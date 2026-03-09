// hooks/useExamSession.js
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI v5:
//
//  ✅ FIX KRITIČNI #4 (nastavak): handleSubmitRef.current sync
//     PRIJE: `handleSubmitRef.current = submit.handleSubmitRef.current`
//            → Kopiralo je TRENUTNU VRIJEDNOST ref-a (null!) u drugi ref.
//            → Timer onExpire je pozivao null → ispit se nikad nije predao
//               automatski kad je isteklo vrijeme!
//     SADA:  `handleSubmitRef.current = submit.handleSubmit`
//            → Direktno postavlja funkciju, ne kopira ref vrijednost.
//            → Timer onExpire ispravno predaje ispit.
//
//  ✅ Sve ostale funkcionalnosti ostaju identične — ExamTaking.jsx ne treba izmjene.
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
  const debounced = (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
  debounced.flush = (...args) => {
    clearTimeout(id);
    fn(...args);
  };
  debounced.cancel = () => clearTimeout(id);
  return debounced;
}

export function useExamSession(examId) {
  // ── Store selektori (useShallow za performance) ───────────────────────────
  const {
    examId: storeExamId,
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
    submitExam: storeSubmitExam,
  } = useExamStore(
    useShallow((s) => ({
      examId: s.examId,
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
      submitExam: s.submitExam,
    })),
  );

  // ── Tab visibility tracking ────────────────────────────────────────────────
  const isExamActive = questions.length > 0 && !submittedAt;
  const tabDataRef = useTabVisibility({ enabled: isExamActive });

  // ── Elapsed clock (anchor-based, bez drift-a) ─────────────────────────────
  const elapsedClockRef = useRef({
    syncedElapsed: 0,
    localTickStartedAt: null,
  });

  const durationSeconds = useMemo(
    () => (examMeta?.duration_minutes ? examMeta.duration_minutes * 60 : null),
    [examMeta],
  );

  const getElapsed = useCallback(() => {
    if (!durationSeconds) return 0;
    const { syncedElapsed, localTickStartedAt } = elapsedClockRef.current;
    const localElapsed = localTickStartedAt
      ? Math.floor((Date.now() - localTickStartedAt) / 1000)
      : 0;
    return Math.min(durationSeconds, syncedElapsed + localElapsed);
  }, [durationSeconds]);

  // eslint-disable-next-line prefer-const
  let timer;

  const applyServerElapsed = useCallback(
    (elapsedSeconds, { running = true } = {}) => {
      if (!durationSeconds) return;
      const normalized = Math.min(
        durationSeconds,
        Math.max(0, Number(elapsedSeconds) || 0),
      );
      elapsedClockRef.current = {
        syncedElapsed: normalized,
        localTickStartedAt: running ? Date.now() : null,
      };
      const remaining = Math.max(0, durationSeconds - normalized);
      // eslint-disable-next-line no-use-before-define
      timerRef.current?.resync(remaining, { running });
    },
    [durationSeconds],
  );

  const timerRef = useRef(null);

  // ── handleSubmitRef: čuva najnoviji handleSubmit za timer onExpire ─────────
  //
  // FIX #4: Ovaj ref čuva FUNKCIJU, ne drugi ref.
  // Postavlja se u useEffect ispod koji prati submit.handleSubmit.
  //
  const handleSubmitRef = useRef(null);

  // ── Timer ─────────────────────────────────────────────────────────────────
  timer = useTimer(durationSeconds, {
    onExpire: () => handleSubmitRef.current?.(),
    onWarning: () => toast.warning("Ostaje manje od 10 minuta!"),
  });

  useEffect(() => {
    timerRef.current = timer;
  });

  useEffect(() => {
    if (!durationSeconds) return;
    if (timer.running && !elapsedClockRef.current.localTickStartedAt) {
      elapsedClockRef.current = {
        ...elapsedClockRef.current,
        localTickStartedAt: Date.now(),
      };
    } else if (!timer.running && elapsedClockRef.current.localTickStartedAt) {
      elapsedClockRef.current = {
        syncedElapsed: getElapsed(),
        localTickStartedAt: null,
      };
    }
  }, [durationSeconds, timer.running, getElapsed]);

  // ── Draft save (debounced 750ms + immediate flush) ────────────────────────
  const saveDraftImmediate = useCallback(
    (nextAnswers) => {
      const currentAttemptId =
        attemptId ?? draftStorage.load(examId)?.attemptId ?? null;
      draftStorage.save(examId, nextAnswers, currentAttemptId);
    },
    [examId, attemptId],
  );

  const debouncedSaveDraftRef = useRef(null);
  if (!debouncedSaveDraftRef.current) {
    debouncedSaveDraftRef.current = debounce((answers) => {
      const aid =
        useExamStore.getState().attemptId ??
        draftStorage.load(examId)?.attemptId ??
        null;
      draftStorage.save(examId, answers, aid);
    }, 750);
  }

  const saveDraft = useCallback(
    (nextAnswers, { immediate = false } = {}) => {
      if (immediate) {
        debouncedSaveDraftRef.current.flush(nextAnswers);
        saveDraftImmediate(nextAnswers);
      } else {
        debouncedSaveDraftRef.current(nextAnswers);
      }
    },
    [saveDraftImmediate],
  );

  // ── Sub-hookovi ───────────────────────────────────────────────────────────
  const init = useExamInit(examId, { applyServerElapsed });

  const submit = useExamSubmit(examId, {
    attemptIdRef: init.attemptIdRef,
    attemptCreationPromiseRef: init.attemptCreationPromiseRef,
    timer,
    getElapsed,
    applyServerElapsed,
    durationSeconds,
    saveDraft,
    tabDataRef,
  });

  // ── FIX #4: Postavi handleSubmitRef.current na FUNKCIJU, ne na ref ─────────
  //
  // PRIJE: handleSubmitRef.current = submit.handleSubmitRef.current
  //        → kopiralo je .current vrijednost (null pri mount-u) iz sub-hooka
  //        → timer onExpire zvao null → autosubmit na istek nije radio!
  //
  // SADA: handleSubmitRef.current = submit.handleSubmit
  //       → direktno referencira funkciju iz useExamSubmit
  //
  useEffect(() => {
    handleSubmitRef.current = submit.handleSubmit;
  }, [submit.handleSubmit]);

  // ── Auto-save svakih 30s ──────────────────────────────────────────────────
  useEffect(() => {
    if (!examId || Object.keys(answers).length === 0) return;
    const id = setInterval(
      () => saveDraft(answers, { immediate: true }),
      30_000,
    );
    return () => clearInterval(id);
  }, [examId, answers, saveDraft]);

  // ── Cleanup debounce na unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      debouncedSaveDraftRef.current?.cancel();
    };
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalVisible = useMemo(
    () => questions.filter((q) => q.questionType !== "fill_blank_mc").length,
    [questions],
  );

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => answers[k] != null).length,
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

  // ── Odgovor + zastavica ───────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (letter) => {
      if (isPaused) return;
      const current = questions[currentIndex];
      if (!current) return;
      setAnswer(current.id, letter);
      saveDraft(useExamStore.getState().answers);
    },
    [isPaused, questions, currentIndex, setAnswer, saveDraft],
  );

  const handleToggleFlag = useCallback(() => {
    const current = questions[currentIndex];
    if (!current) return;
    toggleFlag(current.id);
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

  // ── Image preloading (performance) ───────────────────────────────────────
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
    examData: init.examData,

    // Draft modal
    showDraftModal: init.showDraftModal,
    pendingDraft: init.pendingDraft,
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

    // Submit actions
    isSubmitting: submit.isSubmitting,
    showSubmitModal: submit.showSubmitModal,
    setShowSubmitModal: submit.setShowSubmitModal,
    handlePause: submit.handlePause,
    handleResume: submit.handleResume,
    handleSubmit: submit.handleSubmit,
  };
}
