// pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  BookOpen,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Trophy,
  TrendingUp,
  Target,
  Clock,
  Plus,
  BarChart2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Zap,
  Star,
  Play,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { SUBJECTS, EXAM_SESSIONS, DIFFICULTY_LEVELS } from "@/utils/constants";
import { useCurrentUser } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { attemptApi } from "@/api/attemptApi";
import { cn } from "@/utils/utils";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";

function useAttempts() {
  return useQuery({
    queryKey: ["user-attempts"],
    queryFn: () => attemptApi.getAll(),
    staleTime: 1000 * 60 * 3,
  });
}

function useSubjectStats() {
  return useQuery({
    queryKey: ["user-subject-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subject_stats")
        .select(
          "subject_id, attempts_count, avg_score_pct, best_score_pct, last_attempt_at",
        );
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

function getPctColor(pct) {
  if (pct == null) return "text-warm-400";
  if (pct >= 75) return "text-green-600";
  if (pct >= 50) return "text-amber-600";
  return "text-red-500";
}

function getPctBg(pct) {
  if (pct == null) return "bg-warm-100 text-warm-500";
  if (pct >= 75) return "bg-green-100 text-green-700";
  if (pct >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function getPctBarColor(pct) {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function sessionName(s) {
  return (
    EXAM_SESSIONS?.find((e) => e.id === s)?.name ??
    (s === "ljeto" ? "Ljetni" : s === "jesen" ? "Jesenski" : (s ?? ""))
  );
}

function levelName(level) {
  return DIFFICULTY_LEVELS?.find((d) => d.id === level)?.short ?? level ?? "";
}

function daysAgoLabel(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Danas";
  if (days === 1) return "Jučer";
  if (days < 7) return `Prije ${days} dana`;
  if (days < 30) return `Prije ${Math.floor(days / 7)} tj.`;
  return `Prije ${Math.floor(days / 30)} mj.`;
}

function computeStreak(completed) {
  if (!completed?.length) return 0;
  const days = new Set(
    completed
      .filter((a) => a.finished_at)
      .map((a) => new Date(a.finished_at).toDateString()),
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function computeWeekActivity(completed) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const count = (completed ?? []).filter(
      (a) =>
        a.finished_at && new Date(a.finished_at).toDateString() === dateStr,
    ).length;
    return count;
  });
}

// Animated count-up hook
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * target));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return val;
}

function Bone({ className }) {
  return (
    <div className={cn("bg-warm-200 rounded-xl animate-pulse", className)} />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Bone className="h-36 rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Bone key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Bone className="lg:col-span-2 h-64 rounded-2xl" />
        <Bone className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────────────────
function DashboardError({ onRetry }) {
  return (
    <div className="flex flex-col items-center py-20 gap-4 text-center">
      <AlertCircle size={36} className="text-warm-300" strokeWidth={1.5} />
      <p className="text-warm-700 font-semibold">
        Greška pri učitavanju podataka
      </p>
      <p className="text-warm-400 text-sm">
        Provjeri konekciju i pokušaj ponovo.
      </p>
      <Button variant="secondary" leftIcon={RefreshCw} onClick={onRetry}>
        Pokušaj ponovo
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO BANNER
// ─────────────────────────────────────────────────────────────────────────────
function HeroBanner({ user, streak, weekActivity, avgPct }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Dobro jutro" : hour < 18 ? "Dobar dan" : "Dobra večer";
  const DAYS = ["Po", "Ut", "Sr", "Čet", "Pet", "Sub", "Ned"];

  const maxCount = Math.max(...weekActivity, 1);
  const intensity = (count) => {
    if (count === 0) return "bg-white/10";
    const ratio = count / maxCount;
    if (ratio >= 0.75) return "bg-white";
    if (ratio >= 0.4) return "bg-white/60";
    return "bg-white/35";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-600 p-5 text-white">
      {/* Mesh texture */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-primary-200 text-sm font-medium">{greeting},</p>
          <h1 className="text-xl font-bold mt-0.5">
            {user?.name ?? "Korisnik"} 👋
          </h1>
          {avgPct > 0 && (
            <p className="text-primary-200 text-xs mt-1">
              Prosječni rezultat:{" "}
              <span className="text-white font-bold">{avgPct}%</span>
            </p>
          )}
        </div>

        {streak > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white/15 border border-white/20 backdrop-blur-sm px-3 py-2 rounded-xl"
          >
            <Flame size={15} className="text-orange-300" />
            <div className="text-right">
              <p className="text-sm font-black leading-none">{streak}</p>
              <p className="text-[10px] text-primary-200 leading-none mt-0.5">
                dan streak
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* 7-day activity */}
      <div className="relative mt-4 flex items-end gap-1.5">
        {weekActivity.map((count, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors",
                intensity(count),
                count > 0 ? "text-primary-700" : "text-primary-300",
              )}
            >
              {count > 0 ? count : DAYS[i][0]}
            </div>
            <span className="text-[9px] text-primary-300">{DAYS[i]}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-primary-300 self-end pb-1">
          Ova 7 dana
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  numericValue,
  label,
  iconCls,
  bgCls,
  trend,
}) {
  const animated = useCountUp(numericValue ?? 0);
  const display =
    numericValue != null
      ? typeof value === "string" && value.includes("%")
        ? `${animated}%`
        : animated
      : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-warm-200 shadow-card p-4"
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
          bgCls,
        )}
      >
        <Icon size={17} className={iconCls} />
      </div>
      <p className="text-2xl font-black text-warm-900 leading-none mb-1 tabular-nums">
        {display}
      </p>
      <p className="text-xs text-warm-500 font-medium">{label}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE — trend posljednjih N ispita
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ data, width = 120, height = 36 }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - 2 * pad);
    const y = pad + ((max - v) / range) * (height - 2 * pad);
    return `${x},${y}`;
  });

  const lastPt = points[points.length - 1].split(",");
  const trend = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={trend ? "#16A34A" : "#EF4444"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      <circle
        cx={lastPt[0]}
        cy={lastPt[1]}
        r={3}
        fill={trend ? "#16A34A" : "#EF4444"}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTEMPT ITEM
// ─────────────────────────────────────────────────────────────────────────────
function AttemptItem({ attempt, index }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === attempt.exam?.subject_id);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/ispit/${attempt.exam_id}`)}
      className="group flex items-center gap-3 py-2.5 border-b border-warm-100 last:border-0 cursor-pointer hover:bg-warm-50 -mx-2 px-2 rounded-xl transition-colors"
    >
      {/* Predmet ikona */}
      {subject ? (
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={14} className={subject.color.text} />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-warm-100 flex-shrink-0" />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warm-800 truncate">
          {subject?.shortName ?? attempt.exam?.subject_id}
          {attempt.exam?.year && (
            <span className="text-warm-500 font-normal">
              {" "}
              · {attempt.exam.year}.
            </span>
          )}
          {attempt.exam?.session && (
            <span className="text-warm-400 font-normal">
              {" "}
              {sessionName(attempt.exam.session)}
            </span>
          )}
        </p>
        <p className="text-xs text-warm-400">
          {daysAgoLabel(attempt.finished_at)}
        </p>
      </div>

      {/* Score pill */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            "text-xs font-black px-2 py-0.5 rounded-full",
            getPctBg(attempt.score_pct),
          )}
        >
          {attempt.score_pct != null ? `${attempt.score_pct}%` : "—"}
        </span>
        <ChevronRight
          size={14}
          className="text-warm-300 group-hover:text-warm-500 transition-colors"
        />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT CARD — za panel "Po predmetima"
// ─────────────────────────────────────────────────────────────────────────────
function SubjectCard({ stat, isBest }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === stat.subject_id);
  if (!subject) return null;

  const avg = stat.avg_score_pct ?? 0;
  const best = stat.best_score_pct ?? 0;

  return (
    <div
      onClick={() => navigate(`/predmeti/${stat.subject_id}`)}
      className="group cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
            subject.color.bg,
          )}
        >
          <subject.icon size={13} className={subject.color.text} />
        </div>
        <span className="text-sm font-semibold text-warm-800 flex-1 truncate group-hover:text-warm-900">
          {subject.shortName}
        </span>
        {isBest && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-0.5">
            <Star size={9} />
            Top
          </span>
        )}
        <span
          className={cn("text-xs font-black tabular-nums", getPctColor(avg))}
        >
          {avg}%
        </span>
      </div>

      {/* Dual bar: prosjek + best */}
      <div className="space-y-1">
        <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", getPctBarColor(avg))}
            initial={{ width: 0 }}
            animate={{ width: `${avg}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        {best > avg && (
          <div className="h-1 bg-warm-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-warm-300"
              initial={{ width: 0 }}
              animate={{ width: `${best}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-warm-400">
          {stat.attempts_count} {stat.attempts_count === 1 ? "ispit" : "ispita"}
        </span>
        {best > avg && (
          <span className="text-[10px] text-warm-400">
            Rekord:{" "}
            <span className={cn("font-bold", getPctColor(best))}>{best}%</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECENT TREND PANEL
// ─────────────────────────────────────────────────────────────────────────────
function TrendPanel({ recentAttempts }) {
  const sparkData = recentAttempts
    .slice()
    .reverse()
    .slice(0, 10)
    .map((a) => a.score_pct ?? 0);

  const latest = sparkData[sparkData.length - 1] ?? 0;
  const prev = sparkData[sparkData.length - 2] ?? null;
  const delta = prev != null ? latest - prev : null;
  const up = delta != null && delta >= 0;

  if (sparkData.length < 2) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-warm-50 rounded-xl border border-warm-200 mb-3">
      <div>
        <p className="text-xs font-bold text-warm-500 mb-0.5">
          Trend (zadnjih {sparkData.length})
        </p>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-lg font-black tabular-nums",
              getPctColor(latest),
            )}
          >
            {latest}%
          </span>
          {delta != null && (
            <span
              className={cn(
                "text-xs font-bold flex items-center gap-0.5",
                up ? "text-green-600" : "text-red-500",
              )}
            >
              <TrendingUp size={11} className={up ? "" : "rotate-180"} />
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          )}
        </div>
      </div>
      <Sparkline data={sparkData} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE za novog korisnika
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ onStart }) {
  return (
    <div className="text-center py-14 px-4">
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Zap size={28} className="text-primary-500" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-bold text-warm-900 mb-2">Kreni vježbati!</h2>
      <p className="text-sm text-warm-500 max-w-xs mx-auto mb-6 leading-relaxed">
        Ovdje ćeš vidjeti sve svoje rezultate, napredak po predmetima i
        statistike. Odaberi prvi ispit i počni.
      </p>
      <Button variant="primary" size="lg" leftIcon={Play} onClick={onStart}>
        Odaberi ispit
      </Button>
    </div>
  );
}

export function Dashboard() {
  usePageTitle(PAGE_TITLES.dashboard);
  const user = useCurrentUser();
  const navigate = useNavigate();

  const {
    data: attempts,
    isLoading: loadingAttempts,
    error: attemptsError,
    refetch,
  } = useAttempts();
  const {
    data: subjectStats,
    isLoading: loadingStats,
    error: statsError,
  } = useSubjectStats();

  const isLoading = loadingAttempts || loadingStats;
  const hasError = !!(attemptsError || statsError);

  if (isLoading)
    return (
      <PageWrapper>
        <DashboardSkeleton />
      </PageWrapper>
    );
  if (hasError)
    return (
      <PageWrapper>
        <DashboardError
          onRetry={() => {
            refetch();
            window.location.reload();
          }}
        />
      </PageWrapper>
    );

  const completed = (attempts ?? []).filter((a) => a.status === "completed");
  const totalExams = completed.length;
  const avgPct = totalExams
    ? Math.round(
        completed.reduce((s, a) => s + (a.score_pct ?? 0), 0) / totalExams,
      )
    : 0;
  const bestPct = totalExams
    ? Math.max(...completed.map((a) => a.score_pct ?? 0))
    : 0;
  const passedCount = completed.filter((a) => (a.score_pct ?? 0) >= 50).length;

  const streak = computeStreak(completed);
  const weekActivity = computeWeekActivity(completed);

  const recentAttempts = [...completed]
    .sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at))
    .slice(0, 6);

  const inProgress = (attempts ?? []).find((a) => a.status === "in_progress");

  const bestSubjectId = subjectStats?.length
    ? [...subjectStats].sort(
        (a, b) => (b.best_score_pct ?? 0) - (a.best_score_pct ?? 0),
      )[0]?.subject_id
    : null;

  // ── Prazna stranica za novog korisnika ─────────────────────────────────
  if (totalExams === 0) {
    return (
      <PageWrapper>
        <HeroBanner
          user={user}
          streak={0}
          weekActivity={weekActivity}
          avgPct={0}
        />
        <EmptyState onStart={() => navigate("/")} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <HeroBanner
        user={user}
        streak={streak}
        weekActivity={weekActivity}
        avgPct={avgPct}
      />

      {/* ── Nastavi od zadnjeg (ako postoji in_progress) ──────────────── */}
      {inProgress && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock size={15} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">Nedovršeni ispit</p>
            <p className="text-xs text-amber-700">
              Imaš ispit koji čeka na nastavak.
            </p>
          </div>
          <button
            onClick={() => navigate(`/ispit/${inProgress.exam_id}`)}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Play size={11} />
            Nastavi
          </button>
        </motion.div>
      )}

      {/* ── Stat kartice ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <StatCard
          icon={Trophy}
          value={totalExams}
          numericValue={totalExams}
          label="Riješenih ispita"
          iconCls="text-amber-500"
          bgCls="bg-amber-50"
        />
        <StatCard
          icon={Target}
          value={`${avgPct}%`}
          numericValue={avgPct}
          label="Prosječni rezultat"
          iconCls="text-primary-600"
          bgCls="bg-primary-50"
        />
        <StatCard
          icon={TrendingUp}
          value={`${bestPct}%`}
          numericValue={bestPct}
          label="Osobni rekord"
          iconCls="text-green-600"
          bgCls="bg-green-50"
        />
        <StatCard
          icon={CheckCircle2}
          value={passedCount}
          numericValue={passedCount}
          label="Položenih (≥50%)"
          iconCls="text-violet-600"
          bgCls="bg-violet-50"
        />
      </div>

      {/* ── Sadržaj: 2 kolumne ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Nedavni ispiti */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">
              Nedavni ispiti
            </p>
            {completed.length > 6 && (
              <button
                onClick={() => navigate("/rezultati")}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Svi <ArrowRight size={11} />
              </button>
            )}
          </div>

          {/* Trend panel */}
          {recentAttempts.length >= 2 && (
            <TrendPanel recentAttempts={recentAttempts} />
          )}

          {/* Lista */}
          {recentAttempts.map((attempt, i) => (
            <AttemptItem key={attempt.id} attempt={attempt} index={i} />
          ))}
        </Card>

        {/* Napredak po predmetima */}
        <Card className="p-5">
          <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-4">
            Po predmetima
          </p>

          {!subjectStats?.length ? (
            <div className="text-center py-8">
              <BarChart2
                size={24}
                className="text-warm-200 mx-auto mb-2"
                strokeWidth={1.5}
              />
              <p className="text-xs text-warm-400">
                Statistike će se pojaviti nakon prvog riješenog ispita.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...subjectStats]
                .sort(
                  (a, b) => (b.attempts_count ?? 0) - (a.attempts_count ?? 0),
                )
                .slice(0, 6)
                .map((stat) => (
                  <SubjectCard
                    key={stat.subject_id}
                    stat={stat}
                    isBest={stat.subject_id === bestSubjectId}
                  />
                ))}
            </div>
          )}

          {subjectStats && subjectStats.length > 0 && (
            <button
              onClick={() => navigate("/rezultati?tab=subjects")}
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Detaljna analiza <ArrowRight size={11} />
            </button>
          )}
        </Card>
      </div>

      {/* ── Quick action ─────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="primary" leftIcon={Plus} onClick={() => navigate("/")}>
          Novi ispit
        </Button>
        <Button
          variant="secondary"
          leftIcon={BarChart2}
          onClick={() => navigate("/rezultati")}
        >
          Sve statistike
        </Button>
      </div>
    </PageWrapper>
  );
}
