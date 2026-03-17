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
  if (savedProgressRef.current === null && examId) {
    savedProgressRef.current = audioProgressStorage.load(examId) ?? {
      trackIndex: 0,
      trackUrl: null,
      currentTime: 0,
      isDone: false,
    };
  }

  const saved = savedProgressRef.current;

  const [trackIndex, setTrackIndex] = useState(saved?.trackIndex ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(saved?.currentTime ?? 0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isDone, setIsDone] = useState(saved?.isDone ?? false);
  const [hasStarted, setHasStarted] = useState(
    () => (saved?.currentTime ?? 0) > 0 || (saved?.isDone ?? false),
  );
  const [hasBlockedAutoplay, setHasBlockedAutoplay] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(
    () => queue[saved?.trackIndex ?? 0] ?? null,
  );

  const audioRef = useRef(null);
  const currentTimeRef = useRef(saved?.currentTime ?? 0);
  const trackIndexRef = useRef(saved?.trackIndex ?? 0);
  const isPausedRef = useRef(isPaused);
  const queueRef = useRef(queue);
  const isDoneRef = useRef(saved?.isDone ?? false);
  const hasAudioRef = useRef(hasAudio);
  const hasErrorRef = useRef(false);
  const examIdRef = useRef(examId);
  const initDoneRef = useRef(null);
  const pendingLoadedMetadataRef = useRef(null);
  const pendingTimeoutRef = useRef(null);
  const prevIsPausedRef = useRef(isPaused);
  const trackDurationsRef = useRef({});

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
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
    if (!eid || !hasAudioRef.current) return;
    const q = queueRef.current;
    const idx = trackIndexRef.current;
    audioProgressStorage.save(eid, {
      trackIndex: idx,
      trackUrl: q[idx]?.url ?? null,
      currentTime: currentTimeRef.current,
      isDone: isDoneRef.current,
    });
  };

  const clearProgress = useCallback(() => {
    const eid = examIdRef.current;
    if (eid) audioProgressStorage.clear(eid);
  }, []);

  const playTrackAtIndex = useCallback((index, startTime = 0) => {
    const audio = audioRef.current;
    const track = queueRef.current[index];

    if (!audio || !track) {
      console.warn(`[useListeningAudio] playTrackAtIndex(${index}) bail`);
      return;
    }

    if (pendingLoadedMetadataRef.current) {
      audio.removeEventListener("canplay", pendingLoadedMetadataRef.current);
      pendingLoadedMetadataRef.current = null;
    }
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    currentTimeRef.current = startTime;
    audioProgressStorage.save(examIdRef.current, {
      trackIndex: index,
      trackUrl: track.url,
      currentTime: startTime,
      isDone: false,
    });

    setTrackIndex(index);
    setCurrentTrack(queueRef.current[index] ?? null);
    trackIndexRef.current = index;
    setDuration(0);
    setHasError(false);
    hasErrorRef.current = false;
    isDoneRef.current = false;
    setIsDone(false);

    audio.src = track.url;
    audio.load();
    setIsLoadingTrack(true);

    const doPlay = () => {
      setIsLoadingTrack(false);
      pendingLoadedMetadataRef.current = null;
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }

      audio.currentTime = startTime;

      if (isPausedRef.current) return;

      const attemptPlay = (retries = 0) => {
        audio.play().catch((err) => {
          if (err.name === "AbortError" && retries < 3) {
            setTimeout(() => attemptPlay(retries + 1), 150 * (retries + 1));
          } else if (err.name === "NotAllowedError") {
            console.warn(
              "[useListeningAudio] Autoplay blokiran — čekam user gesture",
            );
            setHasBlockedAutoplay(true);
          } else {
            console.error(
              `[useListeningAudio] play() greška (${err.name}): ${err.message}`,
            );
            hasErrorRef.current = true;
            setHasError(true);
          }
        });
      };
      attemptPlay();
    };

    pendingLoadedMetadataRef.current = doPlay;
    audio.addEventListener("canplay", doPlay, { once: true });

    pendingTimeoutRef.current = setTimeout(() => {
      pendingTimeoutRef.current = null;
      if (pendingLoadedMetadataRef.current === doPlay) {
        audio.removeEventListener("canplay", doPlay);
        pendingLoadedMetadataRef.current = null;
        console.error(
          `[useListeningAudio] Timeout na canplay za: ${track.url}`,
        );
        hasErrorRef.current = true;
        setHasError(true);
      }
    }, 10000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!hasAudio) return;
    if (initDoneRef.current === examId) return;
    initDoneRef.current = examId;

    const s = savedProgressRef.current;

    if (s?.isDone) {
      isDoneRef.current = true;
      setIsDone(true);
      console.info(
        "[useListeningAudio] Audio je bio završen — preskačem init reproduciranje.",
      );
      return;
    }

    let startIndex = 0;
    if (s?.trackUrl) {
      const byUrl = queue.findIndex((t) => t.url === s.trackUrl);
      startIndex =
        byUrl !== -1 ? byUrl : Math.min(s?.trackIndex ?? 0, queue.length - 1);
    } else {
      startIndex = Math.min(s?.trackIndex ?? 0, queue.length - 1);
    }
    const startTime = s?.currentTime ?? 0;

    console.info(
      `[useListeningAudio] Init: track ${startIndex}/${queue.length - 1} @ ${startTime.toFixed(1)}s`,
    );

    playTrackAtIndex(startIndex, startTime);
  }, [hasAudio, examId, queue, playTrackAtIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const prev = prevIsPausedRef.current;
    prevIsPausedRef.current = isPaused;
    if (isPaused === prev) return;

    if (isPaused) {
      audio.pause();
      saveProgressRef.current?.();
    } else {
      const canAttemptResume =
        hasAudioRef.current &&
        !isDoneRef.current &&
        !hasErrorRef.current &&
        audio.src &&
        audio.src !== window.location.href &&
        audio.paused &&
        !audio.ended;

      if (!canAttemptResume) return;

      if (audio.readyState >= 3) {
        audio.play().catch((err) => {
          if (err.name !== "AbortError") {
            setHasBlockedAutoplay(true);
          }
        });
      } else {
        const onCanPlay = () => {
          if (isPausedRef.current) return;
          audio.play().catch((err) => {
            if (err.name !== "AbortError") {
              setHasBlockedAutoplay(true);
            }
          });
        };
        audio.addEventListener("canplay", onCanPlay, { once: true });
        return () => audio.removeEventListener("canplay", onCanPlay);
      }
    }
  }, [isPaused]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
      saveProgressRef.current?.();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error(
        "[useListeningAudio] audioRef.current je null pri registraciji listenera!",
      );
      return;
    }

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

    const onLoadedMetadata = () => {
      const url = queueRef.current[trackIndexRef.current]?.url;
      if (url) trackDurationsRef.current[url] = audio.duration;
      setDuration(audio.duration);
    };

    const onError = () => {
      setIsLoadingTrack(false);
      if (pendingLoadedMetadataRef.current) {
        audio.removeEventListener("canplay", pendingLoadedMetadataRef.current);
        pendingLoadedMetadataRef.current = null;
      }
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }

      const url = queueRef.current[trackIndexRef.current]?.url;
      console.error(`[useListeningAudio] Audio load greška na traci: ${url}`);

      const q = queueRef.current;
      const nextIndex = trackIndexRef.current + 1;

      if (nextIndex < q.length) {
        console.warn(
          `[useListeningAudio] Preskačem pokvarenu traku → track ${nextIndex}`,
        );
        setTimeout(() => playTrackAtIndex(nextIndex, 0), 300);
      } else {
        hasErrorRef.current = true;
        setHasError(true);
        setIsPlaying(false);
      }
    };

    if (pendingLoadedMetadataRef.current) {
      audio.removeEventListener("canplay", pendingLoadedMetadataRef.current);
      pendingLoadedMetadataRef.current = null;
    }
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    const onEnded = () => {
      setIsPlaying(false);

      const q = queueRef.current;

      if (q.length === 0) {
        console.warn(
          "[useListeningAudio] onEnded s praznim queue-om — markiram kao done.",
        );
        isDoneRef.current = true;
        setIsDone(true);
        audioProgressStorage.save(examIdRef.current, {
          trackIndex: trackIndexRef.current,
          trackUrl: null,
          currentTime: 0,
          isDone: true,
        });
        return;
      }

      const nextIndex = trackIndexRef.current + 1;

      if (nextIndex < q.length) {
        playTrackAtIndex(nextIndex, 0);
      } else {
        isDoneRef.current = true;
        setIsDone(true);
        audioProgressStorage.save(examIdRef.current, {
          trackIndex: trackIndexRef.current,
          trackUrl: q[trackIndexRef.current]?.url ?? null,
          currentTime: currentTimeRef.current,
          isDone: true,
        });
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasAudio) return;
    const id = setInterval(() => saveProgressRef.current?.(), 1000);
    return () => clearInterval(id);
  }, [hasAudio]);

  useEffect(() => {
    if (!hasAudio) return;
    const handler = () => {
      if (document.hidden) saveProgressRef.current?.();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [hasAudio]);

  useEffect(() => {
    if (!hasAudio) return;
    const handler = () => saveProgressRef.current?.();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasAudio]);

  const completedDuration = queue
    .slice(0, trackIndex)
    .reduce((sum, t) => sum + (trackDurationsRef.current[t.url] ?? 0), 0);
  const totalKnownDuration = queue.reduce(
    (sum, t) => sum + (trackDurationsRef.current[t.url] ?? 0),
    0,
  );
  const totalProgressPct =
    totalKnownDuration > 0
      ? Math.min(
          100,
          ((completedDuration + currentTime) / totalKnownDuration) * 100,
        )
      : 0;

  return {
    audioRef,
    hasAudio,
    queue,
    totalTracks: queue.length,
    trackIndex,
    currentTrack,
    activePassageId: isDone ? null : (currentTrack?.passageId ?? null),
    isPlaying,
    isLoadingTrack,
    hasStarted,
    isDone,
    hasError,
    hasBlockedAutoplay,
    manualStart,
    currentTime,
    duration,
    totalProgressPct,
    formattedTime: formatTime(currentTime),
    formattedDuration: formatTime(duration),
    clearProgress,
  };
}
