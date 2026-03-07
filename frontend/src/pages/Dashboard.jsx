// pages/Dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI v2:
//
//  BUG #6 — Nedostajao error state za useAttempts / useSubjectStats
//  ─────────────────────────────────────────────────────────────────────────
//  Ako Supabase vrati grešku (npr. expired token, RLS problem), queries
//  bi tiho failali s error=truthy ali data=undefined.
//  Render bi dalje pokušao mapirati undefined → crash bez error boundary.
//
//  Ispravak: extractamo error iz oba querija i prikazujemo error state.
//
//  BUG #7 — Skeleton nije odgovarao stvarnoj strukturi dashboarda
//  ─────────────────────────────────────────────────────────────────────────
//  DashboardSkeleton je bio 3 gruba rectangla koji ne odgovaraju layoutu.
//  Novo: skeleton s HeroBanner + 4 stat kartice + 2 kolumne sadržaja,
//  s unutarnjim detaljima koji odgovaraju pravim komponentama.
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { SUBJECTS, EXAM_SESSIONS, DIFFICULTY_LEVELS } from "@/utils/constants";
import { useCurrentUser } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { attemptApi } from "@/api/attemptApi";
import { cn } from "@/utils/utils";

// ── API hooks ─────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPctColor(pct) {
  if (!pct && pct !== 0) return "text-warm-400";
  if (pct >= 75) return "text-success-600";
  if (pct >= 50) return "text-amber-600";
  return "text-error-600";
}

function getPctBarColor(pct) {
  if (pct >= 75) return "bg-success-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-error-500";
}

function sessionName(s) {
  if (s === "ljeto" || s === "ljetni") return "Ljetni";
  if (s === "jesen" || s === "jesenski") return "Jesenski";
  return s ?? "";
}

function levelName(level) {
  return DIFFICULTY_LEVELS.find((d) => d.id === level)?.short ?? level ?? "";
}

function daysAgoLabel(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Danas";
  if (days === 1) return "Jučer";
  return `Prije ${days} dana`;
}

// ── Streak + week activity računanje ─────────────────────────────────────────

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
    return (completed ?? []).some(
      (a) =>
        a.finished_at && new Date(a.finished_at).toDateString() === dateStr,
    );
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Bone({ className }) {
  return (
    <div className={cn("bg-warm-200 rounded-lg animate-pulse", className)} />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Hero banner skeleton — odgovara stvarnom HeroBanner dimenzijama */}
      <div className="bg-warm-200 rounded-2xl p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <Bone className="h-3 w-20 bg-warm-300" />
            <Bone className="h-6 w-32 bg-warm-300" />
          </div>
          <Bone className="h-8 w-20 rounded-xl bg-warm-300" />
        </div>
        {/* Tjedna aktivnost */}
        <div className="flex items-center gap-1.5 mt-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Bone className="w-7 h-7 rounded-lg bg-warm-300" />
              <Bone className="h-2 w-4 bg-warm-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Stat kartice — 4 kolumne */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-warm-200 p-4 space-y-3 animate-pulse"
          >
            <Bone className="h-9 w-9 rounded-xl" />
            <div className="space-y-1.5">
              <Bone className="h-7 w-12" />
              <Bone className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* 2 kolumne sadržaja */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lijevo: nedavni ispiti (2 od 3 kolumni) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-warm-200 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <Bone className="h-4 w-28" />
            <Bone className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 border-b border-warm-100 last:border-0"
              >
                <Bone className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Bone className="h-3.5 w-36" />
                  <Bone className="h-3 w-24" />
                </div>
                <Bone className="h-5 w-10 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Desno: napredak po predmetima */}
        <div className="bg-white rounded-2xl border border-warm-200 p-5 animate-pulse">
          <Bone className="h-4 w-24 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bone className="h-7 w-7 rounded-lg flex-shrink-0" />
                    <Bone className="h-3.5 w-20" />
                  </div>
                  <Bone className="h-3.5 w-8" />
                </div>
                <Bone className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function DashboardError({ onRetry }) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={24} className="text-red-400" />
      </div>
      <h2 className="text-warm-800 font-bold text-lg mb-2">
        Greška pri učitavanju dashboarda
      </h2>
      <p className="text-warm-500 text-sm mb-6 max-w-sm mx-auto">
        Podaci se nisu mogli učitati. Provjeri konekciju i pokušaj ponovo.
      </p>
      <Button variant="secondary" leftIcon={RefreshCw} onClick={onRetry}>
        Pokušaj ponovo
      </Button>
    </div>
  );
}

// ── Hero banner ───────────────────────────────────────────────────────────────
function HeroBanner({ user, streak, weekActivity }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Dobro jutro," : hour < 18 ? "Dobar dan," : "Dobra večer,";

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-primary-200 text-sm font-medium mb-0.5">
            {greeting}
          </p>
          <h1 className="text-xl font-bold">{user?.name ?? "Korisnik"} 👋</h1>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
            <Flame size={16} className="text-orange-300" />
            <span className="text-sm font-bold">{streak} dana</span>
          </div>
        )}
      </div>

      {/* Tjedna aktivnost */}
      <div className="flex items-center gap-1.5 mt-4">
        {["Po", "Ut", "Sr", "Čet", "Pet", "Sub", "Ned"].map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold",
                weekActivity[i]
                  ? "bg-white text-primary-700"
                  : "bg-white/10 text-primary-300",
              )}
            >
              {weekActivity[i] ? <CheckCircle2 size={12} /> : day[0]}
            </div>
            <span className="text-[9px] text-primary-300">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat kartica ──────────────────────────────────────────────────────────────
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

