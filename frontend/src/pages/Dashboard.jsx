// pages/Dashboard.jsx
// Personalizirana početna stranica za prijavljene korisnike.
// TODO: Streak, RecentAttempts i SubjectProgress trebaju prave API pozive.
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame,
  BookOpen,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { SUBJECTS } from "@/utils/constants";
import { useCurrentUser } from "@/hooks/useAuth";
import { cn } from "@/utils/utils";

// ── Mock data (zamijeniti s API pozivima) ─────────────────────────
const STREAK_DAYS = 5;

const RECENT_ATTEMPTS = [
  {
    examId: "matematika-2024-ljetni-visa",
    subjectId: "matematika",
    year: 2024,
    level: "B razina",
    pct: 82,
    daysAgo: 0,
  },
  {
    examId: "engleski-2023-ljetni-osnovna",
    subjectId: "engleski",
    year: 2023,
    level: "A razina",
    pct: 93,
    daysAgo: 2,
  },
  {
    examId: "hrvatski-2024-ljetni-osnovna",
    subjectId: "hrvatski",
    year: 2024,
    level: "A razina",
    pct: 77,
    daysAgo: 4,
  },
];

const SUBJECT_PROGRESS = [
  { subjectId: "matematika", attempts: 8, avg: 74, trend: +6 },
  { subjectId: "engleski", attempts: 5, avg: 90, trend: +3 },
  { subjectId: "hrvatski", attempts: 3, avg: 77, trend: -2 },
  { subjectId: "fizika", attempts: 2, avg: 50, trend: 0 },
];

// ── Helpers ──────────────────────────────────────────────────────
function getPctColor(pct) {
  if (pct >= 75) return "text-success-600";
  if (pct >= 50) return "text-amber-600";
  return "text-error-600";
}

function daysAgoLabel(n) {
  if (n === 0) return "Danas";
  if (n === 1) return "Jučer";
  return `Prije ${n} dana`;
}

// ── Sub-components ────────────────────────────────────────────────

function StreakCard({ days }) {
  return (
    <Card className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-amber-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
            Trenutni streak
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-warm-900">{days}</span>
            <span className="text-base text-warm-500 mb-1">dana zaredom</span>
          </div>
          <p className="text-xs text-warm-400 mt-1">
            Nastavi svaki dan da ne izgubišstrak!
          </p>
        </div>
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
          <Flame size={30} className="text-orange-500" />
        </div>
      </div>
    </Card>
  );
}

function QuickStartCard() {
  const navigate = useNavigate();
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">
        Brzi start
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SUBJECTS.filter((s) => s.isPopular).map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(`/predmeti/${s.id}`)}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-sm",
              s.color.bg,
              s.color.border,
            )}
          >
            <s.icon size={15} className={s.color.text} />
            <span className={cn("text-xs font-semibold", s.color.text)}>
              {s.shortName}
            </span>
          </button>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        rightIcon={ArrowRight}
        className="w-full mt-3"
        onClick={() => navigate("/")}
      >
        Svi predmeti
      </Button>
    </Card>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

// ── Page ──────────────────────────────────────────────────────────
export function Dashboard() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <PageHeader
        title={`Zdravo, ${user?.name?.split(" ")[0] ?? "učeniče"}! 👋`}
        subtitle="Nastavi s pripremom za maturu"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Streak + Quick start */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StreakCard days={STREAK_DAYS} />
            <QuickStartCard />
          </div>

          {/* Recent attempts */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Nedavni ispiti
              </p>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={ChevronRight}
                onClick={() => navigate("/rezultati")}
              >
                Svi rezultati
              </Button>
            </div>

            {RECENT_ATTEMPTS.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={28} className="text-warm-300 mx-auto mb-2" />
                <p className="text-sm text-warm-400">
                  Još nisi riješio nijedan ispit.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/")}
                >
                  Počni odmah
                </Button>
              </div>
            ) : (
              <motion.div
                className="space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {RECENT_ATTEMPTS.map((attempt) => {
                  const subject = SUBJECTS.find(
                    (s) => s.id === attempt.subjectId,
                  );
                  return (
                    <motion.div
                      key={attempt.examId}
                      variants={itemVariants}
                      className="flex items-center gap-3 p-3 rounded-xl border border-warm-200 hover:border-warm-300 hover:bg-warm-50 transition-all group cursor-pointer"
                      onClick={() => navigate(`/ispit/${attempt.examId}`)}
                    >
                      {subject && (
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                            subject.color.bg,
                          )}
                        >
                          <subject.icon
                            size={16}
                            className={subject.color.text}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-warm-900 truncate">
                          {subject?.name} · {attempt.year}
                        </p>
                        <p className="text-xs text-warm-400">
                          {attempt.level} · {daysAgoLabel(attempt.daysAgo)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-bold flex-shrink-0",
                          getPctColor(attempt.pct),
                        )}
                      >
                        {attempt.pct}%
                      </span>
                      <Button variant="ghost" size="icon" title="Ponovi">
                        <RotateCcw size={14} className="text-warm-400" />
                      </Button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </Card>
        </div>

        {/* ── Right column ────────────────────────────────── */}
        <div className="space-y-4">
          {/* Subject progress */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={14} className="text-amber-500" />
              <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide">
                Napredak
              </p>
            </div>

            {SUBJECT_PROGRESS.length === 0 ? (
              <p className="text-xs text-warm-400 text-center py-4">
                Nema podataka. Riješi barem jedan ispit.
              </p>
            ) : (
              <div className="space-y-4">
                {SUBJECT_PROGRESS.map((sp) => {
                  const subject = SUBJECTS.find((s) => s.id === sp.subjectId);
                  if (!subject) return null;
                  return (
                    <div key={sp.subjectId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <subject.icon
                            size={13}
                            className={subject.color.text}
                          />
                          <span className="text-xs font-semibold text-warm-700">
                            {subject.shortName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              getPctColor(sp.avg),
                            )}
                          >
                            {sp.avg}%
                          </span>
                          {sp.trend !== 0 && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-1.5 py-0",
                                sp.trend > 0
                                  ? "text-green-600 border-green-200 bg-green-50"
                                  : "text-red-500 border-red-200 bg-red-50",
                              )}
                            >
                              {sp.trend > 0 ? "+" : ""}
                              {sp.trend}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            sp.avg >= 75
                              ? "bg-green-500"
                              : sp.avg >= 50
                                ? "bg-amber-400"
                                : "bg-red-400",
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${sp.avg}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-xs text-warm-400 mt-0.5">
                        {sp.attempts} pokušaja
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
