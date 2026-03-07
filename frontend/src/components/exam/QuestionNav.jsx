// components/exam/QuestionNav.jsx — v5 PREMIUM REDESIGN
// ─────────────────────────────────────────────────────────────────────────────
// POBOLJŠANJA:
//   • Submit gumb uvijek vidljiv na dnu — istaknut, s brojem preskočenih
//   • Progress sekcija: postotak + bar u panelu
//   • fill_blank_mc: prikazuje se kao separator/zadatak (ne klikabilno)
//   • Bolji legend s 4 stanja
//   • max-h + overflow-y-auto za duge ispite
//   • onGoTo prop (usklađeno s ExamTaking)
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Send, Flag } from "lucide-react";
import { cn } from "@/utils/utils";

// ── NavButton ─────────────────────────────────────────────────────────────────
function NavButton({
  question,
  idx,
  isAnswered,
  isFlagged,
  isCurrent,
  onGoTo,
}) {
  const label = question.positionLabel ?? String(idx + 1);

  // fill_blank_mc parent — nije klikabilno, samo marker
  if (question.questionType === "fill_blank_mc") {
    return (
      <div
        className={cn(
          "w-full aspect-square rounded-lg flex items-center justify-center",
          "text-[9px] font-bold text-warm-400 bg-warm-50",
          "border border-dashed border-warm-200",
        )}
        title={`Zadatak ${label}`}
        aria-hidden="true"
      >
        {label}
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => onGoTo(idx)}
      aria-current={isCurrent ? "step" : undefined}
      aria-label={`Pitanje ${label}${isAnswered ? ", odgovoreno" : ""}${isFlagged ? ", označeno" : ""}`}
      title={`Pitanje ${label}`}
      className={cn(
        "w-full aspect-square rounded-lg text-[11px] font-bold transition-all duration-100 relative",
        isCurrent
          ? "bg-primary-600 text-white shadow-sm"
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
      {/* Flag dot */}
      {isFlagged && !isCurrent && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border-2 border-white"
          aria-hidden="true"
        />
      )}
    </motion.button>
  );
}

// ── Glavni QuestionNav ────────────────────────────────────────────────────────
export function QuestionNav({
  questions,
  answers,
  flagged, // Set<string>
  currentIndex,
  onGoTo, // (idx: number) => void
  onSubmit, // () => void
  answeredCount,
}) {
  const visibleQuestions = questions.filter(
    (q) => q.questionType !== "fill_blank_mc",
  );
  const total = visibleQuestions.length;
  const flaggedCount = flagged?.size ?? 0;
  const unanswered = total - (answeredCount ?? 0);
  const pct = total > 0 ? Math.round(((answeredCount ?? 0) / total) * 100) : 0;
  const allDone = unanswered === 0;

  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 sticky top-20 flex flex-col gap-3.5 max-h-[calc(100vh-7rem)]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
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

      {/* ── Progress ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-warm-500">Odgovoreno</span>
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              allDone ? "text-green-600" : "text-warm-800",
            )}
          >
            {answeredCount ?? 0}/{total}
          </span>
        </div>
        <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors duration-500",
              allDone ? "bg-green-500" : "bg-primary-600",
            )}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Grid pitanja ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-1.5 overflow-y-auto flex-1 content-start pb-0.5 pr-0.5 -mr-0.5">
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

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 pt-3 border-t border-warm-100">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {[
            {
              swatch: "bg-primary-600",
              label: "Trenutno",
            },
            {
              swatch: "bg-primary-100 border border-primary-200",
              label: "Odgovoreno",
            },
            {
              swatch: "bg-amber-50 border border-amber-300",
              label: "Označeno",
            },
            {
              swatch: "bg-warm-50 border border-warm-200",
              label: "Preskočeno",
            },
          ].map(({ swatch, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={cn("w-3 h-3 rounded flex-shrink-0", swatch)} />
              <span className="text-[10px] text-warm-500 leading-none">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Submit gumb — uvijek vidljiv ─────────────────────────────── */}
      <button
        onClick={onSubmit}
        className={cn(
          "flex-shrink-0 w-full flex items-center justify-center gap-2",
          "py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
          "active:scale-[0.98]",
          allDone
            ? "bg-primary-600 text-white hover:bg-primary-700 shadow-[0_2px_8px_-2px_rgba(45,84,232,0.4)]"
            : "bg-warm-800 text-white hover:bg-warm-900",
        )}
      >
        <Send size={13} />
        <span>Predaj ispit</span>
        {!allDone && unanswered > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold leading-none">
            {unanswered} bez odg.
          </span>
        )}
        {allDone && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold leading-none">
            sve riješeno ✓
          </span>
        )}
      </button>
    </div>
  );
}
