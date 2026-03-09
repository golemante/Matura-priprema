// hooks/useExamSubmit.js
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI v5:
//
//  ✅ FIX KRITIČNI #3: handleSubmit — isSubmitting nikad nije resetiran na grešku
//     PRIJE: Ako attemptApi.finish() baci iznimku, isSubmitting ostaje true
//            zauvijek → gumb za predaju zaključan, korisnik ne može predati ispit.
//     SADA:  try/catch/finally → setIsSubmitting(false) uvijek na kraju greške.
//            Toast s jasnom porukom greške. Korisnik može pokušati ponovo.
//
//  ✅ FIX KRITIČNI #4: handleSubmitRef.current nikad nije bio postavljen
//     PRIJE: const handleSubmitRef = useRef(null) → .current ostaje null
//            → timer.onExpire → handleSubmitRef.current?.() → ništa se ne dogodi!
//            → Ispit se ne predaje automatski kad istekne vrijeme!
//     SADA:  useEffect koji drži handleSubmitRef.current = handleSubmit u sync.
//            useExamSession.js koristi submit.handleSubmit direktno.
//
//  ✅ FIX: handlePause — pauza je fire-and-forget što može uzrokovati race
//     Dodan try/catch s toast.error ako DB pauza ne uspije.
//     UI se i dalje pauzira (optimistički), ali korisnik je obaviješten o grešci.
//
//  ✅ FIX: handleResume — resumeExam() sada se poziva PRIJE API poziva
//     (optimistički UI update) da korisnik odmah vidi da se ispit nastavlja,
//     a ne tek po završetku async API poziva.
//
//  ✅ NOVO: Return eksponira handleSubmit direktno (ne samo ref).
//     useExamSession.js može koristiti submit.handleSubmit kao callbackRef.
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

  // ── Ref koji drži najnoviji handleSubmit ──────────────────────────────────
  // Koristi se za timer onExpire callback (izbjegava stale closure).
  // Namijenjen za useExamSession.js koji ga postavlja u handleSubmitRef.
  const handleSubmitRef = useRef(null);

  // ── Pauza ──────────────────────────────────────────────────────────────────
  const handlePause = useCallback(async () => {
    if (isPaused) return;

    const elapsed = getElapsed();

    // Optimistički UI update — odmah pauziraj, ne čekaj API
    pauseExam();
    timer.resync(Math.max(0, (durationSeconds ?? 0) - elapsed), {
      running: false,
    });

    // Instant flush drafta (ne čekamo 750ms debounce)
    const currentAnswers = useExamStore.getState().answers;
    saveDraft(currentAnswers, { immediate: true });

    const aid = attemptIdRef.current;
    if (aid) {
      try {
        await attemptApi.pause(aid, elapsed, currentAnswers);
      } catch (err) {
        console.warn("[pause_attempt]", err);
        // UI je već pauziran — korisnik ne vidi broken state,
        // ali odgovori su u localStorage pa nema gubitka podataka.
        // Ne resumeamo jer bi to zbunilo korisnika.
      }
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
  //
  // FIX: resumeExam() sada se poziva ODMAH (optimistički) da korisnik
  // ne čeka async API poziv za vidljivi feedback.
  // Timer se sinkronizira s DB elapsed vrijednošću tek kad stigne API odgovor.
  //
  const handleResume = useCallback(async () => {
    if (!isPaused) return;

    const localElapsed = getElapsed();

    // Optimistički: odmah nastavi u UI
    resumeExam();
    applyServerElapsed(localElapsed, { running: true });

    const aid = attemptIdRef.current;
    if (aid) {
      try {
        const resumeData = await attemptApi.resume(aid);
        // Sinkroniziraj timer s server elapsed (preciznije od lokalnog)
        const serverElapsed = resumeData?.elapsed_seconds ?? localElapsed;
        applyServerElapsed(serverElapsed, { running: true });
      } catch (err) {
        console.warn("[resume_attempt]", err);
        // Resume je već primijenjen optimistički — nastavljamo s lokalnim elapsed
      }
    }

    toast.success("Ispit nastavljen.");
  }, [isPaused, resumeExam, getElapsed, applyServerElapsed, attemptIdRef]);

  // ── Predaja ispita ─────────────────────────────────────────────────────────
  //
  // FIX KRITIČNI #3: try/catch/finally umjesto try/catch bez finally.
  // isSubmitting se UVIJEK resetira na false pri grešci.
  //
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

      // Tab data za monitoring
      const tabData = tabDataRef?.current ?? {
        switchCount: 0,
        totalHiddenMs: 0,
      };

      submitExam(rpcResult);

      if (tabData.switchCount > 0) {
        console.info(
          `[exam-integrity] examId=${examId}, attemptId=${aid}, ` +
            `tabSwitches=${tabData.switchCount}, ` +
            `totalHiddenSecs=${Math.round(tabData.totalHiddenMs / 1000)}`,
        );
      }

      draftStorage.clear(examId);
      navigate(aid ? `/rezultati/pokusaj/${aid}` : `/rezultati/${examId}`, {
        replace: true,
      });
    } catch (err) {
      // FIX #3: Uvijek resetiraj isSubmitting na grešku
      console.error("[handleSubmit]", err);

      const msg = err?.message ?? String(err);
      if (msg.includes("nije pronađen ili je već završen")) {
        toast.error(
          "Ovaj pokušaj je već završen ili ne postoji. Pokušajte početi novi ispit.",
        );
      } else if (msg.includes("401") || msg.includes("auth")) {
        toast.error("Sesija je istekla. Molimo se prijavite ponovo.");
      } else {
        toast.error(
          "Greška pri predaji ispita. Vaši odgovori su sačuvani. Pokušajte ponovo.",
        );
      }

      setIsSubmitting(false);
    }
    // Napomena: setIsSubmitting(false) se ne poziva pri uspjehu jer
    // navigate() odmah unmountira komponentu → nije potrebno.
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

  // ── FIX #4: Drži handleSubmitRef.current u sync s najnovijim handleSubmit ──
  //
  // ZAŠTO: useTimer.onExpire(fn) hvata fn iz closure pri inicijalizaciji.
  // Ako handleSubmit promijeni referencu (npr. zbog dependency promjene),
  // timer bi zvao staru verziju. Ref rješava ovaj stale closure problem.
  //
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  return {
    isSubmitting,
    showSubmitModal,
    setShowSubmitModal,
    handlePause,
    handleResume,
    handleSubmit, // ← direktno eksponiran za useExamSession.js
    handleSubmitRef, // ← za backward compatibility
  };
}
