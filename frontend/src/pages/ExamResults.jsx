// pages/ExamResults.jsx
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { SUBJECTS } from "@/utils/constants";
import { calculateScore } from "@/utils/helpers";
import { useExamStore } from "@/store/examStore";
import { cn } from "@/utils/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScoreLabel(pct) {
  if (pct >= 90) return "Izvrsno! 🏆";
  if (pct >= 75) return "Vrlo dobro! 🎉";
  if (pct >= 60) return "Dobro! 👍";
  if (pct >= 50) return "Dovoljno 📖";
  return "Treba vježbati 💪";
}

function getScoreTailwind(pct) {
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

// ── Confetti (već postoji canvas-confetti u projektu) ─────────────────────────

function Confetti({ active }) {
  useEffect(() => {
    if (!active) return;
    import("canvas-confetti")
      .then((mod) => {
        mod.default({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.4 },
          colors: ["#2D54E8", "#22C55E", "#F97316", "#8B5CF6"],
        });
      })
      .catch(() => {});
  }, [active]);
  return null;
}

// ── Animated SVG score ring ───────────────────────────────────────────────────

function ScoreRing({ pct, colors }) {
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 250);
    return () => clearTimeout(t);
  }, [pct]);

  const SIZE = 164;
  const STROKE = 13;
  const r = (SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animPct / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={SIZE}
        height={SIZE}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          stroke={colors.ringBg}
          strokeWidth={STROKE}
        />
        {/* Progress */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          stroke={colors.ringFg}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </svg>
      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-4xl font-bold tabular-nums leading-none",
            colors.text,
          )}
        >
          {animPct}%
        </span>
        <span className="text-xs text-warm-400 font-semibold mt-1">
          rezultat
        </span>
      </div>
    </div>
  );
}

// ── Question review row (expandable) ─────────────────────────────────────────

