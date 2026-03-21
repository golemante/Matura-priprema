import { useCallback } from "react";
import { motion } from "framer-motion";
import { Flag, Check } from "lucide-react";
import { SafeHtml } from "@/components/common/SafeHtml";
import { MathText } from "@/components/math/MathRenderer";
import { cn } from "@/utils/cn";

function OptionText({ text, selected }) {
  if (!text) return null;

  const isPureMath = text.trim().startsWith("$") && !text.includes("<");

  const cls = cn(
    "text-sm flex-1 text-left leading-snug",
    selected ? "font-semibold text-primary-900" : "font-medium text-warm-800",
  );

  return isPureMath ? (
    <MathText text={text} className={cls} />
  ) : (
    <SafeHtml html={text} inline className={cls} />
  );
}

function OptionButton({ option, selected, onSelect, disabled }) {
  const handleClick = useCallback(() => {
    if (!disabled) onSelect?.(option.letter);
  }, [disabled, onSelect, option.letter]);

  const hasImage = !!option.image_url;

  return (
    <motion.button
      layout
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-150 text-left group",
        selected
          ? [
              "border-primary-500 bg-primary-50",
              "shadow-[0_0_0_3px_rgba(45,84,232,0.12)]",
            ]
          : !disabled
            ? [
                "border-warm-200 bg-white",
                "hover:border-primary-300 hover:bg-warm-50",
                "hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]",
              ]
            : "border-warm-200 bg-warm-50 opacity-60",
        hasImage && "flex-col items-start gap-2",
      )}
    >
      <div className="flex items-center gap-3 w-full">
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
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

        {!hasImage && <OptionText text={option.text} selected={selected} />}
      </div>

      {hasImage && (
        <div className="w-full pl-11">
          <img
            src={option.image_url}
            alt={`Opcija ${option.letter.toUpperCase()}`}
            className={cn(
              "max-h-44 w-auto rounded-xl object-contain border border-warm-200",
              selected && "border-primary-300 shadow-sm",
            )}
            loading="lazy"
          />
        </div>
      )}
    </motion.button>
  );
}

function InlineTextBlock({ html }) {
  if (!html) return null;
  return (
    <div className="my-3 px-4 py-3 bg-warm-50 border border-warm-200 rounded-xl">
      <SafeHtml html={html} className="text-sm text-warm-700 leading-relaxed" />
    </div>
  );
}

function QuestionImage({ imageUrl, label }) {
  if (!imageUrl) return null;
  return (
    <div className="my-4 flex justify-center">
      <img
        src={imageUrl}
        alt={label ?? "Skica pitanja"}
        className="max-w-full max-h-64 rounded-xl border border-warm-200 shadow-sm object-contain"
        loading="eager"
      />
    </div>
  );
}

export function QuestionDisplay({
  question,
  selectedAnswer,
  onAnswer,
  onFlag,
  isFlagged,
  index,
  isPaused,
}) {
  if (!question) return null;

  const isParent = question.questionType === "fill_blank_mc";
  const displayLabel = question.positionLabel ?? String((index ?? 0) + 1);

  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-warm-400 uppercase tracking-wider">
              Pitanje {displayLabel}
            </span>
            {question.sectionLabel && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-warm-100 text-warm-500">
                {question.sectionLabel}
              </span>
            )}
            {question.points > 1 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary-50 text-primary-600">
                {question.points} {question.points === 1 ? "bod" : "boda"}
              </span>
            )}
          </div>

          {onFlag && !isParent && (
            <button
              onClick={onFlag}
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

        <SafeHtml
          html={question.text}
          className={cn(
            "text-warm-900 leading-relaxed",
            isParent ? "text-base font-semibold" : "text-sm",
            question.imageUrl ? "mb-2" : "mb-5",
          )}
        />

        <QuestionImage
          imageUrl={question.imageUrl}
          label={`Skica za pitanje ${displayLabel}`}
        />

        <InlineTextBlock html={question.inlineText} />

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
