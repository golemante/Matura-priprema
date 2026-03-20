import {
  Calculator,
  BookOpen,
  Globe,
  ScrollText,
  FlaskConical,
  Atom,
  Map,
  Leaf,
} from "lucide-react";

export const SUBJECTS = [
  {
    id: "matematika",
    name: "Matematika",
    shortName: "MAT",
    description: "Algebra, analiza, geometrija i statistika",
    icon: Calculator,
    examCount: 30,
    color: {
      bg: "bg-primary-50",
      text: "text-primary-600",
      border: "border-primary-200",
      dot: "bg-primary-600",
      badge: "bg-primary-100 text-primary-700",
      gradient: "from-primary-500 to-primary-700",
    },
    isPopular: true,
  },
  {
    id: "hrvatski",
    name: "Hrvatski jezik",
    shortName: "HRV",
    description: "Književnost, jezično izražavanje i analiza teksta",
    icon: BookOpen,
    examCount: 28,
    color: {
      bg: "bg-success-50",
      text: "text-success-600",
      border: "border-green-200",
      dot: "bg-success-600",
      badge: "bg-green-100 text-green-700",
      gradient: "from-green-500 to-green-700",
    },
    isPopular: true,
  },
  {
    id: "engleski",
    name: "Engleski jezik",
    shortName: "ENG",
    description: "Čitanje, pisanje, gramatika i komunikacija",
    icon: Globe,
    examCount: 30,
    color: {
      bg: "bg-warning-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
      badge: "bg-amber-100 text-amber-700",
      gradient: "from-amber-400 to-orange-500",
    },
    isPopular: true,
  },
  {
    id: "povijest",
    name: "Povijest",
    shortName: "POV",
    description: "Hrvatska i svjetska povijest od antike do danas",
    icon: ScrollText,
    examCount: 24,
    color: {
      bg: "bg-error-50",
      text: "text-error-600",
      border: "border-red-200",
      dot: "bg-error-600",
      badge: "bg-red-100 text-red-700",
      gradient: "from-red-500 to-red-700",
    },
    isPopular: false,
  },
  {
    id: "kemija",
    name: "Kemija",
    shortName: "KEM",
    description: "Organska i anorganska kemija, reakcije i formule",
    icon: FlaskConical,
    examCount: 22,
    color: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200",
      dot: "bg-cyan-600",
      badge: "bg-cyan-100 text-cyan-700",
      gradient: "from-cyan-500 to-teal-600",
    },
    isPopular: false,
  },
  {
    id: "fizika",
    name: "Fizika",
    shortName: "FIZ",
    description: "Mehanika, termodinamika, elektromagnetizam i optika",
    icon: Atom,
    examCount: 22,
    color: {
      bg: "bg-fuchsia-50",
      text: "text-fuchsia-700",
      border: "border-fuchsia-200",
      dot: "bg-fuchsia-600",
      badge: "bg-fuchsia-100 text-fuchsia-700",
      gradient: "from-fuchsia-500 to-purple-600",
    },
    isPopular: false,
  },
  {
    id: "biologija",
    name: "Biologija",
    shortName: "BIO",
    description: "Stanica, genetika, evolucija i ekosustavi",
    icon: Leaf,
    examCount: 22,
    color: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
      dot: "bg-violet-600",
      badge: "bg-violet-100 text-violet-700",
      gradient: "from-violet-500 to-purple-600",
    },
    isPopular: false,
  },
  {
    id: "geografija",
    name: "Geografija",
    shortName: "GEO",
    description: "Fizička, regionalna i socioekonomska geografija",
    icon: Map,
    examCount: 22,
    color: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
      gradient: "from-emerald-500 to-green-600",
    },
    isPopular: false,
  },
];

export const EXAM_SESSIONS = [
  { id: "ljeto", name: "Ljetni rok", order: 1 },
  { id: "jesen", name: "Jesenski rok", order: 2 },
];

export function normalizeSession(session) {
  if (session === "ljeto" || session === "ljetni") return "ljeto";
  if (session === "jesen" || session === "jesenski") return "jesen";
  return session ?? "";
}

export function sessionDisplayName(session) {
  const norm = normalizeSession(session);
  return EXAM_SESSIONS.find((s) => s.id === norm)?.name ?? session ?? "";
}

export const DIFFICULTY_LEVELS = [
  { id: "visa", name: "Viša razina", short: "A razina" },
  { id: "osnovna", name: "Osnovna razina", short: "B razina" },
];
