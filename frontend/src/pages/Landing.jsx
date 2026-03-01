// pages/Landing.jsx
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  BarChart2,
  BookOpenCheck,
  ChevronRight,
  Zap,
  TrendingUp,
  Star,
  GraduationCap,
} from "lucide-react";
import { SUBJECTS } from "@/utils/constants";
import { cn } from "@/utils/utils";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay },
  }),
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Reusable InView wrapper ──────────────────────────────────────────────────

function InViewSection({ children, className, delay = 0, threshold = 0.15 }) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: true,
    margin: "-60px",
    amount: threshold,
  });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Floating Exam Preview Card ───────────────────────────────────────────────

function FloatingExamCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow behind */}
      <div className="absolute inset-0 -m-6 bg-gradient-to-br from-primary-200 via-primary-100 to-transparent rounded-3xl blur-2xl opacity-60 pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        style={{ perspective: "1000px" }}
        className="relative bg-white rounded-2xl border border-warm-200 shadow-[0_8px_40px_-8px_rgba(45,84,232,0.18)] overflow-hidden"
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-primary-700" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-[11px] font-bold text-primary-600 uppercase tracking-widest">
                  Matematika · B razina
                </span>
              </div>
              <p className="text-xs text-warm-500">
                Ljetni rok 2024 · 40 pitanja
              </p>
            </div>
            <div className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-primary-100">
              90 min
            </div>
          </div>

          {/* Fake question */}
          <div className="bg-warm-50 rounded-xl p-4 mb-3 border border-warm-200">
            <p className="text-xs font-semibold text-warm-700 mb-3 leading-relaxed">
              1. Kolika je vrijednost izraza{" "}
              <span className="font-mono text-primary-600">3x² + 2x - 1</span>{" "}
              za <span className="font-mono text-primary-600">x = 2</span>?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "A", val: "11", correct: false },
                { id: "B", val: "15", correct: true },
                { id: "C", val: "13", correct: false },
                { id: "D", val: "9", correct: false },
              ].map(({ id, val, correct }) => (
                <motion.div
                  key={id}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-default transition-colors",
                    correct
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-white border-warm-200 text-warm-700",
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                      correct
                        ? "bg-white/20 text-white"
                        : "bg-warm-100 text-warm-500",
                    )}
                  >
                    {id}
                  </span>
                  {val}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center justify-between text-[11px] text-warm-500 mb-1.5">
            <span className="font-medium">12 / 40 pitanja</span>
            <span className="text-primary-600 font-bold">30%</span>
          </div>
          <div className="w-full h-1.5 bg-warm-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "30%" }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Floating result badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 1 }}
        className="absolute -bottom-4 -right-4 bg-white rounded-xl border border-warm-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-3.5 py-2.5 flex items-center gap-2.5"
      >
        <div className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center">
          <TrendingUp size={16} className="text-success-600" />
        </div>
        <div>
          <p className="text-[10px] text-warm-400 font-medium leading-none mb-0.5">
            Zadnji rezultat
          </p>
          <p className="text-sm font-bold text-warm-900 leading-none">87% ✓</p>
        </div>
      </motion.div>

      {/* Floating timer badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 1.15 }}
        className="absolute -top-3 -left-4 bg-white rounded-xl border border-warm-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-3 py-2 flex items-center gap-2"
      >
        <Clock size={13} className="text-amber-500" />
        <span className="text-xs font-bold text-warm-800 font-mono">68:23</span>
      </motion.div>
    </div>
  );
}

// ─── Stats Counter ────────────────────────────────────────────────────────────

const STATS = [
  { value: "132+", label: "Pravih ispita", icon: BookOpenCheck },
  { value: "8", label: "Predmeta", icon: GraduationCap },
  { value: "15k+", label: "Pitanja", icon: Star },
];

function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className="grid grid-cols-3 gap-4 md:gap-6"
    >
      {STATS.map(({ value, label, icon: Icon }, i) => (
        <motion.div
          key={label}
          variants={cardReveal}
          custom={i}
          className="text-center"
        >
          <div className="flex justify-center mb-2">
            <div className="w-9 h-9 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center">
              <Icon size={17} className="text-primary-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-warm-900 tracking-tight leading-none mb-1">
            {value}
          </div>
          <div className="text-xs text-warm-500 font-medium">{label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: "01",
    icon: GraduationCap,
    title: "Odaberi predmet",
    desc: "Pronađi predmet koji polažeš — od matematike do kemije. 8 najčešćih predmeta državne mature.",
    color: "primary",
  },
  {
    step: "02",
    icon: Zap,
    title: "Odaberi pravi ispit",
    desc: "Filtriraj po godini, roku i razini (A ili B). Riješavaš točno onaj ispit koji te zanima.",
    color: "amber",
  },
  {
    step: "03",
    icon: BarChart2,
    title: "Vidi rezultate",
    desc: "Odmah po predaji vidiš detaljnu analizu — koje si pogriješio, zašto, i kako napredovati.",
    color: "success",
  },
];

function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="relative">
      {/* Connector line */}
      <div className="hidden md:block absolute top-10 left-[calc(33%_-_1px)] right-[33%] h-px bg-gradient-to-r from-primary-200 via-amber-200 to-success-500/50" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="grid md:grid-cols-3 gap-6"
      >
        {STEPS.map(({ step, icon: Icon, title, desc, color }, i) => (
          <motion.div
            key={step}
            variants={cardReveal}
            custom={i}
            className="relative"
          >
            <div className="bg-white border border-warm-200 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-300">
              {/* Step badge */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    color === "primary" &&
                      "bg-primary-50 border border-primary-100",
                    color === "amber" && "bg-amber-50 border border-amber-100",
                    color === "success" &&
                      "bg-success-50 border border-green-100",
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      color === "primary" && "text-primary-600",
                      color === "amber" && "text-amber-600",
                      color === "success" && "text-success-600",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-3xl font-black tabular-nums leading-none",
                    color === "primary" && "text-primary-100",
                    color === "amber" && "text-amber-100",
                    color === "success" && "text-green-100",
                  )}
                >
                  {step}
                </span>
              </div>
              <h3 className="text-base font-bold text-warm-900 mb-2 tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-warm-500 leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────

function SubjectCard({ subject, featured = false, index = 0 }) {
  const navigate = useNavigate();
  const Icon = subject.icon;

  return (
    <motion.div variants={cardReveal} custom={index}>
      <motion.div
        onClick={() => navigate(`/predmeti/${subject.id}`)}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className={cn(
          "group relative bg-white rounded-2xl border border-warm-200 overflow-hidden cursor-pointer",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
          "hover:shadow-[0_8px_30px_-4px_rgba(45,84,232,0.12)] hover:border-warm-300",
          "transition-all duration-300",
        )}
      >
        {/* Top gradient line */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl",
            `bg-gradient-to-r ${subject.color.gradient}`,
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          )}
        />

        <div className={cn("p-5", featured ? "pb-4" : "pb-3")}>
          <div className="flex items-start justify-between mb-3">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border",
                subject.color.bg,
                subject.color.border,
              )}
            >
              <Icon size={19} className={subject.color.text} />
            </div>
            <span
              className={cn(
                "text-[11px] font-bold px-2 py-1 rounded-lg",
                subject.color.badge,
              )}
            >
              {subject.examCount} ispita
            </span>
          </div>

          <h3 className="font-bold text-warm-900 text-base leading-snug tracking-tight">
            {subject.name}
          </h3>
          {featured && (
            <p className="mt-1 text-sm text-warm-500 leading-relaxed line-clamp-2">
              {subject.description}
            </p>
          )}
        </div>

        <div
          className={cn(
            "px-5 py-3 border-t border-warm-100 flex items-center justify-between",
            "bg-warm-50 group-hover:bg-primary-50 transition-colors duration-300",
          )}
        >
          <span
            className={cn(
              "text-xs font-bold tracking-wide",
              subject.color.text,
            )}
          >
            {subject.shortName}
          </span>
          <div className="flex items-center gap-1 text-xs font-semibold text-warm-400 group-hover:text-primary-600 transition-colors duration-200">
            <span className="hidden sm:inline">Počni</span>
            <ArrowRight
              size={13}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 md:p-12 text-center"
    >
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary-400/20 rounded-full blur-2xl pointer-events-none" />
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
        >
          <Sparkles size={11} />
          Besplatno za sve učenike
        </motion.div>

        <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight text-balance mb-3">
          Spreman za maturu?
        </h2>
        <p className="text-primary-200 text-base max-w-md mx-auto leading-relaxed mb-8">
          Kreni s vježbanjem odmah — bez registracije. Stotine pravih ispita
          čekaju.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/predmeti/matematika")}
            className="flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.25)] transition-shadow duration-200"
          >
            Počni odmah
            <ArrowRight size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/register")}
            className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/15 transition-colors duration-200"
          >
            Stvori račun
          </motion.button>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {[
            { icon: CheckCircle2, text: "Pravi NCVVO ispiti" },
            { icon: CheckCircle2, text: "Odmah vidiš rezultate" },
            { icon: CheckCircle2, text: "Prati napredak" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-1.5 text-white/70 text-xs"
            >
              <Icon size={12} className="text-white/50" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({ label, title, subtitle }) {
  return (
    <div className="mb-8">
      {label && (
        <div className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-100 text-xs font-bold px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
          {label}
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-bold text-warm-900 tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-warm-500 text-base leading-relaxed max-w-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const navigate = useNavigate();
  const popularSubjects = SUBJECTS.filter((s) => s.isPopular);
  const otherSubjects = SUBJECTS.filter((s) => !s.isPopular);

  const subjectsRef = useRef(null);
  const subjectsInView = useInView(subjectsRef, {
    once: true,
    margin: "-50px",
  });

  return (
    <main className="flex-1">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-primary-100 rounded-full opacity-30 blur-3xl" />
          <div className="absolute top-40 -left-20 w-72 h-72 bg-amber-100 rounded-full opacity-25 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-primary-50 rounded-full opacity-40 blur-2xl" />
        </div>

        <div className="relative page-container py-14 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: text */}
            <div>
              {/* Pill badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5"
              >
                <Sparkles size={11} />
                Pravi NCVVO ispiti · Odmah dostupno
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.08,
                }}
                className="text-4xl md:text-5xl lg:text-[52px] font-bold text-warm-900 tracking-tight leading-[1.12] text-balance mb-5"
              >
                Pripremi se za
                <br />
                <span className="relative inline-block">
                  <span className="text-primary-600">državnu maturu</span>
                  {/* Underline accent */}
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                      delay: 0.6,
                    }}
                    className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-primary-400 to-primary-600 rounded-full origin-left"
                  />
                </span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.18,
                }}
                className="text-warm-500 text-lg leading-relaxed mb-8 max-w-md"
              >
                Riješi stvarne ispite iz prethodnih godina, odmah vidi analizu
                grešaka i prati napredak po predmetima.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.26,
                }}
                className="flex flex-wrap gap-3 mb-10"
              >
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/predmeti/matematika")}
                  className={cn(
                    "flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold text-sm",
                    "shadow-[0_4px_20px_rgba(45,84,232,0.28)] hover:shadow-[0_8px_30px_rgba(45,84,232,0.36)]",
                    "hover:bg-primary-700 transition-all duration-200",
                  )}
                >
                  Počni vježbati
                  <ArrowRight size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    document
                      .getElementById("predmeti")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={cn(
                    "flex items-center gap-2 bg-white text-warm-700 px-6 py-3 rounded-xl font-semibold text-sm",
                    "border border-warm-200 hover:border-warm-300 hover:bg-warm-50",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200",
                  )}
                >
                  Pregledaj predmete
                  <ChevronRight size={15} />
                </motion.button>
              </motion.div>

              {/* Inline trust signals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                {["132+ ispita", "8 predmeta", "Besplatno"].map((text) => (
                  <div
                    key={text}
                    className="flex items-center gap-1.5 text-sm text-warm-500"
                  >
                    <CheckCircle2
                      size={14}
                      className="text-success-500 flex-shrink-0"
                    />
                    <span>{text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: exam card preview */}
            <div className="hidden lg:block">
              <FloatingExamCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-warm-200 bg-white">
        <div className="page-container py-8 md:py-10">
          <StatsBar />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="page-container py-14 md:py-16">
        <InViewSection>
          <SectionHeading
            label="Kako radi"
            title="Tri koraka do boljeg rezultata"
            subtitle="Jednostavno kao što se zvuči — odaberi ispit, riješi ga, vidi gdje griješiš."
          />
        </InViewSection>
        <InViewSection delay={0.1}>
          <HowItWorks />
        </InViewSection>
      </section>

      {/* ── Popular Subjects ──────────────────────────────────────────────── */}
      <section id="predmeti" className="bg-white border-y border-warm-200">
        <div className="page-container py-14 md:py-16">
          <InViewSection>
            <SectionHeading
              label="Popularni predmeti"
              title="Najčešće polagani predmeti"
              subtitle="Matematika, Hrvatski i Engleski — tri obavezna predmeta s najviše dostupnih ispita."
            />
          </InViewSection>

          <motion.div
            ref={subjectsRef}
            variants={staggerContainer}
            initial="hidden"
            animate={subjectsInView ? "show" : "hidden"}
            className="grid md:grid-cols-3 gap-5 mb-6"
          >
            {popularSubjects.map((subject, i) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                featured
                index={i}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── All Subjects ──────────────────────────────────────────────────── */}
      <section className="page-container py-14 md:py-16">
        <InViewSection>
          <SectionHeading
            title="Ostali predmeti"
            subtitle="Polažeš izborni predmet? Imamo ispite i za fiziku, kemiju, biologiju i ostale."
          />
        </InViewSection>

        <InViewSection delay={0.1}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {otherSubjects.map((subject, i) => (
              <SubjectCard key={subject.id} subject={subject} index={i} />
            ))}
          </motion.div>
        </InViewSection>
      </section>

      {/* ── Feature Highlights ────────────────────────────────────────────── */}
      <section className="bg-white border-y border-warm-200">
        <div className="page-container py-14 md:py-16">
          <InViewSection>
            <SectionHeading
              label="Zašto MaturaPrip"
              title="Sve što trebaš za maturu"
            />
          </InViewSection>

          <InViewSection delay={0.1}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: BookOpenCheck,
                  title: "Pravi NCVVO ispiti",
                  desc: "Koristimo originalne ispite Nacionalnog centra za vanjsko vrednovanje obrazovanja.",
                  color: "primary",
                },
                {
                  icon: BarChart2,
                  title: "Detaljna analiza",
                  desc: "Po predaji odmah vidiš koji si odgovor pogriješio, koji bio točan, i koliko bodova imaš.",
                  color: "amber",
                },
                {
                  icon: Clock,
                  title: "Vremensko ograničenje",
                  desc: "Ispit rješavaš pod pravim uvjetima — s odbrojavanjem kao na stvarnoj maturi.",
                  color: "success",
                },
                {
                  icon: TrendingUp,
                  title: "Praćenje napretka",
                  desc: "Vidi kako ti se rezultati poboljšavaju kroz tjedne. Streak motivira nastavak.",
                  color: "primary",
                },
                {
                  icon: Star,
                  title: "Označi pitanja",
                  desc: "Označi pitanja na koja nisi siguran i vrati im se na kraju — baš kao na pravom ispitu.",
                  color: "amber",
                },
                {
                  icon: Zap,
                  title: "Brzo i lagano",
                  desc: "Bez instalacije, bez registracije za osnovno korištenje. Otvori i počni odmah.",
                  color: "success",
                },
              ].map(({ icon: Icon, title, desc, color }, i) => (
                <motion.div
                  key={title}
                  variants={cardReveal}
                  whileInView="show"
                  initial="hidden"
                  viewport={{ once: true, margin: "-30px" }}
                  custom={i}
                  className="p-5 bg-warm-50 rounded-2xl border border-warm-200 hover:border-warm-300 hover:bg-white transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                      color === "primary" && "bg-primary-100",
                      color === "amber" && "bg-amber-100",
                      color === "success" && "bg-success-50",
                    )}
                  >
                    <Icon
                      size={18}
                      className={cn(
                        color === "primary" && "text-primary-600",
                        color === "amber" && "text-amber-600",
                        color === "success" && "text-success-600",
                      )}
                    />
                  </div>
                  <h3 className="font-bold text-warm-900 text-sm mb-1.5 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-warm-500 leading-relaxed">
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </InViewSection>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="page-container py-14 md:py-16">
        <CTASection />
      </section>
    </main>
  );
}
