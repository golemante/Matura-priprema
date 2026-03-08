// hooks/exam/useExamSubmit.js
// ─────────────────────────────────────────────────────────────────────────────
// Odgovornost: sve akcije koje mijenjaju STATUS ispita.
//
//   handlePause   → pauzira timer + šalje RPC pause_attempt
//   handleResume  → nastavlja timer + RPC resume_attempt + server sync
//   handleSubmit  → čeka attempt kreiranje → RPC finish_attempt → navigira
//
// Ovisnosti koje prima izvana (dependency injection umjesto direktnog import):
//   attemptIdRef              — ref na trenutni attemptId (iz useExamInit)
//   attemptCreationPromiseRef — Promise tracking (iz useExamInit)
//   timer                     — useTimer instanca (iz useExamSession)
//   getElapsed / applyServerElapsed — helpers za elapsed tracking
//   durationSeconds           — ukupno trajanje ispita u sekundama
//   saveDraft                 — callback za čuvanje draft-a
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
 *   saveDraft: (answers: object) => void,
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
  },
) {
  const navigate = useNavigate();
  const store = useExamStore();
  const { isPaused, pauseExam, resumeExam, submitExam } = store;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Ref za handleSubmit — potreban useTimeru za onExpire callback
  // (timer se inicijalizira sa starim closure-om, ref ga "probija")
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
    saveDraft(currentAnswers);

    const aid = attemptIdRef.current;
    if (aid) {
      // Best-effort: ne blokiramo UI, ali logiramo greške
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

    // FIX P1-2: Čekaj attempt kreiranje ako je još u tijeku.
    // Brzi submit (< 200ms) inače šalje finish_attempt s null attemptId.
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
      submitExam(rpcResult);
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
  ]);

  // Drži ref ažurnim — useTimer koristi ref za onExpire callback
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