// ── Attempt item ──────────────────────────────────────────────────────────────
function AttemptItem({ attempt }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === attempt.exam?.subject_id);

  return (
    <motion.div
      layout
      onClick={() => navigate(`/ispit/${attempt.exam_id}`)}
      className="group flex items-center gap-3 py-2.5 border-b border-warm-100 last:border-0 cursor-pointer hover:bg-warm-50 -mx-2 px-2 rounded-xl transition-colors"
    >
      {subject && (
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={14} className={subject.color.text} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warm-800 truncate">
          {subject?.shortName ?? attempt.exam?.subject_id} ·{" "}
          {attempt.exam?.year}. · {sessionName(attempt.exam?.session)} ·{" "}
          {levelName(attempt.exam?.level)}
        </p>
        <p className="text-xs text-warm-400">
          {daysAgoLabel(attempt.finished_at)}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn("text-sm font-bold", getPctColor(attempt.score_pct))}
        >
          {attempt.score_pct ?? "—"}%
        </span>
        <ChevronRight
          size={15}
          className="text-warm-300 group-hover:text-warm-500 transition-colors"
        />
      </div>
    </motion.div>
  );
}

// ── Napredak po predmetu ──────────────────────────────────────────────────────
function SubjectProgressItem({ stat }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === stat.subject_id);
  if (!subject) return null;

  return (
    <div
      onClick={() => navigate(`/predmeti/${stat.subject_id}`)}
      className="group cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
              subject.color.bg,
            )}
          >
            <subject.icon size={13} className={subject.color.text} />
          </div>
          <span className="text-sm font-semibold text-warm-800">
            {subject.shortName}
          </span>
        </div>
        <span
          className={cn("text-xs font-bold", getPctColor(stat.avg_score_pct))}
        >
          ∅ {stat.avg_score_pct ?? "—"}%
        </span>
      </div>
      <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stat.avg_score_pct ?? 0}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            getPctBarColor(stat.avg_score_pct ?? 0),
          )}
        />
      </div>
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────
export function Dashboard() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  const {
    data: attempts,
    isLoading: loadingAttempts,
    error: attemptsError,
    refetch: refetchAttempts,
  } = useAttempts();

  const {
    data: subjectStats,
    isLoading: loadingStats,
    error: statsError,
  } = useSubjectStats();

  const isLoading = loadingAttempts || loadingStats;
  const hasError = !!(attemptsError || statsError);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageWrapper>
        <DashboardSkeleton />
      </PageWrapper>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (hasError) {
    return (
      <PageWrapper>
        <DashboardError
          onRetry={() => {
            refetchAttempts();
            window.location.reload();
          }}
        />
      </PageWrapper>
    );
  }

  // ── Agregirane vrijednosti ────────────────────────────────────────────────
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

  const recentAttempts = completed
    .sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at))
    .slice(0, 5);

  return (
    <PageWrapper>
      {/* Hero banner */}
      <HeroBanner user={user} streak={streak} weekActivity={weekActivity} />

      {/* Stat kartice */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <StatCard
          icon={Trophy}
          value={totalExams}
          label="Riješenih ispita"
          iconClass="text-amber-500"
          bgClass="bg-amber-50"
        />
        <StatCard
          icon={Target}
          value={`${avgPct}%`}
          label="Prosječni rezultat"
          iconClass="text-primary-600"
          bgClass="bg-primary-50"
        />
        <StatCard
          icon={TrendingUp}
          value={`${bestPct}%`}
          label="Najbolji rezultat"
          iconClass="text-success-600"
          bgClass="bg-success-50"
        />
        <StatCard
          icon={Clock}
          value={passedCount}
          label="Položenih (≥50%)"
          iconClass="text-violet-600"
          bgClass="bg-violet-50"
        />
      </div>

      {/* Sadržaj: 2 kolumne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Nedavni ispiti */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">
              Nedavni ispiti
            </p>
            {completed.length > 5 && (
              <button
                onClick={() => navigate("/rezultati")}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Svi ispiti
                <ArrowRight size={11} />
              </button>
            )}
          </div>

          {recentAttempts.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen size={28} className="text-warm-300 mx-auto mb-2" />
              <p className="text-sm text-warm-400 mb-4">
                Još nema riješenih ispita.
              </p>
              <Button
                variant="primary"
                leftIcon={Plus}
                onClick={() => navigate("/")}
              >
                Odaberi ispit
              </Button>
            </div>
          ) : (
            recentAttempts.map((attempt) => (
              <AttemptItem key={attempt.id} attempt={attempt} />
            ))
          )}
        </Card>

        {/* Napredak po predmetima */}
        <Card className="p-5">
          <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-4">
            Po predmetima
          </p>

          {!subjectStats || subjectStats.length === 0 ? (
            <div className="text-center py-10">
              <BarChart2 size={24} className="text-warm-300 mx-auto mb-2" />
              <p className="text-sm text-warm-400">
                Statistike će se pojaviti nakon prvog riješenog ispita.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subjectStats
                .sort(
                  (a, b) => (b.attempts_count ?? 0) - (a.attempts_count ?? 0),
                )
                .slice(0, 6)
                .map((stat) => (
                  <SubjectProgressItem key={stat.subject_id} stat={stat} />
                ))}
            </div>
          )}

          {subjectStats && subjectStats.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4"
              rightIcon={ArrowRight}
              onClick={() => navigate("/rezultati?tab=subjects")}
            >
              Detaljna analiza
            </Button>
          )}
        </Card>
      </div>

      {/* Quick action */}
      <div className="mt-5">
        <Button
          variant="primary"
          size="lg"
          leftIcon={Plus}
          onClick={() => navigate("/")}
          className="w-full sm:w-auto"
        >
          Odaberi novi ispit
        </Button>
      </div>
    </PageWrapper>
  );
}
