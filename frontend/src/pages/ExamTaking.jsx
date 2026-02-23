import { useParams, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/utils";
import { Modal, ModalBody, ModalFooter } from "@/components/common/Modal";
import { QuestionView } from "@/components/exam/QuestionView";
import { QuestionNav } from "@/components/exam/QuestionNav";
import { ProgressBar } from "@/components/exam/ProgressBar";
import { ExamTimer } from "@/components/exam/Timer";
import { useExamSession } from "@/hooks/useExamSession";

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function QuizPage() {
  const { examId } = useParams();

  const {
    questions,
    answers,
    flagged,
    current,
    currentIndex,
    totalQ,
    answeredCount,
    isCurrentFlagged,
    direction,
    showSubmitModal,
    setShowSubmitModal,
    showDraftModal,
    confirmRestoreDraft,
    discardDraft,
    handleAnswer,
    handleToggleFlag,
    handleGoTo,
    handleSubmit,
    timer,
  } = useExamSession(examId);

  const { formatted, isWarning, isDanger } = timer;

  if (!current) {
    return (
      <div className="min-h-dvh bg-warm-100 flex items-center justify-center">
        <div className="animate-pulse text-warm-400 text-sm">
          Učitavanje ispita...
        </div>
      </div>
    );
  }

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

      <Modal
        open={showDraftModal}
        onClose={discardDraft}
        title="Nastavi od gdje si stao?"
      >
        <ModalBody>
          <p className="text-sm text-warm-600">
            Pronađeni su prethodni odgovori za ovaj ispit. Želiš li nastaviti od
            mjesta gdje si stao ili početi ispočetka?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={discardDraft}>
            Počni ispočetka
          </Button>
          <Button variant="primary" onClick={confirmRestoreDraft}>
            Nastavi
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
