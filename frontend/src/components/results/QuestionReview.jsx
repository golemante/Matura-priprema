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
  if (isLoading) {
    return (
      <Loader2 size={16} className="text-warm-300 flex-shrink-0 animate-spin" />
    );
  }
  if (isSkipped) {
    return <Minus size={16} className="text-warm-400 flex-shrink-0" />;
  }
  if (isCorrect) {
    return <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />;
  }
  return <XCircle size={16} className="text-red-500 flex-shrink-0" />;
}

function AnswerBadges({ chosenLetter, correctLetter, isCorrect, isLoading }) {
  if (isLoading || !correctLetter) return null;

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {chosenLetter && (
        <span
          className={cn(
            "text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 leading-none",
            isCorrect
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-red-100 text-red-600 border-red-300 line-through",
          )}
          title={isCorrect ? "Tvoj odgovor (točno)" : "Tvoj odgovor (netočno)"}
        >
          {chosenLetter.toUpperCase()}
        </span>
      )}

      {!isCorrect && (
        <span
          className="text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 bg-green-100 text-green-700 border-green-300 leading-none"
          title="Točan odgovor"
        >
          {correctLetter.toUpperCase()}
        </span>
      )}
    </div>
  );
}

function OptionRow({ opt, correctLetter, chosenLetter, keyLoaded }) {
  const letter = opt.letter ?? opt.id;
  const isCorrectOpt = keyLoaded && letter === correctLetter;
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
    textCls = "text-red-700 line-through opacity-75";
  } else {
    containerCls = "bg-white border-warm-100";
    circleCls = "bg-warm-100 text-warm-500 border-warm-200";
    textCls = "text-warm-600";
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-colors",
        containerCls,
        hasImage && "flex-col",
      )}
    >
      <div className="flex items-start gap-2.5 w-full">
        <span
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
            "text-[10px] font-black border mt-0.5",
            circleCls,
          )}
        >
          {letter.toUpperCase()}
        </span>

        {!hasImage && (
          <OptionText
            text={opt.text}
            className={cn("flex-1 leading-snug", textCls)}
          />
        )}

        <div className="flex-shrink-0 ml-auto self-center">
          {isCorrectOpt && isUserPick && (
            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-md leading-none">
              Tvoj ✓
            </span>
          )}
          {isCorrectOpt && !isUserPick && (
            <CheckCircle2 size={14} className="text-green-600" />
          )}
          {isWrongPick && <XCircle size={14} className="text-red-400" />}
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

function ExplanationBlock({ explanation }) {
  if (!explanation) return null;
  return (
    <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl mt-1">
      <Lightbulb size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
      <SafeHtml
        html={explanation}
        className="text-xs text-blue-900 leading-relaxed"
      />
    </div>
  );
}

function OptionsSkeleton({ count = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-warm-100 bg-warm-50"
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
      <span className="text-xs text-amber-800 font-medium">
        Polazni tekst: {passage.title ?? "Priloženi tekst"}
      </span>
    </div>
  );
}

function rowBorderCls(isSkipped, isCorrect, isLoading) {
  if (isLoading) return "border-warm-200";
  if (isSkipped) return "border-warm-200";
  if (isCorrect) return "border-green-200";
  return "border-red-200";
}

function rowBadgeCls(isSkipped, isCorrect, isLoading) {
  if (isLoading) return "bg-warm-100 text-warm-500";
  if (isSkipped) return "bg-warm-100 text-warm-500";
  if (isCorrect) return "bg-green-100 text-green-700";
  return "bg-red-100 text-red-700";
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
  const isCorrect = keyLoaded ? (answerInfo?.isCorrect ?? false) : false;
  const correctLetter = keyLoaded ? (answerInfo?.correctOption ?? null) : null;
  const explanation = answerInfo?.explanation ?? null;

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (keyLoaded && !isCorrect && !isSkipped) {
      setExpanded(true);
    }
  }, [keyLoaded, isCorrect, isSkipped]);

  const borderCls = rowBorderCls(isSkipped, isCorrect, loadingKey);
  const badgeCls = rowBadgeCls(isSkipped, isCorrect, loadingKey);

  const displayLabel = question.positionLabel ?? String(question.position ?? 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.3) }}
      className={cn(
        "rounded-xl border-2 overflow-hidden bg-white transition-colors duration-300",
        borderCls,
      )}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-black/[0.015] transition-colors"
        aria-expanded={expanded}
      >
        <div className="mt-0.5 flex-shrink-0">
          <StatusIcon
            isSkipped={isSkipped}
            isCorrect={isCorrect}
            isLoading={loadingKey && !isSkipped}
          />
        </div>

        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "inline-block text-[10px] font-black px-1.5 py-0.5 rounded mr-1.5 mb-1",
              badgeCls,
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
          <AnswerBadges
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
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5 border-t border-warm-100 pt-3">
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
