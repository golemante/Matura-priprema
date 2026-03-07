// components/exam/QuestionDisplay.jsx
// ─────────────────────────────────────────────────────────────────────────────
// SAŽETAK ISPRAVAKA (v4):
//
//  BUG #1 — selectedAnswer prop (ne selectedOption)
//    ExamTaking proslijedi selectedOption — QuestionDisplay prima selectedAnswer.
//    Rezultat: odabrana opcija NIKAD nije bila označena.
//    FIX: prop ostaje selectedAnswer, ExamTaking mora proslijediti pravilno.
//
//  BUG #2 — onFlag prop (ne onToggleFlag)
//    ExamTaking proslijedi onToggleFlag — QuestionDisplay prima onFlag.
//    Rezultat: flag gumb nikad nije radio.
//    FIX: prop ostaje onFlag. ExamTaking mora proslijediti: onFlag={handleToggleFlag}
//
//  BUG #3 — index prop (ne questionNumber)
//    ExamTaking proslijedi questionNumber={currentIndex+1} — QuestionDisplay prima index (0-based).
//    Rezultat: label pitanja bio je +1 off.
//    FIX: prop ostaje index (0-based), ExamTaking: index={currentIndex}
//
//  BUG #4 — HTML tagovi u tekstu pitanja i opcijama
//    MathText renderira plain text — <em>, <strong>, <u>... prikazuju se doslovno.
//    FIX: SafeHtml komponenta sanitizira i renderira HTML + opcijski LaTeX.
//
//  BUG #5 — fill_blank_mc parent prikaz
//    Pitanje 58 je prikazano kao zasebno pitanje bez opcija (confusing).
//    FIX: Kad je current = fill_blank_child, prikazuje se parent tekst iznad
//    kao KONTEKST, i jasno se vizualizira koja praznina se popunjava.
//
//  BUG #6 — isPaused prop nije proslijeđen iz ExamTaking
//    FIX: ExamTaking mora proslijediti isPaused={isPaused}
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Flag, Lock } from "lucide-react";
import { SafeHtml } from "@/components/common/SafeHtml";
import { cn } from "@/utils/utils";

// ── InlineTextBlock — kratki citat/fragment iznad pitanja ─────────────────────
function InlineTextBlock({ html }) {
  if (!html) return null;
  return (
    <div className="mt-3 mb-1 px-4 py-3 bg-indigo-50 border-l-4 border-indigo-300 rounded-r-xl">
      <SafeHtml
        html={html}
        className="text-sm text-indigo-900 leading-relaxed italic"
      />
    </div>
  );
}

// ── FillBlankParentContext — prikazuje parent tekst za child pitanja ───────────
// Kada je pitanje fill_blank_child (npr. 58.2), prikazuje cijeli parent tekst
// s istaknutom prazninom koju treba popuniti.
function FillBlankParentContext({ parentText, childText, childLabel }) {
  if (!parentText) return null;

  // Označi aktualnu prazninu u tekstu parenta
  const highlightedText = useMemo(() => {
    // Tražimo pattern "(N.) ________" koji odgovara childLabel broju
    const labelNum = childLabel?.replace(/[^0-9]/g, "");
    if (!labelNum) return parentText;
    // Highlight aktualne praznine
    return parentText.replace(
      new RegExp(
        `(\\(${labelNum}\\.\\)\\s*_{3,}|<strong>\\(${labelNum}\\.\\).*?<\\/strong>)`,
        "i",
      ),
      (match) => `<mark class="fill-blank-active">${match}</mark>`,
    );
  }, [parentText, childLabel]);

  return (
    <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Polazni tekst zadatka
        </span>
        <span className="text-[10px] text-slate-400">
          — popunite prazninu označenu bojom
        </span>
      </div>
      <SafeHtml
        html={highlightedText}
        className="text-sm text-slate-700 leading-relaxed fill-blank-context"
      />
    </div>
  );
}

// React import za useMemo
import { useMemo } from "react";

