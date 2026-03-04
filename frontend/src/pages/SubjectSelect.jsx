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
  RefreshCw,
} from "lucide-react";
import { ExamCard } from "@/components/exam/ExamCard";
import { SUBJECTS, EXAM_SESSIONS, DIFFICULTY_LEVELS } from "@/utils/constants";
import { useExams } from "@/hooks/useExam";
import { cn } from "@/utils/utils";

// ── Transformacija DB formata u format koji ExamCard očekuje ──────────────────
// DB:    { id, subject_id, year, session: 'ljetni', level: 'visa', duration_minutes: 90 }
// Card:  { id, subjectId, year, session: {id,name}, difficulty: {id,name,short},
//          questionCount, duration }
function transformExam(dbExam) {
  const session = EXAM_SESSIONS.find((s) => s.id === dbExam.session) ?? {
    id: dbExam.session,
    name: dbExam.session,
  };

  const difficulty = DIFFICULTY_LEVELS.find((d) => d.id === dbExam.level) ?? {
    id: dbExam.level,
    name: dbExam.level,
    short: dbExam.level,
  };

  return {
    id: dbExam.id,
    subjectId: dbExam.subject_id,
    year: dbExam.year,
    session,
    difficulty,
    // questionCount nije u exams tablici — računamo iz razine (konzistentno s NCE)
    questionCount: dbExam.level === "visa" ? 40 : 30,
    duration: dbExam.duration_minutes,
  };
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function FilterChip({ active, onClick, children, activeClassName }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold",
        "border transition-all duration-150 select-none",
        active
          ? cn(activeClassName, "shadow-sm")
          : "bg-white border-warm-200 text-warm-500 hover:border-warm-400 hover:text-warm-700",
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

// ── Active filters badge ──────────────────────────────────────────────────────
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

// ── Year group ────────────────────────────────────────────────────────────────
function YearGroup({ year, exams, subject }) {
  const navigate = useNavigate();
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-bold text-warm-700 tabular-nums">
          {year}.
        </span>
        <div className="h-px flex-1 bg-warm-200" />
        <span className="text-xs text-warm-400 font-medium tabular-nums">
          {exams.length} {exams.length === 1 ? "ispit" : "ispita"}
        </span>
      </div>

      <motion.div
        layout
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
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

// ── Empty state ───────────────────────────────────────────────────────────────
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

// ── Skeleton loader ───────────────────────────────────────────────────────────
function ExamCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 p-4 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-warm-200 rounded-md" />
        <div className="h-5 w-14 bg-warm-100 rounded-md" />
      </div>
      <div className="h-4 w-32 bg-warm-100 rounded" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[2024, 2023].map((year) => (
        <div key={year}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-4 w-10 bg-warm-200 rounded animate-pulse" />
            <div className="h-px flex-1 bg-warm-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[1, 2].map((i) => (
              <ExamCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ onRetry }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 bg-error-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <HelpCircle size={22} className="text-error-500" />
      </div>
      <p className="text-warm-700 font-semibold mb-1">
        Greška pri učitavanju ispita
      </p>
      <p className="text-warm-400 text-sm mb-5">
        Provjeri internetsku vezu i pokušaj ponovo.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3.5 py-2 rounded-xl transition-colors"
      >
        <RefreshCw size={12} />
        Pokušaj ponovo
      </button>
    </div>
  );
}

// ── SubjectsPage ──────────────────────────────────────────────────────────────
export function SubjectsPage() {
  const { subjectId } = useParams();
  const [filterYear, setFilterYear] = useState(null);
  const [filterLevel, setFilterLevel] = useState(null);
  const filterRef = useRef(null);

  const subject = SUBJECTS.find((s) => s.id === subjectId);

  // ── Dohvati ispite iz Supabase ────────────────────────────────────────────
  const { data: rawExams, isLoading, error, refetch } = useExams(subjectId);

  // ── Transformiraj u format koji ExamCard očekuje ──────────────────────────
  const allExams = useMemo(
    () => (rawExams ?? []).map(transformExam),
    [rawExams],
  );

  // ── Filtriranje i grupiranje ──────────────────────────────────────────────
  const availableYears = useMemo(
    () => [...new Set(allExams.map((e) => e.year))].sort((a, b) => b - a),
    [allExams],
  );

  const filtered = useMemo(() => {
    return allExams.filter((e) => {
      if (filterYear && e.year !== filterYear) return false;
      if (filterLevel && e.difficulty.id !== filterLevel) return false;
      return true;
    });
  }, [allExams, filterYear, filterLevel]);

  const grouped = useMemo(
    () =>
      filtered.reduce((acc, exam) => {
        const yr = exam.year;
        if (!acc[yr]) acc[yr] = [];
        acc[yr].push(exam);
        return acc;
      }, {}),
    [filtered],
  );

  const sortedYears = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  const hasFilters = filterYear !== null || filterLevel !== null;
  const activeFilterCount = (filterYear ? 1 : 0) + (filterLevel ? 1 : 0);

  function resetFilters() {
    setFilterYear(null);
    setFilterLevel(null);
  }

  // ── 404 predmet ───────────────────────────────────────────────────────────
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
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft size={14} />
          Na početnu
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container py-8 md:py-10 max-w-3xl mx-auto">
      {/* ── Back + header ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Svi predmeti
        </Link>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              subject.color.bg,
            )}
          >
            <subject.icon size={20} className={subject.color.text} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-warm-900 tracking-tight">
              {subject.name}
            </h1>
            <p className="text-sm text-warm-500">{subject.description}</p>
          </div>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      {!isLoading && !error && allExams.length > 0 && (
        <motion.div
          ref={filterRef}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-14 z-20 bg-warm-100/90 backdrop-blur-sm -mx-4 px-4 py-2.5 mb-6 flex items-center gap-2 flex-wrap border-b border-warm-200"
        >
          {/* Year chips */}
          {availableYears.map((year) => (
            <FilterChip
              key={year}
              active={filterYear === year}
              onClick={() => setFilterYear(filterYear === year ? null : year)}
              activeClassName={cn(subject.color.badge, subject.color.border)}
            >
              {year}.
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

          {/* Result count */}
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
        </motion.div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
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
      )}
    </div>
  );
}
