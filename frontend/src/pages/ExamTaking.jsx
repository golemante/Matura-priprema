// pages/ExamTaking.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI v2:
//
//  BUG #4 — Beskonačni skeleton kad su pitanja prazna (RIJEŠENO)
//  ─────────────────────────────────────────────────────────────────────────
//  Stari kod: if (isLoading || (!current && !fetchError)) → ExamSkeleton
//  Problem: ako pitanja su [], current je null, fetchError je null
//           → uvjet je UVIJEK istinit → beskonačni skeleton
//
//  Ispravak: koristimo isInitialized iz useExamSession.
//    - isLoading || !isInitialized → skeleton (fetching ILI useEffect još nije ran)
//    - fetchError → error state (sa razlikovanjem PGRST116 vs ostale greške)
//    - questions.length === 0 → "nema pitanja" state (novi!)
//    - inače → render ispita
//
//  BUG #5 — Greška nije razlikovana (RIJEŠENO)
//  ─────────────────────────────────────────────────────────────────────────
//  PGRST116 = "exam not found" = exam nije is_published ili ne postoji u DB.
//  Prikazujemo specifičnu poruku: "Ispit nije dostupan" umjesto generičke.
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
  BookOpen,
  Construction,
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
  return `${examMeta.year}. – ${session} – ${level}`;
}

// ── Helper za error poruku iz Supabase greške ─────────────────────────────────
function parseExamError(error) {
  if (!error) return null;

  // PGRST116 = .single() nije pronašao redak = exam nije published ili ne postoji
  if (error.code === "PGRST116" || error.message?.includes("PGRST116")) {
    return {
      title: "Ispit nije dostupan",
      message:
        "Ovaj ispit trenutno nije objavljen ili ne postoji. Provjeri je li odabrani ispit dostupan za rješavanje.",
      icon: "lock",
    };
  }

  // Mrežna greška
  if (
    error.message?.includes("Failed to fetch") ||
    error.message?.includes("NetworkError")
  ) {
    return {
      title: "Greška pri spajanju",
      message: "Provjeri internetsku konekciju i pokušaj ponovo.",
      icon: "network",
    };
  }

  return {
    title: "Greška pri učitavanju",
    message: error.message ?? "Nepoznata greška. Pokušaj ponovo.",
    icon: "error",
  };
}

