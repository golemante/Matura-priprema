import { motion } from "framer-motion";
import { BookOpen, Percent, Target, Timer } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatTotalTime } from "@/utils/statsHelpers";

const STAT_CARDS = [
  {
    key: "totalExams",
    icon: BookOpen,
    label: "Ispita",
    format: (v) => v,
    iconCls: "text-primary-600",
    bgCls: "bg-primary-50",
  },
  {
    key: "avgPct",
    icon: Percent,
    label: "Prosj. rezultat",
    format: (v) => `${v}%`,
    iconCls: "text-green-600",
    bgCls: "bg-green-50",
  },
  {
    key: "passRate",
    icon: Target,
    label: "Položenih",
    format: (v) => `${v}%`,
    iconCls: "text-amber-600",
    bgCls: "bg-amber-50",
  },
  {
    key: "totalTimeSec",
    icon: Timer,
    label: "Ukupno",
    format: formatTotalTime,
    iconCls: "text-violet-600",
    bgCls: "bg-violet-50",
  },
];

export function SummaryBar({ stats }) {
  const passRate =
    stats.totalExams > 0
      ? Math.round((stats.passedCount / stats.totalExams) * 100)
      : 0;

  const values = { ...stats, passRate };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {STAT_CARDS.map(
        ({ key, icon: Icon, label, format, iconCls, bgCls }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-warm-200 shadow-card p-4"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center mb-2.5",
                bgCls,
              )}
            >
              <Icon size={15} className={iconCls} />
            </div>
            <p className="text-xl font-black text-warm-900 leading-none mb-1 tabular-nums">
              {format(values[key] ?? 0)}
            </p>
            <p className="text-xs text-warm-500 font-medium">{label}</p>
          </motion.div>
        ),
      )}
    </div>
  );
}
