import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Timer,
  Flag,
  CheckCircle,
  Circle,
  AlertCircle,
  SkipForward,
} from "lucide-react";
import { useExamStore } from "@/store/examStore";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/utils";

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

  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 min in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    // Ako pitanja još nisu učitana, generiraj ih i pokreni ispit u store-u
    if (!questions || questions.length === 0) {
      startExam(examId, generateQuestions(examId));
    }
  }, [examId, questions, startExam]);

  const current = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleGoTo = (idx) => {
    setDirection(idx > currentIndex ? 1 : -1);
    goToQuestion(idx); // Poziva store akciju
  };

  const handleSubmit = () => {
    navigate(`/rezultati/${examId}`, { state: { answers, questions } });
  };

  if (!current) return null;

  const timerWarning = timeLeft < 10 * 60; // last 10 min

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

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
              <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary-600 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <p className="text-xs text-warm-400 mt-1 text-center">
                {answeredCount}/{totalQ} odgovoreno
              </p>
            </div>

            {/* Right: timer + submit */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold",
                  timerWarning
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-warm-100 text-warm-700",
                )}
              >
                <Timer
                  size={14}
                  className={timerWarning ? "animate-pulse" : ""}
                />
                {formatTime(timeLeft)}
              </div>
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
              {/* Question card */}
              <div className="bg-white rounded-2xl border border-warm-300 shadow-card p-6 mb-4">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <span
                    className="text-xs font-bold text-primary-600 bg-primary-50 border border-primary-200
                                   px-2.5 py-1 rounded-full"
                  >
                    Pitanje {currentIndex + 1}
                  </span>
                  <button
                    onClick={toggleFlag}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      flagged.has(current.id)
                        ? "text-amber-600 bg-amber-50"
                        : "text-warm-400 hover:text-warm-700 hover:bg-warm-100",
                    )}
                    title="Označi pitanje"
                  >
                    <Flag size={16} />
                  </button>
                </div>

                <p className="text-warm-900 font-medium text-base leading-relaxed">
                  {current.text}
                </p>
              </div>

              {/* Answer options */}
              <div className="space-y-2.5">
                {current.options.map((option) => {
                  const selected = answers[current.id] === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => setAnswer(option.id)}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-150",
                        "flex items-center gap-3 group",
                        selected
                          ? "border-primary-500 bg-primary-50 shadow-sm"
                          : "border-warm-200 bg-white hover:border-warm-400 hover:bg-warm-50",
                      )}
                    >
                      {/* Option indicator */}
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all",
                          selected
                            ? "border-primary-500 bg-primary-500 text-white"
                            : "border-warm-300 text-warm-400 group-hover:border-warm-500",
                        )}
                      >
                        {option.id.toUpperCase()}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium leading-relaxed",
                          selected ? "text-primary-800" : "text-warm-700",
                        )}
                      >
                        {option.text}
                      </span>
                      {selected && (
                        <CheckCircle
                          size={16}
                          className="text-primary-500 ml-auto flex-shrink-0"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
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
          <div className="bg-white rounded-2xl border border-warm-300 shadow-card p-4 sticky top-20">
            <h3 className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-3">
              Navigacija
            </h3>
            <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isFlagged = flagged.has(q.id);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleGoTo(idx)}
                    className={cn(
                      "w-full aspect-square rounded-lg text-xs font-semibold transition-all duration-100",
                      isCurrent
                        ? "bg-primary-600 text-white shadow-sm"
                        : isAnswered
                          ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                          : isFlagged
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-warm-100 text-warm-500 hover:bg-warm-200",
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-1.5 text-xs text-warm-500">
              {[
                { color: "bg-primary-100", label: "Odgovoreno" },
                { color: "bg-amber-100", label: "Označeno" },
                { color: "bg-warm-100", label: "Nije odgovoreno" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn("w-3.5 h-3.5 rounded", color)} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-card-lg border border-warm-300 p-6 max-w-sm w-full"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <AlertCircle size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-warm-900">Predaj ispit?</h3>
                  <p className="text-xs text-warm-500">
                    Ova radnja se ne može poništiti
                  </p>
                </div>
              </div>

              <div className="bg-warm-50 rounded-xl p-3 mb-5 space-y-1.5 text-sm">
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
                        ? "text-amber-600"
                        : "text-warm-900",
                    )}
                  >
                    {totalQ - answeredCount}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Odustani
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSubmit}
                >
                  Predaj
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
