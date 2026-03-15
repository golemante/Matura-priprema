// hooks/useListeningAudio.js
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { audioProgressStorage } from "@/utils/storage";

function formatTime(s) {
  if (!s || isNaN(s) || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function buildQueue(orderedPassages) {
  const tracks = [];
  for (const p of orderedPassages) {
    if (!p.audioIntroUrl && !p.audioUrl) continue;
    if (p.audioIntroUrl) {
      tracks.push({
        url: p.audioIntroUrl,
        type: "intro",
        passageId: p.id,
        label: p.title ? `${p.title} — upute` : "Upute",
      });
    }
    if (p.audioUrl) {
      tracks.push({
        url: p.audioUrl,
        type: "content",
        passageId: p.id,
        label: p.title ?? "Snimka",
      });
    }
  }
  return tracks;
}

export function useListeningAudio(examId, orderedPassages, isPaused) {
  const queue = useMemo(() => buildQueue(orderedPassages), [orderedPassages]);

  const hasAudio = queue.length > 0;

  const savedProgressRef = useRef(null);
  if (!savedProgressRef.current && examId) {
    savedProgressRef.current = audioProgressStorage.load(examId) ?? {
      trackIndex: 0,
      currentTime: 0,
    };
  }

  const [trackIndex, setTrackIndex] = useState(
    savedProgressRef.current?.trackIndex ?? 0,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    savedProgressRef.current?.currentTime ?? 0,
  );
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const audioRef = useRef(null);
  const trackIndexRef = useRef(savedProgressRef.current?.trackIndex ?? 0);
  const isPausedRef = useRef(isPaused);
  const queueRef = useRef(queue);
  const initDoneRef = useRef(false);

  useEffect(() => {
    trackIndexRef.current = trackIndex;
  }, [trackIndex]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const saveProgress = useCallback(() => {
    if (!examId || !hasAudio) return;
    const audio = audioRef.current;
    audioProgressStorage.save(examId, {
      trackIndex: trackIndexRef.current,
      currentTime: audio?.currentTime ?? 0,
    });
  }, [examId, hasAudio]);

  const clearProgress = useCallback(() => {
    if (examId) audioProgressStorage.clear(examId);
  }, [examId]);

  const playTrackAtIndex = useCallback(
    (index, startTime = 0) => {
      const audio = audioRef.current;
      const track = queueRef.current[index];
      if (!audio || !track) return;

      if (initDoneRef.current) {
        audioProgressStorage.save(examId, {
          trackIndex: index,
          currentTime: startTime,
        });
      }

      setTrackIndex(index);
      trackIndexRef.current = index;
      setDuration(0);
      setIsDone(false);
      setHasError(false);

      audio.src = track.url;
      audio.load();

      const doPlay = () => {
        audio.currentTime = startTime;
        if (!isPausedRef.current) {
          audio.play().catch((err) => {
            console.warn("[useListeningAudio] Autoplay blokiran:", err.message);
          });
        }
      };

      if (audio.readyState >= 1) {
        doPlay();
      } else {
        audio.addEventListener("loadedmetadata", doPlay, { once: true });
      }
    },
    [examId],
  );

  useEffect(() => {
    if (!hasAudio || initDoneRef.current) return;
    initDoneRef.current = true;

    const saved = savedProgressRef.current;
    const startIndex = Math.min(saved?.trackIndex ?? 0, queue.length - 1);
    const startTime = saved?.currentTime ?? 0;

    const id = setTimeout(() => {
      playTrackAtIndex(startIndex, startTime);
    }, 350);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPaused) {
      audio.pause();
      saveProgress();
    } else {
      if (hasAudio && !isDone && audio.src && !audio.ended) {
        audio.play().catch(() => {});
      }
    }
  }, [isPaused, hasAudio, isDone, saveProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onError = () => {
      console.error(
        "[useListeningAudio] Audio error na traci:",
        queueRef.current[trackIndexRef.current]?.url,
      );
      setHasError(true);
      setIsPlaying(false);
    };
    const onEnded = () => {
      setIsPlaying(false);
      const nextIndex = trackIndexRef.current + 1;
      if (nextIndex < queueRef.current.length) {
        playTrackAtIndex(nextIndex, 0);
      } else {
        setIsDone(true);
        saveProgress();
        console.info("[useListeningAudio] Sve audio trake završene.");
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
    };
  }, [playTrackAtIndex, saveProgress]);

  useEffect(() => {
    if (!hasAudio) return;
    const id = setInterval(saveProgress, 3000);
    return () => clearInterval(id);
  }, [hasAudio, saveProgress]);

  useEffect(() => {
    if (!hasAudio) return;
    const handler = () => {
      if (document.hidden) saveProgress();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [hasAudio, saveProgress]);

  useEffect(() => {
    if (!hasAudio) return;
    window.addEventListener("beforeunload", saveProgress);
    return () => window.removeEventListener("beforeunload", saveProgress);
  }, [hasAudio, saveProgress]);

  const currentTrack = queue[trackIndex] ?? null;
  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const formattedTime = formatTime(currentTime);
  const formattedDuration = formatTime(duration);

  const activePassageId = currentTrack?.passageId ?? null;

  return {
    audioRef,

    hasAudio,
    queue,
    totalTracks: queue.length,

    trackIndex,
    currentTrack,
    activePassageId,

    isPlaying,
    isDone,
    hasError,
    currentTime,
    duration,
    progressPct,
    formattedTime,
    formattedDuration,

    clearProgress,
    saveProgress,
  };
}
