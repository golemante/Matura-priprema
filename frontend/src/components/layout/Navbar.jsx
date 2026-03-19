import { Link, useLocation } from "react-router-dom";
import {
  BookOpenCheck,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  BarChart2,
  ChevronDown,
  User,
  GraduationCap,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";

function UserAvatar({ user, size = "sm" }) {
  const initials = (user?.name ?? user?.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm";

  if (user?.user_metadata?.avatar_url) {
    return (
      <img
        src={user.user_metadata.avatar_url}
        alt={user.name}
        className={cn("rounded-full object-cover ring-2 ring-white", sizeClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center ring-2 ring-white",
        sizeClass,
      )}
    >
      {initials}
    </div>
  );
}

function ProfileDropdown({ user, onClose }) {
  const { logout, isPending } = useLogout();

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Korisnik";
  const email = user?.email ?? "";

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-warm-200 shadow-card-lg overflow-hidden z-50 animate-scale-in origin-top-right">
      <div className="px-4 py-3 border-b border-warm-100">
        <p className="text-sm font-semibold text-warm-900 truncate">
          {displayName}
        </p>
        <p className="text-xs text-warm-400 truncate mt-0.5">{email}</p>
      </div>

      <div className="py-1.5">
        <Link
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2 text-sm text-warm-700 hover:bg-warm-50 hover:text-warm-900 transition-colors"
        >
          <LayoutDashboard size={15} className="text-warm-400" />
          Početna ploča
        </Link>
        <Link
          to="/rezultati"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2 text-sm text-warm-700 hover:bg-warm-50 hover:text-warm-900 transition-colors"
        >
          <BarChart2 size={15} className="text-warm-400" />
          Rezultati
        </Link>
        <Link
          to="/profil"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2 text-sm text-warm-700 hover:bg-warm-50 hover:text-warm-900 transition-colors"
        >
          <User size={15} className="text-warm-400" />
          Moj profil
        </Link>
      </div>

      <div className="border-t border-warm-100 py-1.5">
        <button
          onClick={() => {
            onClose();
            logout();
          }}
          disabled={isPending}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors disabled:opacity-60"
        >
          <LogOut size={15} />
          {isPending ? "Odjava..." : "Odjavi se"}
        </button>
      </div>
    </div>
  );
}

const PUBLIC_NAV = [
  { to: "/predmeti", label: "Predmeti", icon: GraduationCap },
];

const AUTH_NAV = [
  { to: "/dashboard", label: "Početna", icon: LayoutDashboard },
  { to: "/rezultati", label: "Statistike", icon: BarChart2 },
];

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = !!token;

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const desktopLinks = isAuthenticated
    ? [...PUBLIC_NAV, ...AUTH_NAV]
    : PUBLIC_NAV;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-warm-200 shadow-[0_1px_0_0_rgb(0_0_0/0.04)]">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-700 transition-colors shadow-sm">
              <BookOpenCheck size={17} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-warm-900">
              Matura<span className="text-primary-600">Pro</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {desktopLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive(to)
                    ? "bg-primary-50 text-primary-700"
                    : "text-warm-600 hover:text-warm-900 hover:bg-warm-100",
                )}
              >
                {label}
              </Link>
            ))}

            {!isAuthenticated && (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-100 transition-all duration-150"
                >
                  Prijava
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all duration-150 shadow-sm"
                >
                  Registracija
                </Link>
              </div>
            )}

            {isAuthenticated && (
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-warm-100 transition-colors"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <UserAvatar user={user} />
                  <ChevronDown
                    size={14}
                    className={cn(
                      "text-warm-400 transition-transform duration-200",
                      dropdownOpen && "rotate-180",
                    )}
                  />
                </button>

                {dropdownOpen && (
                  <ProfileDropdown
                    user={user}
                    onClose={() => setDropdownOpen(false)}
                  />
                )}
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && <UserAvatar user={user} />}
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-600 border border-primary-200 hover:bg-primary-50 transition-colors"
              >
                Prijava
              </Link>
            )}
            <button
              className="p-2 rounded-lg text-warm-600 hover:bg-warm-100 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Zatvori izbornik" : "Otvori izbornik"}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-warm-200 bg-white animate-fade-in">
          <nav className="page-container py-3 flex flex-col gap-1">
            {PUBLIC_NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive(to)
                    ? "bg-primary-50 text-primary-700"
                    : "text-warm-600 hover:text-warm-900 hover:bg-warm-100",
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                {AUTH_NAV.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive(to)
                        ? "bg-primary-50 text-primary-700"
                        : "text-warm-600 hover:text-warm-900 hover:bg-warm-100",
                    )}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                ))}

                <Link
                  to="/profil"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-100 transition-colors"
                >
                  <User size={15} />
                  Moj profil
                </Link>

                <div className="border-t border-warm-100 mt-1 pt-1">
                  <div className="px-4 py-2.5 flex items-center gap-3">
                    <UserAvatar user={user} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-warm-900">
                        {user?.name ?? user?.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-warm-400">{user?.email}</p>
                    </div>
                  </div>
                  <MobileLogoutButton onClose={() => setMobileOpen(false)} />
                </div>
              </>
            ) : (
              <div className="border-t border-warm-100 mt-1 pt-2 flex flex-col gap-1.5">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-center text-warm-700 border border-warm-300 hover:bg-warm-50 transition-colors"
                >
                  Prijava
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-center text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Registracija
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileLogoutButton({ onClose }) {
  const { logout, isPending } = useLogout();
  return (
    <button
      onClick={() => {
        onClose();
        logout();
      }}
      disabled={isPending}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium text-error-600 hover:bg-error-50 transition-colors disabled:opacity-60"
    >
      <LogOut size={15} />
      {isPending ? "Odjava..." : "Odjavi se"}
    </button>
  );
}
