// pages/ExamTaking.jsx — v4 KOMPLETNI POPRAVAK
// ═══════════════════════════════════════════════════════════════════════════
// SAŽETAK SVIH ISPRAVAKA:
//
//  BUG #1 — selectedOption vs selectedAnswer (QuestionDisplay prop mismatch)
//    Staro: <QuestionDisplay selectedOption={answers[current?.id]} />
//    Novo:  <QuestionDisplay selectedAnswer={answers[current?.id]} />
//
//  BUG #2 — onToggleFlag vs onFlag (QuestionDisplay prop mismatch)
//    Staro: <QuestionDisplay onToggleFlag={handleToggleFlag} />
//    Novo:  <QuestionDisplay onFlag={handleToggleFlag} />
//
//  BUG #3 — questionNumber vs index (QuestionDisplay prop mismatch)
//    Staro: <QuestionDisplay questionNumber={currentIndex + 1} />
//    Novo:  <QuestionDisplay index={currentIndex} />
//
//  BUG #4 — isPaused nije bio proslijeđen QuestionDisplayu
//    Novo:  <QuestionDisplay isPaused={isPaused} />
//
//  BUG #5 — parentQuestion nije bio proslijeđen (za fill_blank_child)
//    Novo:  <QuestionDisplay parentQuestion={parentQuestion} />
//
//  BUG #6 — onGoTo vs onNavigate (QuestionNav prop mismatch)
//    Staro: <QuestionNav onGoTo={handleGoTo} />   ← QuestionNav primao onNavigate
//    Novo:  QuestionNav sada prima onGoTo (usklađeno)
//
//  BUG #7 — "Predaj ispit" samo na zadnjem pitanju
//    Novo:  Gumb je uvijek u QuestionNav panelu. Na zadnjoj stranici
//           ostaje i u donjoj navigaciji za kontekst.
//
//  BUG #8 — Layout "skakanje" pri promjeni pitanja (passage dolazi/odlazi)
//    Novo:  PassageDisplay je uvijek prikazan ako ispit ima IKAKAV passage.
//           Ako trenutno pitanje nema passage, panel je "tiho" sakriven.
// ═══════════════════════════════════════════════════════════════════════════
import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Pause,
  Play,
  Construction,
  Send,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Modal, ModalBody, ModalFooter } from "@/components/common/Modal";
import { QuestionDisplay } from "@/components/exam/QuestionDisplay";
import { PassageDisplay } from "@/components/exam/PassageDisplay";
import { ExamSkeleton } from "@/components/exam/ExamSkeleton";
import { QuestionNav } from "@/components/exam/QuestionNav";
import { ProgressBar } from "@/components/exam/ProgressBar";
import { ExamTimer } from "@/components/exam/Timer";
import { useExamSession } from "@/hooks/useExamSession";
import { EXAM_SESSIONS, DIFFICULTY_LEVELS } from "@/utils/constants";
import { cn } from "@/utils/utils";

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildExamTitle(examMeta) {
  if (!examMeta) return "Ispit";
  if (examMeta.title) return examMeta.title;
  const session =
    EXAM_SESSIONS.find((s) => s.id === examMeta.session)?.name ??
    examMeta.session;
  const level =
    DIFFICULTY_LEVELS.find((d) => d.id === examMeta.level)?.short ??
    examMeta.level;
  return `${examMeta.year}. – ${session} – ${level}`;
}

function parseExamError(error) {
  if (!error) return null;
  const msg = error.message ?? String(error);
  if (msg.includes("PGRST116") || msg.includes("not found")) {
    return "Ispit nije pronađen ili nije objavljen.";
  }
  if (msg.includes("403") || msg.includes("permission")) {
    return "Nemate pristup ovom ispitu. Pokušajte se prijaviti.";
  }
  return "Greška pri učitavanju ispita. Pokušajte ponovo.";
}

