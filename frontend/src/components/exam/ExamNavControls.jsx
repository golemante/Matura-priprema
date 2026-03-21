import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  LayoutGrid,
  X,
  Loader2,
} from "lucide-react";
import { QuestionNav } from "@/components/exam/QuestionNav";
import { cn } from "@/utils/cn";

export function MobileNavDrawer({
  show,
  onClose,
  questions,
  answers,
  flagged,
  currentIndex,
  onGoTo,
  onSubmit,
  answeredCount,
  totalVisible,
  isSyncing,
  isSubmitting,
}) {
  const unanswered = totalVisible - answeredCount;
  const allAnswered = unanswered === 0;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-warm-200">
              <span className="text-sm font-bold text-warm-800">
                Navigacija
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
              >
                <X size={16} className="text-warm-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <QuestionNav
                questions={questions}
                answers={answers}
                flagged={flagged}
                currentIndex={currentIndex}
                onGoTo={(i) => {
                  onGoTo(i);
                  onClose();
                }}
              />
            </div>

            <div className="p-4 border-t border-warm-200 space-y-2">
              {!allAnswered && (
                <p className="text-[11px] text-warm-400 text-center">
                  {unanswered} {unanswered === 1 ? "pitanje" : "pitanja"} bez
                  odgovora
                </p>
              )}
              <button
                onClick={onSubmit}
                disabled={isSyncing || isSubmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isSyncing || isSubmitting
                    ? "bg-warm-200 text-warm-400 cursor-not-allowed"
                    : allAnswered
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-warm-900 text-white hover:bg-black",
                )}
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {isSubmitting
                  ? "Predaje se..."
                  : isSyncing
                    ? "Sinkronizacija..."
                    : "Predaj ispit"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function MobileBottomBar({
  currentIndex,
  totalVisible,
  hasPrev,
  isLast,
  onPrev,
  onNext,
  onOpenNav,
  answeredCount,
  onSubmit,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-white/95 backdrop-blur-sm border-t border-warm-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center h-14 px-3 gap-2 max-w-xl mx-auto">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0",
            !hasPrev
              ? "text-warm-300 cursor-not-allowed"
              : "text-warm-700 hover:bg-warm-100 active:bg-warm-200",
          )}
        >
          <ArrowLeft size={16} />
          <span className="hidden xs:inline text-xs">Preth.</span>
        </button>

        <button
          onClick={onOpenNav}
          className="flex-1 flex items-center justify-center gap-2.5 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 active:bg-warm-300 transition-colors"
        >
          <LayoutGrid size={14} className="text-warm-500 flex-shrink-0" />
          <span className="text-xs font-bold text-warm-700 tabular-nums">
            {currentIndex + 1} / {totalVisible}
          </span>
          <span className="text-[10px] text-warm-400 font-medium">
            · {answeredCount} odg.
          </span>
        </button>

        {isLast ? (
          <button
            onClick={onSubmit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all flex-shrink-0"
          >
            <Send size={14} />
            <span className="hidden xs:inline text-xs">Predaj</span>
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-100 active:bg-warm-200 transition-colors flex-shrink-0"
          >
            <span className="hidden xs:inline text-xs">Sljed.</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export function DesktopSubmitButton({
  onSubmit,
  answeredCount,
  totalVisible,
  isSyncing,
  isSubmitting,
}) {
  const unanswered = totalVisible - answeredCount;
  const allAnswered = unanswered === 0;

  return (
    <div className="mt-2 space-y-1.5">
      {!allAnswered && (
        <p className="text-[10px] text-warm-400 text-center tabular-nums">
          {unanswered} {unanswered === 1 ? "pitanje" : "pitanja"} bez odgovora
        </p>
      )}
      <button
        onClick={onSubmit}
        disabled={isSyncing || isSubmitting}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl",
          "text-xs font-bold transition-all duration-200",
          isSyncing || isSubmitting
            ? "bg-warm-200 text-warm-400 cursor-not-allowed"
            : allAnswered
              ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
              : "bg-warm-900 text-white hover:bg-black",
        )}
      >
        {isSubmitting ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Send size={12} />
        )}
        {isSubmitting
          ? "Predaje se..."
          : isSyncing
            ? "Sinkronizacija..."
            : "Predaj ispit"}
      </button>
    </div>
  );
}
