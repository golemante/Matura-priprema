import { useParams } from "react-router-dom";
import { useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/common/Button";
import { QuestionDisplay } from "@/components/exam/QuestionDisplay";
import { PassageDisplay } from "@/components/exam/PassageDisplay";
import { ExamSkeleton } from "@/components/exam/ExamSkeleton";
import { QuestionNav } from "@/components/exam/QuestionNav";
import { AudioBar } from "@/components/exam/AudioBar";
import { ExamTopBar } from "@/components/exam/ExamTopBar";
import { SubmitModal, DraftModal } from "@/components/exam/ExamModals";
import { KeyboardShortcutsModal } from "@/components/exam/KeyboardShortcutsModal";
import {
  ExamErrorState,
  ExamEmptyState,
  BlockedByTabState,
  PausedOverlay,
} from "@/components/exam/ExamStates";
import {
  MobileNavDrawer,
  MobileBottomBar,
  DesktopSubmitButton,
} from "@/components/exam/ExamNavControls";
import { useExamSession } from "@/hooks/useExamSession";
import { useListeningAudio } from "@/hooks/useListeningAudio";
import { EXAM_SESSIONS, DIFFICULTY_LEVELS } from "@/utils/constants";
import { cn } from "@/utils/cn";
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
    showShortcutsModal,
    setShowShortcutsModal,
    isBlockedByOtherTab,
    isCheckingLock,
  } = useExamSession(examId);

  usePageTitle(examMeta ? buildExamTitle(examMeta) : null);

  const orderedAudioPassages = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const q of questions) {
      if (q.passageId && !seen.has(q.passageId)) {
        const p = passages[q.passageId];
        if (p?.audioUrl || p?.audioIntroUrl) {
          result.push({ ...p, _firstQuestionPosition: q.position ?? 0 });
          seen.add(q.passageId);
        }
      }
    }
    return result.sort(
      (a, b) => a._firstQuestionPosition - b._firstQuestionPosition,
    );
  }, [questions, passages]);

  const audio = useListeningAudio(examId, orderedAudioPassages, isPaused);

  const audioStateRef = useRef(audio);
  audioStateRef.current = audio;

  const wrappedHandlePause = useCallback(() => handlePause(), [handlePause]);

  const wrappedHandleResume = useCallback(() => {
    audioStateRef.current.triggerPlay?.();
    handleResume();
  }, [handleResume]);

  const handleSubmit = useCallback(() => {
    const a = audioStateRef.current;
    a.stopAudio();
    a.clearProgress();
    sessionHandleSubmit();
  }, [sessionHandleSubmit]);

  const openSubmitModal = useCallback(
    () => setShowSubmitModal(true),
    [setShowSubmitModal],
  );

  const subjectId = examMeta?.subject_id ?? examId?.split("-")[0];
  const backLink = `/predmeti/${subjectId}`;
  const examTitle = buildExamTitle(examMeta);

  const showPassageColumn =
    !!currentPassage &&
    currentPassage.contentType !== "audio" &&
    !!currentPassage.content;

  const audioElement = (
    <audio
      ref={audio.audioRef}
      preload={audio.hasAudio ? "metadata" : "none"}
      style={{ display: "none" }}
    />
  );

  if (isCheckingLock)
    return (
      <>
        {audioElement}
        <ExamSkeleton showPassage={false} />
      </>
    );

  if (isBlockedByOtherTab)
    return (
      <>
        {audioElement}
        <BlockedByTabState backLink={backLink} />
      </>
    );

  if (fetchError)
    return (
      <>
        {audioElement}
        <ExamErrorState error={fetchError} backLink={backLink} />
      </>
    );

  if (isLoading || !isInitialized)
    return (
      <>
        {audioElement}
        <ExamSkeleton showPassage={false} />
      </>
    );

  if (questions.length === 0)
    return (
      <>
        {audioElement}
        <ExamEmptyState backLink={backLink} examTitle={examTitle} />
      </>
    );

  if (!current)
    return (
      <>
        {audioElement}
        <ExamErrorState
          error={new Error("Neispravno stanje pitanja. Osvježi stranicu.")}
          backLink={backLink}
        />
      </>
    );

  return (
    <>
      {audioElement}

      <div className="min-h-dvh bg-warm-100 flex flex-col">
        <ExamTopBar
          backLink={backLink}
          examTitle={examTitle}
          timer={timer}
          isPaused={isPaused}
          isPauseSyncing={isPauseSyncing}
          isSyncing={isSyncing}
          onPause={wrappedHandlePause}
          onResume={wrappedHandleResume}
          answeredCount={answeredCount}
          totalVisible={totalVisible}
          onOpenNav={() => setMobileNavOpen(true)}
        />

        <KeyboardShortcutsModal
          open={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
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
          onSubmit={openSubmitModal}
          answeredCount={answeredCount}
          totalVisible={totalVisible}
          isSyncing={isSyncing}
          isSubmitting={isSubmitting}
        />

        <div className="flex-1 page-container py-5 pb-20 lg:pb-5">
          <div className="flex flex-col lg:flex-row gap-5 h-full">
            {showPassageColumn && (
              <div
                className={cn(
                  "lg:w-[40%] xl:w-[36%] lg:flex-shrink-0",
                  "lg:sticky lg:top-[4.5rem] lg:self-start",
                  "lg:max-h-[calc(100dvh-5.5rem)]",
                  "flex flex-col gap-3",
                )}
              >
                {audio.hasAudio && <AudioBar audio={audio} />}

                <PassageDisplay
                  passage={currentPassage}
                  className="lg:flex-1 lg:overflow-hidden"
                />
              </div>
            )}

            <div className="flex-1 min-w-0 flex flex-col">
              {!showPassageColumn && audio.hasAudio && (
                <div className="mb-3">
                  <AudioBar audio={audio} compact />
                </div>
              )}

              <div className="flex-1 lg:overflow-y-auto lg:max-h-[calc(100dvh-14rem)] lg:pr-0.5">
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
                      selectedAnswer={answers[current?.id] ?? null}
                      isFlagged={isCurrentFlagged}
                      onAnswer={handleAnswer}
                      onFlag={handleToggleFlag}
                      index={currentIndex}
                      isPaused={isPaused}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="hidden lg:flex items-center justify-between gap-3 mt-4 pt-4 border-t border-warm-200 flex-shrink-0">
                <Button
                  variant="secondary"
                  leftIcon={ArrowLeft}
                  disabled={!hasPrev}
                  onClick={handlePrev}
                >
                  Prethodno
                </Button>
                <Button
                  variant="primary"
                  rightIcon={isLastVisible ? undefined : ArrowRight}
                  leftIcon={isLastVisible && !isSubmitting ? Send : undefined}
                  onClick={isLastVisible ? openSubmitModal : handleNext}
                  disabled={isSyncing}
                  loading={isLastVisible && isSubmitting}
                >
                  {isLastVisible
                    ? isSubmitting
                      ? "Predaje se..."
                      : "Predaj ispit"
                    : "Sljedeće"}
                </Button>
              </div>
            </div>

            <div className="hidden lg:block lg:w-56 xl:w-64 flex-shrink-0">
              <div className="sticky top-[4.5rem]">
                <QuestionNav
                  questions={questions}
                  answers={answers}
                  flagged={flagged}
                  currentIndex={currentIndex}
                  onGoTo={handleGoTo}
                />
                <DesktopSubmitButton
                  onSubmit={openSubmitModal}
                  answeredCount={answeredCount}
                  totalVisible={totalVisible}
                  isSyncing={isSyncing}
                  isSubmitting={isSubmitting}
                />
              </div>
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
            onSubmit={openSubmitModal}
          />
        )}

        <AnimatePresence>
          {isPaused && (
            <PausedOverlay
              key="paused-overlay"
              onResume={wrappedHandleResume}
              isSyncing={isSyncing}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
