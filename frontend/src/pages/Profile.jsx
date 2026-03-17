import { Link } from "react-router-dom";
import {
  Mail,
  User,
  CalendarDays,
  LayoutDashboard,
  BarChart2,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";

function formatJoinDate(dateValue) {
  if (!dateValue) return "Nije dostupno";
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function ProfileAvatar({ user }) {
  const initials = (user?.name ?? user?.email ?? "?")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (user?.user_metadata?.avatar_url) {
    return (
      <img
        src={user.user_metadata.avatar_url}
        alt={user?.name ?? "Avatar korisnika"}
        className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
      />
    );
  }

  return (
    <div className="w-20 h-20 rounded-2xl bg-primary-100 text-primary-700 text-2xl font-bold flex items-center justify-center ring-4 ring-white shadow-md">
      {initials}
    </div>
  );
}

export function ProfilePage() {
  usePageTitle(PAGE_TITLES.profile);
  const user = useCurrentUser();
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Korisnik";

  return (
    <PageWrapper
      title="Moj profil"
      subtitle="Pregled vaših osnovnih podataka i brzi pristup ključnim stranicama."
    >
      <div className="max-w-3xl mx-auto space-y-5">
        <Card className="p-5 sm:p-6 border border-warm-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <ProfileAvatar user={user} />
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-warm-900">
                {displayName}
              </h2>
              <p className="text-sm text-warm-500">
                Ovdje su vaši osnovni korisnički podaci.
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
                {formatJoinDate(user?.created_at)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-warm-200">
          <h3 className="text-base font-semibold text-warm-900">
            Brza navigacija
          </h3>
          <p className="text-sm text-warm-500 mt-1">
            Nastavite tamo gdje vam je najkorisnije.
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
