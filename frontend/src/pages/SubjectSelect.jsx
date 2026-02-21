import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, ChevronRight, Filter } from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { ExamCard } from "@/components/exam/ExamCard";
import {
  SUBJECTS,
  EXAM_YEARS,
  EXAM_SESSIONS,
  DIFFICULTY_LEVELS,
} from "@/utils/constants";
import { cn } from "@/utils/utils";
import { useState } from "react";

// Mock exam data generator
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

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export function SubjectsPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [filterYear, setFilterYear] = useState(null);
  const [filterLevel, setFilterLevel] = useState(null);

  const subject = SUBJECTS.find((s) => s.id === subjectId);
  if (!subject) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <p className="text-warm-500">Predmet nije pronađen.</p>
          <Link
            to="/"
            className="text-primary-600 font-medium mt-2 inline-block"
          >
            ← Natrag na početnu
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const Icon = subject.icon;
  const allExams = generateExams(subjectId);

  const filtered = allExams.filter((e) => {
    if (filterYear && e.year !== filterYear) return false;
    if (filterLevel && e.difficulty.id !== filterLevel) return false;
    return true;
  });

  // Group by year
  const grouped = filtered.reduce((acc, exam) => {
    const yr = exam.year;
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(exam);
    return acc;
  }, {});

  return (
    <PageWrapper>
      {/* Back + header */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800
                     font-medium mb-5 transition-colors"
        >
          <ArrowLeft size={15} />
          Svi predmeti
        </Link>

        {/* Subject hero */}
        <div
          className={cn(
            "rounded-2xl border p-6 mb-7 relative overflow-hidden",
            subject.color.bg,
            subject.color.border,
          )}
        >
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-2xl"
            style={{ background: "currentColor" }}
          />
          <div className="relative flex items-center gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm",
                "bg-white",
              )}
            >
              <Icon size={26} className={subject.color.text} />
            </div>
            <div>
              <h1
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  subject.color.text,
                )}
              >
                {subject.name}
              </h1>
              <p className="text-sm text-warm-600 mt-0.5">
                {subject.description}
              </p>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <span className="text-sm font-semibold text-warm-700">
              <span className="text-warm-900">{subject.examCount}</span> ispita
            </span>
            <span className="text-sm font-semibold text-warm-700">
              <span className="text-warm-900">{EXAM_YEARS.length}</span> godina
            </span>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter size={14} className="text-warm-400" />
        <span className="text-xs font-semibold text-warm-500 uppercase tracking-wider mr-1">
          Filtriraj:
        </span>

        {/* Year filter */}
        <div className="flex flex-wrap gap-1.5">
          {EXAM_YEARS.map((yr) => (
            <button
              key={yr}
              onClick={() => setFilterYear(filterYear === yr ? null : yr)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-150",
                filterYear === yr
                  ? cn(subject.color.badge, subject.color.border)
                  : "bg-white border-warm-300 text-warm-600 hover:border-warm-400",
              )}
            >
              {yr}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-warm-300 mx-1" />

        {/* Level filter */}
        {DIFFICULTY_LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() =>
              setFilterLevel(filterLevel === lvl.id ? null : lvl.id)
            }
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-150",
              filterLevel === lvl.id
                ? cn(subject.color.badge, subject.color.border)
                : "bg-white border-warm-300 text-warm-600 hover:border-warm-400",
            )}
          >
            {lvl.short}
          </button>
        ))}
      </div>

      {/* Exam groups by year */}
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, exams]) => (
            <motion.section key={year} variants={itemVariants}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-bold text-warm-800">{year}.</h2>
                <div className="h-px flex-1 bg-warm-200" />
                <span className="text-xs text-warm-400">
                  {exams.length} ispita
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    subject={subject}
                    onClick={() => navigate(`/ispit/${exam.id}`)}
                  />
                ))}
              </div>
            </motion.section>
          ))}

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-16">
            <p className="text-warm-400 font-medium">
              Nema ispita za odabrane filtre.
            </p>
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
}
