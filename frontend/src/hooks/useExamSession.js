// hooks/useExamSession.js
// Composite hook koji enkapsulira svu logiku aktivnog ispita.
// ExamTaking.jsx postaje čisti UI — nema više business logike u stranici.
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useExamStore } from "@/store/examStore";
import { useTimer } from "@/hooks/useTimer";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { draftStorage } from "@/utils/storage";
import { toast } from "@/store/toastStore";

// Mock generator — zamijeniti s pravim API pozivom kad backend bude spreman
// useExam(examId) hook iz hooks/useExam.js treba preuzeti ovu ulogu
function generateQuestions(examId) {
  const isVisa = examId?.includes("visa");
  const count = isVisa ? 40 : 30;
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    text: `Pitanje ${i + 1}: Ovo je primjer pitanja koje bi se nalazilo na stvarnom ispitu. Odaberite točan odgovor.`,
    options: [
      { id: "a", text: "Ovo je opcija A – mogući točan odgovor" },
      { id: "b", text: "Ovo je opcija B – alternativni odgovor" },
      { id: "c", text: "Ovo je opcija C – još jedna mogućnost" },
      { id: "d", text: "Ovo je opcija D – posljednja opcija" },
    ],
    correct: ["a", "b", "c", "d"][Math.floor(Math.random() * 4)],
    points: isVisa ? 2 : 1,
  }));
}

// Trajanje ispita u minutama iz examId konvencije
// TODO: zamijeniti s exam.duration iz API-ja
function getDuration(examId) {
  return examId?.includes("visa") ? 90 : 70;
}

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

  // Draft restore modal state
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);

  // ── Inicijalizacija ispita ─────────────────────────────────────
  useEffect(() => {
    if (!examId) return;

    // Ako je isti ispit već u storeu (npr. korisnik se vratio nazad), ne resetiraj
    if (store.examId === examId && questions.length > 0) return;

    const draft = draftStorage.load(examId);
    const freshQuestions = generateQuestions(examId);
    startExam(examId, freshQuestions);

    // FIX: draft se sada nudi za obnavljanje, a ne samo prikazuje toast
    if (draft?.answers && Object.keys(draft.answers).length > 0) {
      setPendingDraft(draft);
      setShowDraftModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

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

  // ── Predaja ispita ─────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    submitExam(); // sprema lastResult u store
    draftStorage.clear(examId);
    navigate(`/rezultati/${examId}`);
  }, [submitExam, examId, navigate]);

  // ── Auto-save drafta svakih 30s ────────────────────────────────
  useEffect(() => {
    const answeredCount = Object.keys(answers).length;
    if (!examId || answeredCount === 0) return;

    const id = setInterval(() => {
      draftStorage.save(examId, answers);
    }, 30_000);

    return () => clearInterval(id);
  }, [examId, answers]);

  // ── Navigacija ─────────────────────────────────────────────────
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

  // ── Keyboard shortcuts ─────────────────────────────────────────
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

  // ── Timer ──────────────────────────────────────────────────────
  const durationSeconds = getDuration(examId) * 60;
  const timer = useTimer(durationSeconds, {
    onExpire: handleSubmit,
    onWarning: () => toast.warning("Ostaje manje od 10 minuta!"),
    warningAt: 600,
  });

  // ── Prevent accidental navigation ─────────────────────────────
  useBeforeUnload(questions.length > 0 && !store.submittedAt);

  // ── Derived values ─────────────────────────────────────────────
  const current = questions[currentIndex] ?? null;
  const isCurrentFlagged = current ? flagged.has(current.id) : false;
  const progress = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

  return {
    // State
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