// ── ExamTopBar ────────────────────────────────────────────────────────────────
function ExamTopBar({
  backLink,
  examTitle,
  timer,
  isPaused,
  onPause,
  onResume,
  answeredCount,
  totalVisible,
  onSubmit,
}) {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-warm-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="page-container">
        <div className="flex items-center h-14 gap-3">
          {/* Back */}
          <Link
            to={backLink}
            className="flex-shrink-0 p-2 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
            aria-label="Natrag na popis ispita"
          >
            <ArrowLeft size={18} />
          </Link>

          {/* Title */}
          <p className="text-sm font-semibold text-warm-700 truncate hidden sm:block flex-1 min-w-0">
            {examTitle}
          </p>

          {/* Progress bar — desktop */}
          <div className="hidden md:flex flex-1 max-w-[220px] items-center gap-2">
            <ProgressBar value={answeredCount} max={totalVisible} />
            <span className="text-xs text-warm-400 tabular-nums whitespace-nowrap">
              {answeredCount}/{totalVisible}
            </span>
          </div>

          {/* Timer */}
          <ExamTimer {...timer} />

          {/* Pauza / nastavak */}
          <button
            onClick={isPaused ? onResume : onPause}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              isPaused
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "bg-warm-100 text-warm-600 hover:bg-warm-200",
            )}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            <span className="hidden sm:inline">
              {isPaused ? "Nastavi" : "Pauziraj"}
            </span>
          </button>

          {/* Predaj — uvijek vidljivo u top baru na mobilnom */}
          <button
            onClick={onSubmit}
            className="flex-shrink-0 sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ExamErrorState({ error, backLink }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-error-200 p-8 max-w-md w-full text-center shadow-card">
        <AlertCircle
          size={40}
          className="text-error-500 mx-auto mb-4"
          strokeWidth={1.5}
        />
        <h2 className="text-lg font-bold text-warm-900 mb-2">
          Ispit nije dostupan
        </h2>
        <p className="text-warm-500 text-sm mb-6 leading-relaxed">
          {parseExamError(error)}
        </p>
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft size={15} />
          Natrag
        </Link>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function ExamEmptyState({ backLink, examMeta }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-warm-200 p-8 max-w-md w-full text-center shadow-card">
        <Construction
          size={40}
          className="text-warm-400 mx-auto mb-4"
          strokeWidth={1.5}
        />
        <h2 className="text-lg font-bold text-warm-900 mb-2">
          Ispit se priprema
        </h2>
        <p className="text-warm-500 text-sm mb-6">
          {examMeta ? buildExamTitle(examMeta) : "Ovaj ispit"} još nema unesena
          pitanja.
        </p>
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 bg-warm-100 text-warm-700 border border-warm-300 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-warm-200 transition-colors"
        >
          <ArrowLeft size={15} />
          Natrag
        </Link>
      </div>
    </div>
  );
}

// ── Pauzirani overlay ─────────────────────────────────────────────────────────
function PausedOverlay({ onResume }) {
  return (
    <motion.div
      key="paused"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex items-center justify-center py-20"
    >
      <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Pause size={28} className="text-warm-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-warm-900 mb-2">
          Ispit je pauziran
        </h2>
        <p className="text-warm-500 text-sm mb-6 leading-relaxed">
          Odgovori su sačuvani. Nastavi kad budeš spreman/a.
        </p>
        <Button variant="primary" leftIcon={Play} size="lg" onClick={onResume}>
          Nastavi ispit
        </Button>
      </div>
    </motion.div>
  );
}

