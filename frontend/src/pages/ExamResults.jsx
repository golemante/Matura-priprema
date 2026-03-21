// pages/ExamResults.jsx
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  Send,
  TrendingUp,
  RefreshCw,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/common/Button";
import { SUBJECTS } from "@/utils/constants";
import { useExamStore } from "@/store/examStore";
import { examApi } from "@/api/examApi";
import { attemptApi } from "@/api/attemptApi";
import { draftStorage, audioProgressStorage } from "@/utils/storage";
import { ScoreHero } from "@/components/results/ScoreHero";
import { SectionReview } from "@/components/results/SectionReview";
import { FilterTabs } from "@/components/results/FilterTabs";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import { AudioTranscriptPanel } from "@/components/exam/AudioTranscriptPanel";
import { cn } from "@/utils/cn";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useConfetti(active) {
  useEffect(() => {
    if (!active) return;
    import("canvas-confetti").then((mod) => {
      mod.default({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#2D54E8", "#22C55E", "#F59E0B", "#EC4899"],
      });
    });
  }, [active]);
}

// ─── Small UI components ──────────────────────────────────────────────────────

function ExamBreadcrumb({ subject, examMeta, backLink }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      <Link
        to={backLink}
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors font-medium"
      >
        <ArrowLeft size={15} />
        <span className="hidden xs:inline">Natrag na ispite</span>
        <span className="xs:hidden">Natrag</span>
      </Link>

      {examMeta && (
        <>
          <span className="text-warm-300 select-none">/</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {subject && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                  subject.color.badge,
                )}
              >
                <subject.icon size={10} />
                {subject.shortName}
              </span>
            )}
            <span className="text-xs text-warm-500">
              {examMeta.year}
              {examMeta.session && ` · ${examMeta.session}`}
              {examMeta.level && ` · ${examMeta.level}`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function AnswerKeyError({ onRetry, isFetching }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4"
    >
      <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          Točni odgovori nisu dostupni
        </p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          Provjeri internetsku vezu i pokušaj ponovo.
        </p>
      </div>
      <button
        onClick={onRetry}
        disabled={isFetching}
        className={cn(
          "flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all",
          isFetching
            ? "text-amber-400 cursor-not-allowed"
            : "text-amber-700 hover:bg-amber-100 active:bg-amber-200",
        )}
      >
        <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
        {isFetching ? "Učitava..." : "Pokušaj ponovo"}
      </button>
    </motion.div>
  );
}

function NoResultBanner() {
  return (
    <div className="flex items-start gap-3 p-4 bg-warm-100 border border-warm-300 rounded-xl mb-4">
      <AlertCircle size={17} className="text-warm-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-warm-700">
        Rezultat nije dostupan — možeš svejedno pregledati odgovore ispod.
      </p>
    </div>
  );
}

function EmptyFilter({ filter }) {
  const cfg = {
    wrong: { icon: "🎉", text: "Nema netočnih odgovora!" },
    skipped: { icon: "✅", text: "Nijedno pitanje nije preskočeno!" },
    flagged: { icon: "🏳️", text: "Nijedno pitanje nije označeno zastavicom." },
  }[filter] ?? { icon: "—", text: "Nema pitanja." };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-14"
    >
      <span className="text-4xl mb-3 block">{cfg.icon}</span>
      <p className="text-sm font-semibold text-warm-600">{cfg.text}</p>
    </motion.div>
  );
}

// Info strip shown when flagged data is unavailable (results loaded from DB history)
function FlaggedUnavailableNote() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-warm-50 border border-warm-200 rounded-lg text-xs text-warm-500 mb-3">
      <Flag size={12} className="flex-shrink-0" />
      Oznake pitanja nisu dostupne za starije pokušaje.
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 sm:h-36 bg-warm-200 rounded-2xl" />
      <div className="h-4 bg-warm-200 rounded-full w-48" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-warm-200 rounded-xl" />
      ))}
    </div>
  );
}

