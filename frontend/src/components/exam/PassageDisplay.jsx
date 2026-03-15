// components/exam/PassageDisplay.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, BookOpen, Headphones, Volume2 } from "lucide-react";
import {
  PassageSafeHtml,
  FootnoteSafeHtml,
} from "@/components/common/SafeHtml";
import { questionAudioStorage } from "@/utils/storage";
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
    badge: "bg-orange-100 text-amber-700",
    border: "border-orange-200",
  },
  audio: {
    label: "Ispit slušanja",
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

function PassageAudioIndicator({ passageId, audioStatus }) {
  if (!audioStatus || (!audioStatus.activePassageId && !audioStatus.isDone)) {
    return null;
  }

  const isActive = audioStatus.activePassageId === passageId;
  const isDone = audioStatus.isDone;

  if (isDone) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
        <Headphones size={12} className="text-green-500 flex-shrink-0" />
        <span className="text-xs text-green-600 font-medium">
          Sve snimke završene
        </span>
      </div>
    );
  }

  if (!isActive) return null;

  const trackType = audioStatus.currentTrack?.type;
  const isIntro = trackType === "intro";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border",
        isIntro ? "bg-amber-50 border-amber-200" : "bg-sky-50 border-sky-200",
      )}
    >
      <Headphones
        size={12}
        className={cn(
          "flex-shrink-0",
          isIntro ? "text-amber-500" : "text-sky-500",
        )}
      />
      {audioStatus.isPlaying && (
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
      <span
        className={cn(
          "text-xs font-medium",
          isIntro ? "text-amber-700" : "text-sky-700",
        )}
      >
        {isIntro ? "Reproducira se uvod..." : "Reproducira se snimka..."}
      </span>
    </div>
  );
}

function FootnoteList({ footnotes }) {
  if (!Array.isArray(footnotes) || footnotes.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-warm-200 space-y-1">
      {footnotes.map((fn, i) => (
        <p key={i} className="text-xs text-warm-500 leading-relaxed">
          <sup className="font-semibold mr-0.5">{fn.marker}</sup>
          <FootnoteSafeHtml html={fn.text} />
        </p>
      ))}
    </div>
  );
}

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  audioUrl,
  maxPlays = 1,
  examId = null,
  questionId = null,
  label = null,
  compact = false,
  isPaused = false,
}) {
  const audioRef = useRef(null);
  const wasPlayingBeforePauseRef = useRef(false);

  // Inicijalizacija playsLeft iz storage-a — sprječava replay nakon refresha
  const [playsLeft, setPlaysLeft] = useState(() => {
    if (
      examId &&
      questionId &&
      questionAudioStorage.hasPlayed(examId, questionId)
    ) {
      return 0;
    }
    return maxPlays;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  const canPlay = playsLeft > 0;

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;
    if (isPlaying) {
      // Pauza između reprodukcija je dozvoljena — samo toggle
      audio.pause();
      return;
    }
    // Dekrementiramo samo pri pokretanju od početka ili od "ended" stanja
    if (audio.currentTime === 0 || audio.ended) {
      setPlaysLeft((n) => n - 1);
    }
    audio.play().catch(() => setError(true));
  }, [canPlay, isPlaying]);

  // Sync s globalnim pauziranjem ispita
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPaused) {
      // Zapamti je li svirao da znamo hoćemo li nastaviti
      wasPlayingBeforePauseRef.current = !audio.paused && !audio.ended;
      audio.pause();
    } else {
      // Nastavi samo ako je bio aktivan i u sredini snimke
      if (
        wasPlayingBeforePauseRef.current &&
        audio.currentTime > 0 &&
        !audio.ended &&
        audio.paused
      ) {
        audio.play().catch(() => setError(true));
      }
      wasPlayingBeforePauseRef.current = false;
    }
  }, [isPaused]);

  // Audio event listeneri
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const h = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      ended: () => {
        setIsPlaying(false);
        // Trajno označi kao reproducirano
        if (examId && questionId) {
          questionAudioStorage.markPlayed(examId, questionId);
        }
      },
      timeupdate: () => setCurrentTime(audio.currentTime),
      loadedmetadata: () => setDuration(audio.duration),
      error: () => setError(true),
    };

    Object.entries(h).forEach(([e, fn]) => audio.addEventListener(e, fn));
    return () =>
      Object.entries(h).forEach(([e, fn]) => audio.removeEventListener(e, fn));
  }, [examId, questionId]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
        Audio nije dostupan
      </div>
    );
  }

  const btnDisabled = (!canPlay && !isPlaying) || isPaused;

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        <button
          onClick={handlePlay}
          disabled={btnDisabled}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full transition-all text-sm",
            !btnDisabled
              ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
              : "bg-warm-200 text-warm-400 cursor-not-allowed",
          )}
          aria-label={isPlaying ? "Pauziraj" : "Reproduciraj"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-xs font-semibold text-sky-800 truncate mb-1">
              {label}
            </p>
          )}
          <div className="h-1 bg-sky-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {canPlay ? (
          <span className="text-[10px] text-sky-500 font-semibold tabular-nums">
            {playsLeft}×
          </span>
        ) : (
          <span className="text-[10px] text-warm-400 font-medium">
            iskorišteno
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="h-1 bg-sky-100">
        <div
          className="h-full bg-sky-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="px-3 py-2.5 flex items-center gap-3">
        <button
          onClick={handlePlay}
          disabled={btnDisabled}
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all",
            !btnDisabled
              ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
              : "bg-warm-200 text-warm-400 cursor-not-allowed",
          )}
          aria-label={isPlaying ? "Pauziraj" : "Reproduciraj"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-xs font-semibold text-sky-900 truncate mb-0.5">
              {label}
            </p>
          )}
          <p className="text-[10px] text-sky-500">
            {canPlay
              ? `${playsLeft} ${playsLeft === 1 ? "reprodukcija" : "reprodukcije"} preostalo`
              : "Iskorišteno"}
          </p>
        </div>
        <span className="text-xs text-sky-500 tabular-nums font-medium">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

