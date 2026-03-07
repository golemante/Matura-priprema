// pages/ExamResults.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PROMJENE u odnosu na staru verziju:
//   • score_pct dolazi iz finish_attempt RPC (lastResult.rpcResult)
//   • Točni odgovori se dohvaćaju iz attempt_details viewa NAKON završetka
//   • calculateScore je uklonjen — score dolazi sa servera (jedino ispravno)
//   • Svako pitanje u pregledu sada prikazuje: chosen, correct, explanation
//   • Grupiranje po sekcijama (I. Čitanje, II. Književnost, III. Jezik)
//   • Fallback za offline: ako rpcResult nije dostupan, prikazujemo samo odgovore
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Minus,
  ArrowLeft,
  RotateCcw,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { SUBJECTS } from "@/utils/constants";
import { useExamStore } from "@/store/examStore";
import { examApi } from "@/api/examApi";
import { cn } from "@/utils/utils";

// ── Pomoćne funkcije ──────────────────────────────────────────────────────────

function getScoreLabel(pct) {
  if (pct >= 90) return "Izvrsno! 🏆";
  if (pct >= 75) return "Vrlo dobro! 🎉";
  if (pct >= 60) return "Dobro! 👍";
  if (pct >= 50) return "Dovoljno 📖";
  return "Treba vježbati 💪";
}

function getScoreColors(pct) {
  if (pct >= 75)
    return {
      text: "text-success-600",
      bg: "bg-success-50",
      border: "border-green-200",
      bar: "bg-success-500",
      ringFg: "#16A34A",
      ringBg: "#DCFCE7",
    };
  if (pct >= 50)
    return {
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      bar: "bg-amber-400",
      ringFg: "#D97706",
      ringBg: "#FEF3C7",
    };
  return {
    text: "text-error-600",
    bg: "bg-error-50",
    border: "border-red-200",
    bar: "bg-error-500",
    ringFg: "#DC2626",
    ringBg: "#FEE2E2",
  };
}

function formatElapsed(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  useEffect(() => {
    if (!active) return;
    import("canvas-confetti").then((mod) => {
      mod.default({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b"],
      });
    });
  }, [active]);
  return null;
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ pct, colors }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg
      width={110}
      height={110}
      viewBox="0 0 110 110"
      className="rotate-[-90deg]"
    >
      <circle
        cx={55}
        cy={55}
        r={r}
        fill="none"
        stroke={colors.ringBg}
        strokeWidth={10}
      />
      <circle
        cx={55}
        cy={55}
        r={r}
        fill="none"
        stroke={colors.ringFg}
        strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

