// hooks/useExamSession.js — v7
// ─────────────────────────────────────────────────────────────────────────────
// SVIH 5 BUGOVA RIJEŠENO:
//
//  BUG #1 — Timer sync race condition [KORJENSKI PROBLEM]:
//    STARO: applyServerElapsed() callback s durationSeconds u closure.
//           examMeta još nije učitan → durationSeconds=null → callback izlazi.
//           syncedAttemptId guard blokira ponovni pokušaj. Timer NIKADA ne krene.
//    NOVO:  timerSyncRef (iz useExamInit) drži elapsed podatke bez callbacka.
//           useEffect čeka dok su OBOJE dostupni: durationSeconds + timerSyncRef.ready
//           Polling svakih 100ms ako sync nije spreman. Timer uvijek krene točno.
//
//  BUG #2 — getElapsed() vraćala objekt umjesto broja:
//    Riješeno u useExamInit.js → attemptApi.getStatus().elapsed_seconds (broj)
//
//  BUG #3 — pauseExam() nije pozvan za pauziran attempt:
//    Riješeno u useExamInit.js → pauseExam() odmah na status==='paused'
//
//  BUG #4 — Odgovori pauziranog attempta nisu obnovljeni:
//    Riješeno u useExamInit.js → attemptApi.getAnswers() + restoreDraft()
//
//  BUG #5 — isSubmitting zauvijek true na grešci:
//    Riješeno u useExamSubmit.js → finally blok
//
//  DODATNI ISPRAVCI:
//  • let timer antipattern uklonjen → const timer = useTimer(...)
//  • handleSubmitRef.current = submit.handleSubmit (ne .handleSubmitRef.current)
//  • auto-save svakih 30s
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { useTimer } from "@/hooks/useTimer";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { useTabVisibility } from "@/hooks/useTabVisibility";
import { useImagePreload } from "@/hooks/useImagePreload";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { useExamInit } from "@/hooks/useExamInit";
import { useExamSubmit } from "@/hooks/useExamSubmit";

