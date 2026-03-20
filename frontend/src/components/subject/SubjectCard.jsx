import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";

export function SubjectCard({ subject, showDescription = true }) {
  const navigate = useNavigate();
  const Icon = subject.icon;

  return (
    <motion.div
      onClick={() => navigate(`/predmeti/${subject.id}`)}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "group relative bg-white rounded-2xl border border-warm-200 overflow-hidden cursor-pointer",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_8px_30px_-4px_rgba(45,84,232,0.10)] hover:border-warm-300",
        "transition-all duration-250",
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          `bg-gradient-to-r ${subject.color.gradient}`,
        )}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0",
              subject.color.bg,
              subject.color.border,
            )}
          >
            <Icon size={20} className={subject.color.text} />
          </div>
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0",
              subject.color.badge,
            )}
          >
            {subject.examCount} ispita
          </span>
        </div>

        <h3 className="font-bold text-warm-900 text-base tracking-tight leading-snug">
          {subject.name}
        </h3>

        {showDescription && subject.description && (
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
          className={cn("text-xs font-bold tracking-wide", subject.color.text)}
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
  );
}