function RefreshButton({ onRefresh, isRefreshing, isFetching }) {
  const busy = isRefreshing || isFetching;
  return (
    <button
      onClick={onRefresh}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
        busy
          ? "border-warm-200 text-warm-300 bg-warm-50 cursor-not-allowed"
          : "border-warm-200 text-warm-600 bg-white hover:border-warm-300 hover:bg-warm-50 active:bg-warm-100",
      )}
      title="Osvježi rezultate"
    >
      <RefreshCw size={12} className={busy ? "animate-spin" : ""} />
      <span className="hidden xs:inline">Osvježi</span>
    </button>
  );
}

function ReviewHeader({
  filter,
  setFilter,
  filterCounts,
  hasFlagged,
  onRefresh,
  isRefreshing,
  isFetching,
}) {
  return (
    <div className="mt-6 mb-4">
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 flex-wrap">
        <h2 className="text-base font-bold text-warm-900 flex items-center gap-2 flex-shrink-0">
          <TrendingUp size={16} className="text-warm-400" />
          Pregled odgovora
        </h2>
        <RefreshButton
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          isFetching={isFetching}
        />
      </div>
      <FilterTabs
        active={filter}
        onChange={setFilter}
        counts={filterCounts}
        hasFlagged={hasFlagged}
      />
    </div>
  );
}

