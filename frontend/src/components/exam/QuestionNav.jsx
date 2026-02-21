// components/exam/QuestionNav.jsx
import { cn } from "@/utils/utils";

export function QuestionNav({
  questions,
  answers,
  flagged,
  currentIndex,
  onNavigate,
}) {
  return (
    <div className="bg-white rounded-2xl border border-warm-300 shadow-card p-4 sticky top-20">
      <h3 className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-3">
        Navigacija
      </h3>
      <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isFlagged = flagged.includes(q.id);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => onNavigate(idx)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Pitanje ${idx + 1}${isAnswered ? ", odgovoreno" : ""}${isFlagged ? ", označeno" : ""}`}
              className={cn(
                "w-full aspect-square rounded-lg text-xs font-semibold transition-all duration-100",
                isCurrent
                  ? "bg-primary-600 text-white shadow-sm"
                  : isAnswered
                    ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                    : isFlagged
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : "bg-warm-100 text-warm-500 hover:bg-warm-200",
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-1.5 text-xs text-warm-500">
        {[
          { color: "bg-primary-100", label: "Odgovoreno" },
          { color: "bg-amber-100", label: "Označeno" },
          { color: "bg-warm-100", label: "Nije odgovoreno" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn("w-3.5 h-3.5 rounded", color)} /> {label}
          </div>
        ))}
      </div>
    </div>
  );
}
