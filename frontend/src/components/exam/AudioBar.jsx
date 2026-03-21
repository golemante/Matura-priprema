import { Play, AlertCircle, Headphones } from "lucide-react";
import { cn } from "@/utils/cn";

export function AudioBar({ audio, compact = false }) {
  if (!audio.hasAudio) return null;

  const track = audio.currentTrack;
  const isIntro = track?.type === "intro";
  const { isDone, isPlaying, hasBlockedAutoplay, manualStart } = audio;

  if (audio.hasError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
        <AlertCircle size={13} className="flex-shrink-0" />
        Audio nije dostupan
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
        <Headphones size={13} className="text-green-500 flex-shrink-0" />
        <span className="text-xs text-green-700 font-semibold">
          Sve snimke završene
        </span>
      </div>
    );
  }

  if (hasBlockedAutoplay && !isPlaying) {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50 overflow-hidden">
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <Headphones size={13} className="text-sky-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sky-700 truncate">
              {track?.label ?? "Audio snimka"}
            </p>
            <p className="text-[10px] text-sky-400">
              Klikni za pokretanje audia
            </p>
          </div>
          <button
            onClick={manualStart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors active:scale-95 flex-shrink-0"
          >
            <Play size={11} />
            Pokreni
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {audio.trackSkipWarning && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle size={12} className="text-amber-500 flex-shrink-0" />
          <p className="text-[11px] text-amber-700 leading-snug">
            <span className="font-semibold">"{audio.trackSkipWarning}"</span>{" "}
            nije mogla biti učitana — preskočena.
          </p>
        </div>
      )}

      <div
        className={cn(
          "rounded-xl border overflow-hidden",
          isIntro ? "bg-amber-50 border-amber-200" : "bg-sky-50 border-sky-200",
        )}
      >
        <div className={cn("h-1", isIntro ? "bg-amber-100" : "bg-sky-100")}>
          <div
            ref={audio.progressBarRef}
            className={cn("h-full", isIntro ? "bg-amber-400" : "bg-sky-500")}
            style={{ width: "0%" }}
          />
        </div>

        <div
          className={cn(
            "flex items-center gap-2.5",
            compact ? "px-3 py-2" : "px-3.5 py-2.5",
          )}
        >
          <Headphones
            size={13}
            className={cn(
              "flex-shrink-0",
              isIntro ? "text-amber-500" : "text-sky-500",
            )}
          />

          {isPlaying && (
            <span className="flex gap-px items-end h-3 flex-shrink-0">
              {[7, 11, 8, 11, 7].map((h, i) => (
                <span
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{
                    height: `${h}px`,
                    background: isIntro ? "#f59e0b" : "#0ea5e9",
                    animation: `waveform ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </span>
          )}

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-semibold truncate",
                compact ? "text-[11px]" : "text-xs",
                isIntro ? "text-amber-700" : "text-sky-700",
              )}
            >
              {track?.label ?? (isIntro ? "Upute" : "Snimka")}
            </p>
          </div>

          {isIntro && isPlaying && (
            <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold leading-none flex-shrink-0">
              slušaj upute
            </span>
          )}
          {isIntro && !isPlaying && !isDone && (
            <span className="text-[10px] bg-amber-50 text-amber-500 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium leading-none flex-shrink-0">
              pričekaj
            </span>
          )}
          {audio.isLoadingTrack && (
            <span className="text-[10px] text-warm-400 font-medium flex-shrink-0">
              učitava...
            </span>
          )}
          {!audio.isLoadingTrack &&
            !isIntro &&
            audio.hasStarted &&
            !isPlaying &&
            !isDone &&
            !hasBlockedAutoplay && (
              <span className="text-[10px] text-warm-400 font-medium flex-shrink-0">
                pauzirano
              </span>
            )}
          {audio.duration > 0 && (
            <span
              className={cn(
                "text-[10px] tabular-nums font-medium flex-shrink-0",
                isIntro ? "text-amber-500" : "text-sky-500",
              )}
            >
              {audio.formattedTime} / {audio.formattedDuration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
