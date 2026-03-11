// components/exam/Timer.jsx
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/utils";

export function ExamTimer({ formatted, isWarning, isDanger }) {
  return (
    <motion.div
      animate={isDanger ? { scale: [1, 1.03, 1] } : {}}
      transition={
        isDanger ? { repeat: Infinity, duration: 1.1, ease: "easeInOut" } : {}
      }
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold tabular-nums",
        "text-sm transition-all duration-500 flex-shrink-0",
        isDanger
          ? [
              "bg-red-50 text-red-600",
              "border border-red-200",
              "shadow-[0_0_0_2px_rgba(239,68,68,0.12)]",
            ]
          : isWarning
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-warm-100 text-warm-700",
      )}
    >
      <Clock
        size={13}
        className={cn(
          "flex-shrink-0 transition-colors",
          isDanger && "animate-pulse",
        )}
      />
      <span
        aria-live="polite"
        aria-label={`Preostalo vrijeme: ${formatted}`}
        className="min-w-[3rem] text-center leading-none"
      >
        {formatted ?? "--:--"}
      </span>
    </motion.div>
  );
}
