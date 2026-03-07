// components/exam/ProgressBar.jsx — v5
// ─────────────────────────────────────────────────────────────────────────────
// POBOLJŠANJA:
//   • Tanja linija (h-1.5) — elegantnija
//   • Green kada je 100%
//   • Smooth motion.div animacija širine
//   • showLabel prop — skrivena po defaultu (koristiti gdje treba)
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { cn } from "@/utils/utils";

export function ProgressBar({ value, max, className, showLabel = false }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const isComplete = pct === 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors duration-500",
            isComplete ? "bg-green-500" : "bg-primary-600",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-warm-400 mt-1 font-medium tabular-nums">
          <span
            className={cn(
              "font-semibold",
              isComplete ? "text-green-600" : "text-warm-700",
            )}
          >
            {value}
          </span>
          /{max} odgovoreno
        </p>
      )}
    </div>
  );
}
