// components/exam/QuestionNav.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI (v2):
//
//  BUG #1 — prop name mismatch
//    ExamTaking proslijedi onGoTo={handleGoTo}
//    Stari QuestionNav prima onNavigate — handler nikad nije pozvan!
//    FIX: prop se sada zove onGoTo (usklađeno s ExamTaking).
//
//  NOVO:
//    • "Predaj ispit" gumb uvijek vidljiv u navigatoru
//    • Tooltip prikazuje positionLabel (npr. "58.1") umjesto samo broja
//    • fill_blank_mc parent pitanja su vizualno drugačije obilježena
//    • Legenda boja na dnu panela
// ─────────────────────────────────────────────────────────────────────────────
import { CheckSquare } from "lucide-react";
import { cn } from "@/utils/utils";

// ── Legenda ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-warm-100">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm bg-primary-100 border border-primary-300" />
        <span className="text-[10px] text-warm-400">Odgovoreno</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
        <span className="text-[10px] text-warm-400">Označeno</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm bg-warm-100 border border-warm-300" />
        <span className="text-[10px] text-warm-400">Nije odgovoreno</span>
      </div>
    </div>
  );
}

// ── Navigacijski gumbić za jedno pitanje ─────────────────────────────────────
function NavButton({
  question,
  idx,
  isAnswered,
  isFlagged,
  isCurrent,
  onGoTo,
}) {
  const isParent = question.questionType === "fill_blank_mc";
  const label = question.positionLabel ?? String(idx + 1);

  // Parent (fill_blank_mc) pitanja se ne rješavaju direktno — vizualno drugačija
  if (isParent) {
    return (
      <button
        onClick={() => onGoTo(idx)}
        title={`Zadatak ${label}`}
        className={cn(
          "col-span-2 w-full h-7 rounded-md text-[10px] font-bold transition-all duration-100",
          "border flex items-center justify-center gap-1",
          isCurrent
            ? "bg-primary-600 text-white border-primary-700 shadow-sm"
            : "bg-warm-100 text-warm-500 border-warm-300 hover:bg-warm-200",
        )}
      >
        Zad. {label}
      </button>
    );
  }

  return (
    <button
      onClick={() => onGoTo(idx)}
      aria-current={isCurrent ? "step" : undefined}
      aria-label={`Pitanje ${label}${isAnswered ? ", odgovoreno" : ""}${isFlagged ? ", označeno zastavicom" : ""}`}
      title={`Pitanje ${label}`}
      className={cn(
        "w-full aspect-square rounded-lg text-[11px] font-bold transition-all duration-100 relative",
        // Active state
        isCurrent
          ? "bg-primary-600 text-white shadow-sm ring-2 ring-primary-200 ring-offset-1"
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
      {/* Zastavica dot */}
      {isFlagged && !isCurrent && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

// ── Glavni QuestionNav ────────────────────────────────────────────────────────
export function QuestionNav({
  questions,
  answers,
  flagged, // Set<string> — questionId-ovi
  currentIndex,
  onGoTo, // FIX: bio onNavigate — sada onGoTo (usklađeno s ExamTaking)
  onSubmit, // () => void — otvara submit modal
  answeredCount,
}) {
  const total = questions.filter(
    (q) => q.questionType !== "fill_blank_mc",
  ).length;
  const flaggedCount = flagged?.size ?? 0;
  const unanswered = total - (answeredCount ?? 0);

  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-4 sticky top-20 flex flex-col gap-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-warm-500 uppercase tracking-wider">
          Navigacija
        </h3>
        <div className="flex items-center gap-2 text-xs">
          {flaggedCount > 0 && (
            <span className="text-amber-600 font-semibold">
              {flaggedCount} 🚩
            </span>
          )}
          <span className="text-warm-400 font-medium tabular-nums">
            {answeredCount ?? 0}/{total}
          </span>
        </div>
      </div>

      {/* ── Grid pitanja ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
        {questions.map((q, idx) => (
          <NavButton
            key={q.id}
            question={q}
            idx={idx}
            isAnswered={!!answers[q.id]}
            isFlagged={flagged?.has(q.id) ?? false}
            isCurrent={idx === currentIndex}
            onGoTo={onGoTo}
          />
        ))}
      </div>

      {/* ── Legenda ────────────────────────────────────────────────────── */}
      <Legend />

      {/* ── Predaj ispit — uvijek vidljivo ─────────────────────────────── */}
      <button
        onClick={onSubmit}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5",
          "rounded-xl font-semibold text-sm transition-all duration-150",
          unanswered > 0
            ? "bg-warm-100 text-warm-600 border border-warm-300 hover:bg-warm-200"
            : "bg-primary-600 text-white shadow-sm hover:bg-primary-700",
        )}
      >
        <CheckSquare size={15} />
        {unanswered > 0
          ? `Predaj ispit (${unanswered} bez odgovora)`
          : "Predaj ispit"}
      </button>
    </div>
  );
}
