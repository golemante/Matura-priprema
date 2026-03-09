// hooks/useExamSubmit.js — v7
// ─────────────────────────────────────────────────────────────────────────────
// BUG #5 RIJEŠEN:
//   STARO: isSubmitting ostao true ako finish() baci grešku → gumb zauvijek disabled
//   NOVO:  try/catch/finally → setIsSubmitting(false) uvijek na grešci
//
// ČIŠĆE:
//   • handleSubmitRef UKLONJEN — useExamSession direktno koristi handleSubmit fn
//   • timer.resync() poziv zamijenjen s pauseTimer/resumeTimer callbacks
//     → useExamSubmit ne treba pristup timer objektu direktno
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useExamStore } from "@/store/examStore";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

/**
 * @param {string} examId
 * @param {{
 *   attemptIdRef: React.MutableRefObject<string|null>,
 *   attemptCreationPromiseRef: React.MutableRefObject,
 *   getElapsed: () => number,
 *   durationSeconds: number | null,
 *   onPauseTimer: (remaining: number) => void,
 *   onResumeTimer: (elapsedSeconds: number) => void,
 *   saveDraft: (answers: object, opts?: { immediate?: boolean }) => void,
 *   tabDataRef: React.MutableRefObject,
 * }} deps
 */
export function useExamSubmit(
  examId,
  {
    attemptIdRef,
    attemptCreationPromiseRef,
    getElapsed,
    durationSeconds,
    onPauseTimer,
    onResumeTimer,
    saveDraft,
    tabDataRef,
  },
) {
  const navigate = useNavigate();

  const { isPaused, pauseExam, resumeExam, submitExam } = useExamStore((s) => ({
    isPaused: s.isPaused,
    pauseExam: s.pauseExam,
    resumeExam: s.resumeExam,
    submitExam: s.submitExam,
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // ── Pauza ──────────────────────────────────────────────────────────────────
  const handlePause = useCallback(async () => {
    if (isPaused) return;

    const elapsed = getElapsed();
    const remaining = Math.max(0, (durationSeconds ?? 0) - elapsed);
    const currentAnswers = useExamStore.getState().answers;

    // Optimistički: odmah pauziraj UI
    pauseExam();
    onPauseTimer(remaining);
    saveDraft(currentAnswers, { immediate: true });

    // DB sinkronizacija (fire-and-forget)
    const aid = attemptIdRef.current;
    if (aid) {
      attemptApi
        .pause(aid, elapsed, currentAnswers)
        .catch((err) => console.warn("[handlePause] DB sync:", err));
    }

    toast.info("Ispit pauziran. Odgovori su sačuvani.");
  }, [
    isPaused,
    pauseExam,
    onPauseTimer,
    getElapsed,
    durationSeconds,
    saveDraft,
    attemptIdRef,
  ]);

  // ── Nastavak ───────────────────────────────────────────────────────────────
  const handleResume = useCallback(async () => {
    if (!isPaused) return;

    const localElapsed = getElapsed();

    // Optimistički: odmah nastavi UI s lokalnim elapsed
    resumeExam();
    onResumeTimer(localElapsed);

    // DB sinkronizacija: dobij server elapsed i korigiraj timer
    const aid = attemptIdRef.current;
    if (aid) {
      attemptApi
        .resume(aid)
        .then((data) => {
          if (data?.elapsed_seconds != null) {
            onResumeTimer(data.elapsed_seconds);
          }
        })
        .catch((err) => console.warn("[handleResume] DB sync:", err));
    }

    toast.success("Ispit nastavljen.");
  }, [isPaused, resumeExam, onResumeTimer, getElapsed, attemptIdRef]);

  // ── Predaja ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const currentAnswers = useExamStore.getState().answers;
    const elapsed = getElapsed();

    // Čekaj kreiranje attempta ako je još u tijeku
    const creationRef = attemptCreationPromiseRef.current;
    if (creationRef && creationRef !== "done") {
      try {
        await creationRef;
      } catch {
        // Nastavi bez attemptId (offline fallback)
      }
    }

    const aid = attemptIdRef.current;

    try {
      let rpcResult = null;
      if (aid) {
        rpcResult = await attemptApi.finish(aid, currentAnswers, elapsed);
      }

      // Tab integrity log
      const tabData = tabDataRef?.current ?? {
        switchCount: 0,
        totalHiddenMs: 0,
      };
      if (tabData.switchCount > 0) {
        console.info(
          `[exam-integrity] examId=${examId} aid=${aid} ` +
            `tabs=${tabData.switchCount} ` +
            `hiddenSec=${Math.round(tabData.totalHiddenMs / 1000)}`,
        );
      }

      submitExam(rpcResult);
      draftStorage.clear(examId);
      navigate(aid ? `/rezultati/pokusaj/${aid}` : `/rezultati/${examId}`, {
        replace: true,
      });
      // navigate unmountira komponentu — setIsSubmitting(false) nije potreban
    } catch (err) {
      console.error("[handleSubmit]", err);
      const msg = err?.message ?? "";

      if (msg.includes("već završen")) {
        toast.error("Ovaj ispit je već završen.");
      } else if (msg.includes("Nemate") || msg.includes("dozvol")) {
        toast.error("Sesija je istekla. Molimo se prijavite ponovo.");
      } else {
        toast.error(
          "Greška pri predaji. Odgovori su sačuvani. Pokušajte ponovo.",
        );
      }

      // BUG #5 FIX: Uvijek reset isSubmitting na grešci
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    getElapsed,
    attemptCreationPromiseRef,
    attemptIdRef,
    submitExam,
    tabDataRef,
    examId,
    navigate,
  ]);

  return {
    isSubmitting,
    showSubmitModal,
    setShowSubmitModal,
    handlePause,
    handleResume,
    handleSubmit,
  };
}
