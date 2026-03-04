// hooks/useExamSession.js
// Migrirano s mock generatora na pravi Supabase API.
// Sve ostale logike (timer, keyboard, draft, flagging) su nepromijenjene.
import { useState, useEffect, useCallback } from "react";
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
import { calculateScore } from "@/utils/helpers";
import { supabase } from "@/lib/supabase";

export function useExamSession(examId) {
  const navigate = useNavigate();
  const store = useExamStore();
  const {
    questions,
    answers,
    flagged,
    currentIndex,
    startExam,
    restoreDraft,
    setAnswer,
    toggleFlag,
    goToQuestion,
    submitExam,
  } = store;

  const [direction, setDirection] = useState(1);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);

  // ── Dohvati ispit + pitanja iz Supabase ───────────────────────────────────
  // enabled: false ako su pitanja već u storeu (korisnik se vratio nazad)
  const alreadyLoaded = store.examId === examId && questions.length > 0;

  const {
    data: examData,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["exam-with-questions", examId],
    queryFn: () => examApi.getWithQuestions(examId),
    enabled: !!examId && !alreadyLoaded,
    staleTime: 1000 * 60 * 30, // 30 min — pitanja se ne mijenjaju
    retry: 2,
  });

  // ── Inicijalizacija ispita kad podaci stignu ───────────────────────────────
  useEffect(() => {
    if (!examData || alreadyLoaded) return;

    const draft = draftStorage.load(examId);
    startExam(examId, examData.questions);

    if (draft?.answers && Object.keys(draft.answers).length > 0) {
      setPendingDraft(draft);
      setShowDraftModal(true);
    }
    // examData i alreadyLoaded su stabilni — exhaustive-deps je ok ignorirati
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData]);

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

  // ── Predaja ispita ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    // 1. Spremi u lokalni store (potrebno za ExamResults koji čita lastResult)
    submitExam();
    draftStorage.clear(examId);

    // 2. Fire-and-forget spremi u Supabase — ne blokiramo navigaciju
    // Samo ako je korisnik prijavljen (anonimni korisnici ne mogu pisati)
    const currentAnswers = useExamStore.getState().answers;
    const currentQuestions = useExamStore.getState().questions;
    const startedAt = useExamStore.getState().startedAt;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return; // Neprijavljen korisnik — lokalni rezultat je dovoljan

      const score = calculateScore(currentAnswers, currentQuestions);
      const elapsedSeconds = Math.round(
        (Date.now() - (startedAt ?? Date.now())) / 1000,
      );

      attemptApi
        .submit({
          examId,
          questions: currentQuestions,
          answers: currentAnswers,
          elapsedSeconds,
          scorePct: score.percentage,
          correctCount: score.correct,
          totalCount: currentQuestions.length,
        })
        .catch((err) => {
          // Tiho logiraj — rezultat je već lokalno dostupan
          console.error("[attemptApi.submit] greška:", err);
        });
    });

    // 3. Navigiraj odmah na rezultate
    navigate(`/rezultati/${examId}`);
  }, [submitExam, examId, navigate]);

  // ── Auto-save drafta svakih 30s ───────────────────────────────────────────
  useEffect(() => {
    const answeredCount = Object.keys(answers).length;
    if (!examId || answeredCount === 0) return;

    const id = setInterval(() => {
      draftStorage.save(examId, answers);
    }, 30_000);

    return () => clearInterval(id);
  }, [examId, answers]);

  // ── Navigacija ────────────────────────────────────────────────────────────
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleGoTo = useCallback(
    (idx) => {
      setDirection(idx > currentIndex ? 1 : -1);
      goToQuestion(idx);
    },
    [currentIndex, goToQuestion],
  );

  const handleAnswer = useCallback(
    (optionId) => {
      const current = questions[currentIndex];
      if (!current) return;
      setAnswer(current.id, optionId);
    },
    [questions, currentIndex, setAnswer],
  );

  const handleToggleFlag = useCallback(() => {
    const current = questions[currentIndex];
    if (!current) return;
    toggleFlag(current.id);
  }, [questions, currentIndex, toggleFlag]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyPress({
    ArrowRight: () => currentIndex < totalQ - 1 && handleGoTo(currentIndex + 1),
    ArrowLeft: () => currentIndex > 0 && handleGoTo(currentIndex - 1),
    a: () => handleAnswer("a"),
    b: () => handleAnswer("b"),
    c: () => handleAnswer("c"),
    d: () => handleAnswer("d"),
    f: handleToggleFlag,
    "?": () =>
      toast.info(
        "Prečaci: ←→ navigacija • A/B/C/D odabir • F označi • ? pomoć",
      ),
  });

  // ── Timer ─────────────────────────────────────────────────────────────────
  // Trajanje iz baze (examData.exam.duration_minutes) ili fallback iz examId
  const durationMinutes =
    examData?.exam?.duration_minutes ?? (examId?.includes("visa") ? 90 : 70);

  const timer = useTimer(durationMinutes * 60, {
    onExpire: handleSubmit,
    onWarning: () => toast.warning("Ostaje manje od 10 minuta!"),
    warningAt: 600,
  });

  // ── Prevent accidental navigation ─────────────────────────────────────────
  useBeforeUnload(questions.length > 0 && !store.submittedAt);

  // ── Derived values ────────────────────────────────────────────────────────
  const current = questions[currentIndex] ?? null;
  const isCurrentFlagged = current ? flagged.has(current.id) : false;
  const progress = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

  return {
    // Data
    questions,
    answers,
    flagged,
    current,
    currentIndex,
    totalQ,
    answeredCount,
    progress,
    isCurrentFlagged,
    direction,
    // Loading / error (novi — ExamTaking može pokazati error state)
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
    // Timer
    timer,
  };
}
