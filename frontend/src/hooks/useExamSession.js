// hooks/useExamSession.js — v9
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI v9:
//
//  BUG E FIX (timer sync) — safeElapsed provjera:
//    Dodana `safeElapsed` varijabla u timer sync effectu.
//    Ako rawElapsed >= durationSeconds (stale attempt prošao kroz sve provjere),
//    silom resetiramo na 0 → timer ne gasi odmah.
//    Ovo je 3. linija obrane iza resolveAttemptId i timer sync u useExamInit.
//
//  BUG F FIX — Auto-save interval se resetirao na svaki setAnswer:
//    PROBLEM: `answers` u deps arrayu auto-save effecta. Zustand vraća novi
//             objekt na svaki setAnswer() → effect se re-run, interval resetira.
//             30s auto-save se NIKAD nije izvršio ako je korisnik tipkao kontinuirano.
//    FIX: Maknut `answers` iz deps, čitamo svježe odgovore iz Zustand store
//         direktno unutar intervala (useExamStore.getState().answers).
//         Interval je sada stabilan 30s, neovisno o promjenama odgovora.
//
// Nasljeđeni ispravci iz v8:
//   BUG #1 — Timer sync race condition (timerSyncRef bez callback-a)
//   BUG D  — Dvostruki resync za pauzirane attemptove
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
  // ── Store selektori ───────────────────────────────────────────────────────
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

  // ── Tab visibility tracking ───────────────────────────────────────────────
  const isExamActive = questions.length > 0 && !submittedAt;
  const tabDataRef = useTabVisibility({ enabled: isExamActive });

  // ── Duration ──────────────────────────────────────────────────────────────
  const durationSeconds = useMemo(
    () => (examMeta?.duration_minutes ? examMeta.duration_minutes * 60 : null),
    [examMeta],
  );

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
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const handleSubmitRef = useRef(null);

  const onTimerExpire = useCallback(() => handleSubmitRef.current?.(), []);
  const onTimerWarning = useCallback(
    () => toast.warning("Ostaje manje od 10 minuta!"),
    [],
  );

  const timer = useTimer(durationSeconds, {
    onExpire: onTimerExpire,
    onWarning: onTimerWarning,
  });

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

  // ── Timer control callbacks ───────────────────────────────────────────────
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

  // ── useExamInit ───────────────────────────────────────────────────────────
  const init = useExamInit(examId);

  // ── Timer sync effect ─────────────────────────────────────────────────────
  // Čeka dok su OBOJE dostupni: durationSeconds + timerSyncRef.ready.
  const timerAppliedRef = useRef(false);
  const POLL_MAX_MS = 6000;

  useEffect(() => {
    if (!durationSeconds) return;
    if (timerAppliedRef.current) return;

    const pollStart = Date.now();

    const tryApply = () => {
      const syncData = init.timerSyncRef.current;

      if (!syncData.ready && Date.now() - pollStart > POLL_MAX_MS) {
        init.timerSyncRef.current = {
          elapsedSeconds: 0,
          isServerPaused: false,
          ready: true,
        };
        console.warn(
          "[useExamSession] Timer sync poll timeout — forcing elapsed=0",
        );
      }

      if (!init.timerSyncRef.current.ready) return false;

      timerAppliedRef.current = true;
      const { elapsedSeconds: rawElapsed, isServerPaused } =
        init.timerSyncRef.current;

      // BUG E FIX (3. linija obrane): Ako rawElapsed >= durationSeconds,
      // stale in_progress attempt je nekako prošao sve provjere u useExamInit.
      // Silom resetiramo na 0 — timer kreće od pune duljine.
      const safeElapsed =
        durationSeconds && rawElapsed >= durationSeconds ? 0 : rawElapsed;

      if (safeElapsed !== rawElapsed) {
        console.warn(
          `[useExamSession] safeElapsed clamp: ${rawElapsed}s → 0 ` +
            `(duration=${durationSeconds}s). Provjeriti useExamInit resolveAttemptId.`,
        );
      }

      if (isServerPaused) {
        // BUG D FIX: Za pauziran attempt — samo jedan resync poziv.
        const dur = durationRef.current ?? 0;
        const remaining = Math.max(0, dur - safeElapsed);
        elapsedClockRef.current = {
          syncedElapsed: safeElapsed,
          startedAt: null,
        };
        timerRef.current?.resync(remaining, { running: false });
      } else {
        onResumeTimer(safeElapsed);
      }

      return true;
    };

    if (tryApply()) return;

    const id = setInterval(() => {
      if (tryApply()) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [durationSeconds, init.timerSyncRef, onResumeTimer]);

  // ── Draft save (debounced 750ms) ──────────────────────────────────────────
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

  // ── useExamSubmit ─────────────────────────────────────────────────────────
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

  useEffect(() => {
    handleSubmitRef.current = submit.handleSubmit;
  }, [submit.handleSubmit]);

  // ── Auto-save svakih 30s ──────────────────────────────────────────────────
  // BUG F FIX: Maknuli `answers` iz deps.
  // Staro: answers u deps → novi objekt na svaki setAnswer → interval se resetira
  //        → 30s auto-save se nikad nije izvršio pri kontinuiranom odgovaranju.
  // Novo:  Stabilan interval, čita svježe odgovore iz Zustand store direktno.
  useEffect(() => {
    if (!examId) return;
    const id = setInterval(() => {
      const currentAnswers = useExamStore.getState().answers;
      if (Object.keys(currentAnswers).length > 0) {
        saveDraft(currentAnswers, { immediate: true });
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [examId, saveDraft]); // Nema `answers` dep → stabilan interval

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
    isLoading: init.isLoading,
    isInitialized: init.isInitialized,
    fetchError: init.fetchError,
    showDraftModal: init.showDraftModal,
    confirmRestoreDraft: init.confirmRestoreDraft,
    discardDraft: init.discardDraft,

    questions,
    answers,
    flagged,
    passages,
    currentIndex,
    isPaused,
    examMeta,

    current,
    currentPassage,
    isCurrentFlagged,
    totalVisible,
    answeredCount,
    direction,

    timer,

    handleGoTo,
    handleAnswer,
    handleToggleFlag,

    isSubmitting: submit.isSubmitting,
    showSubmitModal: submit.showSubmitModal,
    setShowSubmitModal: submit.setShowSubmitModal,
    handlePause: submit.handlePause,
    handleResume: submit.handleResume,
    handleSubmit: submit.handleSubmit,
  };
}
