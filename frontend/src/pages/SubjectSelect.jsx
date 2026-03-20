import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  HelpCircle,
  X,
  Layers,
  RefreshCw,
  Users,
  BookOpen,
} from "lucide-react";
import { ExamCard } from "@/components/exam/ExamCard";
import { SUBJECTS, DIFFICULTY_LEVELS, EXAM_SESSIONS } from "@/utils/constants";
import { transformExam } from "@/utils/examHelpers";
import { useExams } from "@/hooks/useExam";
import { useSubjectFilters } from "@/hooks/useSubjectFilters";
import { cn } from "@/utils/cn";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ExamListSkeleton } from "@/components/common/Skeleton";

function FilterChip({
  active,
  onClick,
  children,
  activeCls = "bg-primary-100 text-primary-700 border-primary-300",
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0",
        "text-xs font-bold border transition-all duration-150 select-none whitespace-nowrap",
        active
          ? cn(activeCls, "shadow-sm")
          : "bg-white border-warm-200 text-warm-500 hover:border-warm-400 hover:text-warm-700",
      )}
    >
      {children}
      {active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.12 }}
        >
          <X size={10} strokeWidth={2.5} />
        </motion.span>
      )}
    </motion.button>
  );
}

function FilterBar({
  subject,
  availableYears,
  availableSessions,
  filterYear,
  filterLevel,
  filterSession,
  hasActiveFilters,
  totalCount,
  filteredCount,
  onYear,
  onLevel,
  onSession,
  onReset,
}) {
  const showSessionFilter = availableSessions.length > 1;

  return (
    <div className="sticky top-14 z-20 bg-warm-100/95 backdrop-blur-sm border-b border-warm-200 py-2.5 mb-5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 w-max pr-1">
            {availableYears.map((year) => (
              <FilterChip
                key={year}
                active={filterYear === year}
                onClick={() => onYear(filterYear === year ? null : year)}
                activeCls={cn(subject.color.badge, subject.color.border)}
              >
                {year}.
              </FilterChip>
            ))}

            <div className="w-px h-4 bg-warm-300 mx-0.5 flex-shrink-0" />

            {showSessionFilter &&
              availableSessions.map((session) => (
                <FilterChip
                  key={session.id}
                  active={filterSession === session.id}
                  onClick={() =>
                    onSession(filterSession === session.id ? null : session.id)
                  }
                  activeCls="bg-sky-50 text-sky-700 border-sky-300"
                >
                  {session.name.replace(" rok", "")}
                </FilterChip>
              ))}

            {showSessionFilter && (
              <div className="w-px h-4 bg-warm-300 mx-0.5 flex-shrink-0" />
            )}

            {DIFFICULTY_LEVELS.map((lvl) => (
              <FilterChip
                key={lvl.id}
                active={filterLevel === lvl.id}
                onClick={() => onLevel(filterLevel === lvl.id ? null : lvl.id)}
                activeCls={
                  lvl.id === "visa"
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : cn(subject.color.badge, subject.color.border)
                }
              >
                <Layers size={9} />
                {lvl.short}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pl-2 border-l border-warm-200">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              title="Ukloni sve filtre"
              className="flex items-center gap-1 text-xs font-bold text-warm-400 hover:text-warm-800 transition-colors p-0.5"
            >
              <X size={13} />
            </button>
          )}
          <span className="text-xs text-warm-400 font-medium tabular-nums whitespace-nowrap">
            <span
              className={cn(
                "font-bold",
                hasActiveFilters ? subject.color.text : "text-warm-700",
              )}
            >
              {filteredCount}
            </span>
            <span className="hidden sm:inline text-warm-400">
              {" "}
              / {totalCount}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function YearGroup({ year, exams, subject, onExamSelect }) {
  const sorted = [...exams].sort((a, b) => {
    const sessionDiff = (a.session.order ?? 99) - (b.session.order ?? 99);
    if (sessionDiff !== 0) return sessionDiff;
    return a.difficulty.id === "visa" ? 1 : -1;
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-bold text-warm-500 tabular-nums">
          {year}.
        </span>
        <div className="h-px flex-1 bg-warm-200" />
        <span className="text-xs text-warm-400">
          {sorted.length} {sorted.length === 1 ? "ispit" : "ispita"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sorted.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            subject={subject}
            onClick={() => onExamSelect(exam.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function SubjectNotFound() {
  return (
    <div className="page-container py-20 text-center">
      <div className="w-14 h-14 bg-error-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <HelpCircle size={24} className="text-error-500" />
      </div>
      <p className="font-semibold text-warm-800 mb-1">Predmet nije pronađen</p>
      <p className="text-sm text-warm-500 mb-5">
        Provjeri URL ili se vrati na popis predmeta.
      </p>
      <Link
        to="/predmeti"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Svi predmeti
      </Link>
    </div>
  );
}

function SubjectHasNoExams({ subject }) {
  return (
    <div className="text-center py-20">
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4",
          subject.color.bg,
        )}
      >
        <BookOpen size={22} className={subject.color.text} />
      </div>
      <p className="font-semibold text-warm-800 mb-1">
        Još nema ispita za {subject.name}
      </p>
      <p className="text-sm text-warm-500 mb-5">
        Ispiti će biti dostupni čim ih dodamo u sustav.
      </p>
      <Link
        to="/predmeti"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Svi predmeti
      </Link>
    </div>
  );
}

function EmptyFilterResults({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16"
    >
      <p className="text-warm-600 font-semibold mb-3">
        Nema ispita s ovim filterima
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3.5 py-2 rounded-xl transition-colors"
      >
        <X size={12} />
        Ukloni sve filtre
      </button>
    </motion.div>
  );
}

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

function CommunityScoreNote({ exams }) {
  const hasCommunityData = exams.some(
    (e) => e.communityScore !== null && e.communityAttempts > 0,
  );
  if (!hasCommunityData) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-warm-400 mb-5">
      <Users size={11} className="flex-shrink-0" />
      <span>Prikazani % je prosječni rezultat svih korisnika za taj ispit</span>
    </div>
  );
}

export function SubjectsPage() {
  usePageTitle("Odabir ispita");
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const subject = SUBJECTS.find((s) => s.id === subjectId);

  const {
    filterYear,
    filterLevel,
    filterSession,
    hasActiveFilters,
    setFilter,
    resetFilters,
  } = useSubjectFilters();

  const { data: rawExams, isLoading, error, refetch } = useExams(subjectId);

  const allExams = useMemo(
    () => (rawExams ?? []).map(transformExam),
    [rawExams],
  );

  const availableYears = useMemo(
    () => [...new Set(allExams.map((e) => e.year))].sort((a, b) => b - a),
    [allExams],
  );

  const availableSessions = useMemo(
    () =>
      EXAM_SESSIONS.filter((s) =>
        allExams.some((e) => e._sessionNorm === s.id),
      ),
    [allExams],
  );

  const filtered = useMemo(
    () =>
      allExams.filter((e) => {
        if (filterYear && e.year !== filterYear) return false;
        if (filterLevel && e.difficulty.id !== filterLevel) return false;
        if (filterSession && e._sessionNorm !== filterSession) return false;
        return true;
      }),
    [allExams, filterYear, filterLevel, filterSession],
  );

  const groupedByYear = useMemo(
    () =>
      filtered.reduce((acc, exam) => {
        (acc[exam.year] ??= []).push(exam);
        return acc;
      }, {}),
    [filtered],
  );

  const sortedYears = Object.keys(groupedByYear)
    .map(Number)
    .sort((a, b) => b - a);

  const skeletonCount = Math.min(Math.max(availableYears.length * 2, 4), 8);

  if (!subject) return <SubjectNotFound />;

  return (
    <div className="page-container py-8 md:py-10 max-w-3xl mx-auto">
      <div className="mb-5">
        <Link
          to="/predmeti"
          className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Svi predmeti
        </Link>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              subject.color.bg,
            )}
          >
            <subject.icon size={20} className={subject.color.text} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-warm-900 tracking-tight">
              {subject.name}
            </h1>
            <p className="text-sm text-warm-500">
              {isLoading
                ? "Učitavanje ispita..."
                : `${allExams.length} ispita dostupno`}
            </p>
          </div>
        </div>
      </div>

      {!isLoading && !error && allExams.length > 0 && (
        <FilterBar
          subject={subject}
          availableYears={availableYears}
          availableSessions={availableSessions}
          filterYear={filterYear}
          filterLevel={filterLevel}
          filterSession={filterSession}
          hasActiveFilters={hasActiveFilters}
          totalCount={allExams.length}
          filteredCount={filtered.length}
          onYear={(v) => setFilter("year", v)}
          onLevel={(v) => setFilter("level", v)}
          onSession={(v) => setFilter("session", v)}
          onReset={resetFilters}
        />
      )}

      {!isLoading && !error && <CommunityScoreNote exams={allExams} />}

      {isLoading ? (
        <ExamListSkeleton count={skeletonCount} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : allExams.length === 0 ? (
        <SubjectHasNoExams subject={subject} />
      ) : (
        <AnimatePresence mode="wait">
          {sortedYears.length === 0 ? (
            <EmptyFilterResults key="empty" onReset={resetFilters} />
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
                    exams={groupedByYear[year]}
                    subject={subject}
                    onExamSelect={(id) => navigate(`/ispit/${id}`)}
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
