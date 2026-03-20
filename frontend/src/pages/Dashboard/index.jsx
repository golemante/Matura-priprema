import { useNavigate } from "react-router-dom";
import { Plus, BarChart2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Button } from "@/components/common/Button";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useDashboard } from "./useDashboard";
import { HeroBanner } from "./HeroBanner";
import { StatCards } from "./StatCards";
import { RecentAttempts } from "./RecentAttempts";
import { SubjectProgress } from "./SubjectProgress";
import { FocusCard } from "./FocusCard";
import {
  InProgressBanner,
  EmptyDashboard,
  DashboardError,
  DashboardSkeleton,
} from "./DashboardStates";

export function Dashboard() {
  usePageTitle("Početna ploča");
  const navigate = useNavigate();
  const user = useCurrentUser();

  const {
    completed,
    inProgress,
    subjectStats,
    stats,
    weekActivity,
    recentAttempts,
    isLoading,
    error,
    refetch,
    isEmpty,
  } = useDashboard();

  if (isLoading)
    return (
      <PageWrapper>
        <DashboardSkeleton />
      </PageWrapper>
    );

  if (error)
    return (
      <PageWrapper>
        <DashboardError onRetry={refetch} />
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <HeroBanner
        user={user}
        streak={stats.streak}
        weekActivity={weekActivity}
        avgPct={stats.avgPct}
      />

      {inProgress && <InProgressBanner attempt={inProgress} />}

      {!isEmpty && <FocusCard subjectStats={subjectStats} />}

      {isEmpty ? (
        <EmptyDashboard />
      ) : (
        <>
          <StatCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <div className="lg:col-span-2">
              <RecentAttempts
                recentAttempts={recentAttempts}
                totalCompleted={completed.length}
              />
            </div>
            <div>
              <SubjectProgress subjectStats={subjectStats} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="primary"
              leftIcon={Plus}
              onClick={() => navigate("/predmeti")}
            >
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
        </>
      )}
    </PageWrapper>
  );
}
