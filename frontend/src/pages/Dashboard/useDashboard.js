import { useMemo } from "react";
import { useAttemptData } from "@/hooks/useAttemptData";
import { computeOverallStats, computeWeekActivity } from "@/utils/statsHelpers";

export function useDashboard() {
  const { attempts, subjectStats, isLoading, error, refetch } =
    useAttemptData();

  const completed = useMemo(
    () => attempts.filter((a) => a.status === "completed"),
    [attempts],
  );

  const inProgress = useMemo(
    () => attempts.find((a) => a.status === "in_progress") ?? null,
    [attempts],
  );

  const stats = useMemo(() => computeOverallStats(completed), [completed]);

  const weekActivity = useMemo(
    () => computeWeekActivity(completed),
    [completed],
  );

  const recentAttempts = useMemo(
    () =>
      [...completed]
        .sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at))
        .slice(0, 6),
    [completed],
  );

  const bestSubjectId = useMemo(() => {
    if (!subjectStats.length) return null;
    return (
      [...subjectStats].sort(
        (a, b) => (b.best_score_pct ?? 0) - (a.best_score_pct ?? 0),
      )[0]?.subject_id ?? null
    );
  }, [subjectStats]);

  return {
    attempts,
    completed,
    inProgress,
    subjectStats,
    stats,
    weekActivity,
    recentAttempts,
    bestSubjectId,
    isLoading,
    error,
    refetch,
    isEmpty: !isLoading && completed.length === 0,
  };
}
