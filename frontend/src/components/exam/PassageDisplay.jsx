// components/exam/PassageDisplay.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  BookOpen,
  Volume2,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import {
  PassageSafeHtml,
  FootnoteSafeHtml,
} from "@/components/common/SafeHtml";
import { cn } from "@/utils/utils";

const CONTENT_TYPES = {
  poem: {
    label: "Pjesma",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
    border: "border-purple-200",
  },
  prose: {
    label: "Proza",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
  },
  drama: {
    label: "Dramski tekst",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
  },
  article: {
    label: "Članak",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
  },
  essay: {
    label: "Esej",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
  },
  audio: {
    label: "Audio zapis",
    bg: "bg-sky-50",
    badge: "bg-sky-100 text-sky-700",
    border: "border-sky-200",
  },
  other: {
    label: "Tekst",
    bg: "bg-warm-50",
    badge: "bg-warm-100 text-warm-600",
    border: "border-warm-200",
  },
};

export function AudioPlayer({
  audioUrl,
  maxPlays = 2,
  label = null,
  compact = false,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playsLeft, setPlaysLeft] = useState(maxPlays);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  const canPlay = playsLeft > 0;

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    if (audio.currentTime === 0 || audio.ended) {
      setPlaysLeft((n) => n - 1);
    }

    audio.play().catch(() => setError(true));
  }, [canPlay, isPlaying]);

  const handleRestart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || playsLeft <= 0) return;
    audio.currentTime = 0;
    setPlaysLeft((n) => n - 1);
    audio.play().catch(() => setError(true));
  }, [playsLeft]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
        <Volume2 size={14} />
        <span>Audio nije dostupan</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        <button
          onClick={handlePlay}
          disabled={!canPlay && !isPlaying}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full transition-all",
            canPlay || isPlaying
              ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
              : "bg-warm-200 text-warm-400 cursor-not-allowed",
          )}
        >
          {isPlaying ? (
            <Pause size={14} />
          ) : (
            <Play size={14} className="ml-0.5" />
          )}
        </button>

        <div className="flex-1 h-1.5 bg-sky-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <span className="text-xs text-sky-700 tabular-nums min-w-[2.5rem] text-right">
          {formatTime(currentTime)}
        </span>

        <span
          className={cn(
            "text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-md",
            playsLeft > 0
              ? "bg-sky-100 text-sky-700"
              : "bg-warm-100 text-warm-500",
          )}
        >
          {playsLeft}/{maxPlays}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {label && (
        <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
          {label}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handlePlay}
          disabled={!canPlay && !isPlaying}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0",
            canPlay || isPlaying
              ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95 shadow-sm"
              : "bg-warm-200 text-warm-400 cursor-not-allowed",
          )}
        >
          {isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} className="ml-0.5" />
          )}
        </button>

        <div className="flex-1 space-y-1.5">
          {/* Progress bar */}
          <div className="h-1.5 bg-sky-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Time */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-600 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-sky-500 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Restart */}
        <button
          onClick={handleRestart}
          disabled={playsLeft <= 0}
          title="Pusti ispočetka"
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full transition-all flex-shrink-0",
            playsLeft > 0
              ? "text-sky-600 hover:bg-sky-100 active:scale-95"
              : "text-warm-300 cursor-not-allowed",
          )}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Play counter + upozorenje */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: maxPlays }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "w-2 h-2 rounded-full",
                i < playsLeft ? "bg-sky-500" : "bg-sky-200",
              )}
            />
          ))}
        </div>
        <span className="text-xs text-sky-600">
          {playsLeft > 0
            ? `Preostalo slušanja: ${playsLeft}`
            : "Iskoristio si sva slušanja"}
        </span>
      </div>
    </div>
  );
}

function FootnoteList({ footnotes }) {
  if (!footnotes?.length) return null;
  return (
    <div className="mt-4 pt-4 border-t border-warm-200/70">
      <p className="text-[10px] font-bold text-warm-500 uppercase tracking-widest mb-2.5">
        Bilješke
      </p>
      <ol className="space-y-2 list-none">
        {footnotes.map((fn, i) => (
          <li key={fn.marker ?? i} className="flex gap-2 text-xs text-warm-700">
            <sup className="font-bold text-warm-500 flex-shrink-0 mt-0.5 leading-none text-[10px]">
              {fn.marker}
            </sup>
            <FootnoteSafeHtml html={fn.text} className="leading-relaxed" />
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Glavni PassageDisplay ─────────────────────────────────────────────────────
export function PassageDisplay({ passage, className }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!passage) return null;

  const typeKey = passage?.contentType ?? passage?.content_type ?? "other";
  const typeConfig = CONTENT_TYPES[typeKey] ?? CONTENT_TYPES.other;

  const hasText = !!passage.content;
  const isAudioOnly = typeKey === "audio" && !hasText;

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden",
        typeConfig.bg,
        typeConfig.border,
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={14} className="text-warm-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-warm-700 truncate">
            {passage.title ?? "Polazni tekst"}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0",
              typeConfig.badge,
            )}
          >
            {typeConfig.label}
          </span>
        </div>
        {!isAudioOnly && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1 text-xs text-warm-500 hover:text-warm-700 transition-colors flex-shrink-0 ml-2"
          >
            <span>{collapsed ? "Prikaži" : "Sakrij"}</span>
            <ChevronDown
              size={14}
              className={cn("transition-transform", collapsed && "-rotate-90")}
            />
          </button>
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 py-3 space-y-3">
          {passage.audioUrl && (
            <AudioPlayer
              audioUrl={passage.audioUrl}
              audioDurationSeconds={passage.audioDurationSeconds}
              maxPlays={2}
              label={isAudioOnly ? null : "Audio snimka"}
            />
          )}

          {/* Tekstualni sadržaj */}
          {hasText && (
            <>
              {passage.author && (
                <p className="text-xs text-warm-500 italic">{passage.author}</p>
              )}
              <PassageSafeHtml
                html={passage.content}
                className={cn(
                  "passage-content",
                  typeKey === "poem" && "passage-poem",
                  typeKey === "drama" && "passage-drama",
                )}
              />
              {passage.source && (
                <p className="text-[11px] text-warm-400 mt-2">
                  Izvor: {passage.source}
                </p>
              )}
              <FootnoteList footnotes={passage.footnotes} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
