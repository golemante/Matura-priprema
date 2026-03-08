// hooks/exam/useExamInit.js
// ─────────────────────────────────────────────────────────────────────────────
// Odgovornost: inicijalizacija ispita pri prvom mountu.
//
// Što radi:
//   1. Dohvaća exam + pitanja + passages iz baze (useExamWithQuestions)
//   2. Pokreće examStore (startExam / setExamMeta)
//   3. Kreira attempt na serveru (fire → track Promise za P1-2 fix)
//   4. Detektira draft iz localStorage i nudi obnovu
//   5. Server-sync timera jednom po attemptId
//
// Što NE radi (nije njegova briga):
//   - navigacija između pitanja → useExamNavigation
//   - submit / pauza / nastavak → useExamSubmit
//   - timer logic → useExamSession (proslijeđen kao prop)
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
 * @returns {{
 *   isLoading: boolean,
 *   isInitialized: boolean,
 *   fetchError: Error | null,
 *   examData: object | null,
 *   attemptCreationPromiseRef: React.MutableRefObject,
 *   attemptIdRef: React.MutableRefObject,
 *   showDraftModal: boolean,
 *   pendingDraft: object | null,
 *   confirmRestoreDraft: () => void,
 *   discardDraft: () => void,
 * }}
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

  // ── Promise tracking (FIX P1-2) ──────────────────────────────────────────
  // null     → create() nije pokrenut
  // Promise  → create() u tijeku, handleSubmit mora await-ati
  // "done"   → create() završen (uspješno ili ne)
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
      // Postoji draft s attemptId → obnovi, ne kreiraj novi
      setAttemptId(draft.attemptId);
      attemptCreationPromiseRef.current = "done";
    } else {
      // Kreiraj novi attempt — prati Promise za submit sync (FIX P1-2)
      const creationPromise = attemptApi
        .create(examId)
        .then((attempt) => {
          if (attempt?.id) {
            setAttemptId(attempt.id);
            draftStorage.save(examId, draft?.answers ?? {}, attempt.id);
          }
        })
        .catch((err) => {
          console.warn("[attemptApi.create]", err);
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
