// pages/ExamTaking.jsx — v5 PREMIUM REDESIGN
// ═══════════════════════════════════════════════════════════════════════════
// POPRAVCI I POBOLJŠANJA:
//
//  FIX #1  — parentQuestion se sada prosljeđuje QuestionDisplayu
//  FIX #2  — Mobile: QuestionNav sidebar sakriven, zamijenjen s:
//             a) sticky bottom bar (prev/counter/next)
//             b) slide-up drawer s kompletnom navigacijom i submit gumbom
//  FIX #3  — Submit gumb uvijek vidljiv (top bar desktop + drawer mobile)
//  FIX #4  — Bolji Submit modal (statistike odgovoreno/preskočeno)
//  FIX #5  — Passage panel "no passage" placeholder ne zauzima prostor
//  UX #1   — Smooth spring animacija za mobile drawer
//  UX #2   — Bottom bar nestaje kad je ispit pauziran
//  UX #3   — pb-20 na mobilnom da content ne ide ispod bottom bara
// ═══════════════════════════════════════════════════════════════════════════
import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Pause,
  Play,
  Construction,
  Send,
  LayoutGrid,
  X,
  CheckCircle2,
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
  enter: (dir) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -28 : 28, opacity: 0 }),
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
  if (msg.includes("PGRST116") || msg.includes("not found"))
    return "Ispit nije pronađen ili nije objavljen.";
  if (msg.includes("403") || msg.includes("permission"))
    return "Nemate pristup ovom ispitu. Prijavite se.";
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
  onOpenNav,
}) {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-warm-200 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
      <div className="page-container">
        <div className="flex items-center h-14 gap-2 sm:gap-3">
          {/* Back */}
          <Link
            to={backLink}
            className="flex-shrink-0 p-2 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
            aria-label="Natrag na popis ispita"
          >
            <ArrowLeft size={18} />
          </Link>

          {/* Title — hidden on small screens */}
          <p className="text-sm font-semibold text-warm-700 truncate hidden sm:block flex-1 min-w-0">
            {examTitle}
          </p>

          {/* Progress — desktop only */}
          <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-[200px]">
            <ProgressBar value={answeredCount} max={totalVisible} />
            <span className="text-xs text-warm-400 tabular-nums whitespace-nowrap">
              {answeredCount}/{totalVisible}
            </span>
          </div>

          <div className="flex-1 sm:hidden" />

          {/* Timer */}
          <ExamTimer {...timer} />

          {/* Pause / Resume */}
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

          {/* Desktop: Submit button */}
          <button
            onClick={onSubmit}
            className="hidden lg:flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-warm-900 text-white hover:bg-black transition-colors"
          >
            <Send size={13} />
            <span>Predaj ispit</span>
          </button>

          {/* Mobile: Navigator toggle */}
          <button
            onClick={onOpenNav}
            className="flex-shrink-0 lg:hidden p-2 rounded-lg text-warm-500 hover:bg-warm-100 transition-colors relative"
            aria-label="Otvori navigaciju"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile Nav Drawer ─────────────────────────────────────────────────────────
function MobileNavDrawer({
  show,
  onClose,
  questions,
  answers,
  flagged,
  currentIndex,
  onGoTo,
  onSubmit,
  answeredCount,
}) {
  const visibleCount = questions.filter(
    (q) => q.questionType !== "fill_blank_mc",
  ).length;
  const unanswered = visibleCount - (answeredCount ?? 0);
  const flaggedCount = flagged?.size ?? 0;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[82vh] flex flex-col lg:hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-warm-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-warm-900">Navigacija</h3>
                <p className="text-xs text-warm-500 tabular-nums">
                  {answeredCount}/{visibleCount} odgovoreno
                  {flaggedCount > 0 && ` · ${flaggedCount} označeno`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-warm-100 text-warm-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-4 flex-shrink-0">
              <ProgressBar value={answeredCount} max={visibleCount} />
            </div>

            {/* Question grid */}
            <div className="overflow-y-auto flex-1 px-5 pb-2">
              <div className="grid grid-cols-6 gap-2">
                {questions.map((q, idx) => {
                  const label = q.positionLabel ?? String(idx + 1);

                  if (q.questionType === "fill_blank_mc") {
                    return (
                      <div
                        key={q.id}
                        className="aspect-square rounded-xl bg-warm-50 border border-dashed border-warm-200 flex items-center justify-center text-[10px] font-bold text-warm-300"
                        title={`Zadatak ${label}`}
                      >
                        {label}
                      </div>
                    );
                  }

                  const isAnswered = !!answers?.[q.id];
                  const isFlagged = flagged?.has(q.id) ?? false;
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        onGoTo(idx);
                        onClose();
                      }}
                      className={cn(
                        "aspect-square rounded-xl text-[11px] font-bold transition-all relative",
                        isCurrent
                          ? "bg-primary-600 text-white shadow-sm scale-105"
                          : isAnswered && isFlagged
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : isAnswered
                              ? "bg-primary-100 text-primary-700 border border-primary-200"
                              : isFlagged
                                ? "bg-amber-50 text-amber-700 border border-amber-300"
                                : "bg-warm-50 text-warm-500 border border-warm-200 active:bg-warm-100",
                      )}
                    >
                      {label}
                      {isFlagged && !isCurrent && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border-2 border-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { color: "bg-primary-600", label: "Trenutno pitanje" },
                  {
                    color: "bg-primary-100 border border-primary-200",
                    label: "Odgovoreno",
                  },
                  {
                    color: "bg-amber-50 border border-amber-300",
                    label: "Označeno zastavicom",
                  },
                  {
                    color: "bg-warm-50 border border-warm-200",
                    label: "Preskočeno",
                  },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      className={cn("w-3.5 h-3.5 rounded flex-shrink-0", color)}
                    />
                    <span className="text-[11px] text-warm-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <div className="p-5 border-t border-warm-100 flex-shrink-0">
              <button
                onClick={() => {
                  onSubmit();
                  onClose();
                }}
                className={cn(
                  "w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2.5",
                  unanswered > 0
                    ? "bg-warm-900 text-white hover:bg-black active:scale-[0.98]"
                    : "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
                )}
              >
                <Send size={15} />
                <span>
                  {unanswered > 0
                    ? `Predaj ispit (${unanswered} bez odg.)`
                    : "Predaj ispit"}
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Mobile Bottom Bar ─────────────────────────────────────────────────────────
function MobileBottomBar({
  currentIndex,
  totalVisible,
  onPrev,
  onNext,
  onOpenNav,
  answeredCount,
}) {
  const isLast = currentIndex === totalVisible - 1;
  const isFirst = currentIndex === 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-white/95 backdrop-blur-sm border-t border-warm-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center h-14 px-3 gap-2 max-w-xl mx-auto">
        {/* Previous */}
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors min-w-0 flex-shrink-0",
            isFirst
              ? "text-warm-300 cursor-not-allowed"
              : "text-warm-700 hover:bg-warm-100 active:bg-warm-200",
          )}
        >
          <ArrowLeft size={16} />
          <span className="hidden xs:inline text-xs">Preth.</span>
        </button>

        {/* Center: counter + grid toggle */}
        <button
          onClick={onOpenNav}
          className="flex-1 flex items-center justify-center gap-2.5 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 active:bg-warm-300 transition-colors"
        >
          <LayoutGrid size={14} className="text-warm-500 flex-shrink-0" />
          <span className="text-xs font-bold text-warm-700 tabular-nums">
            {currentIndex + 1} / {totalVisible}
          </span>
          <span className="text-[10px] text-warm-400 font-medium">
            · {answeredCount} odg.
          </span>
        </button>

        {/* Next / Submit */}
        {isLast ? (
          <button
            onClick={onOpenNav}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 transition-colors flex-shrink-0"
          >
            <Send size={14} />
            <span className="text-xs">Predaj</span>
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-100 active:bg-warm-200 transition-colors flex-shrink-0"
          >
            <span className="hidden xs:inline text-xs">Sljedeće</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
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
  const allAnswered = unanswered === 0;

  return (
    <Modal show={show} onClose={onClose} title="Predaj ispit">
      <ModalBody>
        {allAnswered ? (
          <div className="text-center py-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <p className="text-base font-bold text-warm-900 mb-1.5">
              Sve gotovo!
            </p>
            <p className="text-sm text-warm-500">
              Odgovorili ste na svih{" "}
              <strong className="text-warm-800">{totalVisible}</strong> pitanja.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle
                size={20}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  {unanswered}{" "}
                  {unanswered === 1 ? "pitanje ostalo" : "pitanja ostalo"} bez
                  odgovora
                </p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Preporuča se pregled svih pitanja prije predaje. Preskočena
                  pitanja neće donijeti bodove.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3.5 bg-primary-50 rounded-xl border border-primary-100">
                <p className="text-2xl font-black text-primary-700 tabular-nums leading-none mb-1">
                  {answeredCount}
                </p>
                <p className="text-xs text-primary-600 font-medium">
                  Odgovoreno
                </p>
              </div>
              <div className="text-center p-3.5 bg-warm-100 rounded-xl border border-warm-200">
                <p className="text-2xl font-black text-warm-600 tabular-nums leading-none mb-1">
                  {unanswered}
                </p>
                <p className="text-xs text-warm-500 font-medium">Preskočeno</p>
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          {allAnswered ? "Pregledaj još jednom" : "Nastavi rješavati"}
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          loading={isSubmitting}
          leftIcon={Send}
        >
          {allAnswered ? "Predaj ispit" : "Svejedno predaj"}
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
        <p className="text-sm text-warm-700 leading-relaxed">
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

// ── Error State ───────────────────────────────────────────────────────────────
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

// ── Empty State ───────────────────────────────────────────────────────────────
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

// ── Paused Overlay ────────────────────────────────────────────────────────────
function PausedOverlay({ onResume }) {
  return (
    <motion.div
      key="paused"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex items-center justify-center py-16"
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

// ── Quiz Page ─────────────────────────────────────────────────────────────────
export function QuizPage() {
  const { examId } = useParams();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  // ── FIX: parentQuestion se mora proslijediti QuestionDisplayu ───────────
  const parentQuestion = useMemo(() => {
    if (!current || current.questionType !== "fill_blank_child") return null;
    return questions.find((q) => q.id === current.parentQuestionId) ?? null;
  }, [current, questions]);

  // ── Je li uopće itko od pitanja ima passage (za stabilnost layouta) ─────
  const hasAnyPassage = useMemo(
    () => questions.some((q) => q.passageId),
    [questions],
  );

  // ── Redosljed provjera ───────────────────────────────────────────────────
  if (fetchError)
    return <ExamErrorState error={fetchError} backLink={backLink} />;
  if (isLoading || !isInitialized) return <ExamSkeleton showPassage={false} />;
  if (questions.length === 0)
    return <ExamEmptyState backLink={backLink} examMeta={examMeta} />;

  const isLastQuestion = currentIndex === totalVisible - 1;

  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
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
        onOpenNav={() => setMobileNavOpen(true)}
      />

      {/* ── Modals ──────────────────────────────────────────────────────── */}
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

      {/* ── Mobile nav drawer ───────────────────────────────────────────── */}
      <MobileNavDrawer
        show={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        questions={questions}
        answers={answers}
        flagged={flagged}
        currentIndex={currentIndex}
        onGoTo={handleGoTo}
        onSubmit={() => setShowSubmitModal(true)}
        answeredCount={answeredCount}
      />

      {/* ── Main content ────────────────────────────────────────────────── */}
      {/* pb-20 on mobile to avoid content hiding under bottom bar */}
      <div className="flex-1 page-container py-5 pb-20 lg:pb-5 flex flex-col gap-5">
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
              {/* ── Passage panel ─────────────────────────────────────── */}
              {hasAnyPassage && (
                <div className="lg:w-[42%] xl:w-[38%] flex-shrink-0">
                  {currentPassage ? (
                    <PassageDisplay passage={currentPassage} />
                  ) : (
                    /* Placeholder za pitanja bez passage-a — čuva stabilnost layouta */
                    <div className="hidden lg:flex items-center justify-center rounded-2xl border border-dashed border-warm-300 bg-warm-50/80 h-full min-h-[180px]">
                      <p className="text-xs text-warm-400 font-medium text-center px-4">
                        Ovo pitanje nema polazni tekst
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Question + Desktop bottom nav ─────────────────────── */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={current?.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.16, ease: "easeInOut" }}
                  >
                    <QuestionDisplay
                      question={current}
                      parentQuestion={parentQuestion} /* FIX: proslijeđen */
                      selectedAnswer={answers[current?.id] ?? null}
                      isFlagged={isCurrentFlagged}
                      onAnswer={handleAnswer}
                      onFlag={handleToggleFlag}
                      index={currentIndex}
                      isPaused={isPaused}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Desktop bottom nav */}
                <div className="hidden lg:flex items-center justify-between gap-3 mt-auto pt-1">
                  <Button
                    variant="secondary"
                    leftIcon={ArrowLeft}
                    disabled={currentIndex === 0}
                    onClick={() => handleGoTo(currentIndex - 1)}
                  >
                    Prethodno
                  </Button>

                  <div className="flex items-center gap-2.5">
                    {isLastQuestion ? (
                      <Button
                        variant="primary"
                        leftIcon={Send}
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
              </div>

              {/* ── Navigator sidebar — desktop only ──────────────────── */}
              <div className="hidden lg:block lg:w-56 xl:w-64 flex-shrink-0">
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

      {/* ── Mobile bottom nav bar ──────────────────────────────────────── */}
      {!isPaused && (
        <MobileBottomBar
          currentIndex={currentIndex}
          totalVisible={totalVisible}
          onPrev={() => currentIndex > 0 && handleGoTo(currentIndex - 1)}
          onNext={() =>
            currentIndex < totalVisible - 1 && handleGoTo(currentIndex + 1)
          }
          onOpenNav={() => setMobileNavOpen(true)}
          answeredCount={answeredCount}
        />
      )}
    </div>
  );
}
