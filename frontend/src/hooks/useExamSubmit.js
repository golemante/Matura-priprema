// hooks/useExamSubmit.js
import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

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
    cancelDraft,
    tabDataRef,
  },
) {
  const navigate = useNavigate();

  const { isPaused, pauseExam, resumeExam, submitExam } = useExamStore(
    useShallow((s) => ({
      isPaused: s.isPaused,
      pauseExam: s.pauseExam,
      resumeExam: s.resumeExam,
      submitExam: s.submitExam,
    })),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPauseSyncing, setIsPauseSyncing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const pausePromiseRef = useRef(null);

  const handlePause = useCallback(async () => {
    if (isPaused || isPauseSyncing) return;

    const elapsed = getElapsed();
    const remaining = Math.max(0, (durationSeconds ?? 0) - elapsed);
    const currentAnswers = useExamStore.getState().answers;

    pauseExam();
    onPauseTimer(remaining);
    saveDraft(currentAnswers, { immediate: true });

    const aid = attemptIdRef.current;
    if (aid) {
      setIsPauseSyncing(true);

      const p = attemptApi
        .pause(aid, elapsed, currentAnswers)
        .catch((err) => {
          console.warn("[handlePause] DB sync failed:", err);
          toast.warning(
            "Pauziranje nije sinkronizirano s poslužiteljem. Odgovori su lokalno sačuvani.",
          );
        })
        .finally(() => {
          setIsPauseSyncing(false);
          if (pausePromiseRef.current === p) {
            pausePromiseRef.current = "done";
          }
        });

      pausePromiseRef.current = p;
    } else {
      pausePromiseRef.current = "done";
    }

    toast.info("Ispit pauziran. Odgovori su sačuvani.");
  }, [
    isPaused,
    isPauseSyncing,
    pauseExam,
    onPauseTimer,
    getElapsed,
    durationSeconds,
    saveDraft,
    attemptIdRef,
  ]);

  const handleResume = useCallback(async () => {
    if (!isPaused) return;

    const pending = pausePromiseRef.current;
    if (pending && pending !== "done") {
      try {
        await pending;
      } catch {
        // pause pao — nastavljamo, resume_attempt može baciti grešku ispod
      }
    }
    pausePromiseRef.current = null;

    const localElapsed = getElapsed();
    resumeExam();
    onResumeTimer(localElapsed);

    const aid = attemptIdRef.current;
    if (aid) {
      attemptApi
        .resume(aid)
        .then((data) => {
          if (data?.elapsed_seconds != null) {
            onResumeTimer(data.elapsed_seconds);
          }
        })
        .catch((err) => {
          console.warn("[handleResume] DB sync failed:", err);
          toast.warning(
            "Nastavak nije sinkroniziran s poslužiteljem. Timer može biti minimalno netočan.",
          );
        });
    }

    toast.success("Ispit nastavljen.");
  }, [isPaused, resumeExam, onResumeTimer, getElapsed, attemptIdRef]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    cancelDraft?.();

    const pending = pausePromiseRef.current;
    if (pending && pending !== "done") {
      try {
        await pending;
      } catch {
        // pause pao — finish_attempt prihvaća i 'in_progress' i 'paused'
      }
    }
    pausePromiseRef.current = null;

    const currentAnswers = useExamStore.getState().answers;
    const elapsed = getElapsed();

    const creationRef = attemptCreationPromiseRef.current;
    if (creationRef && creationRef !== "done") {
      try {
        await creationRef;
      } catch {
        // nastavi — pokušat ćemo last-chance create ispod
      }
    }

    let aid = attemptIdRef.current;

    if (!aid) {
      console.warn(
        "[handleSubmit] aid je null — attempt kreiranje nije uspjelo pri init-u. Pokušavam last-chance create...",
      );
      try {
        const created = await attemptApi.create(examId);
        if (created?.id) {
          aid = created.id;
          attemptIdRef.current = created.id;
          console.info(
            `[handleSubmit] Last-chance create uspio: aid=${created.id}`,
          );
        }
      } catch (createErr) {
        console.error(
          "[handleSubmit] Last-chance create pao:",
          createErr?.message,
        );
      }
    }

    if (!aid) {
      setIsSubmitting(false);

      saveDraft?.(currentAnswers, { immediate: true });

      toast.error(
        "Predaja nije moguća — problem s vezom. Odgovori su sačuvani lokalno. Provjeri internet i pokušaj ponovo.",
        { duration: 8000 },
      );
      return;
    }

    try {
      let rpcResult = null;
      rpcResult = await attemptApi.finish(aid, currentAnswers, elapsed);

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

      submitExam(rpcResult, elapsed);

      draftStorage.clear(examId);
      navigate(`/rezultati/pokusaj/${aid}`, { replace: true });
    } catch (err) {
      console.error("[handleSubmit]", err);
      const msg = err?.message ?? "";

      if (msg.includes("već završen")) {
        toast.error("Ovaj ispit je već završen.");
        navigate(`/rezultati/pokusaj/${aid}`, { replace: true });
      } else if (msg.includes("Nemate") || msg.includes("dozvol")) {
        toast.error("Sesija je istekla. Molimo se prijavite ponovo.");
      } else {
        toast.error(
          "Greška pri predaji. Odgovori su sačuvani. Pokušajte ponovo.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    cancelDraft,
    saveDraft,
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
    isPauseSyncing,
    isSyncing: isSubmitting || isPauseSyncing,
    showSubmitModal,
    setShowSubmitModal,
    handlePause,
    handleResume,
    handleSubmit,
  };
}
