import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/utils/cn";

const CARDS = [
  {
    key: "totalExams",
    icon: Trophy,
    label: "Riješenih ispita",
    iconCls: "text-amber-500",
    bgCls: "bg-amber-50",
    format: (v) => v,
  },
  {
    key: "avgPct",
    icon: Target,
    label: "Prosječni rezultat",
    iconCls: "text-primary-600",
    bgCls: "bg-primary-50",
    format: (v) => `${v}%`,
  },
  {
    key: "bestPct",
    icon: TrendingUp,
    label: "Osobni rekord",
    iconCls: "text-green-600",
    bgCls: "bg-green-50",
    format: (v) => `${v}%`,
  },
  {
    key: "passedCount",
    icon: CheckCircle2,
    label: "Položenih (≥50%)",
    iconCls: "text-violet-600",
    bgCls: "bg-violet-50",
    format: (v) => v,
  },
];

function StatCard({ icon: Icon, label, value, iconCls, bgCls, format, index }) {
  const animated = useCountUp(value ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-white rounded-2xl border border-warm-200 shadow-card p-4"
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
          bgCls,
        )}
      >
        <Icon size={17} className={iconCls} />
      </div>
      <p className="text-2xl font-black text-warm-900 leading-none mb-1 tabular-nums">
        {format(animated)}
      </p>
      <p className="text-xs text-warm-500 font-medium">{label}</p>
    </motion.div>
  );
}

export function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
      {CARDS.map((card, i) => (
        <StatCard
          key={card.key}
          {...card}
          value={stats[card.key] ?? 0}
          index={i}
        />
      ))}
    </div>
  );
}
