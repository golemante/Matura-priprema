import { Link, useLocation } from "react-router-dom";
import { BookOpenCheck, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/utils";

const navLinks = [
  { to: "/", label: "Predmeti" },
  { to: "/rezultati", label: "Moji rezultati" },
];

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-warm-300">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center
                            group-hover:bg-primary-700 transition-colors shadow-sm"
            >
              <BookOpenCheck size={17} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-warm-900">
              Matura<span className="text-primary-600">Prep</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  location.pathname === to
                    ? "bg-primary-50 text-primary-700"
                    : "text-warm-600 hover:text-warm-900 hover:bg-warm-100",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-warm-600 hover:bg-warm-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Otvori izbornik"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-warm-200 bg-white animate-fade-in">
          <nav className="page-container py-3 flex flex-col gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  location.pathname === to
                    ? "bg-primary-50 text-primary-700"
                    : "text-warm-600 hover:text-warm-900 hover:bg-warm-100",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
