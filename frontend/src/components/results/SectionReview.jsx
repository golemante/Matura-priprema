import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { QuestionReview } from "@/components/results/QuestionReview";
import { cn } from "@/utils/cn";

function SectionProgressBar({ pct }) {
  const barColor =
    pct === null
      ? ""
      : pct >= 75
        ? "bg-green-500"
        : pct >= 50
          ? "bg-amber-400"
          : "bg-red-400";

  return (
    <div className="h-1 bg-warm-200 rounded-full overflow-hidden">
      {pct !== null && (
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
    </div>
  );
}

function SectionScore({ correct, total, pct }) {
  if (pct === null)
    return <span className="text-[10px] text-warm-400">{total} pit.</span>;

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
        return allScoreable.filter((q) => {
          if (!answers[q.id]) return false;
          const info = answerKey?.[q.id];
          if (!info?.correctOption) return false;
          return answers[q.id] !== info.correctOption;
        });
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
    : allScoreable.filter((q) => {
        const info = answerKey?.[q.id];
        return info?.correctOption && answers[q.id] === info.correctOption;
      }).length;

  const pctSection =
    !loadingKey && correctInSection !== null && allScoreable.length > 0
      ? Math.round((correctInSection / allScoreable.length) * 100)
      : null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3",
          "bg-warm-50 hover:bg-warm-100 border border-warm-200 transition-colors text-left",
          open ? "rounded-t-xl border-b-0" : "rounded-xl",
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
        <div className="flex-shrink-0 text-warm-400 ml-1">
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
            className="overflow-hidden border border-t-0 border-warm-200 rounded-b-xl bg-white px-2.5 sm:px-3 pt-2 pb-2.5 space-y-1.5"
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
