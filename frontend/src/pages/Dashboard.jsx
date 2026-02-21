// pages/Dashboard.jsx — minimalna verzija
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { useCurrentUser } from "@/hooks/useAuth";

export function Dashboard() {
  const user = useCurrentUser();
  return (
    <PageWrapper>
      <PageHeader
        title={`Zdravo, ${user?.name ?? "učeniče"}! 👋`}
        subtitle="Nastavi s pripremom za maturu"
      />
      {/* StatsOverview, RecentAttempts, SubjectProgress */}
    </PageWrapper>
  );
}
