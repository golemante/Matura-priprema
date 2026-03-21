// pages/ExamResults.jsx
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Send,
  TrendingUp,
  RefreshCw,
  Share2,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageWrapper } from "@/components/layout/Wrapper";
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
import { PageSpinner } from "@/components/common/LoadingSpinner";
import { AudioTranscriptPanel } from "@/components/exam/AudioTranscriptPanel";
import { cn } from "@/utils/cn";

// ─── Confetti ────────────────────────────────────────────────────────────────
function Confetti({ active }) {
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
  return null;
}

// ─── Answer key error banner ─────────────────────────────────────────────────
function AnswerKeyError({ onRetry, isRetrying }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4"
    >
      <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          Točni odgovori nisu dostupni
        </p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          Nije moguće dohvatiti točne odgovore. Provjeri internetsku vezu i
          pokušaj ponovo.
        </p>
      </div>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className={cn(
          "flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all",
          isRetrying
            ? "text-amber-400 cursor-not-allowed"
            : "text-amber-700 hover:bg-amber-100 active:bg-amber-200",
        )}
      >
        <RefreshCw size={12} className={isRetrying ? "animate-spin" : ""} />
        {isRetrying ? "Učitava..." : "Pokušaj ponovo"}
      </button>
    </motion.div>
  );
}

// ─── Empty filter state ───────────────────────────────────────────────────────
function EmptyFilter({ filter }) {
  const messages = {
    wrong: { text: "Nema netočnih odgovora!", icon: "🎉", color: "green" },
    skipped: {
      text: "Nijedno pitanje nije preskočeno!",
      icon: "✅",
      color: "primary",
    },
    flagged: {
      text: "Nijedno pitanje nije označeno zastavicom.",
      icon: "🏳️",
      color: "warm",
    },
  };
  const cfg = messages[filter] ?? { text: "Nema pitanja.", icon: "—" };

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

// ─── Refresh button ──────────────────────────────────────────────────────────
function RefreshButton({ onRefresh, isRefreshing, isFetching }) {
  const spinning = isRefreshing || isFetching;
  return (
    <button
      onClick={onRefresh}
      disabled={spinning}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold",
        "border transition-all duration-150",
        spinning
          ? "border-warm-200 text-warm-300 cursor-not-allowed bg-warm-50"
          : "border-warm-200 text-warm-600 hover:border-warm-300 hover:bg-warm-50 active:bg-warm-100 bg-white",
      )}
      title="Osvježi rezultate"
    >
      <RefreshCw size={12} className={spinning ? "animate-spin" : ""} />
      <span className="hidden xs:inline">Osvježi</span>
    </button>
  );
}

