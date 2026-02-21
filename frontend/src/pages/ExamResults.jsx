import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
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

function Confetti({ active }) {
  useEffect(() => {
    if (!active) return;
    // Koristiti canvas-confetti ili mini implementacija
    import("canvas-confetti").then((confetti) => {
      confetti.default({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#2D54E8", "#22C55E", "#F97316", "#8B5CF6"],
      });
    });
  }, [active]);
  return null;
}

export function ResultsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { answers = {}, questions = [] } = location.state || {};

  const subjectId = examId?.split("-")[0];
  const subject = SUBJECTS.find((s) => s.id === subjectId);

  // Calculate results
  const results = questions.map((q) => ({
    ...q,
    userAnswer: answers[q.id] || null,
    isCorrect: answers[q.id] === q.correct,
  }));

  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.filter(
    (r) => r.userAnswer && !r.isCorrect,
  ).length;
  const skippedCount = results.filter((r) => !r.userAnswer).length;
  const totalPoints = results.reduce(
    (sum, q) => sum + (q.isCorrect ? q.points : 0),
    0,
  );
  const maxPoints = results.reduce((sum, q) => sum + q.points, 0);
  const pct =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
  const scoreColors = getScoreColor(pct);

  // Circular progress
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <PageWrapper>
      <Confetti active={pct >= 50} />
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to={subject ? `/predmeti/${subjectId}` : "/"}
          className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Natrag na ispite
        </Link>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Score hero card */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <svg width="140" height="140" viewBox="0 0 140 140">
                {/* Background ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  strokeWidth="10"
                  className="stroke-warm-200"
                />
                {/* Progress ring */}
                <motion.circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  className={scoreColors.ring}
                  transform="rotate(-90 70 70)"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
                {/* Center text */}
                <text
                  x="70"
                  y="62"
                  textAnchor="middle"
                  className="fill-warm-900"
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  {pct}%
                </text>
                <text
                  x="70"
                  y="82"
                  textAnchor="middle"
                  className="fill-warm-400"
                  style={{ fontSize: 12, fontFamily: "Plus Jakarta Sans" }}
                >
                  {totalPoints}/{maxPoints} bod.
                </text>
              </svg>
            </div>

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
              <div className="flex items-center justify-center gap-2 text-sm text-warm-500">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    `bg-gradient-to-r ${subject.color.gradient}`,
                  )}
                />
                {subject.name}
              </div>
            )}

            {/* Stat pills */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                {
                  icon: CheckCircle2,
                  value: correctCount,
                  label: "Točno",
                  color: "text-success-600 bg-success-50",
                },
                {
                  icon: XCircle,
                  value: incorrectCount,
                  label: "Netočno",
                  color: "text-error-600 bg-error-50",
                },
                {
                  icon: Clock,
                  value: skippedCount,
                  label: "Preskočeno",
                  color: "text-warm-500 bg-warm-100",
                },
              ].map(({ icon: Icon, value, label, color }) => (
                <div
                  key={label}
                  className={cn("rounded-xl p-2.5", color.split(" ")[1])}
                >
                  <Icon
                    size={14}
                    className={cn("mx-auto mb-1", color.split(" ")[0])}
                  />
                  <div className={cn("text-lg font-bold", color.split(" ")[0])}>
                    {value}
                  </div>
                  <div className="text-xs text-warm-500">{label}</div>
                </div>
              ))}
            </div>

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
                  navigate(subject ? `/predmeti/${subjectId}` : "/")
                }
              >
                Novi ispit
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Answer review */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-primary-600" />
            <h2 className="font-bold text-warm-800">Pregled odgovora</h2>
          </div>

          <div className="space-y-3">
            {results.map((result, idx) => (
              <motion.div key={result.id} variants={itemVariants}>
                <Card
                  className={cn(
                    "p-4 border-l-4",
                    result.isCorrect
                      ? "border-l-green-500"
                      : result.userAnswer
                        ? "border-l-red-400"
                        : "border-l-warm-300",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {result.isCorrect ? (
                        <CheckCircle2 size={18} className="text-success-600" />
                      ) : result.userAnswer ? (
                        <XCircle size={18} className="text-error-600" />
                      ) : (
                        <Clock size={18} className="text-warm-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-bold text-warm-500">
                          P{idx + 1}
                        </span>
                        {result.isCorrect ? (
                          <Badge variant="success" size="sm">
                            Točno
                          </Badge>
                        ) : result.userAnswer ? (
                          <Badge variant="error" size="sm">
                            Netočno
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Preskočeno
                          </Badge>
                        )}
                        <span className="text-xs text-warm-400">
                          {result.points} bod.
                        </span>
                      </div>

                      <p className="text-sm text-warm-700 line-clamp-2 mb-2">
                        {result.text}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {result.userAnswer && (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md font-semibold",
                              result.isCorrect
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700",
                            )}
                          >
                            Vaš: {result.userAnswer.toUpperCase()}
                          </span>
                        )}
                        {!result.isCorrect && (
                          <span className="px-2 py-0.5 rounded-md font-semibold bg-green-100 text-green-700">
                            Točno: {result.correct.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {results.length === 0 && (
              <div className="text-center py-16 text-warm-400">
                <p>Nema podataka za prikaz.</p>
                <Link
                  to="/"
                  className="text-primary-600 font-medium mt-2 inline-block text-sm"
                >
                  Idi na početnu
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
