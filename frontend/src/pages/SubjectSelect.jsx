// pages/SubjectSelect.jsx
import { useState, useMemo, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  Filter,
  X,
  ChevronDown,
  BookOpen,
  Layers,
} from "lucide-react";
import { ExamCard } from "@/components/exam/ExamCard";
import {
  SUBJECTS,
  EXAM_YEARS,
  EXAM_SESSIONS,
  DIFFICULTY_LEVELS,
} from "@/utils/constants";
import { cn } from "@/utils/utils";

// ─── Mock exam generator (zamijeni s API kad bude spreman) ────────────────────
function generateExams(subjectId) {
  const exams = [];
  EXAM_YEARS.forEach((year) => {
    EXAM_SESSIONS.slice(0, year >= 2022 ? 3 : 2).forEach((session) => {
      DIFFICULTY_LEVELS.forEach((level) => {
        exams.push({
          id: `${subjectId}-${year}-${session.id}-${level.id}`,
          subjectId,
          year,
          session,
          difficulty: level,
          questionCount: level.id === "visa" ? 40 : 30,
          duration: level.id === "visa" ? 90 : 70,
        });
      });
    });
  });
  return exams;
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({ active, onClick, children, activeClassName }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold",
        "border transition-all duration-150 select-none",
        active
          ? cn("shadow-sm", activeClassName)
          : "bg-white border-warm-200 text-warm-600 hover:border-warm-300 hover:bg-warm-50",
      )}
    >
      {children}
      {active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-0.5"
        >
          <X size={10} strokeWidth={2.5} />
        </motion.span>
      )}
    </motion.button>
  );
}

