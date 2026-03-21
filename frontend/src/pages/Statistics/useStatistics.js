import { useMemo } from "react";
import { useAttemptData } from "@/hooks/useAttemptData";
import { computeOverallStats, computeWeekActivity } from "@/utils/statsHelpers";

export function useStatistics() {
  const { attempts, subjectStats, isLoading, error, refetch } =
    useAttemptData();

  const completed = useMemo(
    () => (attempts ?? []).filter((a) => a.status === "completed"),
    [attempts],
  );

  const stats = useMemo(() => computeOverallStats(completed), [completed]);

  const weekActivity = useMemo(
    () => computeWeekActivity(completed),
    [completed],
  );

  return {
    attempts,
    completed,
    subjectStats,
    stats,
    weekActivity,
    isLoading,
    error,
    refetch,
    isEmpty: !isLoading && completed.length === 0,
  };
}
