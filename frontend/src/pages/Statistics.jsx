// pages/Statistics.jsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ChevronDown,
  Flame,
  Timer,
  Percent,
} from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { Button } from "@/components/common/Button";
import { SUBJECTS, EXAM_SESSIONS, DIFFICULTY_LEVELS } from "@/utils/constants";
import { supabase } from "@/lib/supabase";
import { attemptApi } from "@/api/attemptApi";
import { cn } from "@/utils/cn";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import { Bone } from "@/components/common/Skeleton";

function getPctColor(pct) {
  if (pct == null) return "text-warm-400";
  if (pct >= 75) return "text-green-600";
  if (pct >= 50) return "text-amber-600";
  return "text-red-500";
}

function getPctBg(pct) {
  if (pct == null) return "bg-warm-100 text-warm-500 border-warm-200";
  if (pct >= 75) return "bg-green-100 text-green-700 border-green-200";
  if (pct >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-600 border-red-200";
}

function getPctBarColor(pct) {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function sessionName(s) {
  return (
    EXAM_SESSIONS?.find((e) => e.id === s)?.name ??
    (s === "ljeto" || s === "ljetni"
      ? "Ljetni"
      : s === "jesen" || s === "jesenski"
        ? "Jesenski"
        : (s ?? ""))
  );
}

function levelName(level) {
  return DIFFICULTY_LEVELS?.find((d) => d.id === level)?.short ?? level ?? "";
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
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatTotalTime(totalSecs) {
  if (!totalSecs) return "0 min";
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

// Grupira attemptove po "Mjesec Godina" labelu
function groupByMonth(attempts) {
  const groups = {};
  for (const a of attempts) {
    if (!a.finished_at) continue;
    const d = new Date(a.finished_at);
    const key = new Intl.DateTimeFormat("hr-HR", {
      month: "long",
      year: "numeric",
    }).format(d);
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return groups;
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

// ─────────────────────────────────────────────────────────────────────────────
// API HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useAttempts() {
  return useQuery({
    queryKey: ["user-attempts"],
    queryFn: () => attemptApi.getAll(),
    staleTime: 1000 * 60 * 5,
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

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-warm-200 p-4"
          >
            <Bone className="h-8 w-8 rounded-xl mb-2.5" />
            <Bone className="h-7 w-16 mb-1" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-warm-100 rounded-xl p-1 w-fit">
        <Bone className="h-9 w-32 rounded-lg" />
        <Bone className="h-9 w-32 rounded-lg" />
      </div>

      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-warm-200 p-4 flex items-center gap-3"
        >
          <Bone className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-48" />
            <Bone className="h-3 w-28" />
          </div>
          <Bone className="h-7 w-14 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY BAR — kompaktan pregled na vrhu
// ─────────────────────────────────────────────────────────────────────────────
function SummaryBar({ completed }) {
  const totalExams = completed.length;
  const avgPct = totalExams
    ? Math.round(
        completed.reduce((s, a) => s + (a.score_pct ?? 0), 0) / totalExams,
      )
    : 0;
  const passRate = totalExams
    ? Math.round(
        (completed.filter((a) => (a.score_pct ?? 0) >= 50).length /
          totalExams) *
          100,
      )
    : 0;
  const totalTimeSec = completed.reduce(
    (s, a) => s + (a.elapsed_seconds ?? 0),
    0,
  );
  const streak = computeStreak(completed);

  const stats = [
    {
      icon: BookOpen,
      value: totalExams,
      label: "Ispita",
      iconCls: "text-primary-600",
      bgCls: "bg-primary-50",
    },
    {
      icon: Percent,
      value: `${avgPct}%`,
      label: "Prosj. rezultat",
      iconCls: "text-green-600",
      bgCls: "bg-green-50",
    },
    {
      icon: Target,
      value: `${passRate}%`,
      label: "Položenih",
      iconCls: "text-amber-600",
      bgCls: "bg-amber-50",
    },
    {
      icon: Timer,
      value: formatTotalTime(totalTimeSec),
      label: "Uč. ukupno",
      iconCls: "text-violet-600",
      bgCls: "bg-violet-50",
    },
    ...(streak > 1
      ? [
          {
            icon: Flame,
            value: `${streak}d`,
            label: "Streak",
            iconCls: "text-orange-500",
            bgCls: "bg-orange-50",
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.slice(0, 4).map(({ icon: Icon, value, label, iconCls, bgCls }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-warm-200 shadow-card p-4"
        >
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center mb-2.5",
              bgCls,
            )}
          >
            <Icon size={15} className={iconCls} />
          </div>
          <p className="text-xl font-black text-warm-900 leading-none mb-1 tabular-nums">
            {value}
          </p>
          <p className="text-xs text-warm-500 font-medium">{label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT FILTER CHIPS
// ─────────────────────────────────────────────────────────────────────────────
function SubjectFilterChips({ attempts, active, onChange }) {
  // Samo predmeti koji se pojavljuju u attemptovima
  const presentSubjectIds = useMemo(
    () => [...new Set(attempts.map((a) => a.exam?.subject_id).filter(Boolean))],
    [attempts],
  );

  if (presentSubjectIds.length < 2) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
          active === null
            ? "bg-primary-600 text-white border-primary-600"
            : "bg-white text-warm-600 border-warm-200 hover:border-warm-300",
        )}
      >
        Svi
      </button>
      {presentSubjectIds.map((sid) => {
        const s = SUBJECTS.find((x) => x.id === sid);
        if (!s) return null;
        const isActive = active === sid;
        return (
          <button
            key={sid}
            onClick={() => onChange(isActive ? null : sid)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
              isActive
                ? `${s.color.bg} ${s.color.text} border-transparent`
                : "bg-white text-warm-600 border-warm-200 hover:border-warm-300",
            )}
          >
            <s.icon size={11} />
            {s.shortName}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SORT DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: "newest", label: "Najnovije" },
  { id: "oldest", label: "Najstarije" },
  { id: "best", label: "Najbolji rezultat" },
  { id: "worst", label: "Najlošiji rezultat" },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-warm-200 hover:border-warm-300 text-warm-700 transition-all"
      >
        <ArrowUpDown size={11} />
        {current?.label}
        <ChevronDown
          size={11}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-warm-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]"
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-warm-50",
                    value === opt.id
                      ? "text-primary-700 bg-primary-50"
                      : "text-warm-700",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTEMPT ROW
// ─────────────────────────────────────────────────────────────────────────────
function AttemptRow({ attempt, index }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === attempt.exam?.subject_id);
  const exam = attempt.exam;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
      className="group flex items-center gap-3 p-4 bg-white rounded-2xl border border-warm-200 hover:border-warm-300 hover:shadow-sm transition-all"
    >
      {/* Predmet ikona */}
      {subject ? (
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={18} className={subject.color.text} />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-xl bg-warm-100 flex-shrink-0" />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-warm-900 truncate">
          {subject?.shortName ?? exam?.subject_id}
          {exam?.year && (
            <span className="text-warm-500 font-normal"> · {exam.year}.</span>
          )}
          {exam?.session && (
            <span className="text-warm-400 font-normal">
              {" "}
              {sessionName(exam.session)}
            </span>
          )}
          {exam?.level && (
            <span className="text-warm-400 font-normal">
              {" "}
              · {levelName(exam.level)}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-warm-400">
          {attempt.elapsed_seconds && (
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {formatElapsed(attempt.elapsed_seconds)}
            </span>
          )}
          <span>{formatDate(attempt.finished_at)}</span>
        </div>
      </div>

      {/* Score pill */}
      <span
        className={cn(
          "text-xs font-black px-2.5 py-1 rounded-full border flex-shrink-0",
          getPctBg(attempt.score_pct),
        )}
      >
        {attempt.score_pct != null ? `${attempt.score_pct}%` : "—"}
      </span>

      {/* Akcije */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          title="Ponovi ispit"
          onClick={() => navigate(`/ispit/${attempt.exam_id}`)}
          className="p-1.5 rounded-lg text-warm-300 hover:text-warm-700 hover:bg-warm-100 transition-colors"
        >
          <RotateCcw size={13} />
        </button>
        <ChevronRight
          size={15}
          className="text-warm-300 group-hover:text-warm-500 transition-colors"
        />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTH GROUP — grupira attempt rowove po "Siječanj 2025"
// ─────────────────────────────────────────────────────────────────────────────
function MonthGroup({ label, attempts }) {
  const [open, setOpen] = useState(true);
  const avgInGroup = attempts.length
    ? Math.round(
        attempts.reduce((s, a) => s + (a.score_pct ?? 0), 0) / attempts.length,
      )
    : null;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 mb-2.5 group"
      >
        <span className="text-xs font-bold text-warm-500 capitalize whitespace-nowrap">
          {label}
        </span>
        <div className="h-px flex-1 bg-warm-200" />
        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            getPctColor(avgInGroup),
          )}
        >
          ∅ {avgInGroup ?? "—"}%
        </span>
        <span className="text-xs text-warm-400">{attempts.length}</span>
        <ChevronDown
          size={12}
          className={cn(
            "text-warm-300 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2 mb-4"
          >
            {attempts.map((a, i) => (
              <AttemptRow key={a.id} attempt={a} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE za SubjectCard
// ─────────────────────────────────────────────────────────────────────────────
function MiniSparkline({ data, width = 60, height = 24 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - 2 * pad);
    const y = pad + ((max - v) / range) * (height - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trend = data[data.length - 1] >= data[0];
  const color = trend ? "#16A34A" : "#EF4444";
  const lastPt = points[points.length - 1].split(",");

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible flex-shrink-0"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      <circle cx={lastPt[0]} cy={lastPt[1]} r={2.5} fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT CARD — rich kartica po predmetu
// ─────────────────────────────────────────────────────────────────────────────
function SubjectCard({ stat, attempts }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === stat.subject_id);
  if (!subject) return null;

  const avg = stat.avg_score_pct ?? 0;
  const best = stat.best_score_pct ?? 0;
  const cnt = stat.attempts_count ?? 0;

  // Pass rate iz attemptova ovog predmeta
  const subjectAttempts = (attempts ?? [])
    .filter(
      (a) => a.exam?.subject_id === stat.subject_id && a.status === "completed",
    )
    .sort((a, b) => new Date(a.finished_at) - new Date(b.finished_at));

  const passRate = subjectAttempts.length
    ? Math.round(
        (subjectAttempts.filter((a) => (a.score_pct ?? 0) >= 50).length /
          subjectAttempts.length) *
          100,
      )
    : 0;

  // Sparkline data — zadnjih 6 pokušaja kronološki
  const sparkData = subjectAttempts.slice(-6).map((a) => a.score_pct ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-warm-200 p-4 hover:border-warm-300 hover:shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={18} className={subject.color.text} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-warm-900">{subject.name}</p>
          <p className="text-xs text-warm-400">
            {cnt} {cnt === 1 ? "ispit" : "ispita"}
          </p>
        </div>

        {/* Sparkline trend */}
        <MiniSparkline data={sparkData} />

        {/* Score */}
        <span
          className={cn(
            "text-lg font-black tabular-nums flex-shrink-0",
            getPctColor(avg),
          )}
        >
          {avg}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden mb-2">
        <motion.div
          className={cn("h-full rounded-full", getPctBarColor(avg))}
          initial={{ width: 0 }}
          animate={{ width: `${avg}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      {/* Footer: pass rate + rekord + CTA */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span
          className={cn(
            "text-[11px] font-bold px-2 py-0.5 rounded-lg border",
            passRate >= 75
              ? "bg-green-50 text-green-700 border-green-200"
              : passRate >= 50
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-warm-100 text-warm-600 border-warm-200",
          )}
        >
          {passRate}% položenih
        </span>

        {best > avg && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Trophy size={9} />
            Rekord {best}%
          </span>
        )}

        <button
          onClick={() => navigate(`/predmeti/${stat.subject_id}`)}
          className="ml-auto text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline underline-offset-2"
        >
          Vježbaj <ChevronRight size={11} />
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY TAB
// ─────────────────────────────────────────────────────────────────────────────
function HistoryTab({ completed }) {
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let list = subjectFilter
      ? completed.filter((a) => a.exam?.subject_id === subjectFilter)
      : completed;

    switch (sort) {
      case "oldest":
        list = [...list].sort(
          (a, b) => new Date(a.finished_at) - new Date(b.finished_at),
        );
        break;
      case "best":
        list = [...list].sort(
          (a, b) => (b.score_pct ?? -1) - (a.score_pct ?? -1),
        );
        break;
      case "worst":
        list = [...list].sort(
          (a, b) => (a.score_pct ?? 101) - (b.score_pct ?? 101),
        );
        break;
      default:
        list = [...list].sort(
          (a, b) => new Date(b.finished_at) - new Date(a.finished_at),
        );
    }
    return list;
  }, [completed, subjectFilter, sort]);

  // Grupiranje po mjesecu samo za sort "newest"/"oldest"
  const useGrouping = sort === "newest" || sort === "oldest";
  const grouped = useGrouping ? groupByMonth(filtered) : null;

  return (
    <div>
      {/* Kontrole */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <SubjectFilterChips
          attempts={completed}
          active={subjectFilter}
          onChange={setSubjectFilter}
        />
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <CheckCircle2
            size={28}
            className="text-warm-200 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm text-warm-500">Nema ispita s ovim filterom.</p>
          <button
            onClick={() => setSubjectFilter(null)}
            className="text-xs text-primary-600 font-bold mt-2 underline underline-offset-2"
          >
            Ukloni filter
          </button>
        </div>
      ) : useGrouping && grouped ? (
        Object.entries(grouped).map(([label, items]) => (
          <MonthGroup key={label} label={label} attempts={items} />
        ))
      ) : (
        <div className="space-y-2">
          {filtered.map((a, i) => (
            <AttemptRow key={a.id} attempt={a} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// SUBJECTS TAB
function SubjectsTab({ subjectStats, attempts }) {
  if (!subjectStats?.length) {
    return (
      <div className="text-center py-16">
        <BarChart2
          size={32}
          className="text-warm-200 mx-auto mb-3"
          strokeWidth={1.5}
        />
        <p className="text-sm text-warm-500">Nema statistika po predmetima.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[...subjectStats]
        .sort((a, b) => (b.attempts_count ?? 0) - (a.attempts_count ?? 0))
        .map((stat) => (
          <SubjectCard key={stat.subject_id} stat={stat} attempts={attempts} />
        ))}
    </div>
  );
}

// MAIN PAGE
export function StatisticsPage() {
  usePageTitle(PAGE_TITLES.statistics);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultTab = params.get("tab") === "subjects" ? "subjects" : "history";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const {
    data: attempts,
    isLoading: loadingAttempts,
    error: attemptsError,
    refetch,
  } = useAttempts();
  const { data: subjectStats, isLoading: loadingStats } = useSubjectStats();

  const isLoading = loadingAttempts || loadingStats;

  const completed = useMemo(
    () => (attempts ?? []).filter((a) => a.status === "completed"),
    [attempts],
  );

  if (isLoading)
    return (
      <PageWrapper>
        <PageHeader title="Statistike" />
        <StatsSkeleton />
      </PageWrapper>
    );

  if (attemptsError)
    return (
      <PageWrapper>
        <PageHeader title="Statistike" />
        <div className="text-center py-16">
          <AlertCircle
            size={32}
            className="text-red-400 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-warm-700 font-semibold mb-4">
            Greška pri učitavanju
          </p>
          <Button
            variant="secondary"
            leftIcon={RefreshCw}
            onClick={() => refetch()}
          >
            Pokušaj ponovo
          </Button>
        </div>
      </PageWrapper>
    );

  if (completed.length === 0)
    return (
      <PageWrapper>
        <PageHeader
          title="Statistike"
          subtitle="Pregled tvojih rezultata i napretka"
        />
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-warm-400" strokeWidth={1.5} />
          </div>
          <p className="text-warm-700 font-semibold mb-2">
            Još nema riješenih ispita
          </p>
          <p className="text-warm-400 text-sm mb-6 max-w-xs mx-auto">
            Odaberi ispit, riješi ga, i ovdje će se pojaviti detaljne statistike
            tvog napretka.
          </p>
          <Button
            variant="primary"
            leftIcon={BookOpen}
            onClick={() => navigate("/")}
          >
            Odaberi ispit
          </Button>
        </div>
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <PageHeader
        title="Statistike"
        subtitle="Pregled tvojih rezultata i napretka"
      />

      {/* Summary */}
      <SummaryBar completed={completed} />

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
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "history" ? (
            <HistoryTab completed={completed} />
          ) : (
            <SubjectsTab subjectStats={subjectStats} attempts={attempts} />
          )}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}
