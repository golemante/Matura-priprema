import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { attemptApi } from "@/api/attemptApi";

const STALE_TIME = 1000 * 60 * 5;

export function useAttempts() {
  return useQuery({
    queryKey: ["user-attempts"],
    queryFn: () => attemptApi.getAll(),
    staleTime: STALE_TIME,
  });
}

export function useSubjectStats() {
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
    staleTime: STALE_TIME,
  });
}

export function useAttemptData() {
  const attempts = useAttempts();
  const subjectStats = useSubjectStats();

  return {
    attempts: attempts.data ?? [],
    subjectStats: subjectStats.data ?? [],
    isLoading: attempts.isLoading || subjectStats.isLoading,
    error: attempts.error || subjectStats.error,
    refetch: () => {
      attempts.refetch();
      subjectStats.refetch();
    },
    attemptsQuery: attempts,
    subjectStatsQuery: subjectStats,
  };
}
