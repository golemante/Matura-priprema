import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart2, Trophy, ChevronRight } from "lucide-react";
import { SUBJECTS } from "@/utils/constants";
import { MiniSparkline } from "@/components/common/Sparkline";
import { cn } from "@/utils/cn";
import { getPctColor, getPctBarColor } from "@/utils/statsHelpers";

function SubjectCard({ stat, attempts }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === stat.subject_id);
  if (!subject) return null;

  const avg = stat.avg_score_pct ?? 0;
  const best = stat.best_score_pct ?? 0;
  const cnt = stat.attempts_count ?? 0;

  const subjectAttempts = useMemo(
    () =>
      (attempts ?? [])
        .filter(
          (a) =>
            a.exam?.subject_id === stat.subject_id && a.status === "completed",
        )
        .sort((a, b) => new Date(a.finished_at) - new Date(b.finished_at)),
    [attempts, stat.subject_id],
  );

  const passRate = subjectAttempts.length
    ? Math.round(
        (subjectAttempts.filter((a) => (a.score_pct ?? 0) >= 50).length /
          subjectAttempts.length) *
          100,
      )
    : 0;

  const sparkData = subjectAttempts.slice(-8).map((a) => a.score_pct ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-warm-200 p-4 hover:border-warm-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={18} className={subject.color.text} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-warm-900">{subject.name}</p>
          <p className="text-xs text-warm-400">
            {cnt} {cnt === 1 ? "ispit" : "ispita"}
          </p>
        </div>
        {sparkData.length >= 2 && (
          <MiniSparkline data={sparkData} width={56} height={24} />
        )}
        <span
          className={cn(
            "text-lg font-black tabular-nums flex-shrink-0",
            getPctColor(avg),
          )}
        >
          {avg}%
        </span>
      </div>

      <div className="space-y-1 mb-3">
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

      <div className="flex items-center gap-2 flex-wrap">
        <PassRateBadge passRate={passRate} />
        {best > avg && <RecordBadge best={best} />}
        <button
          onClick={() => navigate(`/predmeti/${stat.subject_id}`)}
          className="ml-auto text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline underline-offset-2"
        >
          Vježbaj <ChevronRight size={11} />
        </button>
      </div>
    </motion.div>
  );
}

function PassRateBadge({ passRate }) {
  const cls =
    passRate >= 75
      ? "bg-green-50 text-green-700 border-green-200"
      : passRate >= 50
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-warm-100 text-warm-600 border-warm-200";

  return (
    <span
      className={cn("text-[11px] font-bold px-2 py-0.5 rounded-lg border", cls)}
    >
      {passRate}% položenih
    </span>
  );
}

function RecordBadge({ best }) {
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
      <Trophy size={9} />
      Rekord {best}%
    </span>
  );
}

export function SubjectsTab({ subjectStats, attempts }) {
  if (!subjectStats?.length) {
    return (
      <div className="text-center py-16">
        <BarChart2
          size={32}
          className="text-warm-200 mx-auto mb-3"
          strokeWidth={1.5}
        />
        <p className="text-sm text-warm-500">Nema statistika po predmetima.</p>
      </div>
    );
  }

  const sorted = [...subjectStats].sort(
    (a, b) => (b.attempts_count ?? 0) - (a.attempts_count ?? 0),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sorted.map((stat) => (
        <SubjectCard key={stat.subject_id} stat={stat} attempts={attempts} />
      ))}
    </div>
  );
}