// ── Exam Error State ──────────────────────────────────────────────────────────
function ExamErrorState({ error, backLink }) {
  const parsed = parseExamError(error);

  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-red-200 shadow-card p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-red-400" size={28} />
        </div>
        <h2 className="text-lg font-bold text-warm-900 mb-2">
          {parsed?.title ?? "Greška pri učitavanju"}
        </h2>
        <p className="text-sm text-warm-500 mb-6">
          {parsed?.message ??
            "Provjeri internetsku konekciju i pokušaj ponovo."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link to={backLink}>
            <Button variant="secondary" leftIcon={ArrowLeft}>
              Povratak
            </Button>
          </Link>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Pokušaj ponovo
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Empty Exam State (ispit nema pitanja u DB) ────────────────────────────────
function ExamEmptyState({ backLink, examMeta }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Construction className="text-amber-400" size={28} />
        </div>
        <h2 className="text-lg font-bold text-warm-900 mb-2">
          Ispit se priprema
        </h2>
        <p className="text-sm text-warm-500 mb-6">
          {examMeta
            ? `"${buildExamTitle(examMeta)}" još nema učitana pitanja. Pokušaj ponovo za koji dan.`
            : "Ovaj ispit trenutno nema dostupnih pitanja. Pokušaj ponovo uskoro."}
        </p>
        <Link to={backLink}>
          <Button variant="secondary" leftIcon={ArrowLeft}>
            Povratak na popis
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function ExamTopBar({
  backLink,
  examTitle,
  timer,
  isPaused,
  onPause,
  onResume,
  answeredCount,
  totalVisible,
}) {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-warm-300 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Left: back + title */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to={backLink}
              className="flex-shrink-0 p-2 rounded-lg text-warm-500 hover:text-warm-800 hover:bg-warm-100 transition-colors"
              title="Povratak"
            >
              <ArrowLeft size={18} />
            </Link>
            <span className="text-sm font-semibold text-warm-800 truncate hidden sm:block">
              {examTitle}
            </span>
          </div>

          {/* Center: progress bar */}
          <div className="flex-1 max-w-xs hidden md:block">
            <ProgressBar answered={answeredCount} total={totalVisible} />
          </div>

          {/* Right: timer + pause */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-warm-700 bg-warm-100 px-3 py-1.5 rounded-lg">
              <Clock size={14} className="text-warm-500" />
              <ExamTimer timer={timer} />
            </div>
            {isPaused ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={Play}
                onClick={onResume}
              >
                Nastavi
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Pause}
                onClick={onPause}
              >
                Pauza
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Submit modal ──────────────────────────────────────────────────────────────
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
    <Modal open={show} onClose={onClose} title="Predaj ispit?">
      <ModalBody>
        <p className="text-warm-600 text-sm mb-4">
          Jesi li siguran/a da želiš predati ispit?
        </p>
        <div className="bg-warm-50 rounded-xl p-4 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-warm-500">Odgovoreno</span>
            <span className="font-semibold text-warm-800">
              {answeredCount} / {totalVisible}
            </span>
          </div>
          {unanswered > 0 && (
            <div className="flex justify-between">
              <span className="text-amber-600">Preskočeno</span>
              <span className="font-semibold text-amber-700">{unanswered}</span>
            </div>
          )}
        </div>
        {unanswered > 0 && (
          <p className="text-xs text-amber-600 mt-3">
            Preskočena pitanja računaju se kao netočna.
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Nastavi rješavati
        </Button>
        <Button variant="primary" onClick={onConfirm} loading={isSubmitting}>
          Predaj ispit
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ── Draft modal ───────────────────────────────────────────────────────────────
function DraftModal({ show, onConfirm, onDiscard }) {
  return (
    <Modal open={show} onClose={onDiscard} title="Nastavi gdje si stao/la?">
      <ModalBody>
        <p className="text-sm text-warm-600">
          Pronašli smo sačuvane odgovore za ovaj ispit. Želiš li nastaviti od
          tamo?
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onDiscard}>
          Počni ispočetka
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Nastavi
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ── Paused overlay ────────────────────────────────────────────────────────────
function PausedOverlay({ onResume }) {
  return (
    <motion.div
      key="paused"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex items-center justify-center min-h-[60vh]"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Pause size={28} className="text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-warm-900 mb-2">Ispit pauziran</h2>
        <p className="text-sm text-warm-500 mb-6">
          Odgovori su sačuvani. Nastavi kad budeš spreman/a.
        </p>
        <Button variant="primary" leftIcon={Play} size="lg" onClick={onResume}>
          Nastavi ispit
        </Button>
      </div>
    </motion.div>
  );
}

// ── Glavni QuizPage ───────────────────────────────────────────────────────────
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
    // NOVO: isInitialized umjesto (!current && !fetchError)
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
  const examTitle = buildExamTitle(examMeta);
  const hasPassage = !!currentPassage;

  // ── Loading state ─────────────────────────────────────────────────────────
  // isLoading = TanStack Query fetching
  // !isInitialized = useEffect (startExam) još nije ran (jedan render delay)
  if (isLoading || !isInitialized) {
    return <ExamSkeleton showPassage={false} />;
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (fetchError) {
    return <ExamErrorState error={fetchError} backLink={backLink} />;
  }

  // ── Empty state — ispit postoji ali nema pitanja u DB ─────────────────────
  if (questions.length === 0) {
    return <ExamEmptyState backLink={backLink} examMeta={examMeta} />;
  }

  // ── Render ispita ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col">
      <ExamTopBar
        backLink={backLink}
        examTitle={examTitle}
        timer={timer}
        isPaused={isPaused}
        onPause={handlePause}
        onResume={handleResume}
        answeredCount={answeredCount}
        totalVisible={totalVisible}
      />

      {/* Modals */}
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

      {/* Content */}
      <div className="flex-1 page-container py-5 flex flex-col lg:flex-row gap-5">
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
              {/* Passage panel (ako postoji) */}
              {hasPassage && (
                <div className="lg:w-2/5 xl:w-[38%] flex-shrink-0">
                  <PassageDisplay passage={currentPassage} />
                </div>
              )}

              {/* Pitanje + opcije + navigacija */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={current?.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                  >
                    <QuestionDisplay
                      question={current}
                      selectedOption={answers[current?.id] ?? null}
                      isFlagged={isCurrentFlagged}
                      onAnswer={handleAnswer}
                      onToggleFlag={handleToggleFlag}
                      questionNumber={currentIndex + 1}
                      totalCount={totalVisible}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Prev / Next navigacija */}
                <div className="flex items-center justify-between mt-auto">
                  <Button
                    variant="secondary"
                    leftIcon={ArrowLeft}
                    disabled={currentIndex === 0}
                    onClick={() => handleGoTo(currentIndex - 1)}
                  >
                    Prethodno
                  </Button>

                  {currentIndex === totalVisible - 1 ? (
                    <Button
                      variant="primary"
                      onClick={() => setShowSubmitModal(true)}
                      loading={isSubmitting}
                    >
                      Predaj ispit
                    </Button>
                  ) : (
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

              {/* Question navigator sidebar */}
              <div className="lg:w-56 xl:w-64 flex-shrink-0">
                <QuestionNav
                  questions={questions}
                  currentIndex={currentIndex}
                  answers={answers}
                  flagged={flagged}
                  onGoTo={handleGoTo}
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