// ─── Subject switcher pill ────────────────────────────────────────────────────
function SubjectSwitcher({ currentId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const current = SUBJECTS.find((s) => s.id === currentId);
  const CurrentIcon = current?.icon;

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold",
          "bg-white border-warm-200 text-warm-700 hover:border-warm-300",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-150",
        )}
      >
        {CurrentIcon && (
          <CurrentIcon size={14} className={current.color.text} />
        )}
        <span className="hidden sm:inline">{current?.name}</span>
        <span className="sm:hidden">{current?.shortName}</span>
        <ChevronDown
          size={13}
          className={cn(
            "text-warm-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 z-20 bg-white border border-warm-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden min-w-[200px]"
            >
              {SUBJECTS.map((s) => {
                const Icon = s.icon;
                const isCurrent = s.id === currentId;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      navigate(`/predmeti/${s.id}`);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                      isCurrent
                        ? "bg-warm-50 text-warm-900"
                        : "text-warm-600 hover:bg-warm-50 hover:text-warm-900",
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                        s.color.bg,
                      )}
                    >
                      <Icon size={13} className={s.color.text} />
                    </div>
                    <span className="flex-1 text-left">{s.name}</span>
                    {isCurrent && (
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          s.color.dot,
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Year group section ───────────────────────────────────────────────────────
function YearGroup({ year, exams, subject }) {
  const navigate = useNavigate();

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Year header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold",
            subject.color.badge,
            subject.color.border,
          )}
        >
          <BookOpen size={11} />
          {year}.
        </div>
        <div className="h-px flex-1 bg-warm-200" />
        <span className="text-xs text-warm-400 font-medium tabular-nums">
          {exams.length} {exams.length === 1 ? "ispit" : "ispita"}
        </span>
      </div>

      {/* Cards grid */}
      <motion.div
        layout
        variants={{
          show: { transition: { staggerChildren: 0.04 } },
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
      >
        {exams.map((exam) => (
          <motion.div
            key={exam.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            <ExamCard
              exam={exam}
              subject={subject}
              onClick={() => navigate(`/ispit/${exam.id}`)}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="text-center py-16 px-4"
    >
      <div className="w-14 h-14 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Filter size={22} className="text-warm-400" />
      </div>
      <p className="text-warm-700 font-semibold mb-1">Nema rezultata</p>
      <p className="text-warm-400 text-sm mb-5">
        Nema ispita za odabrane filtre.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3.5 py-2 rounded-xl transition-colors"
      >
        <X size={12} />
        Ukloni filtre
      </button>
    </motion.div>
  );
}

// ─── Active filter summary ────────────────────────────────────────────────────
function ActiveFiltersBadge({ count, filterYear, filterLevel, onReset }) {
  if (count === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 text-xs text-warm-500"
    >
      {filterYear && (
        <span className="bg-warm-100 text-warm-700 px-2 py-0.5 rounded-md font-semibold">
          {filterYear}.
        </span>
      )}
      {filterLevel && (
        <span className="bg-warm-100 text-warm-700 px-2 py-0.5 rounded-md font-semibold">
          {DIFFICULTY_LEVELS.find((d) => d.id === filterLevel)?.short}
        </span>
      )}
      <button
        onClick={onReset}
        className="text-warm-400 hover:text-warm-700 transition-colors ml-1"
        title="Ukloni sve filtre"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ─── SubjectsPage ─────────────────────────────────────────────────────────────
export function SubjectsPage() {
  const { subjectId } = useParams();
  const [filterYear, setFilterYear] = useState(null);
  const [filterLevel, setFilterLevel] = useState(null);
  const filterRef = useRef(null);

  const subject = SUBJECTS.find((s) => s.id === subjectId);

  // Derived data
  const allExams = useMemo(
    () => (subject ? generateExams(subjectId) : []),
    [subjectId, subject],
  );

  const filtered = useMemo(() => {
    return allExams.filter((e) => {
      if (filterYear && e.year !== filterYear) return false;
      if (filterLevel && e.difficulty.id !== filterLevel) return false;
      return true;
    });
  }, [allExams, filterYear, filterLevel]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, exam) => {
      const yr = exam.year;
      if (!acc[yr]) acc[yr] = [];
      acc[yr].push(exam);
      return acc;
    }, {});
  }, [filtered]);

  const sortedYears = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  const hasFilters = filterYear !== null || filterLevel !== null;
  const activeFilterCount = (filterYear ? 1 : 0) + (filterLevel ? 1 : 0);

  function resetFilters() {
    setFilterYear(null);
    setFilterLevel(null);
  }

  // ── 404 predmet ──────────────────────────────────────────────────────────
  if (!subject) {
    return (
      <div className="page-container py-20 text-center">
        <div className="w-14 h-14 bg-error-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={24} className="text-error-500" />
        </div>
        <p className="font-semibold text-warm-800 mb-1">
          Predmet nije pronađen
        </p>
        <p className="text-sm text-warm-500 mb-5">
          Provjeri URL ili se vrati na početnu.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft size={14} />
          Natrag na početnu
        </Link>
      </div>
    );
  }

  const Icon = subject.icon;

  return (
    <div className="flex-1 page-container py-8 md:py-10">
      {/* ── Top nav row ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-warm-500 hover:text-warm-900 transition-colors"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Svi predmeti</span>
          <span className="sm:hidden">Natrag</span>
        </Link>
        <SubjectSwitcher currentId={subjectId} />
      </motion.div>

      {/* ── Subject hero card ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative rounded-3xl border overflow-hidden mb-7 p-6 md:p-8",
          subject.color.bg,
          subject.color.border,
        )}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "currentColor" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ background: "currentColor" }}
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Icon */}
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Icon size={28} className={subject.color.text} />
          </div>

          {/* Text */}
          <div className="flex-1">
            <h1
              className={cn(
                "text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-1",
                subject.color.text,
              )}
            >
              {subject.name}
            </h1>
            <p className="text-sm text-warm-600 leading-relaxed">
              {subject.description}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-3">
              {[
                {
                  icon: BookOpen,
                  value: `${subject.examCount}`,
                  label: "ispita",
                },
                { icon: Clock, value: `${EXAM_YEARS.length}`, label: "godina" },
                { icon: Layers, value: "2", label: "razine" },
              ].map(({ icon: StatIcon, value, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <StatIcon size={12} className="text-warm-400" />
                  <span className="text-sm font-bold text-warm-900">
                    {value}
                  </span>
                  <span className="text-xs text-warm-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <motion.div
        ref={filterRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="sticky top-[57px] z-20 -mx-4 px-4 md:-mx-6 md:px-6 py-3 bg-warm-100/90 backdrop-blur-sm border-b border-warm-200 mb-7"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Icon + label */}
          <div className="flex items-center gap-1.5 mr-1">
            <Filter size={13} className="text-warm-400" />
            <span className="text-[11px] font-bold text-warm-400 uppercase tracking-widest hidden sm:inline">
              Filtriraj
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-warm-300" />

          {/* Year chips */}
          {EXAM_YEARS.map((yr) => (
            <FilterChip
              key={yr}
              active={filterYear === yr}
              onClick={() => setFilterYear(filterYear === yr ? null : yr)}
              activeClassName={cn(subject.color.badge, subject.color.border)}
            >
              {yr}.
            </FilterChip>
          ))}

          {/* Divider */}
          <div className="w-px h-4 bg-warm-300" />

          {/* Level chips */}
          {DIFFICULTY_LEVELS.map((lvl) => (
            <FilterChip
              key={lvl.id}
              active={filterLevel === lvl.id}
              onClick={() =>
                setFilterLevel(filterLevel === lvl.id ? null : lvl.id)
              }
              activeClassName={
                lvl.id === "visa"
                  ? "bg-amber-50 text-amber-700 border-amber-300 shadow-amber-100"
                  : cn(subject.color.badge, subject.color.border)
              }
            >
              <Layers size={9} />
              {lvl.short}
            </FilterChip>
          ))}

          {/* Active filter count + reset */}
          <AnimatePresence mode="wait">
            {hasFilters && (
              <ActiveFiltersBadge
                count={activeFilterCount}
                filterYear={filterYear}
                filterLevel={filterLevel}
                onReset={resetFilters}
              />
            )}
          </AnimatePresence>

          {/* Spacer + result count */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-warm-400 font-medium tabular-nums">
            <span
              className={cn(
                "font-bold",
                hasFilters ? subject.color.text : "text-warm-700",
              )}
            >
              {filtered.length}
            </span>
            <span>/ {allExams.length} ispita</span>
          </div>
        </div>
      </motion.div>

      {/* ── Exam list ────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {sortedYears.length === 0 ? (
          <EmptyState key="empty" onReset={resetFilters} />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <AnimatePresence>
              {sortedYears.map((year) => (
                <YearGroup
                  key={year}
                  year={year}
                  exams={grouped[year]}
                  subject={subject}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
