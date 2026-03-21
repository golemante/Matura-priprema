import { useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { cn } from "@/utils/cn";

function QuestionSquare({
  question,
  index,
  isCurrent,
  isAnswered,
  isFlagged,
  onNavigate,
}) {
  const label = question.positionLabel ?? String(index + 1);

  const handleClick = useCallback(() => {
    onNavigate(index);
  }, [index, onNavigate]);

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.88 }}
      aria-label={`Pitanje ${label}${isAnswered ? ", odgovoreno" : ""}${isFlagged ? ", zastavičeno" : ""}`}
      aria-current={isCurrent ? "true" : undefined}
      className={cn(
        "relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
        "text-xs font-bold border-2 transition-all duration-100 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1",
        isCurrent
          ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200"
          : isFlagged && isAnswered
            ? "bg-primary-50 border-amber-400 text-primary-700 hover:border-amber-500"
            : isFlagged
              ? "bg-amber-50 border-amber-400 text-amber-700 hover:border-amber-500"
              : isAnswered
                ? "bg-primary-50 border-primary-400 text-primary-700 hover:border-primary-500"
                : "bg-white border-warm-200 text-warm-500 hover:border-warm-400 hover:text-warm-700",
      )}
    >
      {label}

      {isFlagged && !isCurrent && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-white"
        />
      )}
    </motion.button>
  );
}

export function QuestionNav({ variant = "mobile" }) {
  const { questions, currentIndex, answers, flagged, goToQuestion } =
    useExamStore(
      useShallow((s) => ({
        questions: s.questions,
        currentIndex: s.currentIndex,
        answers: s.answers,
        flagged: s.flagged,
        goToQuestion: s.goToQuestion,
      })),
    );

  const currentRef = useRef(null);
  useEffect(() => {
    if (variant === "mobile" && currentRef.current) {
      currentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex, variant]);

  if (!questions?.length) return null;

  const getGroupBreak = (index) => {
    if (index === 0) return false;
    const prev = questions[index - 1];
    const curr = questions[index];
    return (
      prev.passageId !== curr.passageId && (prev.passageId || curr.passageId)
    );
  };

  if (variant === "desktop") {
    return (
      <nav
        aria-label="Navigacija po pitanjima"
        className={cn(
          "flex flex-col h-full",
          "px-3 py-3",
          "overflow-y-auto overscroll-contain",
          "scrollbar-thin scrollbar-thumb-warm-200 scrollbar-track-transparent",
        )}
      >
        <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider mb-2.5 px-0.5">
          Pitanja
        </p>

        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, i) => {
            const groupBreak = getGroupBreak(i);
            return (
              <span key={q.id} className={cn("contents", groupBreak && "ml-1")}>
                {groupBreak && (
                  <div className="w-full h-px bg-warm-100 my-0.5" />
                )}
                <div ref={i === currentIndex ? currentRef : null}>
                  <QuestionSquare
                    question={q}
                    index={i}
                    isCurrent={i === currentIndex}
                    isAnswered={!!answers?.[q.id]}
                    isFlagged={
                      flagged instanceof Set
                        ? flagged.has(q.id)
                        : !!flagged?.[q.id]
                    }
                    onNavigate={goToQuestion}
                  />
                </div>
              </span>
            );
          })}
        </div>

        <div className="mt-auto pt-4 space-y-1.5 border-t border-warm-100">
          <LegendItem color="bg-primary-400" label="Odgovoreno" />
          <LegendItem color="bg-amber-400" label="Zastavičeno" />
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navigacija po pitanjima"
      className={cn(
        "w-full flex-shrink-0",
        "bg-white border-b border-warm-100",
        "px-3 py-2.5",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap gap-1.5",
          "max-h-[82px] overflow-y-auto overflow-x-hidden",
          "overscroll-contain",
          "scrollbar-none",
        )}
      >
        {questions.map((q, i) => {
          const groupBreak = getGroupBreak(i);
          return (
            <span key={q.id} className="contents">
              {groupBreak && (
                <div className="self-center w-px h-5 bg-warm-200 mx-0.5" />
              )}
              <div ref={i === currentIndex ? currentRef : null}>
                <QuestionSquare
                  question={q}
                  index={i}
                  isCurrent={i === currentIndex}
                  isAnswered={!!answers?.[q.id]}
                  isFlagged={
                    flagged instanceof Set
                      ? flagged.has(q.id)
                      : !!flagged?.[q.id]
                  }
                  onNavigate={goToQuestion}
                />
              </div>
            </span>
          );
        })}
      </div>
    </nav>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("w-2.5 h-2.5 rounded-sm flex-shrink-0", color)} />
      <span className="text-[10px] text-warm-400 font-medium">{label}</span>
    </div>
  );
}
