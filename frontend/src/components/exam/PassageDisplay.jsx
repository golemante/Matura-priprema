// components/exam/PassageDisplay.jsx
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, BookOpen, Headphones } from "lucide-react";
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
  introUrl,
  contentUrl,
  maxPlays = 2,
  isPaused = false,
}) {
  const [phase, setPhase] = useState("pending");
  const [playsUsed, setPlaysUsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [introTime, setIntroTime] = useState(0);
  const [introDuration, setIntroDuration] = useState(0);
  const [contentTime, setContentTime] = useState(0);
  const [contentDuration, setContentDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  const introRef = useRef(null);
  const contentRef = useRef(null);
  const phaseRef = useRef("pending");

  const playsLeft = maxPlays - playsUsed;

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const playIntro = useCallback(() => {
    const el = introRef.current;
    if (!el) return;
    setPhase("intro");
    phaseRef.current = "intro";
    el.currentTime = 0;
    el.play().catch((err) => {
      console.warn("[SequentialAudioPlayer] Autoplay blocked:", err.message);
    });
  }, []);

  const playContent = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    setPhase("content");
    phaseRef.current = "content";
    el.currentTime = 0;
    el.play().catch((err) => {
      console.warn(
        "[SequentialAudioPlayer] Content play blocked:",
        err.message,
      );
    });
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      if (introUrl) {
        playIntro();
      } else {
        playContent();
      }
    }, 350);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = introRef.current;
    if (!el || !introUrl) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setIntroTime(el.currentTime);
    const onMeta = () => setIntroDuration(el.duration);
    const onError = (e) => {
      console.error("[SequentialAudioPlayer] Intro error:", e);
      setHasError(true);
    };
    const onEnded = () => {
      if (playsLeft > 0) {
        playContent();
      } else {
        setPhase("done");
        phaseRef.current = "done";
      }
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("error", onError);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("error", onError);
      el.removeEventListener("ended", onEnded);
    };
  }, [introUrl, playsLeft, playContent]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setContentTime(el.currentTime);
    const onMeta = () => setContentDuration(el.duration);
    const onError = (e) => {
      console.error("[SequentialAudioPlayer] Content error:", e);
      setHasError(true);
    };
    const onEnded = () => {
      setIsPlaying(false);
      const nextPlaysUsed = playsUsed + 1;
      setPlaysUsed(nextPlaysUsed);

      if (nextPlaysUsed >= maxPlays) {
        setPhase("done");
        phaseRef.current = "done";
      } else {
        setPhase("pending");
        phaseRef.current = "pending";
        if (introUrl) {
          playIntro();
        } else {
          playContent();
        }
      }
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("error", onError);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("error", onError);
      el.removeEventListener("ended", onEnded);
    };
  }, [introUrl, playsUsed, maxPlays, playIntro, playContent]);

  useEffect(() => {
    const ph = phaseRef.current;

    if (isPaused) {
      if (ph === "intro") introRef.current?.pause();
      if (ph === "content") contentRef.current?.pause();
    } else {
      if (ph === "intro" && introRef.current?.paused) {
        introRef.current.play().catch(() => {});
      } else if (ph === "content" && contentRef.current?.paused) {
        contentRef.current.play().catch(() => {});
      }
    }
  }, [isPaused]);

  const progressPct = useMemo(() => {
    if (phase === "intro" && introDuration > 0)
      return (introTime / introDuration) * 100;
    if (phase === "content" && contentDuration > 0)
      return (contentTime / contentDuration) * 100;
    if (phase === "done") return 100;
    return 0;
  }, [phase, introTime, introDuration, contentTime, contentDuration]);

  const displayTime =
    phase === "intro" ? introTime : phase === "content" ? contentTime : 0;
  const displayDuration =
    phase === "intro"
      ? introDuration
      : phase === "content"
        ? contentDuration
        : 0;

  const phaseLabel =
    phase === "intro"
      ? "Upute"
      : phase === "content"
        ? "Snimka"
        : phase === "done"
          ? "Završeno"
          : "Učitavanje...";

  const barColor =
    phase === "intro"
      ? "bg-amber-400"
      : phase === "done"
        ? "bg-green-500"
        : "bg-sky-500";

  if (hasError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
        ⚠️ Audio nije dostupan
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-white shadow-sm overflow-hidden">
      {/* Skriveni audio elementi — uvijek renderirani za stabilan DOM */}
      {introUrl && <audio ref={introRef} src={introUrl} preload="auto" />}
      <audio ref={contentRef} src={contentUrl} preload="auto" />

      {/* Progress traka na vrhu */}
      <div className="h-1 bg-sky-100">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-linear",
            barColor,
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="px-4 py-3 space-y-2">
        {/* Status red */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones
              size={13}
              className={cn(
                "flex-shrink-0",
                phase === "intro" && "text-amber-500",
                (phase === "content" || phase === "pending") && "text-sky-500",
                phase === "done" && "text-green-500",
              )}
            />
            <span
              className={cn(
                "text-xs font-semibold",
                phase === "intro" && "text-amber-600",
                (phase === "content" || phase === "pending") && "text-sky-700",
                phase === "done" && "text-green-600",
              )}
            >
              {phaseLabel}
            </span>

            {/* "pričekaj" badge za intro */}
            {phase === "intro" && (
              <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium leading-none">
                pričekaj
              </span>
            )}

            {/* Animirani waveform za aktivnu snimku */}
            {isPlaying && (phase === "content" || phase === "intro") && (
              <span className="flex gap-px items-end h-3 ml-0.5">
                {[7, 11, 8, 11, 7].map((h, i) => (
                  <span
                    key={i}
                    className="w-0.5 rounded-full"
                    style={{
                      height: `${h}px`,
                      background: phase === "intro" ? "#f59e0b" : "#38bdf8",
                      animation: "waveform 0.7s ease-in-out infinite",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </span>
            )}
          </div>

          {/* Dots: preostala slušanja sadržaja */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxPlays }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-300",
                  i < playsLeft ? "bg-sky-400" : "bg-sky-200",
                )}
              />
            ))}
            <span className="text-[11px] text-sky-400 tabular-nums ml-0.5 font-medium">
              {playsLeft}/{maxPlays}
            </span>
          </div>
        </div>

        {/* Progress bar + timestamp — samo kad svira */}
        {(phase === "intro" || phase === "content") && displayDuration > 0 && (
          <div className="space-y-0.5">
            <div className="h-1 bg-sky-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  phase === "intro" ? "bg-amber-400" : "bg-sky-400",
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-sky-400/80 tabular-nums">
              <span>{formatTime(displayTime)}</span>
              <span>{formatTime(displayDuration)}</span>
            </div>
          </div>
        )}

        {/* Statusi */}
        {phase === "done" && (
          <p className="text-[11px] text-green-600 text-center font-medium">
            Iskoristio/la si sva slušanja za ovaj zadatak.
          </p>
        )}
        {phase === "pending" && playsUsed === 0 && (
          <p className="text-[11px] text-sky-400 text-center">
            Audio se automatski reproducira ·{" "}
            <strong className="font-semibold text-sky-500">{maxPlays}×</strong>{" "}
            ukupno
          </p>
        )}
        {phase === "pending" && playsUsed > 0 && playsLeft > 0 && (
          <p className="text-[11px] text-sky-500 text-center">
            Preostalo: <strong className="font-semibold">{playsLeft}</strong>{" "}
            {playsLeft === 1 ? "reprodukcija" : "reprodukcije"}
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
    const h = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      ended: () => setIsPlaying(false),
      timeupdate: () => setCurrentTime(audio.currentTime),
      loadedmetadata: () => setDuration(audio.duration),
    };
    Object.entries(h).forEach(([e, fn]) => audio.addEventListener(e, fn));
    return () =>
      Object.entries(h).forEach(([e, fn]) => audio.removeEventListener(e, fn));
  }, []);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
        Audio nije dostupan
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
            "flex items-center justify-center w-8 h-8 rounded-full transition-all text-sm",
            canPlay || isPlaying
              ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
              : "bg-warm-200 text-warm-400 cursor-not-allowed",
          )}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <div className="flex-1 h-1.5 bg-sky-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
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
            "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0 text-sm",
            canPlay || isPlaying
              ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95 shadow-sm"
              : "bg-warm-200 text-warm-400 cursor-not-allowed",
          )}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <div className="flex-1 space-y-1.5">
          <div className="h-1.5 bg-sky-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-sky-600 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-sky-500 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
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
          {playsLeft > 0 ? `Preostalo: ${playsLeft}` : "Iskorišteno"}
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
  isPaused = false,
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
    el.querySelectorAll(".exam-gap.active-gap").forEach((s) =>
      s.classList.remove("active-gap"),
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
    el.querySelectorAll(".person-block.person-selected").forEach((b) =>
      b.classList.remove("person-selected"),
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
        "rounded-2xl border overflow-hidden flex flex-col",
        typeConfig.bg,
        typeConfig.border,
        className,
      )}
    >
      {/* ── Header — uvijek vidljiv, ne skrolira ───────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit flex-shrink-0">
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

        {/* Collapse — samo na mobilnom, nije za audio */}
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

      {/* ── Body — skrolabilan ─────────────────────────────────────────────── */}
      {!collapsed && (
        <div
          className={cn(
            "px-4 py-3 space-y-3",
            "max-h-64 overflow-y-auto",
            "lg:max-h-none lg:flex-1 lg:overflow-y-auto",
          )}
        >
          {/* Audio player — key=passage.id jamči stabilan mount kroz navigaciju */}
          {hasAudio && (
            <SequentialAudioPlayer
              key={passage.id}
              introUrl={passage.audioIntroUrl ?? null}
              contentUrl={passage.audioUrl ?? ""}
              maxPlays={2}
              isPaused={isPaused}
            />
          )}

          {/* Tekst */}
          {hasText && (
            <>
              {passage.author && (
                <p className="text-xs text-warm-500 italic">{passage.author}</p>
              )}
              <div ref={contentRef}>
                <PassageSafeHtml
                  html={passage.content}
                  className={cn(
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
