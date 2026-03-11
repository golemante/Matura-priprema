// components/results/SectionReview.jsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { QuestionReview } from "@/components/results/QuestionReview";
import { cn } from "@/utils/utils";

/**
 * @param {object}  props
 * @param {string}  props.sectionLabel
 * @param {Array}   props.questions      — sva pitanja ispita
 * @param {object}  props.answers        — { [questionId]: letter }
 * @param {object}  [props.answerKey]    — { [questionId]: { isCorrect, correctOption, explanation } }
 * @param {object}  [props.passages]     — { [passageId]: passage }
 * @param {Set}     [props.flagged]
 * @param {string}  props.filter         — 'all' | 'wrong' | 'skipped' | 'flagged'
 * @param {boolean} props.loadingKey
 */
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
    if (filter === "all") return allScoreable;
    if (filter === "wrong")
      return allScoreable.filter(
        (q) => answers[q.id] && !answerKey?.[q.id]?.isCorrect,
      );
    if (filter === "skipped") return allScoreable.filter((q) => !answers[q.id]);
    if (filter === "flagged")
      return allScoreable.filter((q) => flagged?.has?.(q.id));
    return allScoreable;
  }, [allScoreable, filter, answers, answerKey, flagged]);

  if (filtered.length === 0) return null;

  const correctInSection = allScoreable.filter(
    (q) => answerKey?.[q.id]?.isCorrect,
  ).length;
  const pctSection =
    allScoreable.length > 0
      ? Math.round((correctInSection / allScoreable.length) * 100)
      : null;

  return (
    <div className="mb-3">
      {/* ── Section header ───────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-warm-100 hover:bg-warm-150 border border-warm-200 rounded-xl mb-1.5 transition-colors text-left"
      >
        {/* Mini progress bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-warm-700 truncate">
              {sectionLabel}
            </span>
            <span className="text-xs text-warm-400 ml-2 flex-shrink-0">
              {correctInSection}/{allScoreable.length}
            </span>
          </div>
          <div className="h-1 bg-warm-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                pctSection === null
                  ? "w-0"
                  : pctSection >= 75
                    ? "bg-green-500"
                    : pctSection >= 50
                      ? "bg-amber-400"
                      : "bg-red-400",
              )}
              style={{ width: pctSection != null ? `${pctSection}%` : "0%" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {pctSection !== null && (
            <span
              className={cn(
                "text-xs font-black tabular-nums",
                pctSection >= 75
                  ? "text-green-600"
                  : pctSection >= 50
                    ? "text-amber-600"
                    : "text-red-600",
              )}
            >
              {pctSection}%
            </span>
          )}
          {open ? (
            <ChevronUp size={14} className="text-warm-300" />
          ) : (
            <ChevronDown size={14} className="text-warm-300" />
          )}
        </div>
      </button>

      {/* ── Lista pitanja ─────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2"
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
