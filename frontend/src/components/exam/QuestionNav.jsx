import { motion } from "framer-motion";
import { Flag } from "lucide-react";
import { cn } from "@/utils/cn";

function NavButton({
  question,
  idx,
  isAnswered,
  isFlagged,
  isCurrent,
  onGoTo,
}) {
  const label = question.positionLabel ?? String(idx + 1);

  if (question.questionType === "fill_blank_mc") {
    return null;
  }

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={() => onGoTo(idx)}
      aria-current={isCurrent ? "step" : undefined}
      aria-label={`Pitanje ${label}${isAnswered ? ", odgovoreno" : ""}${isFlagged ? ", označeno" : ""}`}
      title={`Pitanje ${label}`}
      className={cn(
        "w-full aspect-square rounded-lg text-[11px] font-bold transition-all duration-100 relative",
        "min-h-[28px]",
        isCurrent
          ? "bg-primary-600 text-white shadow-sm ring-2 ring-primary-300 ring-offset-1"
          : isAnswered && isFlagged
            ? "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
            : isAnswered
              ? "bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200"
              : isFlagged
                ? "bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100"
                : "bg-warm-50 text-warm-500 border border-warm-200 hover:bg-warm-100 hover:text-warm-700",
      )}
    >
      {label}
      {isFlagged && !isCurrent && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border-2 border-white"
          aria-hidden="true"
        />
      )}
    </motion.button>
  );
}

const LEGEND = [
  { cls: "bg-primary-600", label: "Trenutno" },
  { cls: "bg-primary-100 border border-primary-200", label: "Odgovoreno" },
  { cls: "bg-amber-50 border border-amber-300", label: "Označeno" },
  { cls: "bg-warm-50 border border-warm-200", label: "Nije odgovoreno" },
];

export function QuestionNav({
  questions,
  answers,
  flagged,
  currentIndex,
  onGoTo,
}) {
  const visibleCount = questions.filter(
    (q) => q.questionType !== "fill_blank_mc",
  ).length;

  const flaggedCount = flagged?.size ?? 0;

  const gridCols =
    visibleCount <= 25
      ? "grid-cols-5"
      : visibleCount <= 40
        ? "grid-cols-6"
        : "grid-cols-7";

  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-xs font-bold text-warm-600 uppercase tracking-wider">
          Navigacija
        </h3>
        {flaggedCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
            <Flag size={10} />
            {flaggedCount}
          </span>
        )}
      </div>

      <div
        className={cn(
          "grid gap-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-warm-300 scrollbar-track-transparent",
          gridCols,
        )}
        style={{ maxHeight: "min(55vh, 400px)" }}
      >
        {questions.map((q, idx) => (
          <NavButton
            key={q.id}
            question={q}
            idx={idx}
            isAnswered={!!answers?.[q.id]}
            isFlagged={flagged?.has(q.id) ?? false}
            isCurrent={idx === currentIndex}
            onGoTo={onGoTo}
          />
        ))}
      </div>

      <div className="pt-2.5 border-t border-warm-100 flex-shrink-0">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {LEGEND.map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1.5 min-w-0">
              <span className={cn("w-3 h-3 rounded flex-shrink-0", cls)} />
              <span className="text-[10px] text-warm-500 font-medium truncate">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
