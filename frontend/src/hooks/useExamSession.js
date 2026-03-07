// hooks/useExamSession.js
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI v2:
//
//  BUG #1 — Timer race condition (RIJEŠENO u prethodnoj verziji)
//
//  BUG #4 — isInitialized flag (NOVO)
//  ─────────────────────────────────────────────────────────────────────────
//  Problem: ExamTaking.jsx koristi (!current && !fetchError) kao loading uvjet.
//  Ako examData.questions = [] (exam nema pitanja u DB), current je null zauvijek
//  → beskonačni skeleton.
//
//  Ispravak: useExamSession vraća isInitialized boolean koji se postavlja
//  na true tek kada je startExam() pozvan (ili kad alreadyLoaded = true).
//  ExamTaking.jsx koristi !isInitialized umjesto !current.
//
//  BUG #5 — alreadyLoaded nije inicijalizirao isInitialized = true
//  ─────────────────────────────────────────────────────────────────────────
//  Ako korisnik refresha stranicu dok je na ispitu, alreadyLoaded = true
//  ali isInitialized bi bio false → skeleton se prikazuje na reload.
//  Ispravak: useState(alreadyLoaded) — ako je alreadyLoaded, odmah je initialized.
// ─────────────────────────────────────────────────────────────────────────────
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

  // Ref za elapsed bez re-rendera na svakom tiku timera
  const elapsedRef = useRef(0);
  // Ref za attemptId u fire-and-forget async operacijama
  const attemptIdRef = useRef(null);
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  // ── Dohvati ispit + pitanja + passages ────────────────────────────────────
  const {
    data: examData,
    isLoading,
    error: fetchError,
  } = useExamWithQuestions(examId);

  // ── Je li ovaj examId već u storeu (korisnik je refresh-ao stranicu) ───────
  const alreadyLoaded = store.examId === examId && questions.length > 0;

  // ── isInitialized — NOVO ─────────────────────────────────────────────────
  //
  // Postavlja se na true tek nakon što je startExam() pozvan ili ako je
  // alreadyLoaded (store već ima pitanja za ovaj examId).
  //
  // Zašto ovo treba: ExamTaking.jsx ranije koristio (!current && !fetchError)
  // kao loading signal, ali ako pitanja su prazna ([] u DB), current je null
  // ali fetchError je null → beskonačni skeleton.
  //
  // Sada: isInitialized = false → skeleton, isInitialized = true → render.
  //
  const [isInitialized, setIsInitialized] = useState(alreadyLoaded);

  // ── Inicijalizacija ispita ────────────────────────────────────────────────
  useEffect(() => {
    // Čekaj examData
    if (!examData) return;

    // examData.exam.id mora biti ovaj examId (race condition provjera)
    if (examData.exam?.id !== examId) return;

    // Ako je isti ispit i već imamo pitanja — ne resetiraj (čuvaj odgovore)
    if (store.examId === examId && store.questions.length > 0) {
      setIsInitialized(true);
      return;
    }

    // Inicijaliziraj store s novim pitanjima i passages
    startExam(examId, examData.questions, examData.passages);

    // Spremi exam metapodatke u store (za top bar)
    setExamMeta(examData.exam);

    // Postavi initialized = true — čak i ako su pitanja prazna!
    // ExamTaking.jsx sada može prikazati "nema pitanja" state umjesto skeletona.
    setIsInitialized(true);

    // Kreiraj attempt u bazi (async, ne blokira UI)
    attemptApi
      .create(examId)
      .then((attempt) => {
        if (attempt?.id) {
          setAttemptId(attempt.id);
          draftStorage.save(examId, {}, attempt.id);
        }
      })
      .catch((err) => {
        console.warn("[attemptApi.create] greška:", err);
        toast.warning(
          "Sesija nije pokrenuta u bazi — odgovori se čuvaju lokalno.",
        );
      });

    // Provjeri postoji li draft s odgovorima za ovaj ispit
    const draft = draftStorage.load(examId);
    if (draft?.answers && Object.keys(draft.answers).length > 0) {
      setPendingDraft(draft);
      setShowDraftModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData, examId]);

  // ── Obnovi attemptId iz drafta ako store nema (browser refresh) ───────────
  useEffect(() => {
    if (alreadyLoaded && !attemptId) {
      const draft = draftStorage.load(examId);
      if (draft?.attemptId) {
        setAttemptId(draft.attemptId);
      }
    }
  }, [alreadyLoaded, attemptId, examId, setAttemptId]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const durationSeconds = examData?.exam?.duration_minutes
    ? examData.exam.duration_minutes * 60
    : null;

  const handleSubmitRef = useRef(null);

  const timer = useTimer(durationSeconds, {
    onExpire: () => handleSubmitRef.current?.(),
    onWarning: () => toast.warning("Ostaje manje od 10 minuta!"),
    onTick: (elapsed) => {
      elapsedRef.current = elapsed;
    },
    running: isInitialized && !isPaused && questions.length > 0,
  });

  // ── Derived values ────────────────────────────────────────────────────────
  const totalVisible = questions.filter(
    (q) => q.questionType !== "fill_blank_mc",
  ).length;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== null && answers[k] !== undefined,
  ).length;

  // ── Draft modals ──────────────────────────────────────────────────────────
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

  // ── Odgovor ───────────────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (letter) => {
      if (isPaused) return;
      const current = questions[currentIndex];
      if (!current) return;
      setAnswer(current.id, letter);
      draftStorage.save(
        examId,
        useExamStore.getState().answers,
        attemptIdRef.current,
      );
    },
    [isPaused, questions, currentIndex, setAnswer, examId],
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

    pauseExam();
    timer.pause();

    const currentAnswers = useExamStore.getState().answers;
    draftStorage.save(examId, currentAnswers, attemptIdRef.current);

    const aid = attemptIdRef.current;
    if (aid) {
      attemptApi
        .pause(aid, elapsedRef.current, currentAnswers)
        .catch((err) => console.warn("[pause_attempt]", err));
    }

    toast.info("Ispit pauziran. Odgovori su sačuvani.");
  }, [isPaused, pauseExam, timer, examId]);

  // ── Nastavak ──────────────────────────────────────────────────────────────
  const handleResume = useCallback(async () => {
    if (!isPaused) return;

    resumeExam();
    timer.resume();

    const aid = attemptIdRef.current;
    if (aid) {
      attemptApi
        .resume(aid)
        .catch((err) => console.warn("[resume_attempt]", err));
    }

    toast.success("Ispit nastavljen.");
  }, [isPaused, resumeExam, timer]);

  // ── Predaja ispita ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const currentAnswers = useExamStore.getState().answers;
    const elapsed = elapsedRef.current;
    const aid = attemptIdRef.current;

    try {
      let rpcResult = null;

      if (aid) {
        rpcResult = await attemptApi.finish(aid, currentAnswers, elapsed);
      }

      submitExam(rpcResult);
      draftStorage.clear(examId);
      navigate(`/rezultati/${examId}`);
    } catch (err) {
      console.error("[handleSubmit]", err);
      toast.error("Greška pri predaji ispita. Pokušaj ponovo.");
      setIsSubmitting(false);
    }
  }, [isSubmitting, submitExam, examId, navigate]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // ── Auto-save svakih 30s ──────────────────────────────────────────────────
  useEffect(() => {
    if (!examId || Object.keys(answers).length === 0) return;
    const id = setInterval(() => {
      draftStorage.save(examId, answers, attemptIdRef.current);
    }, 30_000);
    return () => clearInterval(id);
  }, [examId, answers]);

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

  // ── Sprečava accidental navigaciju ───────────────────────────────────────
  useBeforeUnload(questions.length > 0 && !store.submittedAt);

  const current = questions[currentIndex] ?? null;
  const currentPassage = current?.passageId
    ? (passages[current.passageId] ?? null)
    : null;
  const isCurrentFlagged = current ? flagged.has(current.id) : false;

  return {
    // Data
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
    // Loading / error — NOVO: isInitialized umjesto (!current && !fetchError)
    isLoading,
    isInitialized,
    fetchError,
    // Modals
    showSubmitModal,
    setShowSubmitModal,
    showDraftModal,
    confirmRestoreDraft,
    discardDraft,
    // Actions
    handleAnswer,
    handleToggleFlag,
    handleGoTo,
    handleSubmit,
    handlePause,
    handleResume,
    // Timer
    timer,
  };
}
