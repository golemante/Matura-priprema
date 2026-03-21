import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useExamStore } from "@/store/examStore";
import { cn } from "@/utils/cn";

export function ExamNavButtons({ isPaused }) {
  const { questions, currentIndex, goToQuestion } = useExamStore(
    useShallow((s) => ({
      questions: s.questions,
      currentIndex: s.currentIndex,
      goToQuestion: s.goToQuestion,
    })),
  );

  const total = questions?.length ?? 0;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  const goPrev = () => {
    if (!isFirst && !isPaused) goToQuestion(currentIndex - 1);
  };
  const goNext = () => {
    if (!isLast && !isPaused) goToQuestion(currentIndex + 1);
  };

  return (
    <>
      <button
        onClick={goPrev}
        disabled={isFirst || isPaused}
        aria-label="Prethodno pitanje"
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 font-semibold text-sm",
          "transition-all duration-100",
          isFirst || isPaused
            ? "border-warm-100 text-warm-300 bg-warm-50 cursor-default"
            : "border-warm-200 text-warm-700 bg-white hover:border-warm-300 hover:bg-warm-50 active:scale-[0.98]",
        )}
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
        <span className="hidden sm:inline">Prethodno</span>
      </button>

      <span className="flex-1 text-center text-xs font-medium text-warm-400 select-none">
        {currentIndex + 1} / {total}
      </span>

      <button
        onClick={goNext}
        disabled={isLast || isPaused}
        aria-label="Sljedeće pitanje"
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 font-semibold text-sm",
          "transition-all duration-100",
          isLast || isPaused
            ? "border-warm-100 text-warm-300 bg-warm-50 cursor-default"
            : [
                "border-primary-500 text-primary-700 bg-primary-50",
                "hover:border-primary-600 hover:bg-primary-100",
                "active:scale-[0.98]",
              ],
        )}
      >
        <span className="hidden sm:inline">Sljedeće</span>
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </>
  );
}
