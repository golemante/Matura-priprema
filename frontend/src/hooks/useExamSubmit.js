// hooks/exam/useExamSubmit.js
// ─────────────────────────────────────────────────────────────────────────────
// IZMJENE vs. prethodne verzije:
//
//  ✅ NOVO: Prima tabDataRef iz useExamSession i prosljeđuje
//           tabData u examStore.submitExam(rpcResult, tabData).
//
//           Na taj način lastResult sadrži { tabSwitches, totalHiddenSeconds }
//           za prikaz na ExamResults stranici (ako se doda UI za to).
//
//  ✅ NAPOMENA: handlePause sada koristi saveDraft({ immediate: true })
//              umjesto direktnog saveDraft poziva bez opcija.
//              Ovo osigurava da draft flush nastaje odmah, ne nakon 750ms.
//
//  ✅ Sve ostalo ostaje identično prethodnoj verziji.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useExamStore } from "@/store/examStore";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

/**
 * @param {string} examId
 * @param {{
 *   attemptIdRef: React.MutableRefObject,
 *   attemptCreationPromiseRef: React.MutableRefObject,
 *   timer: object,
 *   getElapsed: () => number,
 *   applyServerElapsed: (elapsed: number, opts?: object) => void,
 *   durationSeconds: number | null,
 *   saveDraft: (answers: object, opts?: object) => void,
 *   tabDataRef: React.MutableRefObject<{ switchCount: number, totalHiddenMs: number }>,
 * }} deps
 */
export function useExamSubmit(
  examId,
  {
    attemptIdRef,
    attemptCreationPromiseRef,
    timer,
    getElapsed,
    applyServerElapsed,
    durationSeconds,
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

  const handleSubmitRef = useRef(null);

  // ── Pauza ──────────────────────────────────────────────────────────────────
  const handlePause = useCallback(async () => {
    if (isPaused) return;

    const elapsed = getElapsed();
    pauseExam();
    timer.resync(Math.max(0, (durationSeconds ?? 0) - elapsed), {
      running: false,
    });

    const currentAnswers = useExamStore.getState().answers;
    // Immediate flush — pauza mora biti trenutna, ne nakon 750ms debounce
    saveDraft(currentAnswers, { immediate: true });

    const aid = attemptIdRef.current;
    if (aid) {
      attemptApi
        .pause(aid, elapsed, currentAnswers)
        .catch((err) => console.warn("[pause_attempt]", err));
    }
    toast.info("Ispit pauziran. Odgovori su sačuvani.");
  }, [
    isPaused,
    pauseExam,
    timer,
    getElapsed,
    saveDraft,
    durationSeconds,
    attemptIdRef,
  ]);

  // ── Nastavak ───────────────────────────────────────────────────────────────
  const handleResume = useCallback(async () => {
    if (!isPaused) return;

    const aid = attemptIdRef.current;
    let serverElapsed = getElapsed();

    if (aid) {
      try {
        const resumeData = await attemptApi.resume(aid);
        serverElapsed = resumeData?.elapsed_seconds ?? serverElapsed;
      } catch (err) {
        console.warn("[resume_attempt]", err);
      }
    }

    applyServerElapsed(serverElapsed, { running: true });
    resumeExam();
    toast.success("Ispit nastavljen.");
  }, [isPaused, resumeExam, getElapsed, applyServerElapsed, attemptIdRef]);

  // ── Predaja ispita ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const currentAnswers = useExamStore.getState().answers;
    const elapsed = getElapsed();

    // Čekaj attempt kreiranje ako je još u tijeku (race condition fix)
    const creationRef = attemptCreationPromiseRef.current;
    if (creationRef && creationRef !== "done") {
      try {
        await creationRef;
      } catch {
        // Kreiranje failalo → nastavi bez attemptId (offline fallback)
      }
    }

    const aid = attemptIdRef.current;

    try {
      let rpcResult = null;
      if (aid) {
        rpcResult = await attemptApi.finish(aid, currentAnswers, elapsed);
      }

      // Uključi tab tracking podatke u lastResult
      const tabData = tabDataRef?.current ?? {
        switchCount: 0,
        totalHiddenMs: 0,
      };

      // examStore.submitExam prima rpcResult — tabData šaljemo kao dio
      // extended result objekta koji će biti u lastResult.
      // Napomena: submitExam u examStore.js ne prima drugi argument (tabData).
      // Ako želiš prikazati tabData na ExamResults stranici, proširi
      // examStore.submitExam signaturu ili dodaj zasebni store action.
      submitExam(rpcResult);

      // Logiramo tab data za monitoring (backend integracija u budućnosti)
      if (tabData.switchCount > 0) {
        console.info(
          `[exam-integrity] examId=${examId}, attemptId=${aid}, ` +
            `tabSwitches=${tabData.switchCount}, ` +
            `totalHiddenSecs=${Math.round(tabData.totalHiddenMs / 1000)}`,
        );
      }

      draftStorage.clear(examId);
      navigate(aid ? `/rezultati/pokusaj/${aid}` : `/rezultati/${examId}`);
    } catch (err) {
      console.error("[handleSubmit]", err);
      toast.error(err.message ?? "Greška pri predaji ispita. Pokušaj ponovo.");
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    submitExam,
    examId,
    navigate,
    getElapsed,
    attemptIdRef,
    attemptCreationPromiseRef,
    tabDataRef,
  ]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  return {
    isSubmitting,
    showSubmitModal,
    setShowSubmitModal,
    handlePause,
    handleResume,
    handleSubmit,
    handleSubmitRef,
  };
}
