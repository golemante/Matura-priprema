import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/store/toastStore";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useExamStore } from "@/store/examStore";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/utils";
import { useTimer } from "@/hooks/useTimer";
import { useKeyPress } from "@/hooks/useKeyPress";
import { draftStorage } from "@/utils/storage";
import { Modal, ModalBody, ModalFooter } from "@/components/common/Modal";
import { QuestionView } from "@/components/exam/QuestionView";
import { QuestionNav } from "@/components/exam/QuestionNav";
import { ProgressBar } from "@/components/exam/ProgressBar";
import { ExamTimer } from "@/components/exam/Timer";

// Mock question data
function generateQuestions(examId) {
  const count = examId?.includes("visa") ? 40 : 30;
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
    points: examId?.includes("visa") ? 2 : 1,
  }));
}

export function QuizPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const {
    questions,
    answers,
    flagged,
    currentIndex,
    startExam,
    setAnswer,
    toggleFlag,
    goToQuestion,
  } = useExamStore();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      const draft = draftStorage.load(examId);
      startExam(examId, generateQuestions(examId));
      // TODO: ako postoji draft, ponudi obnavljanje odgovora
      if (draft) {
        toast.info(
          "Pronađeni su prethodni odgovori. Nastavljaš od mjesta gdje si stao.",
        );
      }
    }
  }, [examId, questions, startExam]);

  const current = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

  const handleAnswer = useCallback(
    (optionId) => {
      if (!current) return;
      setAnswer(current.id, optionId);
    },
    [current, setAnswer],
  );

  const handleToggleFlag = useCallback(() => {
    if (!current) return;
    toggleFlag(current.id);
  }, [current, toggleFlag]);

  useEffect(() => {
    const id = setInterval(() => {
      draftStorage.save(examId, answers);
    }, 30_000);
    return () => clearInterval(id);
  }, [examId, answers]);

  const handleGoTo = useCallback(
    (idx) => {
      setDirection(idx > currentIndex ? 1 : -1);
      goToQuestion(idx);
    },
    [currentIndex, goToQuestion],
  );

  const handleSubmit = useCallback(() => {
    draftStorage.clear(examId);
    navigate(`/rezultati/${examId}`, { state: { answers, questions } });
  }, [examId, navigate, answers, questions]);

  useKeyPress({
    ArrowRight: () => currentIndex < totalQ - 1 && handleGoTo(currentIndex + 1),
    ArrowLeft: () => currentIndex > 0 && handleGoTo(currentIndex - 1),
    // FIX: šaljemo option ID → handleAnswer pronalazi current.id interno
    a: () => handleAnswer("a"),
    b: () => handleAnswer("b"),
    c: () => handleAnswer("c"),
    d: () => handleAnswer("d"),
    // FIX: toggleFlag bez argumenta, handler ga pokupi interno
    f: handleToggleFlag,
  });

  useEffect(() => {
    if (!examId || answeredCount === 0) return;
    const id = setInterval(() => {
      draftStorage.save(examId, answers);
    }, 30_000);
    return () => clearInterval(id);
  }, [examId, answers, answeredCount]);

  const { formatted, isWarning, isDanger } = useTimer(90 * 60, {
    onExpire: () => handleSubmit(),
    onWarning: () =>
      toast.warning("Ostalo je manje od 10 minuta!", { type: "warning" }),
  });

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  if (!current) return null;

  const isCurrentFlagged = flagged.includes(current.id);

  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-warm-300 shadow-card">
        <div className="page-container">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Left: back + question counter */}
            <div className="flex items-center gap-3">
              <Link
                to={`/predmeti/${examId?.split("-")[0]}`}
                className="p-1.5 rounded-lg text-warm-500 hover:bg-warm-100 hover:text-warm-800 transition-colors"
              >
                <ArrowLeft size={18} />
              </Link>
              <span className="text-sm font-semibold text-warm-700 hidden sm:block">
                Pitanje{" "}
                <span className="text-warm-900">{currentIndex + 1}</span>
                <span className="text-warm-400">/{totalQ}</span>
              </span>
            </div>

            {/* Center: progress bar */}
            <div className="flex-1 max-w-xs hidden md:block">
              <ProgressBar
                value={answeredCount}
                max={totalQ}
                showLabel={true}
                variant={answeredCount === totalQ ? "success" : "default"}
                className="w-full"
              />
            </div>

            {/* Right: timer + submit */}
            <div className="flex items-center gap-2">
              <ExamTimer
                formatted={formatted}
                isWarning={isWarning}
                isDanger={isDanger}
              />
              <Button size="sm" onClick={() => setShowSubmitModal(true)}>
                Predaj
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 page-container py-6 flex flex-col lg:flex-row gap-6">
        {/* Question panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <QuestionView
                question={current}
                selectedAnswer={answers[current.id]}
                onAnswer={handleAnswer} // FIX #2: ispravna signatura
                onFlag={handleToggleFlag} // FIX #3: ispravna signatura
                isFlagged={isCurrentFlagged} // FIX #1: array.includes()
                index={currentIndex}
              />
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="secondary"
              leftIcon={ArrowLeft}
              disabled={currentIndex === 0}
              onClick={() => handleGoTo(currentIndex - 1)}
            >
              Prethodno
            </Button>
            {currentIndex < totalQ - 1 ? (
              <Button
                variant="primary"
                rightIcon={ArrowRight}
                onClick={() => handleGoTo(currentIndex + 1)}
              >
                Sljedeće
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowSubmitModal(true)}
              >
                Predaj ispit
              </Button>
            )}
          </div>
        </div>

        {/* Question navigator sidebar */}
        <div className="lg:w-56 xl:w-64">
          <QuestionNav
            questions={questions}
            answers={answers}
            flagged={flagged} // FIX #1: QuestionNav već koristi .includes()
            currentIndex={currentIndex}
            onNavigate={handleGoTo}
          />
        </div>
      </div>

      {/* Submit confirmation modal */}
      <Modal
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Predaj ispit?"
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-primary-600" />
              </div>
              <p className="text-xs text-warm-500">
                Ova radnja se ne može poništiti. Provjeri svoje odgovore prije
                predaje.
              </p>
            </div>
            <div className="bg-warm-50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-600">Odgovoreno</span>
                <span className="font-semibold text-warm-900">
                  {answeredCount}/{totalQ}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-600">Nije odgovoreno</span>
                <span
                  className={cn(
                    "font-semibold",
                    totalQ - answeredCount > 0
                      ? "text-red-600"
                      : "text-success-600",
                  )}
                >
                  {totalQ - answeredCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-600">Označeno zastavicom</span>
                <span className="font-semibold text-amber-600">
                  {flagged.length}
                </span>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
            Nastavi rješavati
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Predaj ispit
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