// ── Jedna opcija ──────────────────────────────────────────────────────────────
function OptionButton({ option, selected, onSelect, disabled }) {
  return (
    <motion.button
      onClick={() => !disabled && onSelect(option.letter)}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150",
        "flex items-center gap-3 group select-none",
        disabled ? "cursor-default" : "cursor-pointer",
        selected
          ? "border-primary-500 bg-primary-50 shadow-sm"
          : !disabled
            ? "border-warm-200 bg-white hover:border-warm-400 hover:bg-warm-50"
            : "border-warm-200 bg-warm-50 opacity-60",
      )}
    >
      {/* Letter badge */}
      <div
        className={cn(
          "w-7 h-7 rounded-full border-2 flex items-center justify-center",
          "flex-shrink-0 text-xs font-bold transition-all duration-150",
          selected
            ? "border-primary-500 bg-primary-500 text-white"
            : "border-warm-300 text-warm-500 group-hover:border-primary-400 group-hover:text-primary-600",
        )}
        aria-hidden="true"
      >
        {option.letter.toUpperCase()}
      </div>

      {/* Option text — SafeHtml za HTML/LaTeX */}
      <SafeHtml
        html={option.text}
        inline
        className={cn(
          "text-sm font-medium flex-1 text-left leading-snug",
          selected ? "text-primary-900" : "text-warm-800",
        )}
      />

      {/* Selected indicator */}
      {selected && (
        <div
          className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-500 ml-auto"
          aria-hidden="true"
        />
      )}
    </motion.button>
  );
}

// ── Glavni QuestionDisplay ────────────────────────────────────────────────────
export function QuestionDisplay({
  question,
  parentQuestion, // fill_blank_mc parent — za kontekst kod child pitanja
  selectedAnswer, // letter: 'a'|'b'|'c'|'d' ili null
  onAnswer, // (letter: string) => void
  onFlag, // () => void
  isFlagged, // boolean
  index, // 0-based index (za fallback label ako nema positionLabel)
  isPaused, // boolean
}) {
  if (!question) return null;

  const isParent = question.questionType === "fill_blank_mc";
  const isChild = question.questionType === "fill_blank_child";

  // Label: positionLabel iz DB ("58.1") ili fallback na index+1
  const displayLabel = question.positionLabel ?? String(index + 1);

  return (
    <div className="relative">
      {/* ── Pauza overlay ───────────────────────────────────────────────── */}
      {isPaused && (
        <div className="absolute inset-0 z-10 bg-white/85 backdrop-blur-sm rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-warm-400">
            <Lock size={28} strokeWidth={1.5} />
            <p className="text-sm font-semibold">Ispit je pauziran</p>
          </div>
        </div>
      )}

      {/* ── Kontekst parent pitanja (za fill_blank_child) ────────────────── */}
      {isChild && parentQuestion && (
        <FillBlankParentContext
          parentText={parentQuestion.text}
          childText={question.text}
          childLabel={displayLabel}
        />
      )}

      {/* ── Question card ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "bg-white rounded-2xl border shadow-card p-5 mb-3",
          isChild
            ? "border-l-4 border-l-primary-400 border-warm-200"
            : isParent
              ? "border-warm-200 bg-warm-50"
              : "border-warm-200",
        )}
      >
        {/* ── Header: broj + sekcija + bodovi + flag ───────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Broj pitanja */}
            <span
              className={cn(
                "inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border",
                isParent
                  ? "text-warm-500 bg-warm-100 border-warm-300"
                  : isChild
                    ? "text-primary-700 bg-primary-50 border-primary-200"
                    : "text-primary-700 bg-primary-50 border-primary-200",
              )}
            >
              {isParent ? `Zadatak ${displayLabel}` : `Pitanje ${displayLabel}`}
            </span>

            {/* Sekcija — samo na širim ekranima */}
            {question.sectionLabel && (
              <span className="hidden sm:inline text-xs text-warm-400 font-medium truncate">
                {question.sectionLabel}
              </span>
            )}
          </div>

          {/* Bodovi + flag */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isParent && (
              <span className="text-xs text-warm-400 font-medium tabular-nums">
                {question.points}&nbsp;{question.points === 1 ? "bod" : "boda"}
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
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isFlagged
                    ? "text-amber-600 bg-amber-100 hover:bg-amber-200"
                    : "text-warm-300 hover:text-amber-600 hover:bg-amber-50",
                  isPaused && "opacity-40 cursor-default pointer-events-none",
                )}
              >
                <Flag size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ── Tekst pitanja — SafeHtml za HTML + LaTeX ──────────────────── */}
        <SafeHtml
          html={question.text}
          className={cn(
            "text-warm-900 text-base leading-relaxed",
            isParent ? "font-semibold text-warm-700 text-sm" : "font-medium",
          )}
        />

        {/* ── Inline tekst (citat, pjesma...) ───────────────────────────── */}
        <InlineTextBlock html={question.inlineText} />

        {/* ── Napomena za parent fill_blank_mc ──────────────────────────── */}
        {isParent && (
          <p className="mt-3 text-xs text-warm-400 italic">
            Odaberite ispravan odgovor za svaku od sljedećih praznina:
          </p>
        )}
      </div>

      {/* ── Opcije — samo za pitanja s odgovorima ────────────────────────── */}
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
