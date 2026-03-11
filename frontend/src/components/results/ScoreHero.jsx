// components/results/ScoreHero.jsx
import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";
import { cn } from "@/utils/utils";

export function getScoreConfig(pct) {
  if (pct >= 90)
    return {
      label: "Izvrsno!",
      emoji: "🏆",
      color: "green",
      ringFg: "#16A34A",
      ringBg: "#DCFCE7",
      textCls: "text-green-700",
      bgCls: "bg-green-50",
      borderCls: "border-green-200",
    };
  if (pct >= 75)
    return {
      label: "Vrlo dobro!",
      emoji: "🎉",
      color: "green",
      ringFg: "#22C55E",
      ringBg: "#DCFCE7",
      textCls: "text-green-600",
      bgCls: "bg-green-50",
      borderCls: "border-green-200",
    };
  if (pct >= 60)
    return {
      label: "Dobro!",
      emoji: "👍",
      color: "amber",
      ringFg: "#D97706",
      ringBg: "#FEF3C7",
      textCls: "text-amber-700",
      bgCls: "bg-amber-50",
      borderCls: "border-amber-200",
    };
  if (pct >= 50)
    return {
      label: "Prolaz",
      emoji: "✅",
      color: "amber",
      ringFg: "#F59E0B",
      ringBg: "#FEF3C7",
      textCls: "text-amber-600",
      bgCls: "bg-amber-50",
      borderCls: "border-amber-200",
    };
  return {
    label: "Nedovoljno",
    emoji: "📚",
    color: "red",
    ringFg: "#EF4444",
    ringBg: "#FEE2E2",
    textCls: "text-red-600",
    bgCls: "bg-red-50",
    borderCls: "border-red-200",
  };
}

function AnimatedRing({ pct, cfg }) {
  const r = 52;
  const circ = 2 * Math.PI * r;

  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });
  const displayed = useTransform(spring, (v) => `${Math.round(v)}%`);

  useEffect(() => {
    mv.set(pct);
  }, [pct, mv]);

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg
        width={128}
        height={128}
        viewBox="0 0 128 128"
        className="-rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={64}
          cy={64}
          r={r}
          fill="none"
          stroke={cfg.ringBg}
          strokeWidth={11}
        />
        {/* Fill ring */}
        <circle
          cx={64}
          cy={64}
          r={r}
          fill="none"
          stroke={cfg.ringFg}
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          style={{
            transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn(
            "text-2xl font-black tabular-nums leading-none",
            cfg.textCls,
          )}
        >
          {displayed}
        </motion.span>
      </div>
    </div>
  );
}

function StackedBar({ correct, wrong, skipped, total }) {
  const pCorrect = total > 0 ? (correct / total) * 100 : 0;
  const pWrong = total > 0 ? (wrong / total) * 100 : 0;
  const pSkipped = total > 0 ? (skipped / total) * 100 : 0;

  return (
    <div className="w-full h-2.5 bg-warm-200 rounded-full overflow-hidden flex">
      {[
        { pct: pCorrect, color: "bg-green-500", delay: 0.2 },
        { pct: pWrong, color: "bg-red-400", delay: 0.35 },
        { pct: pSkipped, color: "bg-warm-300", delay: 0.5 },
      ].map(({ pct, color, delay }) => (
        <motion.div
          key={color}
          className={cn("h-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay }}
        />
      ))}
    </div>
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

/**
 * @param {object}  props
 * @param {number}  props.pct
 * @param {number}  [props.correctCount]
 * @param {number}  [props.totalCount]
 * @param {number}  [props.elapsedSeconds]
 * @param {object}  [props.rpcResult]     — { answered_count, skipped_count, score_pct, ... }
 * @param {object}  [props.examMeta]      — { total_points, ... }
 */
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
  const wrongNum = rpcResult
    ? totalNum - correctNum - (rpcResult.skipped_count ?? 0)
    : totalNum - correctNum;
  const skippedNum =
    rpcResult?.skipped_count ??
    Math.max(0, totalNum - (rpcResult?.answered_count ?? totalNum));

  const timeLabel = formatElapsed(elapsedSeconds);
  const pointsLabel = examMeta?.total_points
    ? `${Math.round((pct / 100) * examMeta.total_points)} / ${examMeta.total_points} bod.`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rounded-2xl border-2 p-5 mb-4", cfg.bgCls, cfg.borderCls)}
    >
      <div className="flex items-center gap-5">
        <AnimatedRing pct={pct ?? 0} cfg={cfg} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{cfg.emoji}</span>
            <span className={cn("text-lg font-black", cfg.textCls)}>
              {cfg.label}
            </span>
          </div>

          <p className="text-sm text-warm-600 mb-3">
            {correctNum} od {totalNum}{" "}
            {totalNum === 1 ? "pitanja točno" : "pitanja točno"}
          </p>

          {/* Stacked bar */}
          {totalNum > 0 && (
            <div className="mb-2.5">
              <StackedBar
                correct={correctNum}
                wrong={Math.max(0, wrongNum)}
                skipped={skippedNum}
                total={totalNum}
              />
            </div>
          )}

          {/* Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              ✓ {correctNum} točno
            </span>
            {wrongNum > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                ✗ {wrongNum} netočno
              </span>
            )}
            {skippedNum > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-warm-500 bg-warm-100 px-2 py-0.5 rounded-full">
                — {skippedNum} preskočeno
              </span>
            )}
            {timeLabel && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-warm-500 bg-warm-100 px-2 py-0.5 rounded-full">
                <Clock size={10} /> {timeLabel}
              </span>
            )}
            {pointsLabel && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> {pointsLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
