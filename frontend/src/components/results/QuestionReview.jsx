import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Minus,
  ChevronDown,
  BookOpen,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { SafeHtml } from "@/components/common/SafeHtml";
import { MathText } from "@/components/math/MathRenderer";
import { cn } from "@/utils/cn";

function computeIsCorrect(chosenLetter, correctLetter, keyLoaded) {
  if (!keyLoaded || !correctLetter || !chosenLetter) return false;
  return chosenLetter === correctLetter;
}

function OptionText({ text, className }) {
  if (!text) return null;
  const isPureMath = text.trim().startsWith("$") && !text.includes("<");
  return isPureMath ? (
    <MathText text={text} className={className} />
  ) : (
    <SafeHtml html={text} inline className={className} />
  );
}

function StatusIcon({ isSkipped, isCorrect, isLoading }) {
  if (isLoading)
    return (
      <Loader2 size={16} className="text-warm-300 flex-shrink-0 animate-spin" />
    );
  if (isSkipped)
    return <Minus size={16} className="text-warm-400 flex-shrink-0" />;
  if (isCorrect)
    return <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />;
  return <XCircle size={16} className="text-red-500 flex-shrink-0" />;
}

function HeaderBadges({ chosenLetter, correctLetter, isCorrect, isLoading }) {
  if (isLoading || !correctLetter) return null;

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {chosenLetter && (
        <span
          title={isCorrect ? "Tvoj odgovor – točno" : "Tvoj odgovor – netočno"}
          className={cn(
            "text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 leading-none",
            isCorrect
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-red-100 text-red-600 border-red-300",
          )}
        >
          {chosenLetter.toUpperCase()}
        </span>
      )}
      {!isCorrect && (
        <span
          title="Točan odgovor"
          className="text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 bg-green-100 text-green-700 border-green-300 leading-none"
        >
          {correctLetter.toUpperCase()}
        </span>
      )}
    </div>
  );
}

function OptionRow({ opt, correctLetter, chosenLetter, keyLoaded }) {
  const letter = opt.letter ?? opt.id;
  const isCorrectOpt = keyLoaded && !!correctLetter && letter === correctLetter;
  const isUserPick = letter === chosenLetter;
  const isWrongPick = isUserPick && keyLoaded && !isCorrectOpt;
  const hasImage = !!opt.image_url;

  let containerCls, circleCls, textCls;
  if (isCorrectOpt) {
    containerCls = "bg-green-50 border-green-300";
    circleCls = "bg-green-600 text-white border-green-600";
    textCls = "text-green-900 font-medium";
  } else if (isWrongPick) {
    containerCls = "bg-red-50 border-red-200";
    circleCls = "bg-red-400 text-white border-red-400";
    textCls = "text-red-700 line-through opacity-70";
  } else {
    containerCls = "bg-white border-warm-100";
    circleCls = "bg-warm-100 text-warm-500 border-warm-200";
    textCls = "text-warm-500";
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm",
        containerCls,
        hasImage && "flex-col",
      )}
    >
      <div className="flex items-start gap-2.5 w-full min-w-0">
        <span
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border mt-0.5",
            circleCls,
          )}
        >
          {letter.toUpperCase()}
        </span>

        {!hasImage && (
          <OptionText
            text={opt.text}
            className={cn("flex-1 leading-snug min-w-0", textCls)}
          />
        )}

        <div className="flex-shrink-0 ml-auto self-center pl-1">
          {isCorrectOpt && isUserPick && (
            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap">
              Tvoj ✓
            </span>
          )}
          {isCorrectOpt && !isUserPick && (
            <CheckCircle2 size={13} className="text-green-600" />
          )}
          {isWrongPick && <XCircle size={13} className="text-red-400" />}
        </div>
      </div>

      {hasImage && (
        <div className="pl-7 w-full">
          <img
            src={opt.image_url}
            alt={`Opcija ${letter.toUpperCase()}`}
            className={cn(
              "max-h-36 w-auto rounded-lg object-contain border",
              isCorrectOpt
                ? "border-green-300"
                : isWrongPick
                  ? "border-red-200 opacity-70"
                  : "border-warm-200",
            )}
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

function OptionsSkeleton({ count = 4 }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-warm-100 bg-warm-50"
        >
          <div className="w-5 h-5 rounded-full bg-warm-200 flex-shrink-0 animate-pulse" />
          <div
            className={cn(
              "h-3 rounded bg-warm-200 animate-pulse",
              ["w-3/5", "w-2/3", "w-1/2", "w-4/5"][i % 4],
            )}
          />
        </div>
      ))}
    </div>
  );
}

