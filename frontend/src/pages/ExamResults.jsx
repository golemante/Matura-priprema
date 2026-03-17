// pages/ExamResults.jsx
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Send,
  TrendingUp,
} from "lucide-react";
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
import { cn } from "@/utils/utils";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";

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

function AnswerKeyError({ onRetry }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
      <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-900">
          Točni odgovori nisu dostupni
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Nije moguće dohvatiti točne odgovore. Provjeri internetsku vezu.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex-shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2"
      >
        Pokušaj ponovo
      </button>
    </div>
  );
}

function EmptyFilter({ filter }) {
  const messages = {
    wrong: "Nema netočnih odgovora! 🎉",
    skipped: "Nijedno pitanje nije preskočeno!",
    flagged: "Nijedno pitanje nije označeno zastavicom.",
  };
  return (
    <div className="text-center py-12">
      <CheckCircle2
        size={32}
        className="text-green-400 mx-auto mb-3"
        strokeWidth={1.5}
      />
      <p className="text-sm font-semibold text-warm-600 mb-1">
        {messages[filter] ?? "Nema pitanja."}
      </p>
    </div>
  );
}

export function ResultsPage() {
  usePageTitle(PAGE_TITLES.examResults ?? "Rezultati");

  const { examId: examIdParam, attemptId: attemptIdParam } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const lastResult = useExamStore((s) => s.lastResult);
  const resetExam = useExamStore((s) => s.resetExam);

  const hasStoreResult =
    !!lastResult &&
    (!examIdParam || lastResult.examId === examIdParam) &&
    (!attemptIdParam || lastResult.attemptId === attemptIdParam);

  const {
    data: attemptData,
    isLoading: loadingAttempt,
    error: attemptError,
  } = useQuery({
    queryKey: ["attempt", attemptIdParam],
    queryFn: () => attemptApi.getById(attemptIdParam),
    enabled: !hasStoreResult && !!attemptIdParam,
    retry: 1,
  });

  const {
    data: examContent,
    isLoading: loadingExam,
    error: examError,
  } = useQuery({
    queryKey: ["exam-with-questions", attemptData?.exam_id],
    queryFn: () => examApi.getWithQuestions(attemptData.exam_id),
    enabled: !hasStoreResult && !!attemptData?.exam_id,
    staleTime: Infinity,
  });

  const effectiveAttemptId = hasStoreResult
    ? lastResult?.attemptId
    : (attemptData?.id ?? attemptIdParam);

  const {
    data: answerKey,
    isLoading: loadingKey,
    error: keyError,
    refetch: retryKey,
  } = useQuery({
    queryKey: ["answer-key", effectiveAttemptId],
    queryFn: () => examApi.getAnswerKey(effectiveAttemptId),
    enabled: !!effectiveAttemptId,
    staleTime: Infinity,
    retry: 2,
  });

  const resolvedData = useMemo(() => {
    if (hasStoreResult && lastResult) {
      return {
        examId: lastResult.examId,
        attemptId: lastResult.attemptId,
        questions: lastResult.questions ?? [],
        answers: lastResult.answers ?? {},
        passages: lastResult.passages ?? {},
        flagged: lastResult.flagged ?? new Set(),
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

  if (!hasStoreResult && (loadingAttempt || loadingExam)) {
    return (
      <PageWrapper className="max-w-2xl mx-auto py-12">
        <div className="flex items-center gap-2 text-warm-600 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
          Učitavanje rezultata...
        </div>
      </PageWrapper>
    );
  }

  if (attemptError || examError || !resolvedData) {
    return (
      <PageWrapper className="max-w-2xl mx-auto py-10">
        <div className="p-5 rounded-xl border border-red-200 bg-red-50">
          <p className="text-sm font-semibold text-red-700">
            Rezultat nije dostupan ili pokušaj ne postoji.
          </p>
        </div>
      </PageWrapper>
    );
  }

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
  const backLink = subject ? `/predmeti/${subject.id}` : "/";

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

  const handleRetry = () => {
    if (!examId) return;
    resetExam();
    draftStorage.clear(examId);
    audioProgressStorage.clear(examId);
    questionAudioStorage.clear(examId);
    navigate(`/ispit/${examId}`);
  };

  const handleNewExam = () => {
    if (examId) {
      audioProgressStorage.clear(examId);
      questionAudioStorage.clear(examId);
    }
    resetExam();
    navigate("/predmeti/" + (subject?.id ?? subjectId));
  };

  return (
    <>
      <PageWrapper className="max-w-2xl mx-auto pb-24">
        <Confetti active={pct !== null && pct >= 75} />

        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-warm-800 mb-5 transition-colors font-medium"
        >
          <ArrowLeft size={15} />
          Natrag na ispite
        </Link>

        {examMeta && (
          <p className="text-xs text-warm-500 mb-3">
            {subject?.name ?? subjectId?.toUpperCase()} · {examMeta.year}. ·{" "}
            {examMeta.session} · {examMeta.level}
          </p>
        )}

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
          <div className="flex items-start gap-3 p-4 bg-warm-100 border border-warm-300 rounded-xl mb-4">
            <AlertCircle
              size={18}
              className="text-warm-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-warm-700">
              Rezultat nije dostupan — možeš svejedno pregledati sve odgovore
              ispod.
            </p>
          </div>
        )}

        {keyError && <AnswerKeyError onRetry={retryKey} />}

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-base font-bold text-warm-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-warm-400" />
              Pregled odgovora
            </h2>
            <FilterTabs
              active={filter}
              onChange={setFilter}
              counts={filterCounts}
            />
          </div>

          {isFilterEmpty && filter !== "all" ? (
            <EmptyFilter filter={filter} />
          ) : (
            sections.map((section) => (
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
            ))
          )}
        </div>
      </PageWrapper>

      {/* ── Sticky CTA traka na dnu ────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-t border-warm-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate(backLink)}
          >
            Natrag
          </Button>
          <div className="flex gap-2">
            {effectiveAttemptId && examId && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={RotateCcw}
                onClick={handleRetry}
              >
                Pokušaj opet
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={Send}
              onClick={handleNewExam}
            >
              Novi ispit
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
