// pages/ExamTaking.jsx — FINALNI FIX v3
// ═══════════════════════════════════════════════════════════════════════════
// BUGOVI KOJI SU UZROKOVALI BESKONAČNI SKELETON:
//
//  BUG #1 (KRITIČNI) — Pogrešan redosljed provjera stanja
//  ───────────────────────────────────────────────────────
//  Stari kod:
//    if (isLoading || !isInitialized) return <ExamSkeleton />  ← blokira
//    if (fetchError) return <ExamErrorState />                 ← nedostižno
//
//  Kada query faila (is_published=false → PGRST116):
//    isLoading=false, fetchError=SET, isInitialized=false
//    → (false || true) = true → skeleton zauvijek
//    → fetchError provjera se NIKAD ne doseže
//
//  FIX: fetchError provjeravamo PRVI — odmah, prije skeleton provjere.
//
//  BUG #2 (KRITIČNI) — Krivi props za ExamTimer
//  ──────────────────────────────────────────────
//  Staro: <ExamTimer timer={timer} />
//  ExamTimer prima: { formatted, isWarning, isDanger }
//  FIX: <ExamTimer {...timer} />  (spread)
//
//  BUG #3 (KRITIČNI) — Krivi props za ProgressBar
//  ────────────────────────────────────────────────
//  Staro: <ProgressBar answered={answeredCount} total={totalVisible} />
//  ProgressBar prima: { value, max }
//  FIX: <ProgressBar value={answeredCount} max={totalVisible} />
// ═══════════════════════════════════════════════════════════════════════════
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Pause,
  Play,
  Construction,
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

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
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
  const msg = error.message ?? "";
  if (
    error.code === "PGRST116" ||
    msg.includes("PGRST116") ||
    msg.includes("multiple (or no) rows")
  ) {
    return {
      title: "Ispit nije dostupan",
      message:
        "Ovaj ispit nije objavljen ili ne postoji u bazi. Provjeri URL ili odaberi drugi ispit.",
    };
  }
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("network")
  ) {
    return {
      title: "Greška pri spajanju",
      message: "Provjeri internetsku konekciju i pokušaj ponovo.",
    };
  }
  return {
    title: "Greška pri učitavanju",
    message: msg || "Nepoznata greška. Pokušaj ponovo.",
  };
}

// ── State komponente ──────────────────────────────────────────────────────────
function ExamErrorState({ error, backLink }) {
  const p = parseExamError(error);
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-red-200 shadow-card p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-red-400" size={28} />
        </div>
        <h2 className="text-lg font-bold text-warm-900 mb-2">{p?.title}</h2>
        <p className="text-sm text-warm-500 mb-6">{p?.message}</p>
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
            ? `"${buildExamTitle(examMeta)}" još nema učitana pitanja. Pokušaj uskoro.`
            : "Ovaj ispit trenutno nema dostupnih pitanja."}
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

// ── Top Bar ───────────────────────────────────────────────────────────────────
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
    <div className="sticky top-0 z-30 bg-white border-b border-warm-200 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Back + title */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to={backLink}
              className="flex-shrink-0 p-2 rounded-lg text-warm-500 hover:text-warm-800 hover:bg-warm-100 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <span className="text-sm font-semibold text-warm-800 truncate hidden sm:block">
              {examTitle}
            </span>
          </div>

          {/* Progress bar — desktop */}
          <div className="flex-1 max-w-xs hidden md:block">
            {/* ✅ BUG #3 FIX: value/max */}
            <ProgressBar
              value={answeredCount}
              max={totalVisible}
              showLabel={false}
            />
          </div>

          {/* Timer + Pause */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* ✅ BUG #2 FIX: spread timer objekt */}
            <ExamTimer {...timer} />

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
      {/* Progress bar — mobile */}
      <div className="md:hidden px-4 pb-2">
        <ProgressBar
          value={answeredCount}
          max={totalVisible}
          showLabel={false}
        />
      </div>
    </div>
  );
}

// ── Modali ────────────────────────────────────────────────────────────────────
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
        <p className="text-sm text-warm-600 mb-4">
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

function DraftModal({ show, onConfirm, onDiscard }) {
  return (
    <Modal open={show} onClose={onDiscard} title="Nastavi gdje si stao/la?">
      <ModalBody>
        <p className="text-sm text-warm-600">
          Pronašli smo sačuvane odgovore za ovaj ispit. Želiš li nastaviti?
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

// ── QuizPage ──────────────────────────────────────────────────────────────────
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

  // ═════════════════════════════════════════════════════════════════════════
  // REDOSLJED PROVJERA — KRITIČAN ZA ISPRAVNO PONAŠANJE
  //
  // ✅ 1. fetchError MORA biti prva provjera
  //    Ako je error set, isInitialized je false (useEffect nije ran)
  //    Bez ove provjere: skeleton blokira error state zauvijek
  //
  // ✅ 2. isLoading || !isInitialized → skeleton
  //    Samo ako NEMA greške, čekamo učitavanje
  //
  // ✅ 3. questions.length === 0 → ispit se priprema
  //    Poseban state za prazne ispite (ne greška, ne loading)
  //
  // ✅ 4. Render ispita
  // ═════════════════════════════════════════════════════════════════════════

  if (fetchError) {
    return <ExamErrorState error={fetchError} backLink={backLink} />;
  }

  if (isLoading || !isInitialized) {
    return <ExamSkeleton showPassage={false} />;
  }

  if (questions.length === 0) {
    return <ExamEmptyState backLink={backLink} examMeta={examMeta} />;
  }

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
              {/* Passage panel */}
              {currentPassage && (
                <div className="lg:w-2/5 xl:w-[38%] flex-shrink-0">
                  <PassageDisplay passage={currentPassage} />
                </div>
              )}

              {/* Pitanje */}
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

                {/* Prev / Next */}
                <div className="flex items-center justify-between mt-auto pt-2">
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

              {/* Navigator */}
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
