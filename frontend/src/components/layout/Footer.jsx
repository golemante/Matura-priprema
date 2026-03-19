import { Link } from "react-router-dom";
import { BookOpenCheck } from "lucide-react";

const FOOTER_LINKS = [
  { to: "/o-nama", label: "O projektu" },
  { to: "/kontakt", label: "Kontakt" },
  { to: "/privatnost", label: "Privatnost" },
  { to: "/uvjeti", label: "Uvjeti" },
];

export function Footer() {
  return (
    <footer className="border-t border-warm-300 bg-white mt-auto">
      <div className="page-container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 group"
          aria-label="MaturaPro - Početna"
        >
          <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-700 transition-colors">
            <BookOpenCheck size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-warm-700 group-hover:text-warm-900 transition-colors">
            Matura<span className="text-primary-600">Pro</span>
          </span>
        </Link>

        <nav className="flex flex-wrap justify-center gap-4 text-xs text-warm-500">
          {FOOTER_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="hover:text-warm-800 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-warm-400">
          © {new Date().getFullYear()} MaturaPro
        </p>
      </div>
    </footer>
  );
}
