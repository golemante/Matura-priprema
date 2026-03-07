// pages/Dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// KOMPLETNI REWRITE — mock podaci zamijenjeni pravim Supabase upitima:
//   • attempts: attemptApi.getAll() → completed attempts za prikaz
//   • subjectStats: user_subject_stats VIEW → aggregated po predmetu
//   • streak: lokalno računamo iz finished_at datuma completed pokušaja
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

// ── Streak računanje ──────────────────────────────────────────────────────────
// Broji koliko uzastopnih dana (do danas) korisnik je imao barem jedan completed attempt
function computeStreak(completedAttempts) {
  if (!completedAttempts.length) return 0;

  const days = new Set(
    completedAttempts.map(
      (a) => new Date(a.finished_at).toISOString().split("T")[0],
    ),
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (days.has(key)) {
      streak++;
    } else if (i > 0) {
      break; // Prekinut niz
    }
  }

  return streak;
}

// Zadnjih 7 dana aktivnosti (true/false)
function computeWeekActivity(completedAttempts) {
  const days = new Set(
    completedAttempts.map(
      (a) => new Date(a.finished_at).toISOString().split("T")[0],
    ),
  );

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return days.has(d.toISOString().split("T")[0]);
  });
}

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

function formatElapsed(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  return `${m} min`;
}

function daysAgoLabel(finishedAt) {
  if (!finishedAt) return "";
  const diff = Math.floor((Date.now() - new Date(finishedAt)) / 86400000);
  if (diff === 0) return "Danas";
  if (diff === 1) return "Jučer";
  return `Prije ${diff} dana`;
}

function sessionName(session) {
  return EXAM_SESSIONS.find((s) => s.id === session)?.name ?? session ?? "";
}

function levelName(level) {
  return DIFFICULTY_LEVELS.find((d) => d.id === level)?.short ?? level ?? "";
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
      {/* Banner skeleton */}
      <Bone className="h-24 rounded-2xl" />
      {/* Stat kartice */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Bone className="lg:col-span-2 h-64 rounded-2xl" />
        <Bone className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Hero banner ───────────────────────────────────────────────────────────────
function HeroBanner({ user, streak, weekActivity }) {
  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 mb-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-primary-200 text-sm font-medium mb-0.5">
            Dobro jutro,
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
              {weekActivity[i] ? "✓" : day[0]}
            </div>
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

// ── Redak pokušaja ────────────────────────────────────────────────────────────
function AttemptItem({ attempt }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === attempt.exam?.subject_id);

  return (
    <motion.div
      whileHover={{ x: 2 }}
      onClick={() => navigate(`/ispit/${attempt.exam_id}`)}
      className="group flex items-center gap-3 py-3 border-b border-warm-100 last:border-0 cursor-pointer"
    >
      {subject && (
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={15} className={subject.color.text} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warm-900 truncate">
          {subject?.shortName} · {attempt.exam?.year}. ·{" "}
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
      className="group flex items-center gap-3 py-3 border-b border-warm-100 last:border-0 cursor-pointer"
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          subject.color.bg,
        )}
      >
        <subject.icon size={15} className={subject.color.text} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-warm-800">
            {subject.shortName}
          </span>
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
      <ChevronRight
        size={14}
        className="text-warm-300 group-hover:text-warm-500 flex-shrink-0"
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function Dashboard() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  const { data: attempts, isLoading: loadingAttempts } = useAttempts();
  const { data: subjectStats, isLoading: loadingStats } = useSubjectStats();

  const isLoading = loadingAttempts || loadingStats;

  // Filtriraj completed
  const completed = (attempts ?? []).filter((a) => a.status === "completed");

  // Agregirane statistike
  const totalExams = completed.length;
  const avgPct = totalExams
    ? Math.round(
        completed.reduce((s, a) => s + (a.score_pct ?? 0), 0) / totalExams,
      )
    : 0;
  const bestPct = totalExams
    ? Math.max(...completed.map((a) => a.score_pct ?? 0))
    : 0;
  const streak = computeStreak(completed);
  const weekActivity = computeWeekActivity(completed);

  // Zadnjih 5 pokušaja za prikaz
  const recentAttempts = completed.slice(0, 5);

  if (isLoading) {
    return (
      <PageWrapper>
        <DashboardSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <HeroBanner user={user} streak={streak} weekActivity={weekActivity} />

      {/* Stat kartice */}
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
          value={streak || "—"}
          label="Streak dana"
          iconClass="text-orange-500"
          bgClass="bg-orange-50"
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Nedavni pokušaji */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">
              Nedavni ispiti
            </p>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={ChevronRight}
              onClick={() => navigate("/statistike")}
            >
              Svi rezultati
            </Button>
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
            <>
              {recentAttempts.map((attempt) => (
                <AttemptItem key={attempt.id} attempt={attempt} />
              ))}
              {completed.length > 5 && (
                <button
                  onClick={() => navigate("/statistike")}
                  className="w-full mt-3 py-2 text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1"
                >
                  Prikaži svih {completed.length} ispita
                  <ArrowRight size={12} />
                </button>
              )}
            </>
          )}
        </Card>

        {/* Napredak po predmetima */}
        <Card className="p-5">
          <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-1">
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
            subjectStats
              .sort((a, b) => (b.attempts_count ?? 0) - (a.attempts_count ?? 0))
              .slice(0, 6)
              .map((stat) => (
                <SubjectProgressItem key={stat.subject_id} stat={stat} />
              ))
          )}

          {subjectStats && subjectStats.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3"
              rightIcon={ArrowRight}
              onClick={() => navigate("/statistike?tab=subjects")}
            >
              Detaljna analiza
            </Button>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
