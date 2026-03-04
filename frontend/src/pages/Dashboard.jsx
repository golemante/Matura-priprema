// pages/Dashboard.jsx
// Personalizirana početna stranica za prijavljene korisnike.
// TODO: Streak, RecentAttempts i SubjectProgress trebaju prave API pozive.
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Flame,
  BookOpen,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Trophy,
  TrendingUp,
  BarChart2,
  Target,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { SUBJECTS } from "@/utils/constants";
import { useCurrentUser } from "@/hooks/useAuth";
import { cn } from "@/utils/utils";

// ── Mock data (zamijeniti s API pozivima) ─────────────────────────────────────

const STREAK_DAYS = 5;

// Zadnjih 7 dana aktivnosti (true = bio aktivan)
const WEEK_ACTIVITY = [true, false, true, true, true, false, true];

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
  {
    examId: "fizika-2022-jesenski-osnovna",
    subjectId: "fizika",
    year: 2022,
    level: "A razina",
    pct: 50,
    daysAgo: 7,
  },
];

const SUBJECT_PROGRESS = [
  { subjectId: "matematika", attempts: 8, avg: 74, trend: +6 },
  { subjectId: "engleski", attempts: 5, avg: 90, trend: +3 },
  { subjectId: "hrvatski", attempts: 3, avg: 77, trend: -2 },
  { subjectId: "fizika", attempts: 2, avg: 50, trend: 0 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPctColor(pct) {
  if (pct >= 75) return "text-success-600";
  if (pct >= 50) return "text-amber-600";
  return "text-error-600";
}

function getPctBarColor(pct) {
  if (pct >= 75) return "bg-success-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-error-500";
}

function daysAgoLabel(n) {
  if (n === 0) return "Danas";
  if (n === 1) return "Jučer";
  return `Prije ${n} dana`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Dobro jutro";
  if (h < 18) return "Dobar dan";
  return "Dobra večer";
}

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

// Tjedni calendar dots (aktivnost)
function WeekActivity({ days }) {
  const labels = ["P", "U", "S", "Č", "P", "S", "N"];
  return (
    <div className="flex items-center gap-1.5">
      {days.map((active, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-7 h-7 rounded-lg border flex items-center justify-center transition-colors",
              active
                ? "bg-primary-100 border-primary-300"
                : "bg-warm-100 border-warm-200",
            )}
          >
            {active && <div className="w-2 h-2 rounded-full bg-primary-500" />}
          </div>
          <span className="text-[10px] text-warm-400 font-semibold">
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// Hero greeting banner s gradientom
function HeroBanner({ user, streak }) {
  const firstName = user?.name?.split(" ")[0] ?? "učeniče";
  const greeting = getGreeting();

  return (
    <Card className="p-6 mb-5 bg-gradient-to-br from-primary-50 to-indigo-50 border-primary-100 overflow-hidden relative">
      {/* Dekorativni krug */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-100 opacity-50 pointer-events-none" />

      <div className="relative">
        <p className="text-sm font-semibold text-primary-600 mb-0.5">
          {greeting}, {firstName}! 👋
        </p>
        <h1 className="text-xl font-bold text-warm-900 mb-4">
          Nastavi s pripremom za maturu
        </h1>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Streak pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200">
            <Flame size={14} className="text-accent-500" />
            <span className="text-sm font-bold text-orange-700">
              {streak} dana zaredom
            </span>
          </div>

          {/* Week dots */}
          <WeekActivity days={WEEK_ACTIVITY} />
        </div>
      </div>
    </Card>
  );
}

// Animated progress bar za subject
function SubjectProgressBar({ subjectId, avg, attempts, trend }) {
  const [animWidth, setAnimWidth] = useState(0);
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  if (!subject) return null;

  useEffect(() => {
    const t = setTimeout(() => setAnimWidth(avg), 300);
    return () => clearTimeout(t);
  }, [avg]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <subject.icon size={13} className={subject.color.text} />
          <span className="text-xs font-semibold text-warm-700">
            {subject.shortName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {trend !== 0 && (
            <Badge
              variant="outline"
              size="sm"
              className={cn(
                "px-1.5 py-0 text-xs",
                trend > 0
                  ? "text-success-600 border-green-200 bg-success-50"
                  : "text-error-600 border-red-200 bg-error-50",
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
            </Badge>
          )}
          <span className={cn("text-xs font-bold", getPctColor(avg))}>
            {avg}%
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getPctBarColor(avg))}
          initial={{ width: 0 }}
          animate={{ width: `${animWidth}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-warm-400 mt-0.5">{attempts} pokušaja</p>
    </div>
  );
}

// Recent attempt red
function AttemptRow({ attempt }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === attempt.subjectId);

  return (
    <motion.div
      variants={itemVariants}
      onClick={() => navigate(`/ispit/${attempt.examId}`)}
      className="flex items-center gap-3 py-2.5 border-b border-warm-100 last:border-0 group cursor-pointer"
    >
      {/* Subject icon */}
      {subject && (
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={16} className={subject.color.text} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warm-900 truncate">
          {subject?.name ?? attempt.subjectId} {attempt.year} · {attempt.level}
        </p>
        <p className="text-xs text-warm-400 mt-0.5">
          {daysAgoLabel(attempt.daysAgo)}
        </p>
      </div>

      {/* Score + action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            getPctColor(attempt.pct),
          )}
        >
          {attempt.pct}%
        </span>
        <ChevronRight
          size={15}
          className="text-warm-300 group-hover:text-warm-500 transition-colors"
        />
      </div>
    </motion.div>
  );
}

// Stat kartica (gore u griду)
function StatCard({ icon: Icon, value, label, iconClass, bgClass }) {
  return (
    <Card className="p-4">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
          bgClass,
        )}
      >
        <Icon size={17} className={iconClass} />
      </div>
      <p className="text-2xl font-bold text-warm-900 leading-none mb-1">
        {value}
      </p>
      <p className="text-xs text-warm-500 font-medium">{label}</p>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Dashboard() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  // Aggregate stats iz mock podataka
  const totalExams = RECENT_ATTEMPTS.length;
  const avgPct = totalExams
    ? Math.round(RECENT_ATTEMPTS.reduce((s, a) => s + a.pct, 0) / totalExams)
    : 0;
  const bestPct = totalExams
    ? Math.max(...RECENT_ATTEMPTS.map((a) => a.pct))
    : 0;

  return (
    <PageWrapper>
      {/* Hero banner */}
      <HeroBanner user={user} streak={STREAK_DAYS} />

      {/* ── Stat kartice ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={BookOpen}
          value={totalExams}
          label="Riješenih ispita"
          iconClass="text-primary-600"
          bgClass="bg-primary-50"
        />
        <StatCard
          icon={TrendingUp}
          value={`${avgPct}%`}
          label="Prosječan rezultat"
          iconClass="text-success-600"
          bgClass="bg-success-50"
        />
        <StatCard
          icon={Trophy}
          value={`${bestPct}%`}
          label="Najbolji rezultat"
          iconClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <StatCard
          icon={Flame}
          value={STREAK_DAYS}
          label="Streak dana"
          iconClass="text-accent-500"
          bgClass="bg-orange-50"
        />
      </div>

      {/* ── Content grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column (2/3) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recent attempts */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">
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
                  Još nema riješenih ispita.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/")}
                >
                  Počni s prvim ispitom
                </Button>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {RECENT_ATTEMPTS.map((attempt) => (
                  <AttemptRow key={attempt.examId} attempt={attempt} />
                ))}
              </motion.div>
            )}
          </Card>

          {/* Quick start */}
          <Card className="p-5">
            <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-3">
              Brzi start
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUBJECTS.filter((s) => s.isPopular).map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/predmeti/${s.id}`)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-card-md",
                    s.color.bg,
                    s.color.border,
                  )}
                >
                  <s.icon size={14} className={s.color.text} />
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
        </div>

        {/* ── Right column (1/3) ─────────────────────────── */}
        <div className="space-y-5">
          {/* Subject progress */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={14} className="text-amber-500" />
              <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">
                Napredak
              </p>
            </div>

            {SUBJECT_PROGRESS.length === 0 ? (
              <p className="text-xs text-warm-400 text-center py-4">
                Nema podataka. Riješi barem jedan ispit.
              </p>
            ) : (
              <div className="space-y-4">
                {SUBJECT_PROGRESS.map((sp) => (
                  <SubjectProgressBar key={sp.subjectId} {...sp} />
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              rightIcon={ChevronRight}
              className="w-full mt-4 text-warm-500"
              onClick={() => navigate("/rezultati")}
            >
              Detaljna statistika
            </Button>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
