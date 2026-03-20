import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

const CHECKS = [
  { label: "8+ znakova", test: (p) => p.length >= 8 },
  { label: "Veliko slovo", test: (p) => /[A-Z]/.test(p) },
  { label: "Broj", test: (p) => /[0-9]/.test(p) },
];

const STRENGTH_COLOR = ["", "bg-error-400", "bg-warning-500", "bg-success-500"];
const STRENGTH_LABEL = ["", "Slaba", "Srednja", "Jaka"];

export function PasswordStrength({ password = "" }) {
  if (!password) return null;

  const passed = CHECKS.filter((c) => c.test(password));
  const score = passed.length;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="pt-2 space-y-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i < score ? STRENGTH_COLOR[score] : "bg-warm-200",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {CHECKS.map(({ label }, i) => (
              <span
                key={label}
                className={cn(
                  "text-xs transition-colors",
                  i < score ? "text-success-600" : "text-warm-400",
                )}
              >
                {i < score ? "✓" : "○"} {label}
              </span>
            ))}
          </div>
          {score > 0 && (
            <span
              className={cn(
                "text-xs font-medium",
                score === 3 ? "text-success-600" : "text-warning-600",
              )}
            >
              {STRENGTH_LABEL[score]}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
