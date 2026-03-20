import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, BarChart2 } from "lucide-react";
import { SUBJECTS } from "@/utils/constants";
import { Card } from "@/components/common/Card";
import { getPctColor, getPctBarColor } from "@/utils/statsHelpers";
import { cn } from "@/utils/cn";

function SubjectRow({ stat, isBest }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === stat.subject_id);
  if (!subject) return null;

  const avg = stat.avg_score_pct ?? 0;
  const best = stat.best_score_pct ?? 0;

  return (
    <div
      onClick={() => navigate(`/predmeti/${stat.subject_id}`)}
      className="group cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
            subject.color.bg,
          )}
        >
          <subject.icon size={13} className={subject.color.text} />
        </div>

        <span className="text-sm font-semibold text-warm-800 flex-1 truncate group-hover:text-warm-900 transition-colors">
          {subject.shortName}
        </span>

        {isBest && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-0.5 flex-shrink-0">
            <Star size={9} />
            Top
          </span>
        )}

        <span
          className={cn(
            "text-xs font-black tabular-nums flex-shrink-0",
            getPctColor(avg),
          )}
        >
          {avg}%
        </span>
      </div>

      <div className="space-y-1">
        <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", getPctBarColor(avg))}
            initial={{ width: 0 }}
            animate={{ width: `${avg}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        {best > avg && (
          <div className="h-1 bg-warm-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-warm-300"
              initial={{ width: 0 }}
              animate={{ width: `${best}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1 mb-3">
        <span className="text-[10px] text-warm-400">
          {stat.attempts_count} {stat.attempts_count === 1 ? "ispit" : "ispita"}
        </span>
        {best > avg && (
          <span className="text-[10px] text-warm-400">
            Rekord:{" "}
            <span className={cn("font-bold", getPctColor(best))}>{best}%</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function SubjectProgress({ subjectStats, bestSubjectId }) {
  const navigate = useNavigate();

  const sorted = [...subjectStats]
    .sort((a, b) => (b.attempts_count ?? 0) - (a.attempts_count ?? 0))
    .slice(0, 6);

  return (
    <Card className="p-5">
      <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-4">
        Po predmetima
      </p>

      {!sorted.length ? (
        <div className="text-center py-8">
          <BarChart2
            size={24}
            className="text-warm-200 mx-auto mb-2"
            strokeWidth={1.5}
          />
          <p className="text-xs text-warm-400 leading-relaxed">
            Statistike će se pojaviti nakon prvog riješenog ispita.
          </p>
        </div>
      ) : (
        <div>
          {sorted.map((stat) => (
            <SubjectRow
              key={stat.subject_id}
              stat={stat}
              isBest={stat.subject_id === bestSubjectId}
            />
          ))}
        </div>
      )}

      {sorted.length > 0 && (
        <button
          onClick={() => navigate("/rezultati?tab=subjects")}
          className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          Detaljna analiza <ArrowRight size={11} />
        </button>
      )}
    </Card>
  );
}
