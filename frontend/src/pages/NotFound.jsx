import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, SearchX, BookOpen, BarChart2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/common/Button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useIsAuthenticated } from "@/hooks/useAuth";

const QUICK_LINKS_PUBLIC = [
  { to: "/predmeti", label: "Svi predmeti", icon: BookOpen },
  { to: "/login", label: "Prijava", icon: Home },
];

const QUICK_LINKS_AUTH = [
  { to: "/dashboard", label: "Početna ploča", icon: Home },
  { to: "/predmeti", label: "Svi predmeti", icon: BookOpen },
  { to: "/rezultati", label: "Statistike", icon: BarChart2 },
];

export function NotFoundPage() {
  usePageTitle("Stranica nije pronađena");
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  const quickLinks = isAuthenticated ? QUICK_LINKS_AUTH : QUICK_LINKS_PUBLIC;

  return (
    <div className="flex-1 flex items-center justify-center page-container py-20">
      <motion.div
        className="text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-20 h-20 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <SearchX size={36} className="text-warm-400" />
        </div>

        <p className="text-xs font-bold text-warm-400 uppercase tracking-widest mb-2">
          Greška 404
        </p>
        <h1 className="text-2xl font-bold text-warm-900 mb-2">
          Stranica nije pronađena
        </h1>
        <p className="text-sm text-warm-500 mb-8 leading-relaxed">
          Tražena stranica ne postoji ili je premještena.
          <br />
          Možda je adresa pogrešno unesena.
        </p>

        <div className="flex justify-center mb-6">
          <Button
            leftIcon={ArrowLeft}
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Vrati se natrag
          </Button>
        </div>

        <div className="border-t border-warm-200 pt-6">
          <p className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-3">
            Popularne stranice
          </p>
          <div className="flex flex-col gap-2">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-warm-50 hover:bg-warm-100 border border-warm-200 text-sm font-medium text-warm-700 transition-colors"
              >
                <Icon size={15} className="text-warm-400" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
