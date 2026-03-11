// components/exam/QuestionDisplay.jsx
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flag, Lock, Check } from "lucide-react";
import { SafeHtml } from "@/components/common/SafeHtml";
import { cn } from "@/utils/utils";

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

function FillBlankParentContext({ parentText, childText, childLabel }) {
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
    <div className="mb-4 p-4 bg-blue-50/80 border border-blue-200 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
          Polazni tekst zadatka
        </span>
        <span className="text-[10px] text-blue-400">
          · popunite označenu prazninu
        </span>
      </div>
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
      onClick={() => !disabled && onSelect(option.letter)}
      whileHover={!disabled && !selected ? { y: -1 } : undefined}
      whileTap={disabled ? undefined : { scale: 0.992 }}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        // Base
        "w-full text-left rounded-xl border-2 transition-all duration-150",
        "flex items-center gap-3 px-4 py-3.5 group select-none",
        disabled ? "cursor-default" : "cursor-pointer",
        // States
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

      {/* Option text — SafeHtml renderira HTML + LaTeX */}
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
  parentQuestion, // fill_blank_mc parent — za kontekst kod child pitanja
  selectedAnswer, // letter: 'a'|'b'|'c'|'d' ili null
  onAnswer, // (letter: string) => void
  onFlag, // () => void
  isFlagged, // boolean
  index, // 0-based index
  isPaused, // boolean
}) {
  if (!question) return null;

  const isParent = question.questionType === "fill_blank_mc";
  const isChild = question.questionType === "fill_blank_child";

  const displayLabel = question.positionLabel ?? String((index ?? 0) + 1);
  const points = pointsLabel(question.points);

  return (
    <div className="relative">
      {/* ── Pause overlay ─────────────────────────────────────────────── */}
      {isPaused && (
        <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-[3px] rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-warm-400">
            <Lock size={26} strokeWidth={1.5} />
            <p className="text-xs font-semibold tracking-wide">
              Ispit pauziran
            </p>
          </div>
        </div>
      )}

      {/* ── Parent context za fill_blank_child ────────────────────────── */}
      {isChild && parentQuestion && (
        <FillBlankParentContext
          parentText={parentQuestion.text}
          childText={question.text}
          childLabel={displayLabel}
        />
      )}

      {/* ── Question card ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.08)] p-5 mb-3",
          isChild
            ? "border-l-[3px] border-l-primary-400 border border-warm-200"
            : isParent
              ? "border border-warm-200 bg-warm-50/80"
              : "border border-warm-200",
        )}
      >
        {/* Header: pitanje N · bodovi · flag */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Broj pitanja */}
            <span
              className={cn(
                "inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap",
                isParent
                  ? "text-warm-500 bg-warm-100"
                  : isChild
                    ? "text-primary-700 bg-primary-50 border border-primary-200"
                    : "text-primary-700 bg-primary-50 border border-primary-200",
              )}
            >
              {isParent ? `Zadatak ${displayLabel}` : `Pitanje ${displayLabel}`}
            </span>

            {/* Sekcija — ako postoji */}
            {question.sectionLabel && (
              <span className="hidden sm:inline text-xs text-warm-400 font-medium truncate max-w-[160px]">
                {question.sectionLabel}
              </span>
            )}
          </div>

          {/* Bodovi + flag */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isParent && points && (
              <span className="text-xs text-warm-400 font-medium tabular-nums">
                {points}
              </span>
            )}
            {!isParent && (
              <button
                onClick={!isPaused ? onFlag : undefined}
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

        {/* Tekst pitanja */}
        <SafeHtml
          html={question.text}
          className={cn(
            "text-warm-900 leading-relaxed",
            isParent
              ? "text-sm font-semibold text-warm-700"
              : "text-[15px] font-medium",
          )}
        />

        {/* Inline tekst blok (citat, pjesma fragment...) */}
        <InlineTextBlock html={question.inlineText} />

        {/* Napomena za fill_blank_mc parent */}
        {isParent && (
          <p className="mt-3 text-xs text-warm-400 italic">
            Odaberite ispravan odgovor za svaku od sljedećih praznina:
          </p>
        )}
      </div>

      {/* ── Opcije ────────────────────────────────────────────────────── */}
      {!isParent && question.options?.length > 0 && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <OptionButton
              key={opt.id ?? opt.letter}
              option={opt}
              selected={selectedAnswer === opt.letter}
              onSelect={onAnswer}
              disabled={!!isPaused}
            />
          ))}
        </div>
      )}
    </div>
  );
}