// ─── Exam meta breadcrumb ─────────────────────────────────────────────────────
function ExamBreadcrumb({ subject, examMeta, subjectId, backLink }) {
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
          <span className="text-warm-300">/</span>
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
              {examMeta.year}.{examMeta.session && ` · ${examMeta.session}`}
              {examMeta.level && ` · ${examMeta.level}`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sticky bottom CTA ────────────────────────────────────────────────────────
function StickyBottomBar({
  onBack,
  onRetry,
  onNewExam,
  effectiveAttemptId,
  examId,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* Gradient fade */}
      <div className="h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

      <div className="bg-white/95 backdrop-blur-sm border-t border-warm-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {/* Mobile: compact bar with expand option */}
        <div className="sm:hidden">
          <div className="flex items-center h-14 px-4 gap-2">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-warm-200 text-warm-600 hover:bg-warm-50 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="flex-1 flex gap-2">
              {effectiveAttemptId && examId && (
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
        </div>

        {/* Desktop: full bar */}
        <div className="hidden sm:block">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={ArrowLeft}
              onClick={onBack}
            >
              Natrag
            </Button>
            <div className="flex gap-2">
              {effectiveAttemptId && examId && (
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

// ─── Section header with collapse ────────────────────────────────────────────
function ReviewHeader({
  filter,
  setFilter,
  filterCounts,
  onRefresh,
  isRefreshing,
  isFetching,
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-base font-bold text-warm-900 flex items-center gap-2 flex-shrink-0">
          <TrendingUp size={16} className="text-warm-400" />
          Pregled odgovora
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <RefreshButton
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            isFetching={isFetching}
          />
          <FilterTabs
            active={filter}
            onChange={setFilter}
            counts={filterCounts}
          />
        </div>
      </div>
    </div>
  );
}

// ─── No result fallback ────────────────────────────────────────────────────────
function NoResultBanner() {
  return (
    <div className="flex items-start gap-3 p-4 bg-warm-100 border border-warm-300 rounded-xl mb-4">
      <AlertCircle size={18} className="text-warm-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-warm-700">
        Rezultat nije dostupan — možeš svejedno pregledati sve odgovore ispod.
      </p>
    </div>
  );
}

// ─── Loading skeleton for result ─────────────────────────────────────────────
function ResultSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-warm-200 rounded-2xl" />
      <div className="h-4 bg-warm-200 rounded-full w-48" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-warm-200 rounded-xl" />
        ))}
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

  // ── Attempt data (when no store result) ──────────────────────────────────
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

  // ── Refresh handler ──────────────────────────────────────────────────────
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
      flagged: new Set(),
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
    };
  }, [hasStoreResult, lastResult, attemptData, examContent]);

  // ── Handlers ─────────────────────────────────────────────────────────────
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
    if (examId) audioProgressStorage.clear(examId);
    resetExam();
    const subjectId =
      resolvedData?.examMeta?.subject_id ?? resolvedData?.examId?.split("-")[0];
    navigate("/predmeti/" + (subjectId ?? ""));
  }, [resolvedData, resetExam, navigate]);

  // ── Guard: no attemptId ──────────────────────────────────────────────────
  if (!hasStoreResult && !attemptIdParam) {
    return (
      <PageWrapper className="max-w-2xl mx-auto py-10">
        <div className="p-5 rounded-xl border border-warm-300 bg-warm-100">
          <p className="text-sm font-semibold text-warm-800">
            Rezultat nije dostupan.
          </p>
          <p className="text-sm text-warm-600 mt-1">
            Otvori rezultat via{" "}
            <code className="font-mono">/rezultati/pokusaj/:attemptId</code>.
          </p>
        </div>
      </PageWrapper>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!hasStoreResult && (loadingAttempt || loadingExam)) {
    return (
      <PageWrapper className="max-w-2xl mx-auto py-12">
        <ResultSkeleton />
      </PageWrapper>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (attemptError || examError || !resolvedData) {
    return (
      <PageWrapper className="max-w-2xl mx-auto py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl border border-red-200 bg-red-50 space-y-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
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
            Pokušaj učitati ponovo
          </button>
        </motion.div>
      </PageWrapper>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const {
    questions,
    answers,
    passages,
    flagged,
    elapsedSeconds,
    rpcResult,
    examMeta,
    examId,
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

  const filterCounts = {
    all: scoreable.length,
    wrong: scoreable.filter(
      (q) => answers[q.id] && !answerKey?.[q.id]?.isCorrect,
    ).length,
    skipped: scoreable.filter((q) => !answers[q.id]).length,
    flagged: scoreable.filter((q) => flagged?.has?.(q.id)).length,
  };

  const isFilterEmpty = sections.every((s) => {
    const sq = scoreable.filter((q) => (q.sectionLabel ?? "Ostalo") === s);
    if (filter === "all") return sq.length === 0;
    if (filter === "wrong")
      return !sq.some((q) => answers[q.id] && !answerKey?.[q.id]?.isCorrect);
    if (filter === "skipped") return !sq.some((q) => !answers[q.id]);
    if (filter === "flagged") return !sq.some((q) => flagged?.has?.(q.id));
    return false;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Confetti za dobar rezultat */}
      <Confetti active={pct !== null && pct >= 75} />

      {/* Sadržaj s paddingom na dnu za sticky bar */}
      <PageWrapper className="max-w-2xl mx-auto pb-28 sm:pb-24">
        {/* Breadcrumb */}
        <ExamBreadcrumb
          subject={subject}
          examMeta={examMeta}
          subjectId={subjectId}
          backLink={backLink}
        />

        {/* Score hero */}
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
            <AnswerKeyError onRetry={retryKey} isRetrying={fetchingKey} />
          )}
        </AnimatePresence>

        {/* Audio transkripti */}
        <AudioTranscriptPanel passages={passages} />

        {/* Review header + filter */}
        <ReviewHeader
          filter={filter}
          setFilter={setFilter}
          filterCounts={filterCounts}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          isFetching={fetchingKey}
        />

        {/* Loading skeleton za answer key */}
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
              transition={{ duration: 0.25 }}
              className="space-y-1"
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

        {/* Spacer za sticky bar */}
        <div className="h-4" />
      </PageWrapper>

      {/* Sticky CTA bar */}
      <StickyBottomBar
        onBack={() => navigate(backLink)}
        onRetry={handleRetry}
        onNewExam={handleNewExam}
        effectiveAttemptId={effectiveAttemptId}
        examId={examId}
      />
    </>
  );
}
