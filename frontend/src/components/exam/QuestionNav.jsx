// components/exam/QuestionNav.jsx
// FIX: flagged je sada Set (ne Array) → koristimo .has() umjesto .includes()
// Ovo je O(1) lookup umjesto O(n) — važno za 40 pitanja × svaki re-render
import { cn } from "@/utils/utils";

export function QuestionNav({
  questions,
  answers,
  flagged, // Set<number>
  currentIndex,
  onNavigate,
}) {
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flagged.size;

  return (
    <div className="bg-white rounded-2xl border border-warm-300 shadow-card p-4 sticky top-20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-warm-500 uppercase tracking-wider">
          Navigacija
        </h3>
        <span className="text-xs text-warm-400">
          {answeredCount}/{questions.length}
        </span>
      </div>

      <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5 mb-4">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isFlagged = flagged.has(q.id); // FIX: .has() umjesto .includes()
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(idx)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Pitanje ${idx + 1}${isAnswered ? ", odgovoreno" : ""}${isFlagged ? ", označeno" : ""}`}
              title={`Pitanje ${idx + 1}`}
              className={cn(
                "w-full aspect-square rounded-lg text-xs font-semibold transition-all duration-100 relative",
                isCurrent
                  ? "bg-primary-600 text-white shadow-sm ring-2 ring-primary-200"
                  : isAnswered && isFlagged
                    ? "bg-amber-200 text-amber-800 hover:bg-amber-300"
                    : isAnswered
                      ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                      : isFlagged
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-warm-100 text-warm-500 hover:bg-warm-200",
              )}
            >
              {idx + 1}
              {/* Flagged indicator dot */}
              {isFlagged && !isCurrent && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-1.5 text-xs text-warm-500">
        {[
          { color: "bg-primary-100", label: `Odgovoreno (${answeredCount})` },
          { color: "bg-amber-100", label: `Označeno (${flaggedCount})` },
          {
            color: "bg-warm-100",
            label: `Nije odgovoreno (${questions.length - answeredCount})`,
          },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn("w-3.5 h-3.5 rounded flex-shrink-0", color)} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