function PassageChip({ passage }) {
  if (!passage) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
      <BookOpen size={12} className="text-amber-600 flex-shrink-0" />
      <span className="text-xs text-amber-800 font-medium truncate">
        Polazni tekst: {passage.title ?? "Priloženi tekst"}
      </span>
    </div>
  );
}

function ExplanationBlock({ explanation }) {
  if (!explanation) return null;
  return (
    <div className="flex items-start gap-2.5 p-3 sm:p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
      <Lightbulb size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
      <SafeHtml
        html={explanation}
        className="text-xs text-blue-900 leading-relaxed"
      />
    </div>
  );
}

function getRowStyle(isSkipped, isCorrect, showLoader) {
  if (showLoader)
    return { border: "border-warm-200", badge: "bg-warm-100 text-warm-400" };
  if (isSkipped)
    return { border: "border-warm-200", badge: "bg-warm-100 text-warm-500" };
  if (isCorrect)
    return { border: "border-green-200", badge: "bg-green-100 text-green-700" };
  return { border: "border-red-200", badge: "bg-red-100 text-red-700" };
}

export function QuestionReview({
  question,
  chosenLetter,
  answerInfo,
  passage,
  loadingKey,
  index = 0,
}) {
  const keyLoaded = !loadingKey;
  const isSkipped = !chosenLetter;
  const correctLetter = keyLoaded ? (answerInfo?.correctOption ?? null) : null;
  const isCorrect = computeIsCorrect(chosenLetter, correctLetter, keyLoaded);
  const explanation = answerInfo?.explanation ?? null;

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (keyLoaded && !isCorrect && !isSkipped) setExpanded(true);
  }, [keyLoaded, isCorrect, isSkipped]);

  const showLoader = loadingKey && !isSkipped;
  const { border, badge } = getRowStyle(isSkipped, isCorrect, showLoader);
  const displayLabel = question.positionLabel ?? String(question.position ?? 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.25) }}
      className={cn(
        "rounded-xl border-2 overflow-hidden bg-white transition-colors duration-300",
        border,
      )}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 text-left hover:bg-black/[0.015] transition-colors"
        aria-expanded={expanded}
      >
        <div className="mt-0.5 flex-shrink-0">
          <StatusIcon
            isSkipped={isSkipped}
            isCorrect={isCorrect}
            isLoading={showLoader}
          />
        </div>

        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "inline-block text-[10px] font-black px-1.5 py-0.5 rounded mr-1.5 mb-0.5 leading-none",
              badge,
            )}
          >
            {displayLabel}
          </span>
          <SafeHtml
            html={question.text}
            inline
            className="text-sm text-warm-800 leading-snug line-clamp-2"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          <HeaderBadges
            chosenLetter={chosenLetter}
            correctLetter={correctLetter}
            isCorrect={isCorrect}
            isLoading={loadingKey}
          />
          <ChevronDown
            size={14}
            className={cn(
              "text-warm-300 transition-transform flex-shrink-0",
              expanded && "rotate-180",
            )}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 border-t border-warm-100 pt-2.5">
              <PassageChip passage={passage} />
              {loadingKey ? (
                <OptionsSkeleton count={question.options?.length ?? 4} />
              ) : (
                question.options?.length > 0 && (
                  <div className="space-y-1.5">
                    {question.options.map((opt) => (
                      <OptionRow
                        key={opt.letter ?? opt.id}
                        opt={opt}
                        correctLetter={correctLetter}
                        chosenLetter={chosenLetter}
                        keyLoaded={keyLoaded}
                      />
                    ))}
                  </div>
                )
              )}
              <ExplanationBlock explanation={explanation} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
