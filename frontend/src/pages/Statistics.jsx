// pages/Statistics.jsx
// ─────────────────────────────────────────────────────────────────────────────
// KOMPLETNI REWRITE — više nema mock podataka.
// Svi podaci dolaze iz Supabase:
//   • attemptApi.getAll()       → attempts JOIN exams (history lista)
//   • user_subject_stats VIEW   → agregirane statistike po predmetu
//   • user_section_stats VIEW   → statistike po sekcijama (za HRV itd.)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Target,
  TrendingUp,
  Clock,
  RotateCcw,
  ChevronRight,
  BarChart2,
  BookOpen,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { Card, CardContent } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { SUBJECTS, EXAM_SESSIONS, DIFFICULTY_LEVELS } from "@/utils/constants";
import { supabase } from "@/lib/supabase";
import { attemptApi } from "@/api/attemptApi";
import { cn } from "@/utils/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPctColor(pct) {
  if (pct >= 75) return "text-success-600";
  if (pct >= 50) return "text-amber-600";
  return "text-error-600";
}

function getPctBg(pct) {
  if (pct >= 75) return "bg-success-50 border-green-200";
  if (pct >= 50) return "bg-amber-50 border-amber-200";
  return "bg-error-50 border-red-200";
}

function formatDate(isoString) {
  if (!isoString) return "—";
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoString));
}

function formatElapsed(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function sessionName(session) {
  return EXAM_SESSIONS.find((s) => s.id === session)?.name ?? session;
}

function levelName(level) {
  return DIFFICULTY_LEVELS.find((d) => d.id === level)?.short ?? level;
}

// ── API hooks ─────────────────────────────────────────────────────────────────

function useAttempts() {
  return useQuery({
    queryKey: ["user-attempts"],
    queryFn: () => attemptApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

function useSubjectStats() {
  return useQuery({
    queryKey: ["user-subject-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subject_stats")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Bone({ className }) {
  return (
    <div className={cn("bg-warm-200 rounded-lg animate-pulse", className)} />
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-warm-200 p-4"
          >
            <Bone className="h-8 w-8 rounded-xl mb-3" />
            <Bone className="h-6 w-12 mb-1" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-warm-200 p-4 flex gap-4"
        >
          <Bone className="h-12 w-12 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <Bone className="h-4 w-40 mb-2" />
            <Bone className="h-3 w-24" />
          </div>
          <Bone className="h-8 w-16 rounded-full flex-shrink-0" />
        </div>
      ))}
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

// ── Kartica napretka po predmetu ──────────────────────────────────────────────
function SubjectProgressCard({ stat }) {
  const subject = SUBJECTS.find((s) => s.id === stat.subject_id);
  if (!subject) return null;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-warm-100 last:border-0">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          subject.color.bg,
        )}
      >
        <subject.icon size={16} className={subject.color.text} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-warm-800">
            {subject.name}
          </span>
          <span
            className={cn("text-sm font-bold", getPctColor(stat.avg_score_pct))}
          >
            {stat.avg_score_pct ?? "—"}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stat.avg_score_pct ?? 0}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              stat.avg_score_pct >= 75
                ? "bg-success-500"
                : stat.avg_score_pct >= 50
                  ? "bg-amber-400"
                  : "bg-error-400",
            )}
          />
        </div>
        <p className="text-xs text-warm-400 mt-1">
          {stat.attempts_count} {stat.attempts_count === 1 ? "ispit" : "ispita"}{" "}
          · Best: {stat.best_score_pct ?? "—"}%
        </p>
      </div>
    </div>
  );
}

