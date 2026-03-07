// hooks/useExamSession.js
// ─────────────────────────────────────────────────────────────────────────────
// PROMJENE u odnosu na staru verziju:
//   • Attempt se KREIRA na početku (attemptApi.create) → attemptId u storeu
//   • handleSubmit poziva finish_attempt RPC (čeka rezultat)
//   • handlePause / handleResume — pauziranje s RPC pozivima
//   • Timer se pauzira kada je isPaused=true
//   • answers su { questionId: letter } gdje letter je 'a'|'b'|'c'|'d'
//   • keyboard shortcut je ostao identičan
//   • LocalStorage backup sada uključuje attemptId
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useExamStore } from "@/store/examStore";
import { useTimer } from "@/hooks/useTimer";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";
import { examApi } from "@/api/examApi";
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
    submitExam,
  } = store;

  const [direction, setDirection] = useState(1);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref za elapsed seconds — ne trebamo re-render pri svakom tiku
  const elapsedRef = useRef(0);

  // ── Provjeri je li ispit već učitan u store ────────────────────────────────
  const alreadyLoaded = store.examId === examId && questions.length > 0;

  // ── Dohvati ispit + pitanja + passages ────────────────────────────────────
  const {
    data: examData,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["exam-with-questions", examId],
    queryFn: () => examApi.getWithQuestions(examId),
    enabled: !!examId && !alreadyLoaded,
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });

  // ── Inicijalizacija ispita + kreiranje attempt u bazi ─────────────────────
  useEffect(() => {
    if (!examData || alreadyLoaded) return;

    // Inicijaliziraj store s pitanjima i passages
    startExam(examId, examData.questions, examData.passages);

    // Kreiraj attempt u bazi (async, fire-and-forget blokiranje UI-a)
    attemptApi
      .create(examId)
      .then((attempt) => {
        if (attempt?.id) {
          setAttemptId(attempt.id);
          // Spremi attemptId u draft za slučaj pada sesije
          draftStorage.save(examId, {}, attempt.id);
        }
      })
      .catch((err) => {
        // Neuspjeh kreiranja attempt-a ne blokira ispit
        // Korisnik može riješiti, ali rezultat neće biti u bazi
        console.warn("[attemptApi.create] greška:", err);
        toast.warning(
          "Nismo mogli pokrenuti sesiju u bazi. Odgovori će biti lokalno pohranjeni.",
        );
      });

    // Provjeri postoji li draft s odgovorima
    const draft = draftStorage.load(examId);
    if (draft?.answers && Object.keys(draft.answers).length > 0) {
      setPendingDraft(draft);
      setShowDraftModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData]);

  // ── Obnovi attemptId iz drafta ako store nema (refresh stranice) ──────────
  useEffect(() => {
    if (alreadyLoaded && !attemptId) {
      const draft = draftStorage.load(examId);
      if (draft?.attemptId) {
        setAttemptId(draft.attemptId);
      }
    }
  }, [alreadyLoaded, attemptId, examId, setAttemptId]);

  // ── Potvrda obnove drafta ─────────────────────────────────────────────────
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

  // ── Pauziraj ispit ────────────────────────────────────────────────────────
  const handlePause = useCallback(async () => {
    if (isPaused || !attemptId) return;

    pauseExam();
    timer.pause();

    // Spremi odgovore lokalno odmah
    draftStorage.save(examId, answers, attemptId);

    // Obavijesti bazu (best-effort)
    if (attemptId) {
      attemptApi
        .pause(attemptId, elapsedRef.current, answers)
        .catch((err) => console.warn("[pause_attempt]", err));
    }

    toast.info("Ispit pauziran. Odgovori su sačuvani.");
  }, [isPaused, attemptId, pauseExam, examId, answers]);

  // ── Nastavi ispit ─────────────────────────────────────────────────────────
  const handleResume = useCallback(async () => {
    if (!isPaused) return;

    resumeExam();
    timer.resume();

    if (attemptId) {
      attemptApi
        .resume(attemptId)
        .catch((err) => console.warn("[resume_attempt]", err));
    }

    toast.success("Ispit nastavljen.");
  }, [isPaused, resumeExam, attemptId]);

  // ── Predaj ispit ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const currentAnswers = useExamStore.getState().answers;
    const elapsed = elapsedRef.current;

    try {
      let rpcResult = null;

      if (attemptId) {
        // Pozovi finish_attempt RPC — server računa score i zapisuje attempt_answers
        rpcResult = await attemptApi.finish(attemptId, currentAnswers, elapsed);
      }

      // Spremi rezultat u store (s RPC rezultatom ili bez)
      submitExam(rpcResult);
      draftStorage.clear(examId);

      navigate(`/rezultati/${examId}`);
    } catch (err) {
      console.error("[handleSubmit]", err);
      toast.error("Greška pri predaji ispita. Pokušaj ponovo.");
      setIsSubmitting(false);
    }
  }, [isSubmitting, attemptId, submitExam, examId, navigate]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const durationMinutes =
    examData?.exam?.duration_minutes ?? (store.examId === examId ? 100 : 70); // fallback

  const timer = useTimer(durationMinutes * 60, {
    onExpire: handleSubmit,
    onWarning: () => toast.warning("Ostaje manje od 10 minuta!"),
    warningAt: 600,
  });

  // Prati elapsed u ref (bez re-rendera)
  useEffect(() => {
    elapsedRef.current = durationMinutes * 60 - timer.timeLeft;
  }, [timer.timeLeft, durationMinutes]);

  // Automatski pauziraj timer kada je ispit pauziran
  useEffect(() => {
    if (isPaused) {
      timer.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  // ── Auto-save svakih 30s ──────────────────────────────────────────────────
  useEffect(() => {
    if (!examId || Object.keys(answers).length === 0) return;

    const id = setInterval(() => {
      draftStorage.save(examId, answers, attemptId);
    }, 30_000);

    return () => clearInterval(id);
  }, [examId, answers, attemptId]);

  // ── Navigacija ────────────────────────────────────────────────────────────
  const totalQ = questions.filter(
    (q) => q.questionType !== "fill_blank_mc",
  ).length;
  // Za prikaz "X/Y" koristimo ukupan broj vidljivih pitanja (s parentima)
  const totalVisible = questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleGoTo = useCallback(
    (idx) => {
      setDirection(idx > currentIndex ? 1 : -1);
      goToQuestion(idx);
    },
    [currentIndex, goToQuestion],
  );

  // ── Odaberi odgovor ───────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (letter) => {
      if (isPaused) return; // Blokiraj kad je pauza
      const current = questions[currentIndex];
      if (!current) return;
      // Odbij unos za fill_blank_mc parent (nema opcija za odabir)
      if (current.questionType === "fill_blank_mc") return;
      setAnswer(current.id, letter);
    },
    [questions, currentIndex, setAnswer, isPaused],
  );

  const handleToggleFlag = useCallback(() => {
    if (isPaused) return;
    const current = questions[currentIndex];
    if (!current) return;
    toggleFlag(current.id);
  }, [questions, currentIndex, toggleFlag, isPaused]);

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
        "Prečaci: ←→ navigacija • A/B/C/D/E odabir • F označi • P pauza",
      ),
  });

  // ── Prevent accidental navigation ────────────────────────────────────────
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
    totalQ,
    totalVisible,
    answeredCount,
    isCurrentFlagged,
    direction,
    isPaused,
    isSubmitting,
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
