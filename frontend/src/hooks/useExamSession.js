// hooks/useExamSession.js
// ─────────────────────────────────────────────────────────────────────────────
// P3-1: REFAKTOR — useExamSession je sada tanki orchestrator.
//
// PRETHODNO: ~450 LOC "God hook" — init, navigacija, timer, submit, pauza,
//            draft logika, keyboard shortcuts, sve u jednom fajlu.
//
// SADA: Logika podijeljena na fokusirane module:
//
//   useExamInit     (hooks/exam/useExamInit.js)
//     → dohvat ispita, attempt kreiranje, draft obnova, server-sync timera
//
//   useExamSubmit   (hooks/exam/useExamSubmit.js)
//     → handlePause, handleResume, handleSubmit, submit modal state
//
//   useExamSession  (ovaj fajl — orchestrator)
//     → timer, elapsed tracking, navigacija, odgovori, keyboard shortcuts
//
// PREDNOSTI:
//   • Svaki modul je testabilan u izolaciji
//   • useExamInit se može mock-ati bez simulate-anja submitta
//   • useExamSubmit se može testirati s fake timerom
//   • Lakše onboarding novih developera (jasna odgovornost po fajlu)
//
// BREAKING CHANGES: nula — API koji vraća je identičan prethodnoj verziji.
// ExamTaking.jsx ne treba nikakve izmjene.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { useExamStore } from "@/store/examStore";
import { useTimer } from "@/hooks/useTimer";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { useExamInit } from "@/hooks/exam/useExamInit";
import { useExamSubmit } from "@/hooks/exam/useExamSubmit";

export function useExamSession(examId) {
  const store = useExamStore();
  const {
    questions,
    answers,
    flagged,
    passages,
    currentIndex,
    isPaused,
    attemptId,
    setAnswer,
    toggleFlag,
    goToQuestion,
  } = store;

  // ── Elapsed clock (anchor-based, ne interval-based — FIX P2-3) ───────────
  const elapsedClockRef = useRef({
    syncedElapsed: 0,
    localTickStartedAt: null,
  });

  const durationSeconds = store.examMeta?.duration_minutes
    ? store.examMeta.duration_minutes * 60
    : null;

  const getElapsed = useCallback(() => {
    if (!durationSeconds) return 0;
    const { syncedElapsed, localTickStartedAt } = elapsedClockRef.current;
    const localElapsed = localTickStartedAt
      ? Math.floor((Date.now() - localTickStartedAt) / 1000)
      : 0;
    return Math.min(durationSeconds, syncedElapsed + localElapsed);
  }, [durationSeconds]);

  // Definirano kao callback da ga timer može koristiti odmah pri init-u
  // eslint-disable-next-line prefer-const
  let timer; // deklariramo unaprijed — init-ira se ispod s useTimer

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

  // Ref za timer — evita circular dependency (timer → applyServerElapsed → timer)
  const timerRef = useRef(null);

  // ── handleSubmit ref — injektiran nakon useExamSubmit inicijalizacije ─────
  const handleSubmitRef = useRef(null);

  // ── Timer ─────────────────────────────────────────────────────────────────
  timer = useTimer(durationSeconds, {
    onExpire: () => handleSubmitRef.current?.(),
    onWarning: () => toast.warning("Ostaje manje od 10 minuta!"),
  });

  // Drži timerRef ažurnim
  useEffect(() => {
    timerRef.current = timer;
  });

  // Sync elapsed clock s running stanjem timera
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

  // ── saveDraft helper ──────────────────────────────────────────────────────
  const saveDraft = useCallback(
    (nextAnswers) => {
      const currentAttemptId =
        attemptId ?? draftStorage.load(examId)?.attemptId ?? null;
      draftStorage.save(examId, nextAnswers, currentAttemptId);
    },
    [examId, attemptId],
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
  });

  // Injektaj handleSubmitRef za timer onExpire
  useEffect(() => {
    handleSubmitRef.current = submit.handleSubmitRef.current;
  });

  // ── Auto-save svakih 30s ──────────────────────────────────────────────────
  useEffect(() => {
    if (!examId || Object.keys(answers).length === 0) return;
    const id = setInterval(() => saveDraft(answers), 30_000);
    return () => clearInterval(id);
  }, [examId, answers, saveDraft]);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalVisible = questions.filter(
    (q) => q.questionType !== "fill_blank_mc",
  ).length;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] != null,
  ).length;

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

  // ── Keyboard shortcuts (FIX P2-8: ignoreFormElements) ────────────────────
  useKeyPress(
    {
      ArrowRight: () =>
        !isPaused &&
        currentIndex < totalVisible - 1 &&
        handleGoTo(currentIndex + 1),
      ArrowLeft: () =>
        !isPaused && currentIndex > 0 && handleGoTo(currentIndex - 1),
      a: () => handleAnswer("a"),
      b: () => handleAnswer("b"),
      c: () => handleAnswer("c"),
      d: () => handleAnswer("d"),
      e: () => handleAnswer("e"),
      f: handleToggleFlag,
      p: submit.handlePause,
      "?": () =>
        toast.info("Prečaci: ←→ navigacija · A–E odabir · F označi · P pauza"),
    },
    { ignoreFormElements: true },
  );

  useBeforeUnload(questions.length > 0 && !store.submittedAt);

  // ── Computed current question ─────────────────────────────────────────────
  const current = questions[currentIndex] ?? null;
  const currentPassage = current?.passageId
    ? (passages[current.passageId] ?? null)
    : null;
  const isCurrentFlagged = current ? flagged.has(current.id) : false;

  // ── Public API ────────────────────────────────────────────────────────────
  // IDENTIČAN s prethodnom verzijom — ExamTaking.jsx ne treba izmjene.
  return {
    questions,
    answers,
    flagged,
    passages,
    current,
    currentPassage,
    currentIndex,
    totalVisible,
    answeredCount,
    isCurrentFlagged,
    direction,
    isPaused,
    examMeta: store.examMeta,

    isLoading: init.isLoading,
    isInitialized: init.isInitialized,
    fetchError: init.fetchError,

    isSubmitting: submit.isSubmitting,
    showSubmitModal: submit.showSubmitModal,
    setShowSubmitModal: submit.setShowSubmitModal,

    showDraftModal: init.showDraftModal,
    confirmRestoreDraft: init.confirmRestoreDraft,
    discardDraft: init.discardDraft,

    handleAnswer,
    handleToggleFlag,
    handleGoTo,
    handleSubmit: submit.handleSubmit,
    handlePause: submit.handlePause,
    handleResume: submit.handleResume,
    timer,
  };
}
