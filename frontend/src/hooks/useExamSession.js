// hooks/useExamSession.js — FINALNI FIX v3
// ═══════════════════════════════════════════════════════════════════════════
// ISPRAVCI:
//
//  BUG #4 — useTimer ne podržava onTick i running props
//  ─────────────────────────────────────────────────────
//  Stari kod proslijeđivao je { onTick, running } u useTimer koji ih
//  ignorira (nisu u signature-u hooka).
//
//  Rezultati:
//    • elapsedRef je uvijek 0 → finish_attempt dobiva elapsed_seconds=0
//    • running prop ignoriran → timer tece čak kad ne bi trebao
//
//  FIX:
//    • Ukloniti onTick i running iz useTimer poziva
//    • elapsed računamo iz (durationSeconds - timer.timeLeft) kada treba
//    • timer.pause()/resume() direktno upravljaju running stanjem
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useExamStore } from "@/store/examStore";
import { useExamWithQuestions } from "@/hooks/useExam";
import { useTimer } from "@/hooks/useTimer";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { attemptApi } from "@/api/attemptApi";
import { get } from "react-hook-form";

export function useExamSession(examId) {
  const navigate = useNavigate();
  const store = useExamStore();

  const {
    questions,
    answers,
    flagged,
    passages,
    currentIndex,
    isPaused,
    attemptId,
    startExam,
    restoreDraft,
    setAnswer,
    toggleFlag,
    goToQuestion,
    pauseExam,
    resumeExam,
    setAttemptId,
    setExamMeta,
    submitExam,
  } = store;

  const [direction, setDirection] = useState(1);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveDraft = useCallback(
    (nextAnswers) => {
      const currentAttemptId =
        attemptIdRef.current ?? draftStorage.load(examId)?.attemptId ?? null;
      draftStorage.save(examId, nextAnswers, currentAttemptId);
    },
    [examId],
  );

  // Ref za attemptId u fire-and-forget async operacijama
  const attemptIdRef = useRef(null);
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  const elapsedClockRef = useRef({
    syncedElapsed: 0,
    localTickStartedAt: null,
  });
  const syncedAttemptRef = useRef(null);

  // ── Dohvati ispit + pitanja + passages ──────────────────────────────────
  const {
    data: examData,
    isLoading,
    error: fetchError,
  } = useExamWithQuestions(examId);

  // ── alreadyLoaded + isInitialized ───────────────────────────────────────
  const alreadyLoaded = store.examId === examId && questions.length > 0;
  const [isInitialized, setIsInitialized] = useState(alreadyLoaded);

  // ── Inicijalizacija ispita ───────────────────────────────────────────────
  useEffect(() => {
    if (!examData) return;
    if (examData.exam?.id !== examId) return;

    if (store.examId === examId && store.questions.length > 0) {
      setIsInitialized(true);
      return;
    }

    const draft = draftStorage.load(examId);

    startExam(examId, examData.questions, examData.passages);
    setExamMeta(examData.exam);
    setIsInitialized(true);

    if (draft?.attemptId) {
      setAttemptId(draft.attemptId);
    } else {
      // Kreiraj attempt u bazi (async, ne blokira UI)
      attemptApi
        .create(examId)
        .then((attempt) => {
          if (attempt?.id) {
            setAttemptId(attempt.id);
            draftStorage.save(examId, draft?.answers ?? {}, attempt.id);
          }
        })
        .catch((err) => {
          console.warn("[attemptApi.create]", err);
          toast.warning("Sesija nije pokrenuta — odgovori se čuvaju lokalno.");
        });
    }

    // Provjeri draft
    if (draft?.answers && Object.keys(draft.answers).length > 0) {
      setPendingDraft(draft);
      setShowDraftModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData, examId]);

  // Obnovi attemptId iz drafta nakon browser refresha
  useEffect(() => {
    if (alreadyLoaded && !attemptId) {
      const draft = draftStorage.load(examId);
      if (draft?.attemptId) setAttemptId(draft.attemptId);
    }
  }, [alreadyLoaded, attemptId, examId, setAttemptId]);

  // ── Timer ────────────────────────────────────────────────────────────────
  // ✅ BUG #4 FIX: uklonjeni onTick i running (useTimer ih ne podržava)
  // elapsed računamo direktno: durationSeconds - timer.timeLeft
  const durationSeconds = examData?.exam?.duration_minutes
    ? examData.exam.duration_minutes * 60
    : null;

  const handleSubmitRef = useRef(null);

  const timer = useTimer(durationSeconds, {
    onExpire: () => handleSubmitRef.current?.(),
    onWarning: () => toast.warning("Ostaje manje od 10 minuta!"),
  });

  const applyServerElapsed = useCallback(
    (elapsedSeconds, { running = true } = {}) => {
      if (!durationSeconds) return;

      const normalizedElapsed = Math.min(
        durationSeconds,
        Math.max(0, Number(elapsedSeconds) || 0),
      );

      elapsedClockRef.current = {
        syncedElapsed: normalizedElapsed,
        localTickStartedAt: running ? Date.now() : null,
      };

      const remaining = Math.max(0, durationSeconds - normalizedElapsed);
      timer.resync(remaining, { running });
    },
    [durationSeconds, timer],
  );

  const getElapsed = useCallback(() => {
    if (!durationSeconds) return 0;
    const { syncedElapsed, localTickStartedAt } = elapsedClockRef.current;
    const localElapsed = localTickStartedAt
      ? Math.floor((Date.now() - localTickStartedAt) / 1000)
      : 0;

    return Math.min(durationSeconds, syncedElapsed + localElapsed);
  }, [durationSeconds]);

  useEffect(() => {
    if (!durationSeconds || !attemptId) return;
    if (syncedAttemptRef.current === attemptId) return;

    let cancelled = false;

    const syncElapsed = async () => {
      try {
        const snapshot = await attemptApi.getElapsed(attemptId);
        if (cancelled) return;

        const isAttemptPaused = snapshot?.status === "paused";
        applyServerElapsed(snapshot?.elapsed_seconds ?? 0, {
          running: !isPaused && !isAttemptPaused,
        });
        syncedAttemptRef.current = attemptId;
      } catch (err) {
        console.warn("[attemptApi.getElapsed]", err);
      }
    };

    syncElapsed();

    return () => {
      cancelled = true;
    };
  }, [attemptId, durationSeconds, isPaused, applyServerElapsed]);

  useEffect(() => {
    if (!durationSeconds) return;

    if (timer.running && !elapsedClockRef.current.localTickStartedAt) {
      elapsedClockRef.current = {
        syncedElapsed: elapsedClockRef.current.syncedElapsed,
        localTickStartedAt: Date.now(),
      };
      return;
    }

    if (!timer.running && elapsedClockRef.current.localTickStartedAt) {
      elapsedClockRef.current = {
        syncedElapsed: getElapsed(),
        localTickStartedAt: null,
      };
    }
  }, [durationSeconds, timer.running, getElapsed]);

  // ── Derived values ───────────────────────────────────────────────────────
  const totalVisible = questions.filter(
    (q) => q.questionType !== "fill_blank_mc",
  ).length;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== null && answers[k] !== undefined,
  ).length;

  // ── Draft callbacks ──────────────────────────────────────────────────────
  const confirmRestoreDraft = useCallback(() => {
    if (pendingDraft?.answers) {
      restoreDraft(pendingDraft.answers);
      toast.success("Prethodni odgovori su obnovljeni.");
    }
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [pendingDraft, restoreDraft]);

  const discardDraft = useCallback(() => {
    draftStorage.clear(examId);
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [examId]);

  // ── Odgovor ──────────────────────────────────────────────────────────────
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

  // ── Zastavice ─────────────────────────────────────────────────────────────
  const handleToggleFlag = useCallback(() => {
    const current = questions[currentIndex];
    if (!current) return;
    toggleFlag(current.id);
  }, [questions, currentIndex, toggleFlag]);

  // ── Navigacija ────────────────────────────────────────────────────────────
  const handleGoTo = useCallback(
    (idx) => {
      if (idx < 0 || idx >= totalVisible) return;
      setDirection(idx > currentIndex ? 1 : -1);
      goToQuestion(idx);
    },
    [currentIndex, goToQuestion, totalVisible],
  );

  // ── Pauza ─────────────────────────────────────────────────────────────────
  const handlePause = useCallback(async () => {
    if (isPaused) return;

    const elapsed = getElapsed();
    elapsedClockRef.current = {
      syncedElapsed: elapsed,
      localTickStartedAt: null,
    };

    pauseExam();
    timer.resync(Math.max(0, (durationSeconds ?? 0) - elapsed), {
      running: false,
    });

    const currentAnswers = useExamStore.getState().answers;
    saveDraft(currentAnswers);

    const aid = attemptIdRef.current;
    if (aid) {
      attemptApi
        .pause(aid, elapsed, currentAnswers)
        .catch((err) => console.warn("[pause_attempt]", err));
    }
    toast.info("Ispit pauziran. Odgovori su sačuvani.");
  }, [isPaused, pauseExam, timer, getElapsed, saveDraft, durationSeconds]);

  // ── Nastavak ──────────────────────────────────────────────────────────────
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
  }, [isPaused, resumeExam, getElapsed, applyServerElapsed]);

  // ── Predaja ispita ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const currentAnswers = useExamStore.getState().answers;
    // ✅ BUG #4 FIX: elapsed iz timer stanja, ne iz elapsedRef (koji je bio uvijek 0)
    const elapsed = getElapsed();
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
      toast.error("Greška pri predaji ispita. Pokušaj ponovo.");
      setIsSubmitting(false);
    }
  }, [isSubmitting, submitExam, examId, navigate, getElapsed]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // ── Auto-save svakih 30s ──────────────────────────────────────────────────
  useEffect(() => {
    if (!examId || Object.keys(answers).length === 0) return;
    const id = setInterval(() => {
      saveDraft(answers);
    }, 30_000);
    return () => clearInterval(id);
  }, [examId, answers, saveDraft]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyPress({
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
    p: handlePause,
    "?": () =>
      toast.info(
        "Prečaci: ←→ navigacija · A/B/C/D/E odabir · F označi · P pauza",
      ),
  });

  useBeforeUnload(questions.length > 0 && !store.submittedAt);

  const current = questions[currentIndex] ?? null;
  const currentPassage = current?.passageId
    ? (passages[current.passageId] ?? null)
    : null;
  const isCurrentFlagged = current ? flagged.has(current.id) : false;

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
    isSubmitting,
    examMeta: store.examMeta,
    isLoading,
    isInitialized,
    fetchError,
    showSubmitModal,
    setShowSubmitModal,
    showDraftModal,
    confirmRestoreDraft,
    discardDraft,
    handleAnswer,
    handleToggleFlag,
    handleGoTo,
    handleSubmit,
    handlePause,
    handleResume,
    timer,
  };
}