// ─── Sticky bottom CTA bar ────────────────────────────────────────────────────
function StickyBottomBar({ onBack, onRetry, onNewExam, canRetry }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      {/* Fade gradient */}
      <div className="h-8 bg-gradient-to-t from-white via-white/60 to-transparent" />

      <div className="bg-white/95 backdrop-blur-sm border-t border-warm-200 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] pointer-events-auto">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
          {/* Mobile */}
          <div className="flex sm:hidden items-center gap-2 h-12">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-warm-200 text-warm-600 hover:bg-warm-50 transition-colors flex-shrink-0"
              aria-label="Natrag"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 flex gap-2">
              {canRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-warm-200 text-sm font-semibold text-warm-700 hover:bg-warm-50 transition-colors"
                >
                  <RotateCcw size={14} />
                  Ponovi
                </button>
              )}
              <button
                onClick={onNewExam}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary-600 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                <Send size={14} />
                Novi ispit
              </button>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={ArrowLeft}
              onClick={onBack}
            >
              Natrag
            </Button>
            <div className="flex gap-2">
              {canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={RotateCcw}
                  onClick={onRetry}
                >
                  Pokušaj opet
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                leftIcon={Send}
                onClick={onNewExam}
              >
                Novi ispit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function ResultsPage() {
  usePageTitle(PAGE_TITLES.examResults ?? "Rezultati");

  const { examId: examIdParam, attemptId: attemptIdParam } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastResult = useExamStore((s) => s.lastResult);
  const resetExam = useExamStore((s) => s.resetExam);

  const hasStoreResult =
    !!lastResult &&
    (!examIdParam || lastResult.examId === examIdParam) &&
    (!attemptIdParam || lastResult.attemptId === attemptIdParam);

  // ── Remote data (when navigating to old result by URL) ───────────────────
  const {
    data: attemptData,
    isLoading: loadingAttempt,
    error: attemptError,
    refetch: refetchAttempt,
  } = useQuery({
    queryKey: ["attempt", attemptIdParam],
    queryFn: () => attemptApi.getById(attemptIdParam),
    enabled: !hasStoreResult && !!attemptIdParam,
    retry: 2,
    retryDelay: 1000,
  });

  const {
    data: examContent,
    isLoading: loadingExam,
    error: examError,
    refetch: refetchExam,
  } = useQuery({
    queryKey: ["exam-with-questions", attemptData?.exam_id],
    queryFn: () => examApi.getWithQuestions(attemptData.exam_id),
    enabled: !hasStoreResult && !!attemptData?.exam_id,
    staleTime: Infinity,
  });

  const effectiveAttemptId = hasStoreResult
    ? lastResult?.attemptId
    : (attemptData?.id ?? attemptIdParam);

  // ── Answer key ───────────────────────────────────────────────────────────
  const {
    data: answerKey,
    isLoading: loadingKey,
    isFetching: fetchingKey,
    error: keyError,
    refetch: retryKey,
  } = useQuery({
    queryKey: ["answer-key", effectiveAttemptId],
    queryFn: () => examApi.getAnswerKey(effectiveAttemptId),
    enabled: !!effectiveAttemptId,
    staleTime: Infinity,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  // ── Refresh ──────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all(
        [
          retryKey(),
          !hasStoreResult && refetchAttempt(),
          !hasStoreResult && refetchExam(),
        ].filter(Boolean),
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [retryKey, refetchAttempt, refetchExam, hasStoreResult]);

  // ── Resolved data ────────────────────────────────────────────────────────
  const resolvedData = useMemo(() => {
    if (hasStoreResult && lastResult) {
      return {
        examId: lastResult.examId,
        attemptId: lastResult.attemptId,
        questions: lastResult.questions ?? [],
        answers: lastResult.answers ?? {},
        passages: lastResult.passages ?? {},
        flagged: new Set(lastResult.flagged ?? []),
        elapsedSeconds: lastResult.elapsedSeconds ?? null,
        rpcResult: lastResult.rpcResult ?? null,
        examMeta: lastResult.examMeta ?? null,
        hasFlagged: (lastResult.flagged ?? []).length > 0 || true, // flagged data IS available from store
      };
    }

    if (!attemptData || !examContent) return null;

    const restoredAnswers = (attemptData.attempt_answers ?? []).reduce(
      (acc, row) => {
        acc[row.question_id] = row.chosen_option ?? null;
        return acc;
      },
      {},
    );

    return {
      examId: attemptData.exam_id,
      attemptId: attemptData.id,
      questions: examContent.questions ?? [],
      answers: restoredAnswers,
      passages: examContent.passages ?? {},
      flagged: new Set(), // Not persisted in DB
      elapsedSeconds: attemptData.elapsed_seconds ?? null,
      rpcResult: {
        score_pct: attemptData.score_pct,
        correct_count: attemptData.correct_count,
        total_count: attemptData.total_count,
        elapsed_seconds: attemptData.elapsed_seconds,
        answered_count: (attemptData.attempt_answers ?? []).filter(
          (r) => r.chosen_option != null,
        ).length,
        skipped_count: (attemptData.attempt_answers ?? []).filter(
          (r) => r.chosen_option == null,
        ).length,
      },
      examMeta: attemptData.exam ?? examContent.exam ?? null,
      hasFlagged: false, // Flagged data is not persisted – always false for old attempts
    };
  }, [hasStoreResult, lastResult, attemptData, examContent]);

  // ── Action handlers ──────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    const examId = resolvedData?.examId;
    if (!examId) return;
    resetExam();
    draftStorage.clear(examId);
    audioProgressStorage.clear(examId);
    navigate(`/ispit/${examId}`);
  }, [resolvedData?.examId, resetExam, navigate]);

  const handleNewExam = useCallback(() => {
    const examId = resolvedData?.examId;
    const subjectId =
      resolvedData?.examMeta?.subject_id ?? examId?.split("-")[0];
    if (examId) audioProgressStorage.clear(examId);
    resetExam();
    navigate("/predmeti/" + (subjectId ?? ""));
  }, [resolvedData, resetExam, navigate]);

  // Confetti on good score
  useConfetti(
    resolvedData !== null && (resolvedData.rpcResult?.score_pct ?? 0) >= 75,
  );

  // ── Guard states ─────────────────────────────────────────────────────────
  if (!hasStoreResult && !attemptIdParam) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="p-5 rounded-xl border border-warm-300 bg-warm-100">
          <p className="text-sm font-semibold text-warm-800">
            Rezultat nije dostupan.
          </p>
          <p className="text-xs text-warm-500 mt-1">
            Otvori rezultat via{" "}
            <code className="font-mono">/rezultati/pokusaj/:attemptId</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!hasStoreResult && (loadingAttempt || loadingExam)) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <ResultSkeleton />
      </div>
    );
  }

  if (attemptError || examError || !resolvedData) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl border border-red-200 bg-red-50 space-y-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={17} className="text-red-500" />
            <p className="text-sm font-semibold text-red-700">
              Rezultat nije dostupan ili pokušaj ne postoji.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 underline underline-offset-2"
          >
            <RefreshCw
              size={12}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Učitaj ponovo
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const {
    questions,
    answers,
    passages,
    flagged,
    elapsedSeconds,
    rpcResult,
    examMeta,
    examId,
    hasFlagged,
  } = resolvedData;

  const pct = rpcResult?.score_pct ?? null;
  const correctCount = rpcResult?.correct_count ?? null;
  const totalCount =
    rpcResult?.total_count ??
    questions.filter((q) => q.questionType !== "fill_blank_mc").length;

  const subjectId = examMeta?.subject_id ?? examId?.split("-")[0];
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  const backLink = subject ? `/predmeti/${subject.id}` : "/predmeti";

  const sections = [
    ...new Set(questions.map((q) => q.sectionLabel ?? "Ostalo")),
  ];
  const scoreable = questions.filter((q) => q.questionType !== "fill_blank_mc");

  // *** FIX: filterCounts.wrong uses letter comparison, NOT answerInfo.isCorrect ***
  // Also: don't count as "wrong" while key is still loading (avoid confusing high number)
  const filterCounts = {
    all: scoreable.length,
    wrong: !answerKey
      ? 0
      : scoreable.filter((q) => {
          if (!answers[q.id]) return false;
          const info = answerKey[q.id];
          return info?.correctOption && answers[q.id] !== info.correctOption;
        }).length,
    skipped: scoreable.filter((q) => !answers[q.id]).length,
    flagged: scoreable.filter((q) => flagged?.has?.(q.id)).length,
  };

  const isFilterEmpty = sections.every((s) => {
    const sq = scoreable.filter((q) => (q.sectionLabel ?? "Ostalo") === s);
    switch (filter) {
      case "wrong":
        return (
          !answerKey ||
          !sq.some((q) => {
            const info = answerKey[q.id];
            return (
              answers[q.id] &&
              info?.correctOption &&
              answers[q.id] !== info.correctOption
            );
          })
        );
      case "skipped":
        return !sq.some((q) => !answers[q.id]);
      case "flagged":
        return !sq.some((q) => flagged?.has?.(q.id));
      default:
        return sq.length === 0;
    }
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-32 sm:pb-28">
        <ExamBreadcrumb
          subject={subject}
          examMeta={examMeta}
          backLink={backLink}
        />

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {pct !== null ? (
            <ScoreHero
              pct={pct}
              correctCount={correctCount}
              totalCount={totalCount}
              elapsedSeconds={elapsedSeconds}
              rpcResult={rpcResult}
              examMeta={examMeta}
            />
          ) : (
            <NoResultBanner />
          )}
        </motion.div>

        {/* Answer key error */}
        <AnimatePresence>
          {keyError && (
            <AnswerKeyError onRetry={retryKey} isFetching={fetchingKey} />
          )}
        </AnimatePresence>

        {/* Audio transcripts */}
        <AudioTranscriptPanel passages={passages} />

        {/* Review section */}
        <ReviewHeader
          filter={filter}
          setFilter={setFilter}
          filterCounts={filterCounts}
          hasFlagged={hasFlagged}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          isFetching={fetchingKey}
        />

        {/* Flagged unavailable note (only when loading from DB) */}
        {!hasFlagged && !hasStoreResult && filter !== "flagged" && (
          <FlaggedUnavailableNote />
        )}

        {/* Questions */}
        <AnimatePresence mode="wait">
          {loadingKey && !answerKey ? (
            <motion.div
              key="key-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2 mt-2"
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-warm-100 rounded-xl animate-pulse"
                />
              ))}
            </motion.div>
          ) : isFilterEmpty && filter !== "all" ? (
            <EmptyFilter key="empty" filter={filter} />
          ) : (
            <motion.div
              key="sections"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {sections.map((section) => (
                <SectionReview
                  key={section}
                  sectionLabel={section}
                  questions={questions}
                  answers={answers}
                  answerKey={answerKey}
                  passages={passages}
                  flagged={flagged}
                  filter={filter}
                  loadingKey={loadingKey}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <StickyBottomBar
        onBack={() => navigate(backLink)}
        onRetry={handleRetry}
        onNewExam={handleNewExam}
        canRetry={!!(effectiveAttemptId && examId)}
      />
    </>
  );
}