// ── Prikaz jednog pitanja s točnim odgovorom ──────────────────────────────────
function QuestionReview({ question, chosenLetter, answerInfo, passage }) {
  const [expanded, setExpanded] = useState(false);

  const isSkipped = !chosenLetter;
  const isCorrect = answerInfo?.isCorrect ?? false;
  const correctLetter = answerInfo?.correctOption ?? null;
  const explanation = answerInfo?.explanation ?? null;

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-colors",
        isSkipped
          ? "border-warm-200 bg-white"
          : isCorrect
            ? "border-green-200 bg-success-50/30"
            : "border-red-200 bg-error-50/30",
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-black/5 transition-colors"
      >
        {/* Status ikona */}
        <div className="flex-shrink-0">
          {isSkipped ? (
            <Minus size={18} className="text-warm-400" />
          ) : isCorrect ? (
            <CheckCircle2 size={18} className="text-success-600" />
          ) : (
            <XCircle size={18} className="text-error-500" />
          )}
        </div>

        {/* Broj + tekst pitanja */}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-warm-400 mr-2">
            {question.positionLabel ?? question.position}
          </span>
          <span className="text-sm text-warm-800 line-clamp-2">
            {question.text.replace(/<[^>]+>/g, "")}
          </span>
        </div>

        {/* Odabrani / točni odgovor badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {chosenLetter && (
            <span
              className={cn(
                "text-xs font-bold px-1.5 py-0.5 rounded border",
                isCorrect
                  ? "bg-success-50 text-success-700 border-green-300"
                  : "bg-error-50 text-error-700 border-red-300",
              )}
            >
              {chosenLetter.toUpperCase()}
            </span>
          )}
          {!isCorrect && correctLetter && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded border bg-green-50 text-success-700 border-green-300">
              ✓ {correctLetter.toUpperCase()}
            </span>
          )}
          {expanded ? (
            <ChevronUp size={14} className="text-warm-400" />
          ) : (
            <ChevronDown size={14} className="text-warm-400" />
          )}
        </div>
      </button>

      {/* Expanded detalji */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3">
              {/* Sve opcije */}
              {question.options.length > 0 && (
                <div className="space-y-2">
                  {question.options.map((opt) => {
                    const isCorrectOpt = opt.letter === correctLetter;
                    const isUserPick = opt.letter === chosenLetter;
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          "flex items-start gap-2.5 p-2.5 rounded-lg border text-sm",
                          isCorrectOpt
                            ? "bg-success-50 border-green-200 text-success-800"
                            : isUserPick && !isCorrectOpt
                              ? "bg-error-50 border-red-200 text-error-700 line-through opacity-80"
                              : "bg-white border-warm-200 text-warm-600",
                        )}
                      >
                        <span
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            isCorrectOpt
                              ? "bg-success-100 text-success-700"
                              : isUserPick && !isCorrectOpt
                                ? "bg-error-100 text-error-600"
                                : "bg-warm-100 text-warm-500",
                          )}
                        >
                          {opt.letter.toUpperCase()}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrectOpt && (
                          <CheckCircle2
                            size={14}
                            className="text-success-600 flex-shrink-0 mt-0.5"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Objašnjenje */}
              {explanation && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Lightbulb
                    size={14}
                    className="text-blue-500 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {explanation}
                  </p>
                </div>
              )}

              {/* Passage badge */}
              {passage && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                  <BookOpen size={12} />
                  <span>
                    Polazni tekst: {passage.title ?? "Priloženi tekst"}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Sekcija pitanja ───────────────────────────────────────────────────────────
function SectionReview({
  sectionLabel,
  questions,
  answers,
  answerKey,
  passages,
}) {
  const [open, setOpen] = useState(true);

  const sectionQuestions = questions.filter(
    (q) =>
      (q.sectionLabel ?? "Ostalo") === sectionLabel &&
      q.questionType !== "fill_blank_mc",
  );

  const correct = sectionQuestions.filter(
    (q) => answerKey?.[q.id]?.isCorrect,
  ).length;

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-2 px-1 group"
      >
        <h3 className="text-sm font-bold text-warm-700 group-hover:text-warm-900 transition-colors">
          {sectionLabel}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-warm-500">
            {correct}/{sectionQuestions.length} točno
          </span>
          {open ? (
            <ChevronUp size={14} className="text-warm-400" />
          ) : (
            <ChevronDown size={14} className="text-warm-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-2 mt-2"
          >
            {sectionQuestions.map((q) => (
              <QuestionReview
                key={q.id}
                question={q}
                chosenLetter={answers[q.id] ?? null}
                answerInfo={answerKey?.[q.id] ?? null}
                passage={q.passageId ? (passages?.[q.passageId] ?? null) : null}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stranica rezultata ────────────────────────────────────────────────────────
export function ResultsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const lastResult = useExamStore((s) => s.lastResult);

  useEffect(() => {
    if (!lastResult || lastResult.examId !== examId) {
      navigate("/", { replace: true });
    }
  }, [lastResult, examId, navigate]);

  if (!lastResult || lastResult.examId !== examId) return null;

  const { questions, answers, passages, elapsedSeconds, rpcResult, attemptId } =
    lastResult;

  // ── Dohvati točne odgovore iz attempt_details ─────────────────────────────
  const {
    data: answerKey,
    isLoading: loadingKey,
    error: keyError,
  } = useQuery({
    queryKey: ["answer-key", attemptId],
    queryFn: () => examApi.getAnswerKey(attemptId),
    enabled: !!attemptId,
    staleTime: Infinity, // nikad ne istječe — rezultat je immutable
    retry: 2,
  });

  // ── Score iz RPC-a ili fallback ───────────────────────────────────────────
  const pct = rpcResult?.score_pct ?? null;
  const correctCount = rpcResult?.correct_count ?? null;
  const totalCount =
    rpcResult?.total_count ??
    questions.filter((q) => q.questionType !== "fill_blank_mc").length;

  const subjectId = examId?.split("-")[0];
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  const colors = pct !== null ? getScoreColors(pct) : getScoreColors(0);
  const label = pct !== null ? getScoreLabel(pct) : "Rezultati se učitavaju...";
  const elapsed = formatElapsed(rpcResult?.elapsed_seconds ?? elapsedSeconds);

  // Grupiraj pitanja po sekcijama
  const sections = [
    ...new Set(questions.map((q) => q.sectionLabel ?? "Ostalo")),
  ];

  return (
    <PageWrapper className="max-w-2xl mx-auto">
      <Confetti active={pct !== null && pct >= 75} />

      {/* Natrag */}
      <Link
        to={subject ? `/predmeti/${subject.id}` : "/"}
        className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-warm-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Natrag na ispite
      </Link>

      {/* ── Score kartica ──────────────────────────────────────────────── */}
      <Card className={cn("p-6 mb-6 border-2", colors.border, colors.bg)}>
        <div className="flex items-center gap-6">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <ScoreRing pct={pct ?? 0} colors={colors} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-xl font-black", colors.text)}>
                {pct !== null ? `${pct}%` : "..."}
              </span>
            </div>
          </div>

          {/* Tekst */}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-warm-900 mb-1">{label}</p>

            <div className="flex flex-wrap gap-4 text-sm text-warm-600">
              {correctCount !== null && (
                <span className="flex items-center gap-1.5">
                  <Target size={14} className="text-success-500" />
                  <span>
                    <strong className="text-warm-900">{correctCount}</strong>/
                    {totalCount} točnih
                  </span>
                </span>
              )}
              {elapsed && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-warm-400" />
                  <span>{elapsed}</span>
                </span>
              )}
            </div>

            {/* Upozorenje ako nema online rezultata */}
            {!rpcResult && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                <AlertCircle size={12} />
                <span>Detaljna analiza nije dostupna (offline predaja)</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Akcije ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-8">
        <Button
          variant="secondary"
          leftIcon={RotateCcw}
          onClick={() => navigate(`/ispit/${examId}`)}
          className="flex-1"
        >
          Ponovi ispit
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate("/")}
          className="flex-1"
        >
          Novi ispit
        </Button>
      </div>

      {/* ── Pregled odgovora ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-warm-900 mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-warm-400" />
          Pregled odgovora
          {loadingKey && (
            <span className="text-xs text-warm-400 font-normal ml-1">
              (učitavanje točnih odgovora...)
            </span>
          )}
        </h2>

        {keyError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-700">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Točni odgovori su dostupni samo prijavljenim korisnicima koji su
              predali ispit. Prijavi se za prikaz rješenja.
            </span>
          </div>
        )}

        {sections.map((section) => (
          <SectionReview
            key={section}
            sectionLabel={section}
            questions={questions}
            answers={answers}
            answerKey={answerKey ?? null}
            passages={passages}
          />
        ))}
      </div>
    </PageWrapper>
  );
}
