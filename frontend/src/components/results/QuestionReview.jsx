// components/results/QuestionReview.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Minus,
  ChevronDown,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { SafeHtml } from "@/components/common/SafeHtml";
import { cn } from "@/utils/cn";

function OptionSkeleton({ count = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-warm-100 bg-warm-50 animate-pulse"
        >
          <div className="w-6 h-6 rounded-full bg-warm-200 flex-shrink-0" />
          <div
            className={cn(
              "h-3 rounded bg-warm-200",
              i === 0
                ? "w-3/5"
                : i === 1
                  ? "w-2/3"
                  : i === 2
                    ? "w-1/2"
                    : "w-4/5",
            )}
          />
        </div>
      ))}
    </div>
  );
}

export function QuestionReview({
  question,
  chosenLetter,
  answerInfo,
  passage,
  loadingKey,
  index = 0,
}) {
  const [expanded, setExpanded] = useState(false);

  const isSkipped = !chosenLetter;
  const isCorrect = answerInfo?.isCorrect ?? false;
  const correctLetter = answerInfo?.correctOption ?? null;
  const explanation = answerInfo?.explanation ?? null;

  useEffect(() => {
    if (!isCorrect && !isSkipped && !loadingKey) {
      setExpanded(true);
    }
  }, [isCorrect, isSkipped, loadingKey]);

  const statusIcon = isSkipped ? (
    <Minus size={16} className="text-warm-400 flex-shrink-0" />
  ) : isCorrect ? (
    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
  ) : (
    <XCircle size={16} className="text-red-500 flex-shrink-0" />
  );

  const borderCls = isSkipped
    ? "border-warm-200"
    : isCorrect
      ? "border-green-200"
      : "border-red-200";

  const badgeCls = isSkipped
    ? "bg-warm-100 text-warm-500"
    : isCorrect
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        "rounded-xl border-2 overflow-hidden bg-white transition-colors",
        borderCls,
      )}
    >
      {/* ── Header (uvijek vidljiv) ─────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02] transition-colors"
      >
        <div className="mt-0.5">{statusIcon}</div>

        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "inline-block text-[10px] font-black px-1.5 py-0.5 rounded mr-1.5 mb-0.5",
              badgeCls,
            )}
          >
            {question.positionLabel ?? String(question.position ?? 0)}
          </span>
          <SafeHtml
            html={question.text}
            inline
            className="text-sm text-warm-800 leading-snug line-clamp-2"
          />
        </div>

        {/* Odabrani / točni badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          {chosenLetter && (
            <span
              className={cn(
                "text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2",
                isCorrect
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-red-100 text-red-600 border-red-300",
              )}
            >
              {chosenLetter.toUpperCase()}
            </span>
          )}
          {!isCorrect && correctLetter && (
            <span className="text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 bg-green-100 text-green-700 border-green-300">
              {correctLetter.toUpperCase()}
            </span>
          )}
          <ChevronDown
            size={14}
            className={cn(
              "text-warm-300 transition-transform flex-shrink-0",
              expanded && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* ── Expanded detalji ───────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-warm-100 pt-3">
              {/* Passage badge */}
              {passage && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <BookOpen
                    size={12}
                    className="text-amber-600 flex-shrink-0"
                  />
                  <span className="text-xs text-amber-800 font-medium">
                    Polazni tekst: {passage.title ?? "Priloženi tekst"}
                  </span>
                </div>
              )}

              {/* Opcije ili skeleton */}
              {loadingKey ? (
                <OptionSkeleton count={question.options?.length ?? 4} />
              ) : (
                question.options?.length > 0 && (
                  <div className="space-y-1.5">
                    {question.options.map((opt) => {
                      const letter = opt.letter ?? opt.id;
                      const isCorrectOpt = letter === correctLetter;
                      const isUserPick = letter === chosenLetter;

                      return (
                        <div
                          key={letter}
                          className={cn(
                            "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-colors",
                            isCorrectOpt
                              ? "bg-green-50 border-green-300"
                              : isUserPick && !isCorrectOpt
                                ? "bg-red-50 border-red-200"
                                : "bg-white border-warm-100",
                          )}
                        >
                          {/* Letter badge */}
                          <span
                            className={cn(
                              "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                              "text-[10px] font-black border",
                              isCorrectOpt
                                ? "bg-green-600 text-white border-green-600"
                                : isUserPick
                                  ? "bg-red-400 text-white border-red-400"
                                  : "bg-warm-100 text-warm-500 border-warm-200",
                            )}
                          >
                            {letter.toUpperCase()}
                          </span>

                          {/* Option text */}
                          <SafeHtml
                            html={opt.text}
                            inline
                            className={cn(
                              "flex-1 leading-snug",
                              isCorrectOpt
                                ? "text-green-900 font-medium"
                                : isUserPick && !isCorrectOpt
                                  ? "text-red-800 line-through opacity-75"
                                  : "text-warm-600",
                            )}
                          />

                          {/* Status ikona */}
                          {isCorrectOpt && (
                            <CheckCircle2
                              size={14}
                              className="text-green-600 flex-shrink-0 mt-0.5"
                            />
                          )}
                          {isUserPick && !isCorrectOpt && (
                            <XCircle
                              size={14}
                              className="text-red-400 flex-shrink-0 mt-0.5"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Objašnjenje */}
              {explanation && (
                <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <Lightbulb
                    size={14}
                    className="text-blue-500 flex-shrink-0 mt-0.5"
                  />
                  <SafeHtml
                    html={explanation}
                    className="text-xs text-blue-900 leading-relaxed"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
