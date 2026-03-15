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
  const [hasStarted, setHasStarted] = useState(false);
  const [hasBlockedAutoplay, setHasBlockedAutoplay] = useState(false);

  const audioRef = useRef(null);
  const currentTimeRef = useRef(savedProgressRef.current?.currentTime ?? 0);
  const trackIndexRef = useRef(savedProgressRef.current?.trackIndex ?? 0);
  const isPausedRef = useRef(isPaused);
  const queueRef = useRef(queue);
  const isDoneRef = useRef(false);
  const hasAudioRef = useRef(hasAudio);
  const examIdRef = useRef(examId);
  const initDoneRef = useRef(false);
  const audioInitializedRef = useRef(false);

  const pendingLoadedMetadataRef = useRef(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    trackIndexRef.current = trackIndex;
  }, [trackIndex]);
  useEffect(() => {
    isDoneRef.current = isDone;
  }, [isDone]);
  useEffect(() => {
    hasAudioRef.current = hasAudio;
  }, [hasAudio]);
  useEffect(() => {
    examIdRef.current = examId;
  }, [examId]);

  const saveProgressRef = useRef(null);
  saveProgressRef.current = () => {
    const eid = examIdRef.current;
    if (!eid || !hasAudioRef.current || !audioInitializedRef.current) return;
    audioProgressStorage.save(eid, {
      trackIndex: trackIndexRef.current,
      currentTime: currentTimeRef.current,
    });
  };

  const saveProgress = useCallback(() => {
    saveProgressRef.current?.();
  }, []);

  const clearProgress = useCallback(() => {
    const eid = examIdRef.current;
    if (eid) audioProgressStorage.clear(eid);
  }, []);

  const playTrackAtIndex = useCallback((index, startTime = 0) => {
    const audio = audioRef.current;
    const track = queueRef.current[index];
    if (!audio || !track) return;

    if (pendingLoadedMetadataRef.current) {
      audio.removeEventListener(
        "loadedmetadata",
        pendingLoadedMetadataRef.current,
      );
      pendingLoadedMetadataRef.current = null;
    }

    currentTimeRef.current = startTime;

    audioProgressStorage.save(examIdRef.current, {
      trackIndex: index,
      currentTime: startTime,
    });

    setTrackIndex(index);
    trackIndexRef.current = index;
    setDuration(0);
    setHasError(false);
    isDoneRef.current = false;
    setIsDone(false);

    audio.src = track.url;
    audio.load();
    audioInitializedRef.current = true;

    const doPlay = () => {
      pendingLoadedMetadataRef.current = null;
      audio.currentTime = startTime;
      if (!isPausedRef.current) {
        audio.play().catch((err) => {
          console.warn("[useListeningAudio] Autoplay blokiran:", err.message);
          setHasBlockedAutoplay(true);
        });
      }
    };

    if (audio.readyState >= 1) {
      doPlay();
    } else {
      pendingLoadedMetadataRef.current = doPlay;
      audio.addEventListener("loadedmetadata", doPlay, { once: true });
    }
  }, []);

  const manualStart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDoneRef.current) return;

    setHasBlockedAutoplay(false);

    if (
      audio.src &&
      audio.src !== window.location.href &&
      !audio.ended &&
      audio.paused
    ) {
      audio.play().catch(() => setHasBlockedAutoplay(true));
    } else {
      playTrackAtIndex(trackIndexRef.current, currentTimeRef.current);
    }
  }, [playTrackAtIndex]);

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

  // Pauziranje/nastavak ispita → pauziranje/nastavak audia
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPaused) {
      audio.pause();
      if (audioInitializedRef.current) {
        saveProgressRef.current?.();
      }
    } else {
      if (
        hasAudioRef.current &&
        !isDoneRef.current &&
        audio.src &&
        audio.src !== window.location.href &&
        audio.paused &&
        !audio.ended
      ) {
        audio.play().catch(() => {
          // Na resume (korisnik kliknuo) autoplay gotovo sigurno prolazi,
          // ali ako ne — postavi blocked stanje
          setHasBlockedAutoplay(true);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (!audioInitializedRef.current) return;
      saveProgressRef.current?.();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      setIsPlaying(true);
      setHasStarted(true);
      setHasBlockedAutoplay(false);
    };
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      currentTimeRef.current = audio.currentTime;
      const nowSec = Math.floor(audio.currentTime);
      if (nowSec !== Math.floor(currentTimeRef._lastSec ?? -1)) {
        currentTimeRef._lastSec = nowSec;
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onError = () => {
      console.error(
        "[useListeningAudio] Audio greška na traci:",
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
        isDoneRef.current = true;
        setIsDone(true);
        saveProgressRef.current?.();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasAudio) return;
    const id = setInterval(() => {
      if (audioInitializedRef.current) saveProgressRef.current?.();
    }, 3000);
    return () => clearInterval(id);
  }, [hasAudio]);

  useEffect(() => {
    if (!hasAudio) return;
    const handler = () => {
      if (document.hidden && audioInitializedRef.current) {
        saveProgressRef.current?.();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [hasAudio]);

  useEffect(() => {
    if (!hasAudio) return;
    const handler = () => {
      if (audioInitializedRef.current) saveProgressRef.current?.();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasAudio]);

  const currentTrack = queue[trackIndex] ?? null;
  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return {
    audioRef,

    hasAudio,
    queue,
    totalTracks: queue.length,

    trackIndex,
    currentTrack,
    activePassageId: currentTrack?.passageId ?? null,

    isPlaying,
    hasStarted,
    isDone,
    hasError,
    hasBlockedAutoplay,
    manualStart,
    currentTime,
    duration,
    progressPct,
    formattedTime: formatTime(currentTime),
    formattedDuration: formatTime(duration),

    saveProgress,
    clearProgress,
  };
}
