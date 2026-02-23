import { useNavigate, useParams, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Card, CardContent } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { SUBJECTS } from "@/utils/constants";
import { calculateScore } from "@/utils/helpers";
import { useExamStore } from "@/store/examStore";
import { cn } from "@/utils/utils";

function getScoreColor(pct) {
  if (pct >= 75)
    return {
      text: "text-success-600",
      bg: "bg-success-50",
      border: "border-green-200",
      ring: "stroke-green-500",
    };
  if (pct >= 50)
    return {
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "stroke-amber-400",
    };
  return {
    text: "text-error-600",
    bg: "bg-error-50",
    border: "border-red-200",
    ring: "stroke-red-400",
  };
}

function getScoreLabel(pct) {
  if (pct >= 90) return "Izvrsno! 🏆";
  if (pct >= 75) return "Vrlo dobro! 🎉";
  if (pct >= 60) return "Dobro! 👍";
  if (pct >= 50) return "Dovoljno 📖";
  return "Treba vježbati 💪";
}

function formatElapsed(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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
      .catch(() => {}); // tiho ignoriraj ako modul nije instaliran
  }, [active]);
  return null;
}

export function ResultsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const lastResult = useExamStore((s) => s.lastResult);

  useEffect(() => {
    if (!lastResult || lastResult.examId !== examId) {
      navigate("/", { replace: true });
    }
  }, [lastResult, examId, navigate]);

  if (!lastResult || lastResult.examId !== examId) {
    return null; // useEffect će napraviti redirect
  }

  const { questions, answers, elapsedSeconds } = lastResult;

  const subjectId = examId?.split("-")[0];
  const subject = SUBJECTS.find((s) => s.id === subjectId);

  const score = calculateScore(answers, questions);
  const {
    correct,
    incorrect,
    skipped,
    totalPoints,
    maxPoints,
    percentage: pct,
  } = score;

  const scoreColors = getScoreColor(pct);
  const showConfetti = pct >= 75;

  // Circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <PageWrapper className="max-w-3xl mx-auto">
      <Confetti active={showConfetti} />

      {/* Back link */}
      <Link
        to={subject ? `/predmeti/${subject.id}` : "/"}
        className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-warm-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Natrag na predmet
      </Link>

      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-6 text-center mb-6">
          <CardContent>
            {/* Circular progress ring */}
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-warm-200"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  className={scoreColors.ring}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-2xl font-bold", scoreColors.text)}>
                  {pct}%
                </span>
              </div>
            </div>

            {/* Label + subject */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold mb-3",
                scoreColors.bg,
                scoreColors.text,
                scoreColors.border,
              )}
            >
              <Trophy size={14} />
              {getScoreLabel(pct)}
            </div>

            {subject && (
              <div className="flex items-center justify-center gap-2 text-sm text-warm-500 mb-5">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    `bg-gradient-to-r ${subject.color.gradient}`,
                  )}
                />
                {subject.name}
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  icon: CheckCircle2,
                  value: correct,
                  label: "Točno",
                  color: "text-success-600 bg-success-50",
                },
                {
                  icon: XCircle,
                  value: incorrect,
                  label: "Netočno",
                  color: "text-error-600 bg-error-50",
                },
                {
                  icon: Clock,
                  value: skipped,
                  label: "Preskočeno",
                  color: "text-warm-500 bg-warm-100",
                },
              ].map(({ icon: Icon, value, label, color }) => {
                const [textCls, bgCls] = color.split(" ");
                return (
                  <div key={label} className={cn("rounded-xl p-2.5", bgCls)}>
                    <Icon size={14} className={cn("mx-auto mb-1", textCls)} />
                    <div className={cn("text-lg font-bold", textCls)}>
                      {value}
                    </div>
                    <div className="text-xs text-warm-500">{label}</div>
                  </div>
                );
              })}
            </div>

            {/* Points + elapsed time */}
            <div className="flex justify-center gap-4 mt-4 text-sm text-warm-500">
              <span>
                <span className="font-semibold text-warm-900">
                  {totalPoints}
                </span>
                /{maxPoints} bodova
              </span>
              {elapsedSeconds && (
                <span>
                  <TrendingUp size={12} className="inline mr-1" />
                  {formatElapsed(elapsedSeconds)} min
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-2 mt-5">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={RotateCcw}
                className="flex-1"
                onClick={() => navigate(`/ispit/${examId}`)}
              >
                Ponovi
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Target}
                className="flex-1"
                onClick={() =>
                  navigate(subject ? `/predmeti/${subject.id}` : "/")
                }
              >
                Drugi ispit
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Per-question review */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3"
      >
        <h2 className="text-sm font-bold text-warm-500 uppercase tracking-wider mb-3">
          Pregled odgovora
        </h2>
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correct;
          const isSkipped = !userAnswer;

          return (
            <Card
              key={q.id}
              className={cn(
                "p-4 border-l-4",
                isCorrect
                  ? "border-l-green-400"
                  : isSkipped
                    ? "border-l-warm-300"
                    : "border-l-red-400",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-warm-400">
                      Pitanje {idx + 1}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        isCorrect
                          ? "text-success-600 border-green-200 bg-success-50"
                          : isSkipped
                            ? "text-warm-500 border-warm-200"
                            : "text-error-600 border-red-200 bg-error-50",
                      )}
                    >
                      {isCorrect
                        ? "Točno"
                        : isSkipped
                          ? "Preskočeno"
                          : "Netočno"}
                    </Badge>
                  </div>
                  <p className="text-sm text-warm-800 mb-2">{q.text}</p>
                  <div className="space-y-1 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded-lg",
                          opt.id === q.correct &&
                            "bg-green-50 text-green-700 font-medium",
                          opt.id === userAnswer &&
                            !isCorrect &&
                            "bg-red-50 text-red-700",
                        )}
                      >
                        <span className="font-bold uppercase w-4">
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                        {opt.id === q.correct && (
                          <CheckCircle2
                            size={12}
                            className="ml-auto text-green-600"
                          />
                        )}
                        {opt.id === userAnswer && !isCorrect && (
                          <XCircle size={12} className="ml-auto text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </motion.div>
    </PageWrapper>
  );
}