export function PassageDisplay({
  passage,
  activeGapPosition = null,
  selectedPersonLetter = null,
  audioStatus = null,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef(null);

  if (!passage) return null;

  const typeKey = passage.contentType ?? "other";
  const typeConfig = CONTENT_TYPES[typeKey] ?? CONTENT_TYPES.other;
  const isAudioOnly = typeKey === "audio";
  const hasText = !isAudioOnly && !!passage.content;
  const hasAudio = !!(passage.audioUrl || passage.audioIntroUrl);

  return (
    <div
      className={cn(
        "rounded-xl border flex flex-col",
        typeConfig.bg,
        typeConfig.border,
      )}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-inherit">
        <BookOpen size={13} className="text-warm-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-warm-700 flex-1 truncate">
          {passage.title ?? (isAudioOnly ? "Ispit slušanja" : "Polazni tekst")}
        </span>
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0",
            typeConfig.badge,
          )}
        >
          {typeConfig.label}
        </span>

        {!isAudioOnly && hasText && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1 text-xs text-warm-500 hover:text-warm-700 transition-colors flex-shrink-0 ml-2 lg:hidden"
          >
            <span>{collapsed ? "Prikaži" : "Sakrij"}</span>
            <ChevronDown
              size={14}
              className={cn("transition-transform", collapsed && "-rotate-90")}
            />
          </button>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div
          className={cn(
            "px-4 py-3 space-y-3",
            "max-h-64 overflow-y-auto",
            "lg:max-h-none lg:flex-1 lg:overflow-y-auto",
          )}
        >
          {hasAudio && audioStatus && (
            <PassageAudioIndicator
              passageId={passage.id}
              audioStatus={audioStatus}
            />
          )}

          {hasText && (
            <div ref={contentRef}>
              <PassageSafeHtml
                html={passage.content}
                contentType={typeKey}
                className="passage-content"
              />
              <FootnoteList footnotes={passage.footnotes} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
