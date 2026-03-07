// hooks/useExamSession.js
// ─────────────────────────────────────────────────────────────────────────────
// KRITIČNI ISPRAVCI:
//
//  BUG #1 — Timer race condition
//  ──────────────────────────────
//  Stari kod:
//    const durationMinutes = examData?.exam?.duration_minutes ?? 100;
//    const timer = useTimer(durationMinutes * 60, ...);
//  Problem: useTimer() prima initialSeconds na INICIJALIZACIJI hooka.
//  examData je null na prvom renderu (useQuery još nije završio).
//  React HOOKS redoslijed mora biti konzistentan — ne možeš postponiti useTimer().
//  Rezultat: timer startao s 0 ili fallback vrijednošću, ne s pravim trajanjem.
//
//  ISPRAVAK: useTimer prima initialSeconds koji se ažurira kada examData pristignu.
//  Timer NE TECE dok je initialSeconds null (running=false dok nema examData).
//
//  BUG #2 — alreadyLoaded nije čistio stare podatke za različit ispit
//  ────────────────────────────────────────────────────────────────────
//  Ako korisnik ide: ispit A → lista → ispit B
//  store.examId === examB ali questions su bile iz A dok useQuery nije završio.
//  ISPRAVAK: useEffect inicijalizira store samo kada examData pristignu za TOČAN examId.
//
//  BUG #3 — attemptApi.finish() i pause() — format je sada OBJECT (FIXED u attemptApi)
//
//  NOVO:
//  • setExamMeta() — sprema exam.exam u store za top bar
//  • useExamWithQuestions hook (ne inline useQuery) za čišći kod
//  • Abandon attempt pri beforeunload (best-effort)
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
  // Ref za attemptId u fire-and-forget async operacijama (ne ovisi o closure staleness)
  const attemptIdRef = useRef(null);
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  // ── Dohvati ispit + pitanja + passages ────────────────────────────────────
  // Koristi useExamWithQuestions (30min staleTime — sadržaj ispita stabilan)
  const {
    data: examData,
    isLoading,
    error: fetchError,
  } = useExamWithQuestions(examId);

  // ── Je li ovaj examId već u storeu (korisnik je refresh-ao stranicu) ───────
  const alreadyLoaded = store.examId === examId && questions.length > 0;

  // ── Inicijalizacija ispita ────────────────────────────────────────────────
  //
  // Pokreće se kada examData pristignu ZA OVAJ examId.
  // Ako je examId isti kao store.examId i pitanja već postoje — preskoči
  // (korisnik se vratio na isti ispit u istoj sesiji).
  //
  useEffect(() => {
    // Čekaj examData
    if (!examData) return;

    // examData.exam.id mora biti ovaj examId (paranoja provjera za race condition)
    if (examData.exam?.id !== examId) return;

    // Ako je isti ispit i već imamo pitanja — ne resetiraj (čuvaj odgovore)
    if (store.examId === examId && store.questions.length > 0) return;

    // Inicijaliziraj store s novim pitanjima i passages
    startExam(examId, examData.questions, examData.passages);

    // Spremi exam metapodatke u store (za top bar)
    setExamMeta(examData.exam);

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

  // ── Timer — ISPRAVAK race condition ───────────────────────────────────────
  //
  // Problem: useTimer mora biti pozvan uvijek (React hooks pravilo).
  // Rješenje: timer prima initialSeconds = null dok examData nije spreman.
  //   useTimer interno ne tece dok je running=false (ispravak u useTimer).
  //
  const durationSeconds = examData?.exam?.duration_minutes
    ? examData.exam.duration_minutes * 60
    : null;

  // handleSubmit deklariran ispod, ali timer mu treba referencu — koristimo ref
  const handleSubmitRef = useRef(null);

  const timer = useTimer(durationSeconds, {
    onExpire: () => handleSubmitRef.current?.(),
    onWarning: () => toast.warning("Ostaje manje od 10 minuta!"),
    warningAt: 600,
  });

  // Prati elapsed u ref (ne uzrokuje re-render)
  useEffect(() => {
    if (durationSeconds == null) return;
    elapsedRef.current = durationSeconds - timer.timeLeft;
  }, [timer.timeLeft, durationSeconds]);

  // Automatski pauziraj timer kada je ispit pauziran
  useEffect(() => {
    if (isPaused) timer.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  // ── Obnova drafta ─────────────────────────────────────────────────────────
  const confirmRestoreDraft = useCallback(() => {
    if (pendingDraft?.answers) {
      restoreDraft(pendingDraft.answers);
      if (pendingDraft.attemptId) setAttemptId(pendingDraft.attemptId);
      toast.success("Prethodni odgovori su obnovljeni.");
    }
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [pendingDraft, restoreDraft, setAttemptId]);

  const discardDraft = useCallback(() => {
    draftStorage.clear(examId);
    setShowDraftModal(false);
    setPendingDraft(null);
  }, [examId]);

  // ── Odabir odgovora ───────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (letter) => {
      if (isPaused) return;
      const q =
        useExamStore.getState().questions[useExamStore.getState().currentIndex];
      if (!q || q.questionType === "fill_blank_mc") return;
      setAnswer(q.id, letter);
    },
    [isPaused, setAnswer],
  );

  const handleToggleFlag = useCallback(() => {
    if (isPaused) return;
    const q =
      useExamStore.getState().questions[useExamStore.getState().currentIndex];
    if (!q) return;
    toggleFlag(q.id);
  }, [isPaused, toggleFlag]);

  // ── Navigacija ────────────────────────────────────────────────────────────
  const totalVisible = questions.length;
  const answeredCount = Object.keys(answers).filter((qId) => {
    const q = questions.find((q) => q.id === qId);
    return q && q.questionType !== "fill_blank_mc";
  }).length;

  const handleGoTo = useCallback(
    (idx) => {
      setDirection(idx > currentIndex ? 1 : -1);
      goToQuestion(idx);
    },
    [currentIndex, goToQuestion],
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
        // finish_attempt RPC: atomarno sprema odgovore + računa score
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

  // Poveži handleSubmit u ref za useTimer onExpire callback
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

  // ── Derived values ────────────────────────────────────────────────────────
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
    // Loading / error
    isLoading,
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
