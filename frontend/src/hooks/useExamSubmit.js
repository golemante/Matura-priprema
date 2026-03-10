// hooks/useExamSubmit.js — v10
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI v10:
//
//  BUG G — Race condition: pause (fire-and-forget) → resume / finish:
//    UZROK: handlePause() ne čeka DB odgovor. Ako korisnik brzo klikne
//           "Nastavi" ili "Predaj", resume_attempt / finish_attempt se
//           pozivaju dok je attempt još in_progress na serveru.
//           - resume_attempt: baca "Attempt nije pauziran" → error progutan
//             → timer nikad ne dobiva server korekciju
//           - finish_attempt: uspije, ali tada pause_attempt vrati i
//             mijenja status natrag u 'paused' → inconsistent DB stanje
//    FIX:   pausePromiseRef prati pending pause promise.
//           handleResume() i handleSubmit() ČEKAJU pausePromiseRef
//           prije pozivanja server API-ja.
//
//  BUG H — Nedostaje isSyncing stanje:
//    UZROK: UI ima isSubmitting ali nema signal za in-flight pause_attempt.
//           "Predaj" gumb se mogao kliknuti dok background sync još traje.
//    FIX:   isPauseSyncing state praćen u ovom hookom.
//           isSyncing = isSubmitting || isPauseSyncing → UI blokira akcije.
//
//  BUG I — handleSubmit ne cancelira/flusha debounced draft:
//    UZROK: Korisnik odgovori → debounced save (750ms) → odmah klikne "Predaj"
//           → finish_attempt uspije → draftStorage.clear() → 750ms timer
//           okine → draftStorage.save() prepiše upravo izbrisani draft →
//           sljedeći posjet: "Nastavi od X odgovora" za dovršeni ispit.
//    FIX:   cancelDraft() (novi dep iz useExamSession) se poziva na početku
//           handleSubmit() da cancelira pending debounced save. Flush nije
//           potreban jer finish_attempt čita svježe stanje iz Zustand store.
//
//  BUG J — Dvostruki timer resync u handleResume uzrokuje micro-jump:
//    UZROK: onResumeTimer(localElapsed) odmah + onResumeTimer(server elapsed)
//           async → drugi poziv resetira anchorTime = Date.now() iznova.
//    FIX:   Optimistički poziv maknuti. Timer startamo isključivo sa server
//           elapsed u async callback-u. UI responsiveness je sačuvan jer
//           resumeExam() (Zustand) i onPauseTimer/timer kontrole su instant.
//           Server odgovor tipično dolazi za < 300ms → delay je neosjetljiv.
//
// Nasljeđeno iz v9:
//   FIX #185 — useShallow za Zustand selektor
//   BUG #5   — isSubmitting reset u finally bloku
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";