// ── Submit Modal ──────────────────────────────────────────────────────────────
function SubmitModal({
  show,
  onClose,
  onConfirm,
  answeredCount,
  totalVisible,
  isSubmitting,
}) {
  const unanswered = totalVisible - answeredCount;
  return (
    <Modal show={show} onClose={onClose} title="Predaj ispit">
      <ModalBody>
        {unanswered > 0 ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle
                size={18}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {unanswered} {unanswered === 1 ? "pitanje" : "pitanja"} bez
                  odgovora
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Preskočena pitanja će biti označena kao netočna.
                </p>
              </div>
            </div>
            <p className="text-sm text-warm-600">
              Odgovoreno:{" "}
              <strong>
                {answeredCount}/{totalVisible}
              </strong>
            </p>
          </div>
        ) : (
          <p className="text-sm text-warm-700">
            Odgovorili ste na sva pitanja ({answeredCount}/{totalVisible}).
            Jeste li sigurni da želite predati ispit?
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Vrati se
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          loading={isSubmitting}
          leftIcon={Send}
        >
          Predaj ispit
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ── Draft Modal ───────────────────────────────────────────────────────────────
function DraftModal({ show, onConfirm, onDiscard }) {
  return (
    <Modal show={show} title="Nastaviti gdje ste stali?">
      <ModalBody>
        <p className="text-sm text-warm-700">
          Pronašli smo sačuvane odgovore za ovaj ispit. Želite li nastaviti od
          tamo gdje ste stali?
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onDiscard}>
          Počni ispočetka
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Nastavi gdje sam stao/la
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ── QuizPage ──────────────────────────────────────────────────────────────────
export function QuizPage() {
  const { examId } = useParams();

  const {
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
    examMeta,
    isLoading,
    isInitialized,
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

  const subjectId = examMeta?.subject_id ?? examId?.split("-")[0];
  const backLink = `/predmeti/${subjectId}`;

  // ── Pronađi parent pitanje za fill_blank_child ──────────────────────────
  const parentQuestion = useMemo(() => {
    if (!current || current.questionType !== "fill_blank_child") return null;
    return questions.find((q) => q.id === current.parentQuestionId) ?? null;
  }, [current, questions]);

  // ── Provjeri ima li ispit ikakve passages (za stabilnost layouta) ───────
  const hasAnyPassage = useMemo(() => {
    return questions.some((q) => q.passageId);
  }, [questions]);

  // ── Redosljed provjera — kritičan ───────────────────────────────────────
  if (fetchError)
    return <ExamErrorState error={fetchError} backLink={backLink} />;
  if (isLoading || !isInitialized)
    return <ExamSkeleton showPassage={hasAnyPassage} />;
  if (questions.length === 0)
    return <ExamEmptyState backLink={backLink} examMeta={examMeta} />;

  const isLastQuestion = currentIndex === totalVisible - 1;

  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col">
      <ExamTopBar
        backLink={backLink}
        examTitle={buildExamTitle(examMeta)}
        timer={timer}
        isPaused={isPaused}
        onPause={handlePause}
        onResume={handleResume}
        answeredCount={answeredCount}
        totalVisible={totalVisible}
        onSubmit={() => setShowSubmitModal(true)}
      />

      <SubmitModal
        show={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        answeredCount={answeredCount}
        totalVisible={totalVisible}
        isSubmitting={isSubmitting}
      />
      <DraftModal
        show={showDraftModal}
        onConfirm={confirmRestoreDraft}
        onDiscard={discardDraft}
      />

      <div className="flex-1 page-container py-5 flex flex-col gap-5">
        <AnimatePresence mode="wait">
          {isPaused ? (
            <PausedOverlay key="paused" onResume={handleResume} />
          ) : (
            <motion.div
              key="exam-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col lg:flex-row gap-5"
            >
              {/* ── Passage panel (perzistentan za stabilnost layouta) ───── */}
              {/*    Ako ispit ima passages, prostor je uvijek rezerviran.     */}
              {/*    Ako trenutno pitanje nema passage, panel je prazan.       */}
              {hasAnyPassage && (
                <div className="lg:w-[42%] xl:w-[38%] flex-shrink-0">
                  {currentPassage ? (
                    <PassageDisplay passage={currentPassage} />
                  ) : (
                    // Placeholder kad pitanje nema passage — sprječava layout shift
                    <div className="hidden lg:block h-full min-h-[200px] bg-warm-50 border border-dashed border-warm-200 rounded-2xl" />
                  )}
                </div>
              )}

              {/* ── Desna kolona: pitanje + navigacija ───────────────────── */}
              <div className="flex-1 min-w-0 flex flex-col gap-5">
                {/* Pitanje s animacijom */}
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={current?.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.16, ease: "easeInOut" }}
                    className="flex-1"
                  >
                    {/* FIX: Svi props su ispravno nazvani */}
                    <QuestionDisplay
                      question={current}
                      parentQuestion={parentQuestion} // za fill_blank_child kontekst
                      selectedAnswer={answers[current?.id] ?? null} // FIX: bio selectedOption
                      onAnswer={handleAnswer}
                      onFlag={handleToggleFlag} // FIX: bio onToggleFlag
                      isFlagged={isCurrentFlagged}
                      index={currentIndex} // FIX: bio questionNumber={currentIndex+1}
                      isPaused={isPaused} // FIX: nije bio proslijeđen
                    />
                  </motion.div>
                </AnimatePresence>

                {/* ── Donja navigacija ───────────────────────────────────── */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="secondary"
                    leftIcon={ArrowLeft}
                    disabled={currentIndex === 0}
                    onClick={() => handleGoTo(currentIndex - 1)}
                  >
                    Prethodno
                  </Button>

                  <div className="flex items-center gap-2">
                    {/* "Predaj ispit" na zadnjem pitanju — duplikat iz navigatora
                        ali korisno jer je u tijeku rada */}
                    {isLastQuestion && (
                      <Button
                        variant="primary"
                        leftIcon={Send}
                        onClick={() => setShowSubmitModal(true)}
                        loading={isSubmitting}
                        className="hidden sm:flex"
                      >
                        Predaj ispit
                      </Button>
                    )}

                    {!isLastQuestion && (
                      <Button
                        variant="primary"
                        rightIcon={ArrowRight}
                        onClick={() => handleGoTo(currentIndex + 1)}
                      >
                        Sljedeće
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Navigator sidebar ────────────────────────────────────── */}
              <div className="lg:w-56 xl:w-64 flex-shrink-0">
                {/* FIX: QuestionNav sada prima onGoTo (ne onNavigate) */}
                <QuestionNav
                  questions={questions}
                  currentIndex={currentIndex}
                  answers={answers}
                  flagged={flagged}
                  onGoTo={handleGoTo} // FIX: QuestionNav interno koristi onGoTo
                  onSubmit={() => setShowSubmitModal(true)}
                  answeredCount={answeredCount}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
