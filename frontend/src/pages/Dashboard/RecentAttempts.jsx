import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Clock } from "lucide-react";
import { SUBJECTS } from "@/utils/constants";
import { Sparkline } from "@/components/common/Sparkline";
import { Card } from "@/components/common/Card";
import { getPctBg, getPctColor, daysAgoLabel } from "@/utils/statsHelpers";
import { cn } from "@/utils/cn";

function AttemptItem({ attempt, index }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === attempt.exam?.subject_id);

  function handleClick() {
    if (attempt.status === "completed") {
      navigate(`/rezultati/pokusaj/${attempt.id}`);
    } else {
      navigate(`/ispit/${attempt.exam_id}`);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className="group flex items-center gap-3 py-2.5 border-b border-warm-100 last:border-0 cursor-pointer hover:bg-warm-50 -mx-2 px-2 rounded-xl transition-colors"
    >
      {subject ? (
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={14} className={subject.color.text} />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-warm-100 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warm-800 truncate">
          {subject?.shortName ?? attempt.exam?.subject_id}
          {attempt.exam?.year && (
            <span className="text-warm-500 font-normal">
              {" "}
              · {attempt.exam.year}.
            </span>
          )}
          {attempt.exam?.session && (
            <span className="text-warm-400 font-normal">
              {" "}
              {attempt.exam.session === "ljeto" ||
              attempt.exam.session === "ljetni"
                ? "Ljetni"
                : "Jesenski"}
            </span>
          )}
        </p>
        <p className="text-xs text-warm-400">
          {attempt.status === "in_progress"
            ? "U tijeku"
            : daysAgoLabel(attempt.finished_at)}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {attempt.status === "in_progress" ? (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            Nastavi
          </span>
        ) : (
          <span
            className={cn(
              "text-xs font-black px-2 py-0.5 rounded-full",
              getPctBg(attempt.score_pct),
            )}
          >
            {attempt.score_pct != null ? `${attempt.score_pct}%` : "—"}
          </span>
        )}
        <ChevronRight
          size={14}
          className="text-warm-300 group-hover:text-warm-500 transition-colors"
        />
      </div>
    </motion.div>
  );
}

import { ChevronRight } from "lucide-react";

function TrendPanel({ recentAttempts }) {
  const sparkData = [...recentAttempts]
    .reverse()
    .slice(0, 10)
    .map((a) => a.score_pct ?? 0);
  if (sparkData.length < 2) return null;

  const latest = sparkData[sparkData.length - 1] ?? 0;
  const prev = sparkData[sparkData.length - 2] ?? null;
  const delta = prev != null ? latest - prev : null;
  const up = delta != null && delta >= 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-warm-50 rounded-xl border border-warm-200 mb-3">
      <div>
        <p className="text-xs font-bold text-warm-500 mb-0.5">
          Trend (zadnjih {sparkData.length})
        </p>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-lg font-black tabular-nums",
              getPctColor(latest),
            )}
          >
            {latest}%
          </span>
          {delta != null && (
            <span
              className={cn(
                "text-xs font-bold flex items-center gap-0.5",
                up ? "text-green-600" : "text-red-500",
              )}
            >
              <TrendingUp size={11} className={up ? "" : "rotate-180"} />
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          )}
        </div>
      </div>
      <Sparkline data={sparkData} />
    </div>
  );
}

export function RecentAttempts({ recentAttempts, totalCompleted }) {
  const navigate = useNavigate();
  const hasMany = totalCompleted > 6;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">
          Nedavni ispiti
        </p>
        {hasMany && (
          <button
            onClick={() => navigate("/rezultati")}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            Svi <ArrowRight size={11} />
          </button>
        )}
      </div>

      {recentAttempts.length >= 2 && (
        <TrendPanel recentAttempts={recentAttempts} />
      )}

      {recentAttempts.map((attempt, i) => (
        <AttemptItem key={attempt.id} attempt={attempt} index={i} />
      ))}
    </Card>
  );
}
