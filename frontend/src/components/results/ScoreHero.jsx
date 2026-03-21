import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";
import { Clock, TrendingUp, Target } from "lucide-react";
import { cn } from "@/utils/cn";

export function getScoreConfig(pct) {
  if (pct >= 90)
    return {
      label: "Izvrsno!",
      emoji: "🏆",
      ringFg: "#16A34A",
      ringBg: "#DCFCE7",
      textCls: "text-green-700",
      bgCls: "bg-green-50",
      borderCls: "border-green-200",
      pillCls: "bg-green-100 text-green-800",
    };
  if (pct >= 75)
    return {
      label: "Vrlo dobro!",
      emoji: "🎉",
      ringFg: "#22C55E",
      ringBg: "#DCFCE7",
      textCls: "text-green-600",
      bgCls: "bg-green-50",
      borderCls: "border-green-200",
      pillCls: "bg-green-100 text-green-700",
    };
  if (pct >= 60)
    return {
      label: "Dobro!",
      emoji: "👍",
      ringFg: "#D97706",
      ringBg: "#FEF3C7",
      textCls: "text-amber-700",
      bgCls: "bg-amber-50",
      borderCls: "border-amber-200",
      pillCls: "bg-amber-100 text-amber-800",
    };
  if (pct >= 50)
    return {
      label: "Prolaz",
      emoji: "✅",
      ringFg: "#F59E0B",
      ringBg: "#FEF3C7",
      textCls: "text-amber-600",
      bgCls: "bg-amber-50",
      borderCls: "border-amber-200",
      pillCls: "bg-amber-100 text-amber-700",
    };
  return {
    label: "Nedovoljno",
    emoji: "📚",
    ringFg: "#EF4444",
    ringBg: "#FEE2E2",
    textCls: "text-red-600",
    bgCls: "bg-red-50",
    borderCls: "border-red-200",
    pillCls: "bg-red-100 text-red-700",
  };
}

function AnimatedRing({ pct, cfg }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const size = 120;

  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 55, damping: 18 });
  const displayed = useTransform(spring, (v) => `${Math.round(v)}%`);

  useEffect(() => {
    mv.set(pct);
  }, [pct, mv]);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={cfg.ringBg}
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={cfg.ringFg}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          style={{
            transition: "stroke-dasharray 1.1s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn(
            "text-xl font-black tabular-nums leading-none",
            cfg.textCls,
          )}
        >
          {displayed}
        </motion.span>
        <span
          className={cn(
            "text-[10px] font-semibold mt-0.5",
            cfg.textCls,
            "opacity-70",
          )}
        >
          rezultat
        </span>
      </div>
    </div>
  );
}

function StackedBar({ correct, wrong, skipped, total }) {
  if (total <= 0) return null;
  const pCorrect = (correct / total) * 100;
  const pWrong = (wrong / total) * 100;
  const pSkipped = (skipped / total) * 100;

  const segments = [
    { pct: pCorrect, color: "bg-green-500", delay: 0.2 },
    { pct: pWrong, color: "bg-red-400", delay: 0.35 },
    { pct: pSkipped, color: "bg-warm-300", delay: 0.5 },
  ];

  return (
    <div className="w-full h-2 bg-warm-200 rounded-full overflow-hidden flex">
      {segments.map(({ pct, color, delay }) =>
        pct > 0 ? (
          <motion.div
            key={color}
            className={cn("h-full", color)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.85, ease: "easeOut", delay }}
          />
        ) : null,
      )}
    </div>
  );
}

function Pill({ icon: Icon, label, iconCls, bg }) {
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
        bg,
      )}
    >
      {Icon && <Icon size={10} className={cn("flex-shrink-0", iconCls)} />}
      {label}
    </span>
  );
}

function formatElapsed(secs) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ScoreHero({
  pct,
  correctCount,
  totalCount,
  elapsedSeconds,
  rpcResult,
  examMeta,
}) {
  const cfg = getScoreConfig(pct ?? 0);

  const correctNum = correctCount ?? 0;
  const totalNum = totalCount ?? 0;
  const skippedNum = rpcResult?.skipped_count ?? 0;
  const wrongNum = Math.max(0, totalNum - correctNum - skippedNum);

  const timeLabel = formatElapsed(elapsedSeconds);
  const pointsLabel = examMeta?.total_points
    ? `${Math.round(((pct ?? 0) / 100) * examMeta.total_points)} / ${examMeta.total_points} bod.`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-2xl border-2 p-4 sm:p-5 mb-4",
        cfg.bgCls,
        cfg.borderCls,
      )}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <AnimatedRing pct={pct ?? 0} cfg={cfg} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{cfg.emoji}</span>
            <span
              className={cn("text-base sm:text-lg font-black", cfg.textCls)}
            >
              {cfg.label}
            </span>
          </div>

          <p className="text-sm text-warm-600 mb-2.5">
            <span className="font-bold text-warm-900">{correctNum}</span>
            {" od "}
            <span className="font-bold text-warm-900">{totalNum}</span>
            {" pitanja točno"}
          </p>

          {totalNum > 0 && (
            <StackedBar
              correct={correctNum}
              wrong={wrongNum}
              skipped={skippedNum}
              total={totalNum}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-black/5">
        {correctNum > 0 && (
          <Pill
            label={`${correctNum} točno`}
            bg="bg-green-100 text-green-800"
            icon={() => <span>✓</span>}
          />
        )}
        {wrongNum > 0 && (
          <Pill
            label={`${wrongNum} netočno`}
            bg="bg-red-100 text-red-700"
            icon={() => <span>✗</span>}
          />
        )}
        {skippedNum > 0 && (
          <Pill
            label={`${skippedNum} preskočeno`}
            bg="bg-warm-100 text-warm-600"
            icon={() => <span>—</span>}
          />
        )}
        {timeLabel && (
          <Pill
            icon={Clock}
            label={timeLabel}
            iconCls="text-warm-500"
            bg="bg-warm-100 text-warm-600"
          />
        )}
        {pointsLabel && (
          <Pill
            icon={TrendingUp}
            label={pointsLabel}
            iconCls="text-primary-500"
            bg="bg-primary-50 text-primary-700"
          />
        )}
      </div>
    </motion.div>
  );
}
