// hooks/exam/useExamInit.js
// ─────────────────────────────────────────────────────────────────────────────
// IZMJENE vs. prethodne verzije:
//
//  ✅ FIX P1-1: Prevencija višestrukih sesija
//     Prije create() poziva, provjerava postoji li već aktivan attempt
//     za ovaj exam+user (via attemptApi.checkActive).
//
//     Scenariji:
//       A) Nema aktivnog attempta → create() (normalan flow)
//       B) Postoji in_progress attempt → koristi ga (tab refresh, navigacija)
//       C) Postoji paused attempt → koristi ga + obavijesti korisnika
//
//  ✅ Sve ostalo ostaje identično prethodnoj verziji.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
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
  const store = useExamStore();
  const {
    questions,
    attemptId,
    isPaused,
    startExam,
    restoreDraft,
    setAttemptId,
    setExamMeta,
  } = store;

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

  const alreadyLoaded = store.examId === examId && questions.length > 0;
  const [isInitialized, setIsInitialized] = useState(alreadyLoaded);

  // ── Inicijalizacija (jednom po examId + examData) ────────────────────────
  useEffect(() => {
    if (!examData) return;
    if (examData.exam?.id !== examId) return;

    // Ispit je već učitan u store (npr. korisnik se vratio navigacijom)
    if (store.examId === examId && store.questions.length > 0) {
      setIsInitialized(true);
      return;
    }

    const draft = draftStorage.load(examId);

    startExam(examId, examData.questions, examData.passages);
    setExamMeta(examData.exam);
    setIsInitialized(true);

    if (draft?.attemptId) {
      // ── Scenarij B/C: Draft ima attemptId → obnovi, ne kreiraj novi ──────
      // Draft postoji jer je korisnik refreshao stranicu ili navigirao van/natrag.
      // attemptId je validan (već postoji u DB).
      setAttemptId(draft.attemptId);
      attemptCreationPromiseRef.current = "done";
    } else {
      // ── Scenarij A: Nema drafta → provjeri DB za aktivni attempt ──────────
      //
      // FIX P1-1: Bez ove provjere, svaki novi mount kreira svježi attempt
      // čak i ako postoji in_progress/paused attempt za isti exam+user.
      //
      // Primjeri bez fixa:
      //   1. Korisnik otvori ispit u dva taba → 2 attempted
      //   2. Korisnik ode back i dođe na isti ispit → novi attempt
      //   3. SSR hydration ili StrictMode double-mount → duplikat
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
          console.warn("[attemptApi.checkActive/create]", err);
          toast.warning("Sesija nije pokrenuta — odgovori se čuvaju lokalno.");
        })
        .finally(() => {
          attemptCreationPromiseRef.current = "done";
        });

      attemptCreationPromiseRef.current = creationPromise;
    }

    // Ponudi obnovu drafta ako postoji
    if (draft?.answers && Object.keys(draft.answers).length > 0) {
      setPendingDraft(draft);
      setShowDraftModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData, examId]);

  // ── Obnovi attemptId iz drafta nakon browser refresha ───────────────────
  useEffect(() => {
    if (alreadyLoaded && !attemptId) {
      const draft = draftStorage.load(examId);
      if (draft?.attemptId) {
        setAttemptId(draft.attemptId);
        attemptCreationPromiseRef.current = "done";
      }
    }
  }, [alreadyLoaded, attemptId, examId, setAttemptId]);

  // ── Server-sync timera (jednom po attemptId) ─────────────────────────────
  const syncedAttemptId = useRef(null);
  useEffect(() => {
    const durationSeconds = examData?.exam?.duration_minutes
      ? examData.exam.duration_minutes * 60
      : null;

    if (!durationSeconds || !attemptId) return;
    if (syncedAttemptId.current === attemptId) return;

    let cancelled = false;

    const syncElapsed = async () => {
      try {
        const snapshot = await attemptApi.getElapsed(attemptId);
        if (cancelled) return;
        const isAttemptPaused = snapshot?.status === "paused";
        applyServerElapsed(snapshot?.elapsed_seconds ?? 0, {
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
