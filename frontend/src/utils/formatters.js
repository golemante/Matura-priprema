// utils/formatters.js
export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const formatScore = (correct, total) =>
  total > 0 ? `${Math.round((correct / total) * 100)}%` : "0%";

export const formatExamLabel = (exam) =>
  `${exam.year}. – ${exam.session.name} (${exam.difficulty.short})`;

export const formatDuration = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60),
    m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
};

export const formatDate = (date) =>
  new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));

export const formatRelativeDate = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600) return `prije ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `prije ${Math.floor(diff / 3600)} h`;
  return formatDate(date);
};
