// components/exam/QuestionDisplay.jsx
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flag, Check } from "lucide-react";
import { SafeHtml } from "@/components/common/SafeHtml";
import { cn } from "@/utils/utils";
import { AudioPlayer } from "@/components/exam/PassageDisplay";

function pointsLabel(n) {
  if (!n && n !== 0) return null;
  if (n === 1) return "1 bod";
  if (n < 5) return `${n} boda`;
  return `${n} bodova`;
}

function InlineTextBlock({ html }) {
  if (!html) return null;
  return (
    <div className="mt-4 mb-0.5 px-4 py-3.5 bg-indigo-50 border-l-[3px] border-indigo-400 rounded-r-xl">
      <SafeHtml
        html={html}
        className="text-sm text-indigo-900 leading-relaxed italic"
      />
    </div>
  );
}

function FillBlankParentContext({ parentText, childLabel }) {
  if (!parentText) return null;

  const highlightedText = useMemo(() => {
    const labelNum = childLabel?.replace(/[^0-9]/g, "");
    if (!labelNum) return parentText;
    return parentText.replace(
      new RegExp(
        `(\\(${labelNum}\\.\\)\\s*_{3,}|<strong>\\(${labelNum}\\.\\).*?<\\/strong>)`,
        "i",
      ),
      (match) => `<mark class="fill-blank-active">${match}</mark>`,
    );
  }, [parentText, childLabel]);

  return (
    <div className="mb-3 px-3.5 py-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
      <SafeHtml
        html={highlightedText}
        className="text-sm text-blue-900 leading-relaxed fill-blank-context"
      />
    </div>
  );
}

function OptionButton({ option, selected, onSelect, disabled }) {
  return (
    <motion.button
      onClick={(e) => {
        if (disabled) return;
        onSelect(option.letter);
        e.currentTarget.blur();
      }}
      whileHover={!disabled && !selected ? { y: -1 } : undefined}
      whileTap={disabled ? undefined : { scale: 0.992 }}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "w-full text-left rounded-xl border-2 transition-all duration-150",
        "flex items-center gap-3 px-4 py-3.5 group select-none",
        disabled ? "cursor-default" : "cursor-pointer",
        selected
          ? [
              "border-primary-500 bg-primary-50",
              "shadow-[0_2px_10px_-2px_rgba(45,84,232,0.18)]",
            ]
          : !disabled
            ? [
                "border-warm-200 bg-white",
                "hover:border-primary-300 hover:bg-warm-50",
                "hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]",
              ]
            : "border-warm-200 bg-warm-50 opacity-60",
      )}
    >
      {/* Letter/Check badge */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          "text-xs font-bold transition-all duration-150 border-2",
          selected
            ? "bg-primary-600 border-primary-600 text-white"
            : !disabled
              ? [
                  "border-warm-300 text-warm-600",
                  "group-hover:border-primary-400 group-hover:text-primary-600",
                ]
              : "border-warm-200 text-warm-400",
        )}
        aria-hidden="true"
      >
        {selected ? (
          <Check size={13} strokeWidth={3} />
        ) : (
          option.letter.toUpperCase()
        )}
      </div>

      <SafeHtml
        html={option.text}
        inline
        className={cn(
          "text-sm flex-1 text-left leading-snug",
          selected
            ? "font-semibold text-primary-900"
            : "font-medium text-warm-800",
        )}
      />
    </motion.button>
  );
}

export function QuestionDisplay({
  question,
  parentQuestion,
  selectedAnswer,
  onAnswer,
  onFlag,
  isFlagged,
  index,
  isPaused,
}) {
  if (!question) return null;

  const isParent = question.questionType === "fill_blank_mc";
  const isChild = question.questionType === "fill_blank_child";

  const displayLabel = question.positionLabel ?? String((index ?? 0) + 1);

  return (
    <div className="space-y-3">
      {/* fill_blank_child — prikaži okolni kontekst bez labele */}
      {isChild && parentQuestion && (
        <FillBlankParentContext
          parentText={parentQuestion.text}
          childLabel={question.positionLabel}
        />
      )}

      {/* Kartica pitanja */}
      <div
        className={cn(
          "bg-white rounded-2xl border border-warm-200",
          "shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5",
          isPaused && "opacity-60 pointer-events-none select-none",
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {question.sectionLabel && (
              <span className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">
                {question.sectionLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warm-100 text-warm-700 text-xs font-bold">
              Pitanje {displayLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {question.points != null && (
              <span className="text-xs text-warm-400 font-medium">
                {pointsLabel(question.points)}
              </span>
            )}
            {onFlag && (
              <button
                onClick={onFlag}
                disabled={isPaused}
                aria-label={
                  isFlagged ? "Ukloni zastavicu" : "Označi pitanje zastavicom"
                }
                aria-pressed={isFlagged}
                title={
                  isFlagged ? "Ukloni zastavicu" : "Označi za kasniji pregled"
                }
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-150",
                  isFlagged
                    ? "text-amber-600 bg-amber-100 hover:bg-amber-200"
                    : "text-warm-300 hover:text-amber-600 hover:bg-amber-50",
                  isPaused && "opacity-40 pointer-events-none",
                )}
              >
                <Flag size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Per-question audio (ako postoji) */}
        {question.audioUrl && (
          <div className="mb-4">
            <AudioPlayer audioUrl={question.audioUrl} maxPlays={2} compact />
          </div>
        )}

        {/* Tekst pitanja */}
        <SafeHtml
          html={question.text}
          className={cn(
            "text-warm-900 leading-relaxed mb-5",
            isParent ? "text-base font-semibold" : "text-sm",
          )}
        />

        {/* Inline tekst (za fill_blank_child) */}
        <InlineTextBlock html={question.inlineText} />

        {/* Opcije */}
        {!isParent && question.options?.length > 0 && (
          <div className="space-y-2 mt-4">
            {question.options.map((option) => (
              <OptionButton
                key={option.id ?? option.letter}
                option={option}
                selected={selectedAnswer === option.letter}
                onSelect={onAnswer}
                disabled={isPaused || !onAnswer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