function QuestionRow({ question, userAnswer, index }) {
  const [open, setOpen] = useState(false);

  const isCorrect = userAnswer === question.correct;
  const isSkipped = !userAnswer;

  const leftBorder = isSkipped
    ? "border-l-warm-300"
    : isCorrect
      ? "border-l-green-400"
      : "border-l-red-400";

  const StatusIcon = isSkipped ? Minus : isCorrect ? CheckCircle2 : XCircle;
  const statusIconClass = isSkipped
    ? "text-warm-400"
    : isCorrect
      ? "text-success-600"
      : "text-error-500";

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border border-warm-200 border-l-4 overflow-hidden bg-white",
        leftBorder,
      )}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-warm-50 transition-colors"
      >
        {/* Index bubble */}
        <span className="w-6 h-6 rounded-full bg-warm-100 border border-warm-200 text-xs font-bold text-warm-600 flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>

        <StatusIcon
          size={15}
          className={cn("flex-shrink-0", statusIconClass)}
        />

        {/* Question text — pitanje koristi q.text (ne q.question) */}
        <span className="flex-1 text-sm text-warm-800 font-medium truncate">
          {question.text}
        </span>

        {open ? (
          <ChevronUp size={14} className="text-warm-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-warm-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded options */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-warm-100 px-4 pb-3 pt-2 space-y-2">
              {question.options?.map((opt) => {
                const isUserPick = opt.id === userAnswer;
                const isCorrectOpt = opt.id === question.correct;

                return (
                  <div
                    key={opt.id}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm",
                      isCorrectOpt
                        ? "bg-success-50 border-green-200 text-success-700 font-semibold"
                        : isUserPick && !isCorrectOpt
                          ? "bg-error-50 border-red-200 text-error-600 font-semibold"
                          : "bg-warm-50 border-warm-200 text-warm-600",
                    )}
                  >
                    {/* Option letter */}
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        isCorrectOpt
                          ? "bg-success-100 text-success-700"
                          : isUserPick && !isCorrectOpt
                            ? "bg-error-100 text-error-600"
                            : "bg-warm-200 text-warm-500",
                      )}
                    >
                      {opt.id.toUpperCase()}
                    </span>

                    <span className="flex-1">{opt.text}</span>

                    {isCorrectOpt && (
                      <CheckCircle2
                        size={14}
                        className="text-success-600 flex-shrink-0"
                      />
                    )}
                    {isUserPick && !isCorrectOpt && (
                      <XCircle
                        size={14}
                        className="text-error-500 flex-shrink-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ResultsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const lastResult = useExamStore((s) => s.lastResult);

  // Redirect ako nema rezultata (direktan URL pristup)
  useEffect(() => {
    if (!lastResult || lastResult.examId !== examId) {
      navigate("/", { replace: true });
    }
  }, [lastResult, examId, navigate]);

  if (!lastResult || lastResult.examId !== examId) return null;

  const { questions, answers, elapsedSeconds } = lastResult;

  const subjectId = examId?.split("-")[0];
  const subject = SUBJECTS.find((s) => s.id === subjectId);

  const {
    correct,
    incorrect,
    skipped,
    totalPoints,
    maxPoints,
    percentage: pct,
  } = calculateScore(answers, questions);

  const colors = getScoreTailwind(pct);
  const label = getScoreLabel(pct);
  const elapsed = formatElapsed(elapsedSeconds);

  return (
    <PageWrapper className="max-w-2xl mx-auto">
      <Confetti active={pct >= 75} />

      {/* Back link */}
      <Link
        to={subject ? `/predmeti/${subject.id}` : "/"}
        className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Natrag na predmete
      </Link>

      {/* ── Hero card ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-6 mb-4 text-center shadow-card-md">
          {/* Subject pill */}
          {subject && (
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-6",
                subject.color.bg,
                subject.color.text,
                subject.color.border,
              )}
            >
              <subject.icon size={12} />
              {subject.name}
              <span className="text-warm-400 font-normal">·</span>
              {examId?.split("-")[1]}
              <span className="text-warm-400 font-normal">·</span>
              {examId?.includes("visa") ? "B razina" : "A razina"}
            </div>
          )}

          {/* Score ring */}
          <div className="flex justify-center mb-4">
            <ScoreRing pct={pct} colors={colors} />
          </div>

          {/* Verdict */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.35 }}
          >
            <p className="text-2xl font-bold text-warm-900 mb-1">{label}</p>
            <p className="text-sm text-warm-500">
              {totalPoints} / {maxPoints} bodova
            </p>
          </motion.div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-0 mt-6 pt-5 border-t border-warm-100">
            {[
              {
                icon: CheckCircle2,
                value: correct,
                label: "Točno",
                iconClass: "text-success-600",
              },
              {
                icon: XCircle,
                value: incorrect,
                label: "Netočno",
                iconClass: "text-error-500",
              },
              {
                icon: Minus,
                value: skipped,
                label: "Preskočeno",
                iconClass: "text-warm-400",
              },
              {
                icon: Clock,
                value: elapsed ?? "–",
                label: "Vrijeme",
                iconClass: "text-primary-500",
              },
            ].map(({ icon: Icon, value, label: lbl, iconClass }, i) => (
              <div
                key={lbl}
                className={cn(
                  "flex flex-col items-center gap-1 py-1",
                  i < 3 && "border-r border-warm-100",
                )}
              >
                <Icon size={15} className={cn("mb-0.5", iconClass)} />
                <span className="text-xl font-bold text-warm-900 tabular-nums">
                  {value}
                </span>
                <span className="text-xs text-warm-400 font-medium">{lbl}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex gap-2.5 mt-5">
            <Button
              variant="secondary"
              size="md"
              leftIcon={RotateCcw}
              className="flex-1"
              onClick={() => navigate(`/ispit/${examId}`)}
            >
              Ponovi ispit
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={Target}
              className="flex-1"
              onClick={() =>
                navigate(subject ? `/predmeti/${subject.id}` : "/")
              }
            >
              Drugi ispit
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ── Question review ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Legend + heading */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">
            Pregled odgovora
          </p>
          <div className="flex items-center gap-3 text-xs text-warm-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success-500 inline-block" />
              Točno
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error-500 inline-block" />
              Netočno
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warm-300 inline-block" />
              Preskočeno
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {questions.map((q, idx) => (
            <QuestionRow
              key={q.id}
              question={q}
              userAnswer={answers[q.id]}
              index={idx}
            />
          ))}
        </div>
      </motion.div>
    </PageWrapper>
  );
}
