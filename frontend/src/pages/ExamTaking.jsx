// pages/ExamTaking.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PROMJENE u odnosu na staru verziju:
//   • Koristi QuestionDisplay umjesto QuestionView (options.letter)
//   • Prikazuje PassageDisplay uz pitanje (side-by-side na desktopu, iznad na mobu)
//   • Dugme Pauza s isPaused stanjem i overlay-em
//   • ExamSkeleton za skeleton loading
//   • Error state s retry opcijom
//   • handlePause / handleResume iz useExamSession
// ─────────────────────────────────────────────────────────────────────────────
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Pause,
  Play,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/utils";
import { Modal, ModalBody, ModalFooter } from "@/components/common/Modal";
import { QuestionDisplay } from "@/components/exam/QuestionDisplay";
import { PassageDisplay } from "@/components/exam/PassageDisplay";
import { ExamSkeleton } from "@/components/exam/ExamSkeleton";
import { QuestionNav } from "@/components/exam/QuestionNav";
import { ProgressBar } from "@/components/exam/ProgressBar";
import { ExamTimer } from "@/components/exam/Timer";
import { useExamSession } from "@/hooks/useExamSession";

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ── Pauza overlay ─────────────────────────────────────────────────────────────
function PauseOverlay({ onResume }) {
  return (
    <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-primary-50 border-2 border-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Pause size={28} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-warm-900 mb-2">
          Ispit je pauziran
        </h2>
        <p className="text-sm text-warm-500 mb-6">
          Odgovori su automatski sačuvani. Timer je zaustavljen.
        </p>
        <Button
          variant="primary"
          className="w-full"
          leftIcon={Play}
          onClick={onResume}
        >
          Nastavi ispit
        </Button>
      </div>
    </div>
  );
}

// ── Glavna stranica ───────────────────────────────────────────────────────────
export function QuizPage() {
  const { examId } = useParams();

  const {
    questions,
    answers,
    flagged,
    current,
    currentPassage,
    currentIndex,
    totalVisible,
    answeredCount,
    isCurrentFlagged,
    direction,
    isPaused,
    isSubmitting,
    isLoading,
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
  } = useExamSession(examId);

  const { formatted, isWarning, isDanger } = timer;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || (!current && !fetchError)) {
    // Provjeri ima li ovaj ispit passages (npr. Hrvatski)
    const mightHavePassage =
      examId?.startsWith("hrv") || examId?.startsWith("lij");
    return <ExamSkeleton showPassage={mightHavePassage} />;
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 shadow-card p-8 max-w-md text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={40} />
          <h2 className="text-lg font-bold text-warm-900 mb-2">
            Greška pri učitavanju
          </h2>
          <p className="text-sm text-warm-500 mb-6">
            {fetchError.message ??
              "Provjerite internet konekciju i pokušaj ponovo."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => window.history.back()}>
              Natrag
            </Button>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Pokušaj ponovo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasPassage = !!currentPassage;

  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col">
      {/* Pauza overlay */}
      <AnimatePresence>
        {isPaused && <PauseOverlay onResume={handleResume} />}
      </AnimatePresence>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-warm-300 shadow-card">
        <div className="page-container">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Natrag + broj pitanja */}
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
                <span className="text-warm-400">/{totalVisible}</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex-1 max-w-xs hidden md:block">
              <ProgressBar
                value={answeredCount}
                max={
                  questions.filter((q) => q.questionType !== "fill_blank_mc")
                    .length
                }
                showLabel
                variant={
                  answeredCount === questions.length ? "success" : "default"
                }
              />
            </div>

            {/* Timer + Pauza + Predaj */}
            <div className="flex items-center gap-2">
              <ExamTimer
                formatted={formatted}
                isWarning={isWarning}
                isDanger={isDanger}
              />

              {/* Pauza dugme */}
              <button
                onClick={handlePause}
                title="Pauziraj ispit (P)"
                className="p-1.5 rounded-lg text-warm-500 hover:bg-warm-100 hover:text-warm-800 transition-colors hidden sm:flex items-center"
              >
                <Pause size={16} />
              </button>

              <Button
                size="sm"
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Predaj"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 page-container py-6 flex flex-col gap-6",
          // S passageom: passage lijevo, pitanje desno
          hasPassage ? "lg:flex-row" : "lg:flex-row",
        )}
      >
        {/* Passage panel — prikazan IZNAD na mobu, LIJEVO na desktopu */}
        {hasPassage && (
          <div className="w-full lg:w-2/5 xl:w-[38%] lg:flex-shrink-0">
            <div className="lg:sticky lg:top-20">
              <PassageDisplay passage={currentPassage} />
            </div>
          </div>
        )}

        {/* Pitanje + opcije */}
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
              <QuestionDisplay
                question={current}
                selectedAnswer={answers[current?.id] ?? null}
                onAnswer={handleAnswer}
                onFlag={handleToggleFlag}
                isFlagged={isCurrentFlagged}
                index={currentIndex}
                isPaused={isPaused}
              />
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next */}
          <div className="flex justify-between mt-6">
            <Button
              variant="secondary"
              leftIcon={ArrowLeft}
              disabled={currentIndex === 0 || isPaused}
              onClick={() => handleGoTo(currentIndex - 1)}
            >
              Prethodno
            </Button>
            {currentIndex < totalVisible - 1 ? (
              <Button
                variant="primary"
                rightIcon={ArrowRight}
                disabled={isPaused}
                onClick={() => handleGoTo(currentIndex + 1)}
              >
                Sljedeće
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={isPaused}
                onClick={() => setShowSubmitModal(true)}
              >
                Predaj ispit
              </Button>
            )}
          </div>
        </div>

        {/* Navigator sidebar */}
        <div className={cn(hasPassage ? "lg:w-48 xl:w-52" : "lg:w-56 xl:w-64")}>
          <QuestionNav
            questions={questions}
            answers={answers}
            flagged={flagged}
            currentIndex={currentIndex}
            onNavigate={isPaused ? undefined : handleGoTo}
          />
        </div>
      </div>

      {/* ── Submit modal ─────────────────────────────────────────────────── */}
      <Modal
        open={showSubmitModal}
        onClose={() => !isSubmitting && setShowSubmitModal(false)}
        title="Predaj ispit?"
      >
        <ModalBody>
          <p className="text-sm text-warm-600">
            Odgovorili ste na{" "}
            <span className="font-bold text-warm-900">{answeredCount}</span> od{" "}
            <span className="font-bold text-warm-900">
              {
                questions.filter((q) => q.questionType !== "fill_blank_mc")
                  .length
              }
            </span>{" "}
            pitanja.
          </p>
          {answeredCount <
            questions.filter((q) => q.questionType !== "fill_blank_mc")
              .length && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
              <AlertCircle
                size={16}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-amber-700">
                Neka pitanja su ostala bez odgovora. Možete se vratiti i
                odgovoriti.
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setShowSubmitModal(false)}
            disabled={isSubmitting}
          >
            Odustani
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowSubmitModal(false);
              handleSubmit();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Predaje se...
              </span>
            ) : (
              "Predaj ispit"
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Draft restore modal ──────────────────────────────────────────── */}
      <Modal
        open={showDraftModal}
        onClose={discardDraft}
        title="Pronađeni su sačuvani odgovori"
      >
        <ModalBody>
          <p className="text-sm text-warm-600">
            Pronašli smo ranije sačuvane odgovore za ovaj ispit. Želite li ih
            obnoviti?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={discardDraft}>
            Započni ispočetka
          </Button>
          <Button variant="primary" onClick={confirmRestoreDraft}>
            Obnovi odgovore
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
