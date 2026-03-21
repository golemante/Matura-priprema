import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { QuestionReview } from "@/components/results/QuestionReview";
import { cn } from "@/utils/cn";

function SectionProgressBar({ pct }) {
  if (pct === null) return <div className="h-1 bg-warm-100 rounded-full" />;

  const barColor =
    pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="h-1 bg-warm-200 rounded-full overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", barColor)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function SectionScore({ correct, total, pct }) {
  if (pct === null) return null;

  const textColor =
    pct >= 75
      ? "text-green-600"
      : pct >= 50
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className={cn("text-xs font-black tabular-nums", textColor)}>
        {pct}%
      </span>
      <span className="text-[10px] text-warm-400 tabular-nums">
        {correct}/{total}
      </span>
    </div>
  );
}

export function SectionReview({
  sectionLabel,
  questions,
  answers,
  answerKey,
  passages,
  flagged,
  filter,
  loadingKey,
}) {
  const [open, setOpen] = useState(true);

  const allScoreable = useMemo(
    () =>
      questions.filter(
        (q) =>
          (q.sectionLabel ?? "Ostalo") === sectionLabel &&
          q.questionType !== "fill_blank_mc",
      ),
    [questions, sectionLabel],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "wrong":
        return allScoreable.filter(
          (q) => answers[q.id] && !answerKey?.[q.id]?.isCorrect,
        );
      case "skipped":
        return allScoreable.filter((q) => !answers[q.id]);
      case "flagged":
        return allScoreable.filter((q) => flagged?.has?.(q.id));
      default:
        return allScoreable;
    }
  }, [allScoreable, filter, answers, answerKey, flagged]);

  if (filtered.length === 0) return null;

  const correctInSection = loadingKey
    ? null
    : allScoreable.filter((q) => answerKey?.[q.id]?.isCorrect).length;

  const pctSection =
    !loadingKey && correctInSection !== null && allScoreable.length > 0
      ? Math.round((correctInSection / allScoreable.length) * 100)
      : null;

  return (
    <div className="mb-2.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3",
          "bg-warm-50 hover:bg-warm-100 border border-warm-200",
          open ? "rounded-t-xl border-b-transparent" : "rounded-xl",
          "transition-colors text-left",
        )}
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-warm-700 truncate">
              {sectionLabel}
            </span>
            <SectionScore
              correct={correctInSection}
              total={allScoreable.length}
              pct={pctSection}
            />
          </div>
          <SectionProgressBar pct={pctSection} />
        </div>

        <div className="flex-shrink-0 text-warm-400">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "overflow-hidden border border-t-0 border-warm-200 rounded-b-xl",
              "bg-white px-3 pt-2 pb-3 space-y-2",
            )}
          >
            {filtered.map((q, idx) => (
              <QuestionReview
                key={q.id}
                question={q}
                index={idx}
                chosenLetter={answers[q.id] ?? null}
                answerInfo={answerKey?.[q.id] ?? null}
                passage={q.passageId ? (passages?.[q.passageId] ?? null) : null}
                loadingKey={loadingKey}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
