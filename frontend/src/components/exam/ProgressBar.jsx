// components/exam/ProgressBar.jsx
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { cn } from "@/utils/utils";

export function ProgressBar({
  value,
  max,
  className,
  showLabel = true,
  variant = "default",
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors",
            // Dinamička promjena boje ovisno o varijanti ili postotku
            variant === "default" && "bg-primary-600",
            (variant === "success" || pct === 100) && "bg-green-500",
          )}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {showLabel && (
        <p className="text-xs text-warm-400 mt-1 font-medium">
          <span className="text-warm-700">{value}</span>/{max} odgovoreno
        </p>
      )}
    </div>
  );
}
