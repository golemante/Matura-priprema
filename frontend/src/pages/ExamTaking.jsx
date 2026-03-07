// pages/ExamTaking.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI:
//
//  BUG #1 — subjectId detekcija: examId?.split("-")[0]
//           Ispravak: koristi examMeta.subject_id iz stora (pouzdano)
//
//  BUG #2 — showPassage skeleton detekcija: examId?.startsWith("hrv")
//           Ispravak: `hasPassage` se bazira na stvarnim podacima iz pitanja
//           Fallback za skeleton: provjeri examMeta ili defaultaj na false
//
//  BUG #3 — Exam title u top baru bio je hardkodiran kao "Ispit"
//           Ispravak: koristi examMeta.title (iz DB) ili generira iz meta
//
//  NOVO:
//  • Top bar prikazuje naziv ispita iz DB (title, godina, rok, razina)
//  • Timer prikazuje "—:—" dok se čeka inicijalizacija (ne 00:00)
//  • Bolja error poruka sa specifičnijim textom
// ─────────────────────────────────────────────────────────────────────────────
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Pause,
  Play,
  Loader2,
  Clock,
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
import { EXAM_SESSIONS, DIFFICULTY_LEVELS } from "@/utils/constants";

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ── Helper za exam title ──────────────────────────────────────────────────────
function buildExamTitle(examMeta) {
  if (!examMeta) return "Ispit";
  if (examMeta.title) return examMeta.title;

  const session =
    EXAM_SESSIONS.find((s) => s.id === examMeta.session)?.name ??
    examMeta.session;
  const level =
    DIFFICULTY_LEVELS.find((d) => d.id === examMeta.level)?.short ??
    examMeta.level;
  return `${examMeta.year}. · ${session} · ${level}`;
}

// ── Pauza overlay ─────────────────────────────────────────────────────────────
function PauseOverlay({ onResume, examTitle }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
      >
        <div className="w-16 h-16 bg-primary-50 border-2 border-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Pause size={28} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-warm-900 mb-1">
          Ispit je pauziran
        </h2>
        {examTitle && (
          <p className="text-xs text-warm-400 mb-2 truncate">{examTitle}</p>
        )}
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
      </motion.div>
    </motion.div>
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
    examMeta,
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

  const { formatted, isWarning, isDanger, isReady } = timer;

  // Subject ID pouzdano iz examMeta (ne split-anjem examId stringa)
  const subjectId = examMeta?.subject_id ?? examId?.split("-")[0];
  const backLink = `/predmeti/${subjectId}`;
  const examTitle = buildExamTitle(examMeta);

  // showPassage se bazira na STVARNIM podacima (ima li currentPassage)
  // Za skeleton: pretpostavljamo based on examMeta ili false
  const hasPassage = !!currentPassage;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || (!current && !fetchError)) {
    return <ExamSkeleton showPassage={false} />;
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
              "Provjeri internetsku konekciju i pokušaj ponovo."}
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

  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col">
      {/* Pauza overlay */}
      <AnimatePresence>
        {isPaused && (
          <PauseOverlay onResume={handleResume} examTitle={examTitle} />
        )}
      </AnimatePresence>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-warm-300 shadow-card">
        <div className="page-container">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Natrag + naziv ispita */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to={backLink}
                className="p-1.5 rounded-lg text-warm-500 hover:bg-warm-100 hover:text-warm-800 transition-colors flex-shrink-0"
                title="Natrag na popis ispita"
              >
                <ArrowLeft size={18} />
              </Link>
              <div className="hidden sm:block min-w-0">
                <p className="text-xs text-warm-400 leading-none mb-0.5 truncate">
                  {examTitle}
                </p>
                <p className="text-sm font-semibold text-warm-900 leading-none tabular-nums">
                  Pitanje{" "}
                  <span className="text-warm-900">{currentIndex + 1}</span>
                  <span className="text-warm-400">/{totalVisible}</span>
                </p>
              </div>
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
                  answeredCount ===
                  questions.filter((q) => q.questionType !== "fill_blank_mc")
                    .length
                    ? "success"
                    : "default"
                }
              />
            </div>

            {/* Timer + Pauza + Predaj */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Timer — prikazuje "—:—" dok nije inicijaliziran */}
              {isReady ? (
                <ExamTimer
                  formatted={formatted}
                  isWarning={isWarning}
                  isDanger={isDanger}
                />
              ) : (
                <div className="flex items-center gap-1.5 text-warm-400 text-sm font-mono">
                  <Clock size={14} />
                  <span>—:—</span>
                </div>
              )}

              {/* Pauza */}
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
      <div className="flex-1 page-container py-6 flex flex-col lg:flex-row gap-6">
        {/* Passage panel — iznad na mobu, lijevo na desktopu */}
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
            Zanemari
          </Button>
          <Button variant="primary" onClick={confirmRestoreDraft}>
            Obnovi odgovore
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
