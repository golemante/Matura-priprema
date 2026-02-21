// components/layout/Footer.jsx
import { Link } from "react-router-dom";
import { BookOpenCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-warm-300 bg-white mt-auto">
      <div className="page-container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center">
            <BookOpenCheck size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-warm-700">
            MaturaPrip
          </span>
        </div>
        <nav className="flex gap-4 text-xs text-warm-500">
          <Link to="/o-nama" className="hover:text-warm-800 transition-colors">
            O nama
          </Link>
          <Link to="/kontakt" className="hover:text-warm-800 transition-colors">
            Kontakt
          </Link>
          <Link
            to="/privatnost"
            className="hover:text-warm-800 transition-colors"
          >
            Privatnost
          </Link>
        </nav>
        <p className="text-xs text-warm-400">
          © {new Date().getFullYear()} MaturaPrip
        </p>
      </div>
    </footer>
  );
}
