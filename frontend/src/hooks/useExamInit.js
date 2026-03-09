// hooks/exam/useExamInit.js
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI u ovoj verziji:
//
//  ✅ FIX: useShallow selektor umjesto cijelog store subscription-a
//     PRIJE: `const store = useExamStore()` → pretplaćen na SVE promjene.
//            Svaki timer tick (useTimer lokalni state) triggerao je re-render
//            ovog hooka, što je moglo resetirati initializedForExamRef guard
//            i prekinuti initialization flow.
//     SADA:  useShallow selektira samo potrebna polja → re-render samo kad se
//            zaista nešto promijeni u relevantnim dijelovima store-a.
//
//  ✅ FIX P1-1: Prevencija višestrukih sesija (nepromijenjeno)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { useExamWithQuestions } from "@/hooks/useExam";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

/**
 * @param {string} examId
 * @param {{ applyServerElapsed: (elapsed: number, opts?: object) => void }} opts
 */
export function useExamInit(examId, { applyServerElapsed }) {
  // ── FIX: useShallow selektor — samo relevantna polja ─────────────────────
  const {
    storeExamId,
    storeQuestions,
    attemptId,
    isPaused,
    startExam,
    restoreDraft,
    setAttemptId,
    setExamMeta,
  } = useExamStore(
    useShallow((s) => ({
      storeExamId: s.examId,
      storeQuestions: s.questions,
      attemptId: s.attemptId,
      isPaused: s.isPaused,
      startExam: s.startExam,
      restoreDraft: s.restoreDraft,
      setAttemptId: s.setAttemptId,
      setExamMeta: s.setExamMeta,
    })),
  );

  // ── Promise tracking (FIX P1-2 — brzi submit race condition) ─────────────
  const attemptCreationPromiseRef = useRef(null);

  // Ref za attemptId — dostupan u async callback-ovima bez stale closure
  const attemptIdRef = useRef(null);
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  // ── Draft modal state ────────────────────────────────────────────────────
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);

  // ── Dohvat ispita iz baze ────────────────────────────────────────────────
  const {
    data: examData,
    isLoading,
    error: fetchError,
  } = useExamWithQuestions(examId);

  const alreadyLoaded = storeExamId === examId && storeQuestions.length > 0;
  const [isInitialized, setIsInitialized] = useState(alreadyLoaded);

  // Guard protiv ponovljene inicijalizacije za isti examId
  // (štiti od potencijalnih petlji ako query observer emitira novi data ref).
  const initializedForExamRef = useRef(alreadyLoaded ? examId : null);

  useEffect(() => {
    if (initializedForExamRef.current === examId && !isInitialized) {
      setIsInitialized(true);
    }
  }, [examId, isInitialized]);

  // ── Inicijalizacija (jednom po examId + examData) ────────────────────────
  useEffect(() => {
    if (!examData) return;
    if (examData.exam?.id && examData.exam.id !== examId) return;

    if (initializedForExamRef.current === examId) {
      if (!isInitialized) setIsInitialized(true);
      return;
    }

    // Ispit je već učitan u store (npr. korisnik se vratio navigacijom)
    if (storeExamId === examId && storeQuestions.length > 0) {
      initializedForExamRef.current = examId;
      if (!isInitialized) setIsInitialized(true);
      return;
    }

    const draft = draftStorage.load(examId);

    const safeQuestions = Array.isArray(examData.questions)
      ? examData.questions
      : [];
    const safePassages =
      examData.passages && typeof examData.passages === "object"
        ? examData.passages
        : {};

    startExam(examId, safeQuestions, safePassages);
    setExamMeta(examData.exam ?? null);
    initializedForExamRef.current = examId;
    if (!isInitialized) setIsInitialized(true);

    if (draft?.attemptId) {
      // ── Scenarij B/C: Draft ima attemptId → obnovi, ne kreiraj novi ──────
      setAttemptId(draft.attemptId);
      attemptCreationPromiseRef.current = "done";

      if (draft?.answers && Object.keys(draft.answers).length > 0) {
        setPendingDraft(draft);
        setShowDraftModal(true);
      }
    } else {
      // ── Scenarij A: Nema drafta → provjeri DB za aktivni attempt ──────────
      //
      // FIX P1-1: Bez ove provjere, svaki novi mount kreira svježi attempt
      // čak i ako postoji in_progress/paused attempt za isti exam+user.
      //
      const creationPromise = attemptApi
        .checkActive(examId)
        .then((existingAttempt) => {
          if (existingAttempt) {
            // Postoji aktivan attempt → recycle
            setAttemptId(existingAttempt.id);
            draftStorage.save(examId, draft?.answers ?? {}, existingAttempt.id);

            if (existingAttempt.status === "paused") {
              toast.info(
                "Pronađen pauziran ispit. Nastavljamo od zadnjeg spremanja.",
              );
            }
            return existingAttempt;
          }

          // Nema aktivnog → kreiraj novi (normalan flow)
          return attemptApi.create(examId).then((newAttempt) => {
            if (newAttempt?.id) {
              setAttemptId(newAttempt.id);
              draftStorage.save(examId, draft?.answers ?? {}, newAttempt.id);
            }
            return newAttempt;
          });
        })
        .catch((err) => {
          console.error("[useExamInit] attempt creation failed:", err);
        });

      attemptCreationPromiseRef.current = creationPromise;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData, examId]);

  // ── Server elapsed sync ──────────────────────────────────────────────────
  const syncedAttemptId = useRef(null);

  useEffect(() => {
    if (!attemptId || !examData) return;
    if (syncedAttemptId.current === attemptId) return;

    let cancelled = false;

    const syncElapsed = async () => {
      try {
        const isAttemptPaused =
          (await attemptApi.getElapsed(attemptId)) === null;
        const elapsed = await attemptApi.getElapsed(attemptId);
        if (cancelled) return;
        applyServerElapsed(elapsed ?? 0, {
          running: !isPaused && !isAttemptPaused,
        });
        syncedAttemptId.current = attemptId;
      } catch (err) {
        console.warn("[attemptApi.getElapsed]", err);
      }
    };

    syncElapsed();
    return () => {
      cancelled = true;
    };
  }, [attemptId, examData, isPaused, applyServerElapsed]);

  // ── Draft callbacks ──────────────────────────────────────────────────────
  const confirmRestoreDraft = useCallback(() => {
    if (pendingDraft?.answers) {
      restoreDraft(pendingDraft.answers);
      toast.success("Prethodni odgovori su obnovljeni.");
    }
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [pendingDraft, restoreDraft]);

  const discardDraft = useCallback(() => {
    draftStorage.clear(examId);
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [examId]);

  return {
    isLoading,
    isInitialized,
    fetchError,
    examData,
    attemptCreationPromiseRef,
    attemptIdRef,
    showDraftModal,
    pendingDraft,
    confirmRestoreDraft,
    discardDraft,
  };
}
