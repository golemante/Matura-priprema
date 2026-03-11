// components/exam/ExamCard.jsx
import { motion } from "framer-motion";
import {
  Clock,
  HelpCircle,
  ChevronRight,
  Layers,
  Users,
  Target,
} from "lucide-react";
import { cn } from "@/utils/utils";

// ── Community score boja ──────────────────────────────────────────────────────
function communityScoreColor(pct) {
  if (pct === null || pct === undefined) return "text-warm-400";
  if (pct >= 75) return "text-success-600";
  if (pct >= 50) return "text-amber-600";
  return "text-error-500";
}

export function ExamCard({ exam, subject, onClick }) {
  const isVisa = exam.difficulty.id === "visa";

  // Generira title ako ga DB nije dao
  const displayTitle =
    exam.title ??
    `${exam.session.name} ${exam.year}. — ${exam.difficulty.short}`;

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={cn(
        "group relative bg-white rounded-2xl border cursor-pointer overflow-hidden",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.1)]",
        "transition-shadow duration-250",
        isVisa
          ? "border-amber-200 hover:border-amber-300"
          : "border-warm-200 hover:border-warm-300",
      )}
    >
      {/* Level indicator — left stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl",
          isVisa
            ? "bg-gradient-to-b from-amber-400 to-orange-500"
            : `bg-gradient-to-b ${subject.color.gradient}`,
        )}
      />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges row: rok + razina + komponenta */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
              <span
                className={cn(
                  "inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md",
                  subject.color.badge,
                )}
              >
                {exam.session.name}
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border",
                  isVisa
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-warm-100 text-warm-600 border-warm-200",
                )}
              >
                <Layers size={9} />
                {exam.difficulty.short}
              </span>

              {exam.component && (
                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {exam.component}
                </span>
              )}
            </div>

            {/* Godina + title */}
            <p className="text-sm font-bold text-warm-900 leading-snug mb-1.5 truncate">
              {exam.year}. — {exam.session.name}
            </p>

            {/* Meta row: pitanja + bodovi + trajanje */}
            <div className="flex items-center gap-3 text-xs text-warm-500 flex-wrap">
              {exam.questionCount != null && (
                <span className="flex items-center gap-1">
                  <HelpCircle size={10} className="flex-shrink-0" />
                  {exam.questionCount} pitanja
                </span>
              )}
              {exam.totalPoints != null && (
                <span className="flex items-center gap-1">
                  <Target size={10} className="flex-shrink-0" />
                  {exam.totalPoints} bodova
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={10} className="flex-shrink-0" />
                {exam.duration} min
              </span>
            </div>
          </div>

          {/* Right: community score + arrow */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <ChevronRight
              size={16}
              className="text-warm-300 group-hover:text-warm-600 group-hover:translate-x-0.5 transition-all"
            />

            {/* Community score */}
            {exam.communityScore != null && (
              <div className="flex flex-col items-end">
                <span
                  className={cn(
                    "text-base font-black tabular-nums",
                    communityScoreColor(exam.communityScore),
                  )}
                >
                  {exam.communityScore}%
                </span>
                <span className="text-[10px] text-warm-400 leading-none">
                  prosjek
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Community attempts — social proof */}
        {exam.communityAttempts > 0 && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-warm-100">
            <Users size={10} className="text-warm-300 flex-shrink-0" />
            <span className="text-[11px] text-warm-400">
              {exam.communityAttempts.toLocaleString("hr-HR")}{" "}
              {exam.communityAttempts === 1 ? "rješavanje" : "rješavanja"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
