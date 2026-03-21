import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, LayoutGrid, Loader2 } from "lucide-react";
import { ProgressBar } from "@/components/exam/ProgressBar";
import { ExamTimer } from "@/components/exam/Timer";
import { cn } from "@/utils/cn";

export function ExamTopBar({
  backLink,
  examTitle,
  timer,
  isPaused,
  isPauseSyncing,
  isSyncing,
  onPause,
  onResume,
  answeredCount,
  totalVisible,
  onOpenNav,
}) {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-warm-200 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
      <div className="page-container">
        <div className="flex items-center h-14 gap-2 sm:gap-3">
          <Link
            to={backLink}
            className="flex-shrink-0 p-2 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
            aria-label="Natrag na popis ispita"
          >
            <ArrowLeft size={18} />
          </Link>

          <p className="text-sm font-semibold text-warm-700 truncate hidden sm:block flex-1 min-w-0">
            {examTitle}
          </p>

          <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-[200px]">
            <ProgressBar value={answeredCount} max={totalVisible} />
            <span className="text-xs text-warm-400 tabular-nums whitespace-nowrap">
              {answeredCount}/{totalVisible}
            </span>
          </div>

          <div className="flex-1 sm:hidden" />

          {isPauseSyncing && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-warm-400 flex-shrink-0">
              <Loader2 size={11} className="animate-spin" />
              <span className="hidden md:inline">Sinkronizacija...</span>
            </span>
          )}

          <ExamTimer {...timer} />

          <button
            onClick={isPaused ? onResume : onPause}
            disabled={isSyncing}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              isSyncing && "opacity-60 cursor-not-allowed",
              !isSyncing && isPaused
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : !isSyncing
                  ? "bg-warm-100 text-warm-600 hover:bg-warm-200"
                  : "bg-warm-100 text-warm-600",
            )}
          >
            {isPauseSyncing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isPaused ? (
              <Play size={13} />
            ) : (
              <Pause size={13} />
            )}
            <span className="hidden sm:inline">
              {isPauseSyncing
                ? "Sinkronizacija..."
                : isPaused
                  ? "Nastavi"
                  : "Pauza"}
            </span>
          </button>

          <button
            onClick={onOpenNav}
            className="lg:hidden flex-shrink-0 p-2 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
            aria-label="Otvori navigaciju pitanja"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
