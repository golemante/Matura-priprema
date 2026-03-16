// pages/ExamTaking.jsx
import { useParams, Link } from "react-router-dom";
import { useMemo, useState, useCallback, useEffect } from "react";
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
  Loader2,
  Headphones,
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
import { useListeningAudio } from "@/hooks/useListeningAudio";
import { EXAM_SESSIONS, DIFFICULTY_LEVELS } from "@/utils/constants";
import { cn } from "@/utils/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -28 : 28, opacity: 0 }),
};

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

// ─── GlobalAudioBar ───────────────────────────────────────────────────────────
function GlobalAudioBar({ audio }) {
  if (!audio.hasAudio) return null;

  const track = audio.currentTrack;
  const isIntro = track?.type === "intro";
  const { isDone, isPlaying, hasStarted, hasBlockedAutoplay, manualStart } =
    audio;

  if (audio.hasError) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
        <AlertCircle size={13} className="flex-shrink-0" />
        Audio nije dostupan
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-green-50 border border-green-200">
        <Headphones size={13} className="text-green-500 flex-shrink-0" />
        <span className="text-xs text-green-700 font-semibold">
          Sve snimke završene
        </span>
      </div>
    );
  }

  if (hasBlockedAutoplay && !isPlaying) {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50 overflow-hidden">
        <div className="px-3.5 py-2.5 flex items-center gap-2.5">
          <Headphones size={13} className="text-sky-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sky-700 truncate">
              {track?.label ?? "Audio snimka"}
            </p>
            <p className="text-[10px] text-sky-400">
              Klikni za pokretanje audia
            </p>
          </div>
          <button
            onClick={manualStart}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold",
              "bg-sky-600 hover:bg-sky-700 text-white",
              "transition-colors active:scale-95",
            )}
          >
            <Play size={11} />
            Pokreni
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        isIntro ? "bg-amber-50 border-amber-200" : "bg-sky-50 border-sky-200",
      )}
    >
      <div className={cn("h-1", isIntro ? "bg-amber-100" : "bg-sky-100")}>
        <div
          className={cn(
            "h-full transition-all duration-500 ease-linear",
            isIntro ? "bg-amber-400" : "bg-sky-500",
          )}
          style={{ width: `${audio.totalProgressPct}%` }}
        />
      </div>
      <div className="px-3.5 py-2.5 flex items-center gap-2.5">
        <Headphones
          size={13}
          className={cn(
            "flex-shrink-0",
            isIntro ? "text-amber-500" : "text-sky-500",
          )}
        />

        {isPlaying && (
          <span className="flex gap-px items-end h-3 flex-shrink-0">
            {[7, 11, 8, 11, 7].map((h, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full"
                style={{
                  height: `${h}px`,
                  background: isIntro ? "#f59e0b" : "#0ea5e9",
                  animation: `waveform ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-xs font-semibold truncate",
              isIntro ? "text-amber-700" : "text-sky-700",
            )}
          >
            {track?.label ?? (isIntro ? "Upute" : "Snimka")}
          </p>
        </div>

        {isIntro && (
          <span className="text-[10px] bg-amber-100 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium leading-none flex-shrink-0">
            pričekaj
          </span>
        )}

        {audio.isLoadingTrack && (
          <span className="text-[10px] text-warm-400 font-medium flex-shrink-0">
            učitava...
          </span>
        )}
        {!audio.isLoadingTrack &&
          hasStarted &&
          !isPlaying &&
          !isDone &&
          !hasBlockedAutoplay && (
            <span className="text-[10px] text-warm-400 font-medium flex-shrink-0">
              pauzirano
            </span>
          )}

        {audio.duration > 0 && (
          <span
            className={cn(
              "text-[10px] tabular-nums font-medium flex-shrink-0",
              isIntro ? "text-amber-500" : "text-sky-500",
            )}
          >
            {audio.formattedTime} / {audio.formattedDuration}
          </span>
        )}

        <span className="text-[10px] text-warm-400 font-medium flex-shrink-0">
          {audio.trackIndex + 1}/{audio.totalTracks}
        </span>
      </div>
    </div>
  );
}

// ─── PausedOverlay ────────────────────────────────────────────────────────────
function PausedOverlay({ onResume, isSyncing }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-x-0 bottom-0 top-14 z-20 flex items-center justify-center bg-warm-100/98 backdrop-blur-md px-4"
    >
      <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-5">
          {isSyncing ? (
            <Loader2
              size={28}
              className="text-warm-400 animate-spin"
              strokeWidth={1.5}
            />
          ) : (
            <Pause size={28} className="text-warm-400" strokeWidth={1.5} />
          )}
        </div>
        <h2 className="text-xl font-bold text-warm-900 mb-2">
          {isSyncing ? "Sinkronizacija..." : "Ispit je pauziran"}
        </h2>
        <p className="text-warm-500 text-sm mb-6 leading-relaxed">
          {isSyncing
            ? "Čekamo potvrdu poslužitelja. Trenutak..."
            : "Odgovori su sačuvani. Nastavi kad budeš spreman/a."}
        </p>
        {!isSyncing && (
          <button
            onClick={onResume}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 active:scale-95 transition-all"
          >
            <Play size={14} />
            Nastavi ispit
          </button>
        )}
      </div>
    </motion.div>
  );
}

function BlockedByTabScreen({ backLink }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-warm-200 shadow-sm p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
          <AlertCircle size={22} className="text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-warm-900 text-base">
            Ispit je otvoren u drugom tabu
          </p>
          <p className="text-sm text-warm-500 mt-1.5 leading-relaxed">
            Ovaj ispit je aktivan u drugom prozoru ili tabu preglednika. Zatvori
            drugi tab pa pokušaj ponovo.
          </p>
        </div>
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

function ExamTopBar({
  backLink,
  examTitle,
  timer,
  isPaused,
  isPauseSyncing,
  isSyncing,
  isSubmitting,
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
          <Link
            to={backLink}
            className="flex-shrink-0 p-2 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
            aria-label="Natrag na popis ispita"
          >
            <ArrowLeft size={18} />
          </Link>

          <p className="text-sm font-semibold text-warm-700 truncate hidden sm:block flex-1 min-w-0">
            {examTitle}
          </p>

          <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-[200px]">
            <ProgressBar value={answeredCount} max={totalVisible} />
            <span className="text-xs text-warm-400 tabular-nums whitespace-nowrap">
              {answeredCount}/{totalVisible}
            </span>
          </div>

          <div className="flex-1 sm:hidden" />

          {isPauseSyncing && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-warm-400 flex-shrink-0">
              <Loader2 size={11} className="animate-spin" />
              <span className="hidden md:inline">Sinkronizacija...</span>
            </span>
          )}

          <ExamTimer {...timer} />

          <button
            onClick={isPaused ? onResume : onPause}
            disabled={isSyncing}
            title={
              isPauseSyncing
                ? "Čekaj sinkronizaciju s poslužiteljem..."
                : isPaused
                  ? "Nastavi ispit"
                  : "Pauziraj ispit"
            }
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              isSyncing && "opacity-60 cursor-not-allowed",
              !isSyncing && isPaused
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : !isSyncing
                  ? "bg-warm-100 text-warm-600 hover:bg-warm-200"
                  : "bg-warm-100 text-warm-600",
            )}
          >
            {isPauseSyncing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isPaused ? (
              <Play size={13} />
            ) : (
              <Pause size={13} />
            )}
            <span className="hidden sm:inline">
              {isPauseSyncing
                ? "Sinkronizacija..."
                : isPaused
                  ? "Nastavi"
                  : "Pauza"}
            </span>
          </button>

          <button
            onClick={onOpenNav}
            className="lg:hidden flex-shrink-0 p-2 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
            aria-label="Otvori navigaciju pitanja"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExamErrorState({ error, backLink }) {
  const msg = parseExamError(error);
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-warm-200 shadow-sm p-8 text-center space-y-4">
        <AlertCircle size={32} className="text-red-400 mx-auto" />
        <p className="text-sm text-warm-700 leading-relaxed">{msg}</p>
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

function ExamEmptyState({ backLink, examMeta }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-warm-200 shadow-sm p-8 text-center space-y-4">
        <Construction size={32} className="text-warm-400 mx-auto" />
        <p className="text-sm text-warm-600 leading-relaxed">
          Ispit{" "}
          <strong className="font-semibold text-warm-800">
            {examMeta ? buildExamTitle(examMeta) : "Ovaj ispit"}
          </strong>{" "}
          još nema unesena pitanja.
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

function SubmitModal({
  open,
  onClose,
  onConfirm,
  answeredCount,
  totalVisible,
  isSubmitting,
  isSyncing,
}) {
  const unanswered = totalVisible - answeredCount;
  const allAnswered = unanswered === 0;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={allAnswered ? "Predaj ispit?" : "Još ima neodgovorenih pitanja"}
    >
      <ModalBody>
        {allAnswered ? (
          <p className="text-sm text-warm-700 leading-relaxed">
            Odgovorili ste na sva pitanja. Potvrdom se ispit predaje i ne možete
            se više vraćati na odgovore.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle
                size={16}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-amber-800">
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
            <div className="flex justify-between text-sm px-1">
              <span className="text-warm-500">Odgovoreno</span>
              <span className="font-bold text-warm-800">
                {answeredCount}/{totalVisible}
              </span>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSyncing}>
          {allAnswered ? "Odustani" : "Još provjeri"}
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isSyncing}
          loading={isSubmitting}
        >
          {isSubmitting
            ? "Predaje se..."
            : allAnswered
              ? "Predaj ispit"
              : "Svejedno predaj"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function DraftModal({ open, onConfirm, onDiscard }) {
  return (
    <Modal open={open} title="Nastaviti gdje ste stali?">
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
  isSyncing,
  isSubmitting,
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-warm-200">
              <span className="text-sm font-bold text-warm-800">
                Navigacija
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
              >
                <X size={16} className="text-warm-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <QuestionNav
                questions={questions}
                answers={answers}
                flagged={flagged}
                currentIndex={currentIndex}
                onGoTo={(i) => {
                  onGoTo(i);
                  onClose();
                }}
                onSubmit={onSubmit}
                answeredCount={answeredCount}
              />
            </div>
            <div className="p-4 border-t border-warm-200">
              <button
                onClick={onSubmit}
                disabled={isSyncing || isSubmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isSyncing || isSubmitting
                    ? "bg-warm-200 text-warm-400 cursor-not-allowed"
                    : "bg-primary-600 text-white hover:bg-primary-700",
                )}
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                <span>
                  {isSubmitting
                    ? "Predaje se..."
                    : isSyncing
                      ? "Sinkronizacija..."
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

function MobileBottomBar({
  currentIndex,
  totalVisible,
  hasPrev,
  isLast,
  onPrev,
  onNext,
  onOpenNav,
  answeredCount,
  onSubmit,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-white/95 backdrop-blur-sm border-t border-warm-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center h-14 px-3 gap-2 max-w-xl mx-auto">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors min-w-0 flex-shrink-0",
            !hasPrev
              ? "text-warm-300 cursor-not-allowed"
              : "text-warm-700 hover:bg-warm-100 active:bg-warm-200",
          )}
        >
          <ArrowLeft size={16} />
          <span className="hidden xs:inline text-xs">Preth.</span>
        </button>

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

        {isLast ? (
          <button
            onClick={onSubmit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all flex-shrink-0"
          >
            <Send size={14} />
            <span className="hidden xs:inline text-xs">Predaj</span>
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-100 active:bg-warm-200 transition-colors flex-shrink-0"
          >
            <span className="hidden xs:inline text-xs">Sljed.</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

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
    examMeta,
    isSubmitting,
    isPauseSyncing,
    isSyncing,
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
    handleNext,
    handlePrev,
    isLastVisible,
    hasPrev,
    handleSubmit: sessionHandleSubmit,
    handlePause,
    handleResume,
    timer,
    isBlockedByOtherTab,
    isCheckingLock,
  } = useExamSession(examId);

  usePageTitle(examMeta ? buildExamTitle(examMeta) : null);

  // ── Globalni audio za ispit slušanja ──────────────────────────────────────
  const orderedAudioPassages = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const q of questions) {
      if (q.passageId && !seen.has(q.passageId)) {
        const p = passages[q.passageId];
        if (p?.audioUrl || p?.audioIntroUrl) {
          result.push(p);
          seen.add(q.passageId);
        }
      }
    }
    return result.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [questions, passages]);

  const audio = useListeningAudio(examId, orderedAudioPassages, isPaused);

  const handleSubmit = useCallback(() => {
    if (audio.audioRef.current) {
      audio.audioRef.current.pause();
    }
    audio.clearProgress();
    sessionHandleSubmit();
  }, [audio, sessionHandleSubmit]);

  const wrappedHandlePause = useCallback(() => {
    handlePause();
  }, [handlePause]);

  const wrappedHandleResume = useCallback(() => {
    handleResume();
  }, [handleResume]);

  // audioStatus za PassageDisplay (samo read-only)
  const audioStatus = useMemo(
    () =>
      audio.hasAudio
        ? {
            activePassageId: audio.activePassageId,
            isPlaying: audio.isPlaying,
            currentTrack: audio.currentTrack,
            isDone: audio.isDone,
          }
        : null,
    [audio],
  );

  const subjectId = examMeta?.subject_id ?? examId?.split("-")[0];
  const backLink = `/predmeti/${subjectId}`;

  const parentQuestion = useMemo(() => {
    if (!current || current.questionType !== "fill_blank_child") return null;
    return questions.find((q) => q.id === current.parentQuestionId) ?? null;
  }, [current, questions]);

  const hasAnyPassage = useMemo(
    () => questions.some((q) => q.passageId),
    [questions],
  );

  if (isCheckingLock) return <ExamSkeleton showPassage={false} />;
  if (isBlockedByOtherTab) return <BlockedByTabScreen backLink={backLink} />;
  if (fetchError)
    return <ExamErrorState error={fetchError} backLink={backLink} />;
  if (isLoading || !isInitialized) return <ExamSkeleton showPassage={false} />;
  if (questions.length === 0)
    return <ExamEmptyState backLink={backLink} examMeta={examMeta} />;
  if (!current)
    return (
      <ExamErrorState
        error={new Error("Neispravno stanje pitanja. Osvježi stranicu.")}
        backLink={backLink}
      />
    );

  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col">
      <audio
        ref={audio.audioRef}
        preload={audio.hasAudio ? "auto" : "none"}
        style={{ display: "none" }}
      />

      <ExamTopBar
        backLink={backLink}
        examTitle={buildExamTitle(examMeta)}
        timer={timer}
        isPaused={isPaused}
        isPauseSyncing={isPauseSyncing}
        isSyncing={isSyncing}
        isSubmitting={isSubmitting}
        onPause={wrappedHandlePause}
        onResume={wrappedHandleResume}
        answeredCount={answeredCount}
        totalVisible={totalVisible}
        onSubmit={() => setShowSubmitModal(true)}
        onOpenNav={() => setMobileNavOpen(true)}
      />

      <SubmitModal
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        answeredCount={answeredCount}
        totalVisible={totalVisible}
        isSubmitting={isSubmitting}
        isSyncing={isSyncing}
      />
      <DraftModal
        open={showDraftModal}
        onConfirm={confirmRestoreDraft}
        onDiscard={discardDraft}
      />
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
        isSyncing={isSyncing}
        isSubmitting={isSubmitting}
      />

      <div className="flex-1 page-container py-5 pb-20 lg:pb-5">
        <div className="flex flex-col lg:flex-row gap-5 h-full">
          {/* ── Lijeva kolona: GlobalAudioBar + passage ──────────────────── */}
          {hasAnyPassage && (
            <div
              className={cn(
                "lg:w-[42%] xl:w-[38%] flex-shrink-0",
                "lg:sticky lg:top-[4.5rem] lg:self-start",
                "lg:max-h-[calc(100dvh-5.5rem)]",
                "flex flex-col gap-3",
              )}
            >
              <GlobalAudioBar audio={audio} />

              {currentPassage ? (
                <PassageDisplay
                  passage={currentPassage}
                  activeGapPosition={
                    current?.questionType === "fill_blank_child"
                      ? current.position
                      : null
                  }
                  selectedPersonLetter={
                    current?.questionType === "multiple_choice"
                      ? (answers[current?.id] ?? null)
                      : null
                  }
                  isPaused={isPaused}
                  audioStatus={audioStatus}
                  isGlobalPlaying={audio.isPlaying}
                  className="lg:flex-1 lg:overflow-hidden"
                />
              ) : (
                <div className="hidden lg:flex items-center justify-center rounded-2xl border border-dashed border-warm-300 bg-warm-50/80 min-h-[180px]">
                  <p className="text-xs text-warm-400 font-medium text-center px-4">
                    Ovo pitanje nema polazni tekst
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Desna kolona: pitanje ─────────────────────────────────────── */}
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
                  parentQuestion={parentQuestion}
                  selectedAnswer={answers[current?.id] ?? null}
                  isFlagged={isCurrentFlagged}
                  onAnswer={handleAnswer}
                  onFlag={handleToggleFlag}
                  index={currentIndex}
                  isPaused={isPaused}
                  isGlobalPlaying={audio.isPlaying}
                />
              </motion.div>
            </AnimatePresence>

            <div className="hidden lg:flex items-center justify-between gap-3 mt-auto pt-1">
              <Button
                variant="secondary"
                leftIcon={ArrowLeft}
                disabled={!hasPrev}
                onClick={handlePrev}
              >
                Prethodno
              </Button>
              <div className="flex items-center gap-2.5">
                {isLastVisible ? (
                  <Button
                    variant="primary"
                    leftIcon={isSubmitting ? undefined : Send}
                    onClick={() => setShowSubmitModal(true)}
                    disabled={isSyncing}
                    loading={isSubmitting}
                  >
                    {isSubmitting ? "Predaje se..." : "Predaj ispit"}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    rightIcon={ArrowRight}
                    onClick={handleNext}
                  >
                    Sljedeće
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── Nav sidebar (samo desktop) ──────────────────────────────── */}
          <div className="hidden lg:block lg:w-56 xl:w-64 flex-shrink-0">
            <QuestionNav
              questions={questions}
              answers={answers}
              flagged={flagged}
              currentIndex={currentIndex}
              onGoTo={handleGoTo}
              onSubmit={() => setShowSubmitModal(true)}
              answeredCount={answeredCount}
            />
          </div>
        </div>
      </div>

      {!isPaused && (
        <MobileBottomBar
          currentIndex={currentIndex}
          totalVisible={totalVisible}
          hasPrev={hasPrev}
          isLast={isLastVisible}
          onPrev={handlePrev}
          onNext={handleNext}
          onOpenNav={() => setMobileNavOpen(true)}
          answeredCount={answeredCount}
          onSubmit={() => setShowSubmitModal(true)}
        />
      )}

      <AnimatePresence>
        {isPaused && (
          <PausedOverlay
            key="paused-overlay"
            onResume={handleResume}
            isSyncing={isSyncing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