// ── Redak jednog pokušaja ─────────────────────────────────────────────────────
function AttemptRow({ attempt }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === attempt.exam?.subject_id);
  const exam = attempt.exam;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-warm-200 hover:border-warm-300 transition-all cursor-pointer"
      onClick={() => navigate(`/ispit/${attempt.exam_id}`)}
    >
      {/* Subject icon */}
      {subject && (
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={18} className={subject.color.text} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-warm-900 truncate">
          {subject?.shortName ?? exam?.subject_id} · {exam?.year}.
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-warm-400">
          <span>{sessionName(exam?.session)}</span>
          <span>·</span>
          <span>{levelName(exam?.level)}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Clock size={10} />
            {formatElapsed(attempt.elapsed_seconds)}
          </span>
        </div>
        <p className="text-[11px] text-warm-300 mt-0.5">
          {formatDate(attempt.finished_at)}
        </p>
      </div>

      {/* Score */}
      <div
        className={cn(
          "px-3 py-1 rounded-full border text-sm font-bold flex-shrink-0",
          getPctBg(attempt.score_pct),
          getPctColor(attempt.score_pct),
        )}
      >
        {attempt.score_pct ?? "—"}%
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          title="Ponovi ispit"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/ispit/${attempt.exam_id}`);
          }}
          className="p-1.5 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
        >
          <RotateCcw size={14} />
        </button>
        <ChevronRight
          size={16}
          className="text-warm-300 group-hover:text-warm-600 transition-colors"
        />
      </div>
    </motion.div>
  );
}

// ── Stranica statistike ───────────────────────────────────────────────────────
export function StatisticsPage() {
  const [activeTab, setActiveTab] = useState("history"); // "history" | "subjects"
  const navigate = useNavigate();

  const {
    data: attempts,
    isLoading: loadingAttempts,
    error: attemptsError,
  } = useAttempts();
  const { data: subjectStats, isLoading: loadingStats } = useSubjectStats();

  const isLoading = loadingAttempts || loadingStats;

  // Agregirane brojke
  const completedAttempts = (attempts ?? []).filter(
    (a) => a.status === "completed",
  );
  const totalExams = completedAttempts.length;
  const avgPct = totalExams
    ? Math.round(
        completedAttempts.reduce((s, a) => s + (a.score_pct ?? 0), 0) /
          totalExams,
      )
    : 0;
  const bestPct = totalExams
    ? Math.max(...completedAttempts.map((a) => a.score_pct ?? 0))
    : 0;
  const passedCount = completedAttempts.filter(
    (a) => (a.score_pct ?? 0) >= 50,
  ).length;

  return (
    <PageWrapper>
      <PageHeader
        title="Statistike"
        subtitle="Pregled tvojih rezultata i napretka"
      />

      {isLoading ? (
        <StatsSkeleton />
      ) : attemptsError ? (
        <div className="text-center py-16">
          <AlertCircle size={32} className="text-error-400 mx-auto mb-3" />
          <p className="text-warm-700 font-semibold mb-4">
            Greška pri učitavanju statistika
          </p>
          <Button
            variant="secondary"
            leftIcon={RefreshCw}
            onClick={() => window.location.reload()}
          >
            Pokušaj ponovo
          </Button>
        </div>
      ) : totalExams === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <BookOpen size={40} className="text-warm-300 mx-auto mb-4" />
          <p className="text-warm-600 font-semibold mb-2">
            Još nema riješenih ispita
          </p>
          <p className="text-warm-400 text-sm mb-6">
            Odaberi ispit i počni vježbati!
          </p>
          <Button variant="primary" onClick={() => navigate("/")}>
            Odaberi ispit
          </Button>
        </div>
      ) : (
        <>
          {/* Stat kartice */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
              icon={Target}
              value={passedCount}
              label="Položenih (≥50%)"
              iconClass="text-violet-600"
              bgClass="bg-violet-50"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-warm-100 rounded-xl p-1 w-fit">
            {[
              { id: "history", label: "Povijest ispita" },
              { id: "subjects", label: "Po predmetima" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-white text-warm-900 shadow-sm"
                    : "text-warm-500 hover:text-warm-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === "history" ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2.5"
              >
                {completedAttempts.map((attempt) => (
                  <AttemptRow key={attempt.id} attempt={attempt} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="subjects"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-5">
                  {(subjectStats ?? []).length === 0 ? (
                    <p className="text-sm text-warm-400 text-center py-4">
                      Nema podataka po predmetima.
                    </p>
                  ) : (
                    (subjectStats ?? [])
                      .sort(
                        (a, b) =>
                          (b.attempts_count ?? 0) - (a.attempts_count ?? 0),
                      )
                      .map((stat) => (
                        <SubjectProgressCard
                          key={stat.subject_id}
                          stat={stat}
                        />
                      ))
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </PageWrapper>
  );
}
