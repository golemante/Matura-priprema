// components/exam/QuestionDisplay.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PROMJENE u odnosu na QuestionView:
//   • Opcije koriste option.letter ('a'|'b'|...) umjesto option.id za prikaz i selekciju
//   • Podržava question_type: 'fill_blank_child' — podpitanja s labelom (58.1, 58.2)
//   • Podržava inline_text — kratki citat/pjesma unutar pitanja
//   • section_label prikazuje se vizualno ako se promijenio
//   • isPaused prop — sve opcije su disabled, vizualni overlay
//   • positionLabel kao prikaz broja umjesto index+1
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Flag, CheckCircle, Lock } from "lucide-react";
import { MathText } from "@/components/math/MathRenderer";
import { cn } from "@/utils/utils";

// ── Inline text prikaz (kratki citat uz pitanje) ──────────────────────────────
function InlineTextBlock({ html }) {
  if (!html) return null;
  return (
    <div
      className="my-3 px-4 py-3 bg-blue-50 border-l-4 border-blue-300 rounded-r-xl text-sm text-blue-900 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Jedna opcija ──────────────────────────────────────────────────────────────
function OptionButton({ option, selected, onSelect, disabled }) {
  return (
    <motion.button
      key={option.id}
      onClick={() => !disabled && onSelect(option.letter)}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      disabled={disabled}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 group",
        disabled && "cursor-default opacity-70",
        !disabled && "cursor-pointer",
        selected
          ? "border-primary-500 bg-primary-50 shadow-sm"
          : !disabled
            ? "border-warm-200 bg-white hover:border-warm-400 hover:bg-warm-50"
            : "border-warm-200 bg-warm-50",
      )}
    >
      {/* Letter circle */}
      <div
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all",
          selected
            ? "border-primary-500 bg-primary-500 text-white"
            : "border-warm-300 text-warm-400 group-hover:border-warm-500",
        )}
      >
        {option.letter.toUpperCase()}
      </div>

      {/* Option text */}
      <MathText
        text={option.text}
        className={cn(
          "text-sm font-medium flex-1 text-left",
          selected ? "text-primary-800" : "text-warm-800",
        )}
      />

      {selected && (
        <CheckCircle
          size={16}
          className="text-primary-500 flex-shrink-0 ml-auto"
        />
      )}
    </motion.button>
  );
}

// ── Glavni QuestionDisplay ────────────────────────────────────────────────────
export function QuestionDisplay({
  question,
  selectedAnswer, // letter: 'a'|'b'|...|null
  onAnswer, // (letter: string) => void
  onFlag,
  isFlagged,
  index, // 0-based index za fallback prikaz
  isPaused = false,
}) {
  if (!question) return null;

  const isParent = question.questionType === "fill_blank_mc";
  const isChild = question.questionType === "fill_blank_child";

  const displayLabel = question.positionLabel ?? String(index + 1);

  return (
    <div className="relative">
      {/* Pauza overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-warm-500">
            <Lock size={24} />
            <p className="text-sm font-semibold">Ispit je pauziran</p>
          </div>
        </div>
      )}

      {/* ── Question card ───────────────────────────────────────────────── */}
      <div
        className={cn(
          "bg-white rounded-2xl border border-warm-300 shadow-card p-6 mb-4",
          isChild && "border-l-4 border-l-primary-300 ml-2",
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Broj pitanja */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full border",
                isParent
                  ? "text-warm-600 bg-warm-100 border-warm-300"
                  : isChild
                    ? "text-primary-700 bg-primary-50 border-primary-200"
                    : "text-primary-600 bg-primary-50 border-primary-200",
              )}
            >
              {isChild ? `Pitanje ${displayLabel}` : `Pitanje ${displayLabel}`}
            </span>

            {question.sectionLabel && (
              <span className="text-xs text-warm-400 font-medium hidden sm:inline">
                {question.sectionLabel}
              </span>
            )}
          </div>

          {/* Bodovi + flag */}
          <div className="flex items-center gap-2 text-xs text-warm-400 flex-shrink-0">
            {!isParent && (
              <span className="font-medium">
                {question.points} {question.points === 1 ? "bod" : "boda"}
              </span>
            )}
            {!isParent && (
              <button
                onClick={onFlag}
                disabled={isPaused}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isFlagged
                    ? "text-amber-600 bg-amber-50"
                    : "text-warm-400 hover:text-warm-700 hover:bg-warm-100",
                  isPaused && "opacity-50 cursor-default",
                )}
                title="Označi pitanje (F)"
              >
                <Flag size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Tekst pitanja */}
        <MathText
          text={question.text}
          className={cn(
            "text-warm-900 font-medium text-base leading-relaxed",
            isParent && "font-semibold text-warm-700",
          )}
        />

        {/* Inline tekst (kratki citat, pjesma...) */}
        <InlineTextBlock html={question.inlineText} />

        {/* Napomena za parent fill_blank */}
        {isParent && (
          <p className="mt-3 text-xs text-warm-400 italic">
            Riješite sljedeća podpitanja:
          </p>
        )}
      </div>

      {/* ── Opcije (samo za pitanja koja imaju odgovore) ───────────────── */}
      {!isParent && question.options.length > 0 && (
        <div className="space-y-2.5">
          {question.options.map((opt) => (
            <OptionButton
              key={opt.id}
              option={opt}
              selected={selectedAnswer === opt.letter}
              onSelect={onAnswer}
              disabled={isPaused}
            />
          ))}
        </div>
      )}
    </div>
  );
}
