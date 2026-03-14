// components/exam/PassageDisplay.jsx
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  BookOpen,
  Volume2,
  Play,
  Pause,
  Headphones,
  AlertCircle,
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

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function SequentialAudioPlayer({
  audioIntroUrl,
  audioUrl,
  maxPlays = 2,
  label = null,
}) {
  const [phase, setPhase] = useState("idle");
  const [playsUsed, setPlaysUsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [introTime, setIntroTime] = useState(0);
  const [introDuration, setIntroDuration] = useState(0);
  const [contentTime, setContentTime] = useState(0);
  const [contentDuration, setContentDuration] = useState(0);
  const [error, setError] = useState(false);

  const introRef = useRef(null);
  const contentRef = useRef(null);

  const playsLeft = maxPlays - playsUsed;
  const canPlay = playsLeft > 0 && phase !== "done";

  useEffect(() => {
    const intro = introRef.current;
    if (!intro || !audioIntroUrl) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setIntroTime(intro.currentTime);
    const onMeta = () => setIntroDuration(intro.duration);
    const onError = () => setError(true);
    const onEnded = () => {
      setPhase("content");
      const c = contentRef.current;
      if (c) {
        c.currentTime = 0;
        c.play().catch(() => setError(true));
      }
    };

    intro.addEventListener("play", onPlay);
    intro.addEventListener("pause", onPause);
    intro.addEventListener("timeupdate", onTime);
    intro.addEventListener("loadedmetadata", onMeta);
    intro.addEventListener("error", onError);
    intro.addEventListener("ended", onEnded);

    return () => {
      intro.removeEventListener("play", onPlay);
      intro.removeEventListener("pause", onPause);
      intro.removeEventListener("timeupdate", onTime);
      intro.removeEventListener("loadedmetadata", onMeta);
      intro.removeEventListener("error", onError);
      intro.removeEventListener("ended", onEnded);
    };
  }, [audioIntroUrl]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setContentTime(content.currentTime);
    const onMeta = () => setContentDuration(content.duration);
    const onError = () => setError(true);
    const onEnded = () => {
      setIsPlaying(false);
      setPhase("idle");
      setPlaysUsed((n) => {
        const next = n + 1;
        if (next >= maxPlays) setPhase("done");
        return next;
      });
    };

    content.addEventListener("play", onPlay);
    content.addEventListener("pause", onPause);
    content.addEventListener("timeupdate", onTime);
    content.addEventListener("loadedmetadata", onMeta);
    content.addEventListener("error", onError);
    content.addEventListener("ended", onEnded);

    return () => {
      content.removeEventListener("play", onPlay);
      content.removeEventListener("pause", onPause);
      content.removeEventListener("timeupdate", onTime);
      content.removeEventListener("loadedmetadata", onMeta);
      content.removeEventListener("error", onError);
      content.removeEventListener("ended", onEnded);
    };
  }, [maxPlays]);

  const handlePlay = useCallback(() => {
    if (!canPlay) return;

    if (isPlaying) {
      introRef.current?.pause();
      contentRef.current?.pause();
      return;
    }

    if (phase === "idle" || phase === "done") {
      if (playsLeft <= 0) return;

      if (audioIntroUrl && introRef.current) {
        setPhase("intro");
        introRef.current.currentTime = 0;
        introRef.current.play().catch(() => setError(true));
      } else if (contentRef.current) {
        setPhase("content");
        contentRef.current.currentTime = 0;
        contentRef.current.play().catch(() => setError(true));
      }
    } else if (phase === "intro" || phase === "content") {
      const active = phase === "intro" ? introRef.current : contentRef.current;
      active?.play().catch(() => setError(true));
    }
  }, [canPlay, isPlaying, phase, playsLeft, audioIntroUrl]);

  const activeLabel = useMemo(() => {
    if (phase === "intro") return "Upute";
    if (phase === "content") return "Snimka";
    if (phase === "done") return "Snimka završena";
    return label ?? "Slušanje";
  }, [phase, label]);

  const progressPct = useMemo(() => {
    if (phase === "intro" && introDuration > 0)
      return (introTime / introDuration) * 100;
    if (phase === "content" && contentDuration > 0)
      return (contentTime / contentDuration) * 100;
    if (phase === "done") return 100;
    return 0;
  }, [phase, introTime, introDuration, contentTime, contentDuration]);

  const currentTimestamp = phase === "intro" ? introTime : contentTime;
  const totalDuration = phase === "intro" ? introDuration : contentDuration;

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
        <AlertCircle size={14} />
        <span>Audio nije dostupan</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-white shadow-sm overflow-hidden">
      {/* Skriveni audio elementi */}
      {audioIntroUrl && (
        <audio ref={introRef} src={audioIntroUrl} preload="metadata" />
      )}
      <audio ref={contentRef} src={audioUrl} preload="metadata" />

      {/* Progress bar — cijela širina, bez paddinga */}
      <div className="h-1 bg-sky-100">
        <div
          className={cn(
            "h-full transition-all duration-300",
            phase === "intro" ? "bg-amber-400" : "bg-sky-500",
            phase === "done" && "bg-green-500",
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Gornji red: faza label + counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones size={13} className="text-sky-500" />
            <span
              className={cn(
                "text-xs font-semibold transition-colors",
                phase === "intro" && "text-amber-600",
                phase === "content" && "text-sky-700",
                phase === "done" && "text-green-600",
                phase === "idle" && "text-sky-600",
              )}
            >
              {activeLabel}
            </span>
            {phase === "intro" && (
              <span className="text-[10px] text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium">
                Čekaj — upute
              </span>
            )}
          </div>

          {/* Dots: koliko slušanja preostaje */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxPlays }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-300",
                  i < playsLeft ? "bg-sky-500" : "bg-sky-200",
                )}
              />
            ))}
            <span className="text-[11px] text-sky-500 ml-1 font-medium tabular-nums">
              {playsLeft > 0 ? `${playsLeft}/${maxPlays}` : "Iskorišteno"}
            </span>
          </div>
        </div>

        {/* Play kontrole */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlay}
            disabled={!canPlay && !isPlaying}
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-full transition-all duration-150 flex-shrink-0 shadow-sm",
              canPlay || isPlaying
                ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
                : "bg-warm-200 text-warm-400 cursor-not-allowed",
            )}
            aria-label={isPlaying ? "Pauziraj" : "Reproduciraj"}
          >
            {isPlaying ? (
              <Pause size={17} />
            ) : (
              <Play size={17} className="ml-0.5" />
            )}
          </button>

          {/* Timestamp */}
          <div className="flex-1 space-y-1">
            <div className="h-1.5 bg-sky-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  phase === "intro" ? "bg-amber-400" : "bg-sky-500",
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-sky-400 tabular-nums">
              <span>{formatTime(currentTimestamp)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>
        </div>

        {/* Info poruka */}
        {playsLeft === 0 && (
          <p className="text-[11px] text-warm-400 text-center">
            Iskoristio/la si sva dopuštena slušanja za ovaj zadatak.
          </p>
        )}
        {playsLeft > 0 && phase === "idle" && playsUsed === 0 && (
          <p className="text-[11px] text-sky-500 text-center">
            Snimka se reproducira <strong>{maxPlays}×</strong>. Najprije će se
            čuti upute, zatim snimka.
          </p>
        )}
        {playsLeft > 0 && phase === "idle" && playsUsed > 0 && (
          <p className="text-[11px] text-sky-500 text-center">
            Još <strong>{playsLeft}</strong>{" "}
            {playsLeft === 1 ? "reprodukcija" : "reprodukcije"} preostalo.
          </p>
        )}
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
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
          <div className="h-1.5 bg-sky-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-600 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-sky-500 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
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

export function PassageDisplay({
  passage,
  activeGapPosition,
  selectedPersonLetter,
  className,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef(null);

  if (!passage) return null;

  const typeKey = passage?.contentType ?? passage?.content_type ?? "other";
  const typeConfig = CONTENT_TYPES[typeKey] ?? CONTENT_TYPES.other;

  const hasText = !!passage.content;
  const hasAudio = !!(passage.audioUrl || passage.audioIntroUrl);
  const isAudioOnly = typeKey === "audio" && !hasText;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    el.querySelectorAll(".exam-gap.active-gap").forEach((span) =>
      span.classList.remove("active-gap"),
    );

    if (!activeGapPosition) return;

    const target = el.querySelector(
      `.exam-gap[data-pos="${activeGapPosition}"]`,
    );
    if (!target) return;

    target.classList.add("active-gap");

    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeGapPosition]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    el.querySelectorAll(".person-block.person-selected").forEach((block) =>
      block.classList.remove("person-selected"),
    );

    if (!selectedPersonLetter) return;

    const upper = selectedPersonLetter.toUpperCase();
    const target =
      el.querySelector(`[id="person-${upper}"]`) ??
      el.querySelector(`.person-block[data-person="${selectedPersonLetter}"]`);

    if (!target) return;
    target.classList.add("person-selected");

    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedPersonLetter]);

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden",
        typeConfig.bg,
        typeConfig.border,
        className,
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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

        {/* Collapse gumb — samo za tekstualni sadržaj */}
        {!isAudioOnly && hasText && (
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

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 py-3 space-y-3">
          {/* ── Audio player (sekvenčijalni za listening ispite) ──────────── */}
          {hasAudio && (
            <SequentialAudioPlayer
              audioIntroUrl={passage.audioIntroUrl ?? null}
              audioUrl={passage.audioUrl}
              maxPlays={2}
              label={passage.title}
            />
          )}

          {/* ── Tekstualni sadržaj ─────────────────────────────────────────── */}
          {hasText && (
            <>
              {passage.author && (
                <p className="text-xs text-warm-500 italic">{passage.author}</p>
              )}
              <div ref={contentRef}>
                <PassageSafeHtml
                  html={passage.content}
                  className={cn(
                    "passage-content",
                    typeKey === "poem" && "passage-poem",
                    typeKey === "drama" && "passage-drama",
                    typeKey === "article" && "passage-article",
                  )}
                />
              </div>
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