/**
 * @param {string} examId
 * @param {{
 *   attemptIdRef:              React.MutableRefObject<string|null>,
 *   attemptCreationPromiseRef: React.MutableRefObject,
 *   getElapsed:                () => number,
 *   durationSeconds:           number | null,
 *   onPauseTimer:              (remaining: number) => void,
 *   onResumeTimer:             (elapsedSeconds: number) => void,
 *   saveDraft:                 (answers: object, opts?: { immediate?: boolean }) => void,
 *   cancelDraft:               () => void,   ← NOVO v10
 *   tabDataRef:                React.MutableRefObject,
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
    cancelDraft, // BUG I FIX
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
  const [isPauseSyncing, setIsPauseSyncing] = useState(false); // BUG H FIX
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // BUG G FIX: ref koji drži pending pause promise
  // null     → nema in-flight pause-a
  // Promise  → pause_attempt još traje
  // "done"   → pause je završen (resetira se na null pri sljed. pauzi)
  const pausePromiseRef = useRef(null);

  // ── Pauza ──────────────────────────────────────────────────────────────────
  const handlePause = useCallback(async () => {
    if (isPaused || isPauseSyncing) return;

    const elapsed = getElapsed();
    const remaining = Math.max(0, (durationSeconds ?? 0) - elapsed);
    const currentAnswers = useExamStore.getState().answers;

    // 1. Odmah ažuriraj UI (optimistički)
    pauseExam();
    onPauseTimer(remaining);
    saveDraft(currentAnswers, { immediate: true });

    // 2. Pokreni DB sync i zapamti promise (BUG G FIX)
    const aid = attemptIdRef.current;
    if (aid) {
      setIsPauseSyncing(true); // BUG H FIX

      const p = attemptApi
        .pause(aid, elapsed, currentAnswers)
        .then(() => {
          // Uspješno: timer je već pauziran optimistički, nema potrebe za resync
        })
        .catch((err) => {
          // DB sync pao, ali UI je već pauziran.
          // Korisnik vidi pauziran stav; odgovori su u localStorage.
          // Loggamo ali ne rušimo UX.
          console.warn("[handlePause] DB sync failed:", err);
          toast.warning(
            "Pauziranje nije sinkronizirano s poslužiteljem. Odgovori su lokalno sačuvani.",
          );
        })
        .finally(() => {
          setIsPauseSyncing(false); // BUG H FIX
          // Ne resetiramo na null odmah — handleResume/handleSubmit
          // provjeravaju pausePromiseRef.current i čekaju ovaj promise.
          // Postavljamo sentinel "done" da se razlikuje od aktivnog promisa.
          if (pausePromiseRef.current === p) {
            pausePromiseRef.current = "done";
          }
        });

      pausePromiseRef.current = p; // BUG G FIX
    } else {
      // Anonimni korisnik ili attempt nije kreiran — nema DB synca
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

  // ── Nastavak ───────────────────────────────────────────────────────────────
  const handleResume = useCallback(async () => {
    if (!isPaused) return;

    // BUG G FIX: Čekaj pending pause_attempt prije resume_attempt.
    // Bez ovoga: resume_attempt pozvan dok attempt još nije 'paused' → RPC error.
    const pending = pausePromiseRef.current;
    if (pending && pending !== "done") {
      try {
        await pending;
      } catch {
        // pause pao, ali nastavljamo — attempt je možda još in_progress
        // resume_attempt će baciti grešku → uhvatit ćemo je dolje
      }
    }
    pausePromiseRef.current = null; // Reset za sljedeću pauzu

    const localElapsed = getElapsed();
    resumeExam();
    onResumeTimer(localElapsed);

    const aid = attemptIdRef.current;
    if (aid) {
      try {
        const data = await attemptApi.resume(aid);
        if (data?.elapsed_seconds != null) {
          onResumeTimer(data.elapsed_seconds); // Jedini, autoritativni resync
        } else {
          // Fallback: server nije vratio elapsed, koristi lokalni
          onResumeTimer(getElapsed());
        }
      } catch (err) {
        console.warn("[handleResume] DB sync failed:", err);
        // Fallback: timer startamo s lokalnim elapsed
        onResumeTimer(getElapsed());
        toast.warning(
          "Nastavak nije sinkroniziran s poslužiteljem. Timer može biti netočan.",
        );
      }
    } else {
      // Anon: lokalni elapsed
      onResumeTimer(getElapsed());
    }

    toast.success("Ispit nastavljen.");
  }, [isPaused, resumeExam, onResumeTimer, getElapsed, attemptIdRef]);

  // ── Predaja ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // BUG I FIX: Canceliraj debounced draft odmah.
    // Bez ovoga: debounced timer (750ms) može okinuti NAKON draftStorage.clear()
    // i kreirati ghost draft koji se pojavljuje pri sljedećem posjetu.
    cancelDraft?.();

    // BUG G FIX: Čekaj pending pause_attempt.
    // Bez ovoga: finish_attempt uspije → pause_attempt vrati → status = 'paused' (bug!)
    const pending = pausePromiseRef.current;
    if (pending && pending !== "done") {
      try {
        await pending;
      } catch {
        // pause pao, nastavljamo — finish_attempt prihvaća i 'in_progress' i 'paused'
      }
    }
    pausePromiseRef.current = null;

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
      draftStorage.clear(examId); // Sigurno: cancelDraft() već je otkaz'o debounced timer
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

      // BUG #5 FIX (nasljeđeno): Uvijek reset isSubmitting na grešci
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    cancelDraft,
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
    isPauseSyncing, // BUG H FIX: izlazi zasebno
    isSyncing: isSubmitting || isPauseSyncing, // BUG H FIX: convenience flag za UI
    showSubmitModal,
    setShowSubmitModal,
    handlePause,
    handleResume,
    handleSubmit,
  };
}
