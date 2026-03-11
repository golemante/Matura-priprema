// hooks/useExamSession.js
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

  const isExamActive = questions.length > 0 && !submittedAt;
  const tabDataRef = useTabVisibility({ enabled: isExamActive });

  const durationSeconds = useMemo(
    () => (examMeta?.duration_minutes ? examMeta.duration_minutes * 60 : null),
    [examMeta],
  );

  const durationRef = useRef(durationSeconds);
  useEffect(() => {
    durationRef.current = durationSeconds;
  }, [durationSeconds]);

  const elapsedClockRef = useRef({ syncedElapsed: 0, startedAt: null });

  const getElapsed = useCallback(() => {
    const dur = durationRef.current;
    if (!dur) return 0;
    const { syncedElapsed, startedAt } = elapsedClockRef.current;
    const local = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    return Math.min(dur, syncedElapsed + local);
  }, []);

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

  const init = useExamInit(examId);

  const timerAppliedRef = useRef(false);
  const POLL_MAX_MS = 6000;

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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

      const safeElapsed =
        durationSeconds && rawElapsed >= durationSeconds ? 0 : rawElapsed;

      if (safeElapsed !== rawElapsed) {
        console.warn(
          `[useExamSession] safeElapsed clamp: ${rawElapsed}s → 0 ` +
            `(duration=${durationSeconds}s).`,
        );
      }

      const effectivelyPaused = isServerPaused || isPausedRef.current;

      if (effectivelyPaused) {
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

  const cancelDraft = useCallback(() => {
    debouncedSaveDraftRef.current?.cancel();
  }, []);

  const submit = useExamSubmit(examId, {
    attemptIdRef: init.attemptIdRef,
    attemptCreationPromiseRef: init.attemptCreationPromiseRef,
    getElapsed,
    durationSeconds,
    onPauseTimer,
    onResumeTimer,
    saveDraft,
    cancelDraft,
    tabDataRef,
  });

  useEffect(() => {
    handleSubmitRef.current = submit.handleSubmit;
  }, [submit.handleSubmit]);

  const handlePauseRef = useRef(null);
  useEffect(() => {
    handlePauseRef.current = submit.handlePause;
  }, [submit.handlePause]);

  useEffect(() => {
    if (!isExamActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const { isPaused: p, submittedAt: s } = useExamStore.getState();
        if (!p && !s) {
          handlePauseRef.current?.();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isExamActive]);

  useEffect(() => {
    return () => {
      const {
        isPaused: p,
        submittedAt: s,
        questions: q,
      } = useExamStore.getState();
      if (!p && !s && q.length > 0) {
        handlePauseRef.current?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!examId) return;
    const id = setInterval(() => {
      const currentAnswers = useExamStore.getState().answers;
      if (Object.keys(currentAnswers).length > 0) {
        saveDraft(currentAnswers, { immediate: true });
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [examId, saveDraft]);

  const totalVisible = useMemo(
    () => questions.filter((q) => q.questionType !== "fill_blank_mc").length,
    [questions],
  );

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v != null).length,
    [answers],
  );

  const [direction, setDirection] = useState(1);

  const handleGoTo = useCallback(
    (idx) => {
      if (idx < 0 || idx >= questions.length) return;
      setDirection(idx > currentIndex ? 1 : -1);
      goToQuestion(idx);
    },
    [currentIndex, goToQuestion, questions.length],
  );

  const findNextNavIndex = useCallback(
    (from) => {
      for (let i = from + 1; i < questions.length; i++) {
        if (questions[i]?.questionType !== "fill_blank_mc") return i;
      }
      return -1;
    },
    [questions],
  );

  const findPrevNavIndex = useCallback(
    (from) => {
      for (let i = from - 1; i >= 0; i--) {
        if (questions[i]?.questionType !== "fill_blank_mc") return i;
      }
      return -1;
    },
    [questions],
  );

  const handleNext = useCallback(() => {
    if (isPaused) return;
    const next = findNextNavIndex(currentIndex);
    if (next !== -1) handleGoTo(next);
  }, [isPaused, currentIndex, findNextNavIndex, handleGoTo]);

  const handlePrev = useCallback(() => {
    if (isPaused) return;
    const prev = findPrevNavIndex(currentIndex);
    if (prev !== -1) handleGoTo(prev);
  }, [isPaused, currentIndex, findPrevNavIndex, handleGoTo]);

  const isLastVisible = useMemo(
    () => findNextNavIndex(currentIndex) === -1,
    [currentIndex, findNextNavIndex],
  );

  const hasPrev = useMemo(
    () => findPrevNavIndex(currentIndex) !== -1,
    [currentIndex, findPrevNavIndex],
  );

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

  useKeyPress(
    {
      ArrowRight: () => !isPaused && handleNext(),
      ArrowLeft: () => !isPaused && handlePrev(),
      a: () => !isPaused && handleAnswer("a"),
      b: () => !isPaused && handleAnswer("b"),
      c: () => !isPaused && handleAnswer("c"),
      d: () => !isPaused && handleAnswer("d"),
      f: handleToggleFlag,
      p: () => !submit.isSyncing && submit.handlePause(),
      "?": () =>
        toast.info("Prečaci: ←→ navigacija · A–D odabir · F označi · P pauza"),
    },
    { ignoreFormElements: true },
  );

  useBeforeUnload(questions.length > 0 && !submittedAt);
  useImagePreload(questions, currentIndex, { ahead: 3 });

  const current = questions[currentIndex] ?? null;
  const currentPassage = current?.passageId
    ? (passages[current.passageId] ?? null)
    : null;
  const isCurrentFlagged = current ? flagged.has(current.id) : false;

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

    handleGoTo,
    handleNext,
    handlePrev,
    isLastVisible,
    hasPrev,

    timer,

    handleAnswer,
    handleToggleFlag,

    isSubmitting: submit.isSubmitting,
    isPauseSyncing: submit.isPauseSyncing,
    isSyncing: submit.isSyncing,
    showSubmitModal: submit.showSubmitModal,
    setShowSubmitModal: submit.setShowSubmitModal,
    handlePause: submit.handlePause,
    handleResume: submit.handleResume,
    handleSubmit: submit.handleSubmit,
  };
}
