// components/exam/Timer.jsx
import { Timer as TimerIcon } from "lucide-react";
import { cn } from "@/utils/utils";

export function ExamTimer({ formatted, isWarning, isDanger }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
        isDanger
          ? "bg-red-100 text-red-700 border border-red-200 animate-pulse"
          : isWarning
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-warm-100 text-warm-700",
      )}
    >
      <TimerIcon size={14} className={isWarning ? "animate-pulse" : ""} />
      <span aria-live="polite" aria-label={`Preostalo vrijeme: ${formatted}`}>
        {formatted}
      </span>
    </div>
  );
}
