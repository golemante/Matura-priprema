import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingDown, Sparkles } from "lucide-react";
import { SUBJECTS } from "@/utils/constants";
import { getPctColor } from "@/utils/statsHelpers";
import { cn } from "@/utils/cn";

export function FocusCard({ subjectStats }) {
  const navigate = useNavigate();

  if (!subjectStats?.length) return null;

  const weakest = [...subjectStats]
    .filter((s) => s.attempts_count > 0)
    .sort((a, b) => (a.avg_score_pct ?? 0) - (b.avg_score_pct ?? 0))[0];

  if (!weakest) return null;

  const subject = SUBJECTS.find((s) => s.id === weakest.subject_id);
  if (!subject) return null;

  const avg = weakest.avg_score_pct ?? 0;
  const isLow = avg < 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        "flex items-center gap-4 px-4 py-3.5 rounded-2xl border mt-4",
        isLow ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          subject.color.bg,
        )}
      >
        <subject.icon size={18} className={subject.color.text} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {isLow ? (
            <TrendingDown size={12} className="text-red-500 flex-shrink-0" />
          ) : (
            <Sparkles size={12} className="text-amber-500 flex-shrink-0" />
          )}
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-wider",
              isLow ? "text-red-600" : "text-amber-700",
            )}
          >
            {isLow ? "Fokusiraj se ovdje" : "Ima prostora za napredak"}
          </p>
        </div>
        <p className="text-sm font-semibold text-warm-900 truncate">
          {subject.name}
          <span
            className={cn(
              "ml-2 text-sm font-black tabular-nums",
              getPctColor(avg),
            )}
          >
            {avg}%
          </span>
          <span className="text-xs text-warm-400 font-normal ml-1">
            prosjek
          </span>
        </p>
      </div>

      <button
        onClick={() => navigate(`/predmeti/${weakest.subject_id}`)}
        className={cn(
          "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl",
          "text-xs font-bold transition-colors",
          isLow
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "bg-amber-100 text-amber-800 hover:bg-amber-200",
        )}
      >
        Vježbaj
        <ArrowRight size={12} />
      </button>
    </motion.div>
  );
}
