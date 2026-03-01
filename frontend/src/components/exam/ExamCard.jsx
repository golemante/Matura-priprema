// components/exam/ExamCard.jsx
import { motion } from "framer-motion";
import { Clock, HelpCircle, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/utils/utils";

export function ExamCard({ exam, subject, onClick }) {
  const isVisa = exam.difficulty.id === "visa";

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
            {/* Session + Level badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
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
            </div>

            {/* Meta info row */}
            <div className="flex items-center gap-3 text-xs text-warm-500">
              <span className="flex items-center gap-1 font-semibold text-warm-700">
                {exam.year}.
              </span>
              <span className="w-px h-3 bg-warm-200" />
              <span className="flex items-center gap-1">
                <HelpCircle size={10} />
                {exam.questionCount} pitanja
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {exam.duration} min
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
              "bg-warm-50 group-hover:bg-primary-50 transition-colors duration-200",
            )}
          >
            <ChevronRight
              size={15}
              className="text-warm-400 group-hover:text-primary-600 transition-all duration-200 group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