// ── Debounce helper ────────────────────────────────────────────────────────────
function debounce(fn, ms) {
  let id;
  const d = (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
  d.flush = (...args) => {
    clearTimeout(id);
    fn(...args);
  };
  d.cancel = () => clearTimeout(id);
  return d;
}

export function useExamSession(examId) {
  // ── Store selektori (useShallow: re-render samo kad se zaista promijeni) ───
  const {
    questions,
    answers,
    flagged,
    passages,
    currentIndex,
    isPaused,
    attemptId,
    examMeta,
    submittedAt,
    setAnswer,
    toggleFlag,
    goToQuestion,
  } = useExamStore(
    useShallow((s) => ({
      questions: s.questions,
      answers: s.answers,
      flagged: s.flagged,
      passages: s.passages,
      currentIndex: s.currentIndex,
      isPaused: s.isPaused,
      attemptId: s.attemptId,
      examMeta: s.examMeta,
      submittedAt: s.submittedAt,
      setAnswer: s.setAnswer,
      toggleFlag: s.toggleFlag,
      goToQuestion: s.goToQuestion,
    })),
  );

  // ── Tab visibility tracking ────────────────────────────────────────────────
  const isExamActive = questions.length > 0 && !submittedAt;
  const tabDataRef = useTabVisibility({ enabled: isExamActive });

  // ── Duration ──────────────────────────────────────────────────────────────
  const durationSeconds = useMemo(
    () => (examMeta?.duration_minutes ? examMeta.duration_minutes * 60 : null),
    [examMeta],
  );

  // Ref uvijek drži aktualnu vrijednost (za getElapsed koji se ne smije mjenjati)
  const durationRef = useRef(durationSeconds);
  useEffect(() => {
    durationRef.current = durationSeconds;
  }, [durationSeconds]);

  // ── Elapsed clock (anchor-based, bez drift-a) ─────────────────────────────
  const elapsedClockRef = useRef({ syncedElapsed: 0, startedAt: null });

  const getElapsed = useCallback(() => {
    const dur = durationRef.current;
    if (!dur) return 0;
    const { syncedElapsed, startedAt } = elapsedClockRef.current;
    const local = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    return Math.min(dur, syncedElapsed + local);
  }, []); // Stabilan — koristi samo refove

  // ── Timer ─────────────────────────────────────────────────────────────────
  // handleSubmitRef drži najnoviji handleSubmit za timer onExpire
  const handleSubmitRef = useRef(null);

  // ISPRAVAK Rules of Hooks: useCallback MORA biti na top levelu,
  // ne unutar objekta koji se prosljeđuje useTimer!
  const onTimerExpire = useCallback(() => handleSubmitRef.current?.(), []);
  const onTimerWarning = useCallback(
    () => toast.warning("Ostaje manje od 10 minuta!"),
    [],
  );

  const timer = useTimer(durationSeconds, {
    onExpire: onTimerExpire,
    onWarning: onTimerWarning,
  });

  // Ref za timer objekt (dostupan submit/pause callbackima)
  const timerRef = useRef(timer);
  useEffect(() => {
    timerRef.current = timer;
  });

  // Prati running stanje za elapsed clock
  useEffect(() => {
    if (!durationSeconds) return;
    if (timer.running && !elapsedClockRef.current.startedAt) {
      elapsedClockRef.current = {
        ...elapsedClockRef.current,
        startedAt: Date.now(),
      };
    } else if (!timer.running && elapsedClockRef.current.startedAt) {
      elapsedClockRef.current = {
        syncedElapsed: getElapsed(),
        startedAt: null,
      };
    }
  }, [durationSeconds, timer.running, getElapsed]);

  // ── Timer control callbacks (prosljeđuju se useExamSubmit) ────────────────
  const onPauseTimer = useCallback(
    (remaining) => {
      elapsedClockRef.current = {
        syncedElapsed: getElapsed(),
        startedAt: null,
      };
      timerRef.current?.resync(remaining, { running: false });
    },
    [getElapsed],
  );

  const onResumeTimer = useCallback((elapsedSeconds) => {
    const dur = durationRef.current;
    if (!dur) return;
    const normalized = Math.min(dur, Math.max(0, Number(elapsedSeconds) || 0));
    const remaining = Math.max(0, dur - normalized);
    elapsedClockRef.current = {
      syncedElapsed: normalized,
      startedAt: Date.now(),
    };
    timerRef.current?.resync(remaining, { running: true });
  }, []);

  // ── useExamInit ────────────────────────────────────────────────────────────
  // BUG #1 FIX: Nema applyServerElapsed callback. Init eksponira timerSyncRef.
  const init = useExamInit(examId);

  // ── BUG #1 FIX: Timer sync effect ─────────────────────────────────────────
  // Čeka dok su OBOJE dostupni: durationSeconds + timerSyncRef.ready.
  // Polling interval rješava race condition — ako sync stigne prije examMeta,
  // čekamo examMeta. Ako examMeta stigne prije syncа, čekamo sync.
  const timerAppliedRef = useRef(false);

  useEffect(() => {
    if (!durationSeconds) return; // Čekaj examMeta
    if (timerAppliedRef.current) return; // Već primijenjeno

    const tryApply = () => {
      const syncData = init.timerSyncRef.current;
      if (!syncData.ready) return false; // Sync još nije spreman

      timerAppliedRef.current = true;
      onResumeTimer(syncData.elapsedSeconds);

      // Ako je server rekao da je pauziran → zaustavi timer
      if (syncData.isServerPaused) {
        const dur = durationRef.current ?? 0;
        const remaining = Math.max(0, dur - syncData.elapsedSeconds);
        elapsedClockRef.current = {
          syncedElapsed: syncData.elapsedSeconds,
          startedAt: null,
        };
        timerRef.current?.resync(remaining, { running: false });
      }
      return true;
    };

    if (tryApply()) return; // Odmah gotovo

    // Polling dok sync ne bude spreman
    const id = setInterval(() => {
      if (tryApply()) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [durationSeconds, init.timerSyncRef, onResumeTimer]);

  // ── Draft save (debounced 750ms) ───────────────────────────────────────────
  const debouncedSaveDraftRef = useRef(null);
  if (!debouncedSaveDraftRef.current) {
    debouncedSaveDraftRef.current = debounce((nextAnswers) => {
      const aid =
        useExamStore.getState().attemptId ??
        draftStorage.load(examId)?.attemptId ??
        null;
      draftStorage.save(examId, nextAnswers, aid);
    }, 750);
  }
  useEffect(() => () => debouncedSaveDraftRef.current?.cancel(), []);

  const saveDraft = useCallback((nextAnswers, { immediate = false } = {}) => {
    if (immediate) {
      debouncedSaveDraftRef.current.flush(nextAnswers);
    } else {
      debouncedSaveDraftRef.current(nextAnswers);
    }
  }, []);

  // ── useExamSubmit ──────────────────────────────────────────────────────────
  const submit = useExamSubmit(examId, {
    attemptIdRef: init.attemptIdRef,
    attemptCreationPromiseRef: init.attemptCreationPromiseRef,
    getElapsed,
    durationSeconds,
    onPauseTimer,
    onResumeTimer,
    saveDraft,
    tabDataRef,
  });

  // BUG UKLONJEN: Direktna referenca, ne kopija .current!
  // submit.handleSubmit je stabilan useCallback — ref je uvijek aktualan
  useEffect(() => {
    handleSubmitRef.current = submit.handleSubmit;
  }, [submit.handleSubmit]);

  // ── Auto-save svakih 30s ───────────────────────────────────────────────────
  useEffect(() => {
    if (!examId || !Object.keys(answers).length) return;
    const id = setInterval(
      () => saveDraft(answers, { immediate: true }),
      30_000,
    );
    return () => clearInterval(id);
  }, [examId, answers, saveDraft]);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalVisible = useMemo(
    () => questions.filter((q) => q.questionType !== "fill_blank_mc").length,
    [questions],
  );

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v != null).length,
    [answers],
  );

  // ── Navigacija ────────────────────────────────────────────────────────────
  const [direction, setDirection] = useState(1);

  const handleGoTo = useCallback(
    (idx) => {
      if (idx < 0 || idx >= totalVisible) return;
      setDirection(idx > currentIndex ? 1 : -1);
      goToQuestion(idx);
    },
    [currentIndex, goToQuestion, totalVisible],
  );

  // ── Odgovori + zastavice ──────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (letter) => {
      if (isPaused) return;
      const q = questions[currentIndex];
      if (!q) return;
      setAnswer(q.id, letter);
      saveDraft(useExamStore.getState().answers);
    },
    [isPaused, questions, currentIndex, setAnswer, saveDraft],
  );

  const handleToggleFlag = useCallback(() => {
    const q = questions[currentIndex];
    if (q) toggleFlag(q.id);
  }, [questions, currentIndex, toggleFlag]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyPress(
    {
      ArrowRight: () =>
        !isPaused &&
        currentIndex < totalVisible - 1 &&
        handleGoTo(currentIndex + 1),
      ArrowLeft: () =>
        !isPaused && currentIndex > 0 && handleGoTo(currentIndex - 1),
      a: () => !isPaused && handleAnswer("a"),
      b: () => !isPaused && handleAnswer("b"),
      c: () => !isPaused && handleAnswer("c"),
      d: () => !isPaused && handleAnswer("d"),
      f: handleToggleFlag,
      p: submit.handlePause,
      "?": () =>
        toast.info("Prečaci: ←→ navigacija · A–D odabir · F označi · P pauza"),
    },
    { ignoreFormElements: true },
  );

  useBeforeUnload(questions.length > 0 && !submittedAt);
  useImagePreload(questions, currentIndex, { ahead: 3 });

  // ── Computed current question ─────────────────────────────────────────────
  const current = questions[currentIndex] ?? null;
  const currentPassage = current?.passageId
    ? (passages[current.passageId] ?? null)
    : null;
  const isCurrentFlagged = current ? flagged.has(current.id) : false;

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    // Init state
    isLoading: init.isLoading,
    isInitialized: init.isInitialized,
    fetchError: init.fetchError,
    showDraftModal: init.showDraftModal,
    confirmRestoreDraft: init.confirmRestoreDraft,
    discardDraft: init.discardDraft,

    // Store state
    questions,
    answers,
    flagged,
    passages,
    currentIndex,
    isPaused,
    examMeta,

    // Derived
    current,
    currentPassage,
    isCurrentFlagged,
    totalVisible,
    answeredCount,
    direction,

    // Timer
    timer,

    // Actions
    handleGoTo,
    handleAnswer,
    handleToggleFlag,

    // Submit
    isSubmitting: submit.isSubmitting,
    showSubmitModal: submit.showSubmitModal,
    setShowSubmitModal: submit.setShowSubmitModal,
    handlePause: submit.handlePause,
    handleResume: submit.handleResume,
    handleSubmit: submit.handleSubmit,
  };
}
