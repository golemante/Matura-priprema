import {
  EXAM_SESSIONS,
  DIFFICULTY_LEVELS,
  normalizeSession,
} from "@/utils/constants";

export function getPctColor(pct) {
  if (pct == null) return "text-warm-400";
  if (pct >= 75) return "text-green-600";
  if (pct >= 50) return "text-amber-600";
  return "text-red-500";
}

export function getPctBg(pct) {
  if (pct == null) return "bg-warm-100 text-warm-500 border-warm-200";
  if (pct >= 75) return "bg-green-100 text-green-700 border-green-200";
  if (pct >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-600 border-red-200";
}

export function getPctBarColor(pct) {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
}

export function sessionName(session) {
  const norm = normalizeSession(session);
  return EXAM_SESSIONS.find((s) => s.id === norm)?.name ?? session ?? "";
}

export function levelName(level) {
  return DIFFICULTY_LEVELS.find((d) => d.id === level)?.short ?? level ?? "";
}

export function formatElapsed(secs) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatTotalTime(totalSecs) {
  if (!totalSecs) return "0 min";
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function daysAgoLabel(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Danas";
  if (days === 1) return "Jučer";
  if (days < 7) return `Prije ${days} dana`;
  if (days < 30) return `Prije ${Math.floor(days / 7)} tj.`;
  return `Prije ${Math.floor(days / 30)} mj.`;
}

export function formatAttemptDate(isoString) {
  if (!isoString) return "—";
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoString));
}

export function computeStreak(completed) {
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

export function computeWeekActivity(completed) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    return (completed ?? []).filter(
      (a) =>
        a.finished_at && new Date(a.finished_at).toDateString() === dateStr,
    ).length;
  });
}

export function groupByMonth(attempts) {
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

export function computeOverallStats(completed) {
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

  const totalTimeSec = completed.reduce(
    (s, a) => s + (a.elapsed_seconds ?? 0),
    0,
  );

  const streak = computeStreak(completed);

  return { totalExams, avgPct, bestPct, passedCount, totalTimeSec, streak };
}
