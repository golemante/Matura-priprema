import { Link } from "react-router-dom";
import {
  Mail,
  User,
  CalendarDays,
  LayoutDashboard,
  BarChart2,
  LogOut,
  ChevronRight,
  BookOpen,
  Shield,
} from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { useCurrentUser } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useAuth";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import { formatDate } from "@/utils/formatters";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 },
  }),
};

const QUICK_LINKS = [
  {
    to: "/dashboard",
    label: "Početna ploča",
    desc: "Pregled napretka i aktivnosti",
    icon: LayoutDashboard,
    color: "text-primary-600",
    bg: "bg-primary-50",
  },
  {
    to: "/predmeti",
    label: "Odaberi ispit",
    desc: "Kreni s vježbanjem",
    icon: BookOpen,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    to: "/rezultati",
    label: "Statistike",
    desc: "Svi tvoji rezultati",
    icon: BarChart2,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export function ProfilePage() {
  usePageTitle(PAGE_TITLES.profile);
  const user = useCurrentUser();
  const { logout, isPending } = useLogout();

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Korisnik";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const INFO_ROWS = [
    {
      icon: User,
      label: "Ime profila",
      value: displayName,
    },
    {
      icon: Mail,
      label: "Email adresa",
      value: user?.email ?? "Nije dostupno",
    },
    {
      icon: CalendarDays,
      label: "Korisnik od",
      value: user?.created_at ? formatDate(user.created_at) : "Nije dostupno",
    },
    {
      icon: Shield,
      label: "Status računa",
      value: "Aktivan",
      badge: true,
    },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Moj profil"
        subtitle="Pregled tvojih podataka i brza navigacija."
      />

      <div className="max-w-2xl mx-auto space-y-4">
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Card className="overflow-hidden">
            <div className="h-20 sm:h-24 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 relative">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #fff 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
            </div>

            <div className="px-4 sm:px-5 pb-5">
              <div className="-mt-9 sm:-mt-12 mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-4 ring-white shadow-md overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <span className="text-xl sm:text-2xl font-black text-primary-700">
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-warm-900 mb-0.5 truncate">
                {displayName}
              </h2>
              <p className="text-sm text-warm-500 truncate mb-5">
                {user?.email}
              </p>

              <button
                onClick={logout}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
                  "text-sm font-semibold border transition-all duration-150",
                  "text-error-600 bg-white border-error-200",
                  "hover:bg-error-50 hover:border-error-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <LogOut size={15} />
                {isPending ? "Odjava u tijeku..." : "Odjavi se"}
              </button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
        >
          <Card className="divide-y divide-warm-100 overflow-hidden">
            {INFO_ROWS.map(({ icon: Icon, label, value, badge }) => (
              <div
                key={label}
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4"
              >
                <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-warm-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wider leading-none mb-1">
                    {label}
                  </p>
                  {badge ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {value}
                    </span>
                  ) : (
                    <p className="text-sm font-medium text-warm-800 truncate">
                      {value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
        >
          <p className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2.5 px-1">
            Brza navigacija
          </p>
          <div className="space-y-2">
            {QUICK_LINKS.map(
              ({ to, label, desc, icon: Icon, color, bg }, i) => (
                <motion.div
                  key={to}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={3 + i * 0.5}
                >
                  <Link
                    to={to}
                    className={cn(
                      "flex items-center gap-3 sm:gap-4 px-4 py-3.5 rounded-2xl",
                      "bg-white border border-warm-200",
                      "hover:border-warm-300 hover:shadow-sm",
                      "transition-all duration-200 group",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        bg,
                      )}
                    >
                      <Icon size={18} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-warm-900 truncate">
                        {label}
                      </p>
                      <p className="text-xs text-warm-400 truncate">{desc}</p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-warm-300 group-hover:text-warm-600 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    />
                  </Link>
                </motion.div>
              ),
            )}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={5}
          className="flex items-start gap-3 p-4 bg-warm-50 border border-warm-200 rounded-2xl"
        >
          <Shield size={15} className="text-warm-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warm-500 leading-relaxed">
            Tvoji podaci se čuvaju sigurno i ne dijele se s trećim stranama.
            Korištenjem platforme prihvaćaš naše{" "}
            <Link
              to="/uvjeti"
              className="underline underline-offset-2 hover:text-warm-700 transition-colors"
            >
              uvjete korištenja
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
