import { Link } from "react-router-dom";
import {
  Mail,
  User,
  CalendarDays,
  LayoutDashboard,
  BarChart2,
} from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/layout/PageLayout";
import { Card } from "@/components/common/Card";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import { formatDate } from "@/utils/formatters";

export function ProfilePage() {
  usePageTitle(PAGE_TITLES.profile);
  const user = useCurrentUser();
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Korisnik";

  return (
    <PageWrapper>
      <PageHeader
        title="Moj profil"
        subtitle="Pregled tvojih osnovnih podataka."
      />

      <div className="max-w-3xl mx-auto space-y-5">
        <Card className="p-5 sm:p-6 border border-warm-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <UserAvatar user={user} size="xl" shadow />
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-warm-900">
                {displayName}
              </h2>
              <p className="text-sm text-warm-500">
                Ovdje su tvoji osnovni korisnički podaci.
              </p>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-warm-200 bg-warm-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-warm-500">
                Email
              </p>
              <p className="mt-1 text-sm font-medium text-warm-800 flex items-center gap-2">
                <Mail size={14} className="text-warm-500" />
                {user?.email ?? "Nije dostupno"}
              </p>
            </div>

            <div className="rounded-xl border border-warm-200 bg-warm-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-warm-500">
                Ime profila
              </p>
              <p className="mt-1 text-sm font-medium text-warm-800 flex items-center gap-2">
                <User size={14} className="text-warm-500" />
                {displayName}
              </p>
            </div>

            <div className="rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-warm-500">
                Korisnik od
              </p>
              <p className="mt-1 text-sm font-medium text-warm-800 flex items-center gap-2">
                <CalendarDays size={14} className="text-warm-500" />
                {user?.created_at
                  ? formatDate(user.created_at)
                  : "Nije dostupno"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-warm-200">
          <h3 className="text-base font-semibold text-warm-900">
            Brza navigacija
          </h3>
          <p className="text-sm text-warm-500 mt-1">
            Nastavi tamo gdje ti je najkorisnije.
          </p>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <Link
              to="/dashboard"
              className="rounded-xl border border-warm-200 px-4 py-3 text-sm font-medium text-warm-700 hover:bg-warm-50 transition-colors flex items-center gap-2"
            >
              <LayoutDashboard size={16} className="text-warm-500" />
              Otvori Dashboard
            </Link>
            <Link
              to="/rezultati"
              className="rounded-xl border border-warm-200 px-4 py-3 text-sm font-medium text-warm-700 hover:bg-warm-50 transition-colors flex items-center gap-2"
            >
              <BarChart2 size={16} className="text-warm-500" />
              Pogledaj rezultate
            </Link>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
