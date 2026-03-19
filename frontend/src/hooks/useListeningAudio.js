// hooks/useListeningAudio.js
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { audioProgressStorage } from "@/utils/storage";
import { attemptApi } from "@/api/attemptApi";
import { supabase } from "@/lib/supabase";
import { formatTime } from "@/utils/formatters";

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
        knownDuration: null,
      });
    }
    if (p.audioUrl) {
      tracks.push({
        url: p.audioUrl,
        type: "content",
        passageId: p.id,
        label: p.title ?? "Snimka",
        knownDuration: p.audioDurationSeconds ?? null,
      });
    }
  }
  return tracks;
}

function calcTotalKnownDuration(queue, trackDurationsRuntime = {}) {
  return queue.reduce((sum, t) => {
    const duration = trackDurationsRuntime[t.url] ?? t.knownDuration ?? 0;
    return sum + duration;
  }, 0);
}

export function useListeningAudio(
  examId,
  orderedPassages,
  isPaused,
  { attemptId = null, maxPlaysPerTrack = 2 } = {},
) {
  const queue = useMemo(() => buildQueue(orderedPassages), [orderedPassages]);
  const hasAudio = queue.length > 0;

  const playCountRef = useRef({});
  const [playCountMap, setPlayCountMap] = useState({});

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

  const savedTrack = queue[saved?.trackIndex ?? 0] ?? null;
  const seedDuration = savedTrack?.knownDuration ?? 0;

  const [trackIndex, setTrackIndex] = useState(saved?.trackIndex ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(saved?.currentTime ?? 0);
  const [duration, setDuration] = useState(seedDuration);
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

  const [totalKnownDuration, setTotalKnownDuration] = useState(() =>
    calcTotalKnownDuration(queue),
  );
  const [trackSkipWarning, setTrackSkipWarning] = useState(null);

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const rafRef = useRef(null);

  const currentTimeRef = useRef(saved?.currentTime ?? 0);
  const trackIndexRef = useRef(saved?.trackIndex ?? 0);
  const isPausedRef = useRef(isPaused);
  const queueRef = useRef(queue);
  const isDoneRef = useRef(saved?.isDone ?? false);
  const hasAudioRef = useRef(hasAudio);
  const hasErrorRef = useRef(false);
  const examIdRef = useRef(examId);
  const initDoneRef = useRef(null);
  const prevIsPausedRef = useRef(isPaused);
  const isLoadingTrackRef = useRef(false);

  const trackDurationsRef = useRef({});
  const totalKnownDurationRef = useRef(calcTotalKnownDuration(queue));
  const lastSecRef = useRef(-1);
  const iosWatchdogRef = useRef(null);
  const pendingPlayHandlerRef = useRef(null);
  const pendingTimeoutRef = useRef(null);
  const attemptIdRef = useRef(attemptId);

  const authTokenRef = useRef(null);

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
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      authTokenRef.current = data.session?.access_token ?? null;
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      authTokenRef.current = session?.access_token ?? null;
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    totalKnownDurationRef.current = calcTotalKnownDuration(
      queue,
      trackDurationsRef.current,
    );
  }, [queue]);

  const scheduleProgressBarUpdate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = progressBarRef.current;
      if (!el) return;

      const total = totalKnownDurationRef.current;
      if (total <= 0) return;

      const q = queueRef.current;
      const idx = trackIndexRef.current;

      const completedDuration = q
        .slice(0, idx)
        .reduce(
          (sum, t) =>
            sum + (trackDurationsRef.current[t.url] ?? t.knownDuration ?? 0),
          0,
        );

      const pct = Math.min(
        100,
        ((completedDuration + currentTimeRef.current) / total) * 100,
      );

      el.style.width = `${pct.toFixed(2)}%`;
    });
  }, []);

  const saveProgressRef = useRef(null);
  saveProgressRef.current = () => {
    const eid = examIdRef.current;
    if (!eid || !hasAudioRef.current) return;
    const q = queueRef.current;
    const idx = trackIndexRef.current;
    const audio = audioRef.current;
    const ct =
      !isLoadingTrackRef.current && audio && audio.readyState >= 1
        ? audio.currentTime
        : currentTimeRef.current;

    audioProgressStorage.save(eid, {
      trackIndex: idx,
      trackUrl: q[idx]?.url ?? null,
      currentTime: ct,
      isDone: isDoneRef.current,
    });
  };

  const clearProgress = useCallback(() => {
    const eid = examIdRef.current;
    if (eid) audioProgressStorage.clear(eid);
  }, []);

  const cleanupPendingPlay = useCallback(() => {
    const audio = audioRef.current;
    const handler = pendingPlayHandlerRef.current;
    if (audio && handler) {
      audio.removeEventListener("canplay", handler);
      audio.removeEventListener("canplaythrough", handler);
      audio.removeEventListener("loadeddata", handler);
      pendingPlayHandlerRef.current = null;
    }
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    if (iosWatchdogRef.current) {
      clearTimeout(iosWatchdogRef.current);
      iosWatchdogRef.current = null;
    }
  }, []);

  const playTrackAtIndex = useCallback(
    (index, startTime = 0) => {
      const audio = audioRef.current;
      const track = queueRef.current[index];

      if (!audio || !track) {
        console.warn(`[useListeningAudio] playTrackAtIndex(${index}) bail`);
        return;
      }

      cleanupPendingPlay();

      currentTimeRef.current = startTime;
      setCurrentTime(startTime);

      audioProgressStorage.save(examIdRef.current, {
        trackIndex: index,
        trackUrl: track.url,
        currentTime: startTime,
        isDone: false,
      });

      setTrackIndex(index);
      setCurrentTrack(queueRef.current[index] ?? null);
      trackIndexRef.current = index;

      const nextKnown = queueRef.current[index]?.knownDuration ?? 0;
      setDuration(nextKnown);
      setHasError(false);
      hasErrorRef.current = false;
      isDoneRef.current = false;
      setIsDone(false);

      audio.src = track.url;
      isLoadingTrackRef.current = true;
      audio.load();
      setIsLoadingTrack(true);

      const doPlay = () => {
        cleanupPendingPlay();
        setIsLoadingTrack(false);
        isLoadingTrackRef.current = false;

        if (isPausedRef.current) return;

        if (startTime > 0) {
          audio.currentTime = startTime;

          iosWatchdogRef.current = setTimeout(() => {
            iosWatchdogRef.current = null;
            if (
              audio &&
              !audio.paused &&
              Math.abs(audio.currentTime - startTime) > 1.5
            ) {
              console.warn(
                `[useListeningAudio] iOS watchdog: korigiram currentTime ${audio.currentTime.toFixed(1)}s → ${startTime.toFixed(1)}s`,
              );
              audio.currentTime = startTime;
            }
          }, 200);
        }

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

      let triggered = false;
      const multiEventHandler = () => {
        if (triggered) return;
        triggered = true;
        doPlay();
      };

      pendingPlayHandlerRef.current = multiEventHandler;
      audio.addEventListener("canplay", multiEventHandler);
      audio.addEventListener("canplaythrough", multiEventHandler);
      audio.addEventListener("loadeddata", multiEventHandler);

      pendingTimeoutRef.current = setTimeout(() => {
        pendingTimeoutRef.current = null;
        if (pendingPlayHandlerRef.current === multiEventHandler) {
          cleanupPendingPlay();
          console.error(
            `[useListeningAudio] Timeout — audio nije spreman za: ${track.url}`,
          );
          hasErrorRef.current = true;
          setHasError(true);
        }
      }, 12_000);
    },
    [cleanupPendingPlay],
  );

  const manualStart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDoneRef.current) return;
    if (isPausedRef.current) return;

    const url = queueRef.current[trackIndexRef.current]?.url;
    if (url && (playCountRef.current[url] ?? 0) >= maxPlaysPerTrack) {
      console.info(
        `[useListeningAudio] manualStart blokiran: traka "${url}" odslušana ${maxPlaysPerTrack}× (NCVVO limit).`,
      );
      return;
    }

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
  }, [playTrackAtIndex, maxPlaysPerTrack]);

  useEffect(() => {
    if (!hasAudio) return;
    if (initDoneRef.current === examId) return;
    initDoneRef.current = examId;

    for (const t of queue) {
      if (t.knownDuration && !trackDurationsRef.current[t.url]) {
        trackDurationsRef.current[t.url] = t.knownDuration;
      }
    }
    totalKnownDurationRef.current = calcTotalKnownDuration(
      queue,
      trackDurationsRef.current,
    );

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

    const prev = prevIsPausedRef.current;
    prevIsPausedRef.current = isPaused;
    if (isPaused === prev) return;

    if (isPaused) {
      audio?.pause();
    } else {
      const canAttemptResume =
        hasAudioRef.current &&
        !isDoneRef.current &&
        !hasErrorRef.current &&
        audio?.src &&
        audio.src !== window.location.href &&
        audio.paused &&
        !audio.ended;

      if (!canAttemptResume || !audio) return;

      if (audio.readyState >= 3) {
        audio.play().catch((err) => {
          if (err.name !== "AbortError") setHasBlockedAutoplay(true);
        });
      } else {
        const onCanPlay = () => {
          if (isPausedRef.current) return;
          audio.play().catch((err) => {
            if (err.name !== "AbortError") setHasBlockedAutoplay(true);
          });
        };
        audio.addEventListener("canplay", onCanPlay, { once: true });
        return () => audio.removeEventListener("canplay", onCanPlay);
      }
    }
  }, [isPaused]);

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
      setTrackSkipWarning(null);

      const url = queueRef.current[trackIndexRef.current]?.url;
      if (url) {
        const prev = playCountRef.current[url] ?? 0;
        if ((audioRef.current?.currentTime ?? 0) < 2) {
          playCountRef.current[url] = prev + 1;
          setPlayCountMap((m) => ({ ...m, [url]: prev + 1 }));
        }
      }
    };

    const onPause = () => {
      setIsPlaying(false);
      saveProgressRef.current?.();
    };

    const onTimeUpdate = () => {
      currentTimeRef.current = audio.currentTime;

      const nowSec = Math.floor(audio.currentTime);
      if (nowSec !== lastSecRef.current) {
        lastSecRef.current = nowSec;
        setCurrentTime(audio.currentTime);
      }

      scheduleProgressBarUpdate();
    };

    const onSeeked = () => {
      currentTimeRef.current = audio.currentTime;
      scheduleProgressBarUpdate();
    };

    const onLoadedMetadata = () => {
      const url = queueRef.current[trackIndexRef.current]?.url;
      if (url) {
        trackDurationsRef.current[url] = audio.duration;
      }
      setDuration(audio.duration);

      const newTotal = calcTotalKnownDuration(
        queueRef.current,
        trackDurationsRef.current,
      );
      totalKnownDurationRef.current = newTotal;
      setTotalKnownDuration(newTotal);

      scheduleProgressBarUpdate();
    };

    let skipWarningTimerRef_local = null;
    const onError = () => {
      isLoadingTrackRef.current = false;
      setIsLoadingTrack(false);
      cleanupPendingPlay();

      const failedTrack = queueRef.current[trackIndexRef.current];
      const failedUrl = failedTrack?.url;
      console.error(
        `[useListeningAudio] Audio load greška na traci: ${failedUrl}`,
      );

      const q = queueRef.current;
      const nextIndex = trackIndexRef.current + 1;

      if (nextIndex < q.length) {
        console.warn(
          `[useListeningAudio] Preskačem pokvarenu traku → track ${nextIndex}`,
        );
        const warningLabel = failedTrack?.label ?? "Snimka";
        setTrackSkipWarning(warningLabel);
        if (skipWarningTimerRef_local) clearTimeout(skipWarningTimerRef_local);
        skipWarningTimerRef_local = setTimeout(() => {
          setTrackSkipWarning(null);
        }, 4_000);

        setTimeout(() => playTrackAtIndex(nextIndex, 0), 300);
      } else {
        hasErrorRef.current = true;
        setHasError(true);
        setIsPlaying(false);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      const q = queueRef.current;
      const idx = trackIndexRef.current;
      const currentTrackUrl = q[idx]?.url;

      const timesPlayed = currentTrackUrl
        ? (playCountRef.current[currentTrackUrl] ?? 0)
        : maxPlaysPerTrack;

      if (timesPlayed < maxPlaysPerTrack) {
        setTimeout(() => {
          if (!isPausedRef.current) {
            playTrackAtIndex(idx, 0);
          }
        }, 1500);
        return;
      }

      const nextIndex = idx + 1;

      if (nextIndex < q.length) {
        playTrackAtIndex(nextIndex, 0);
      } else {
        isDoneRef.current = true;
        setIsDone(true);

        const lastUrl = q[idx]?.url ?? null;

        audioProgressStorage.save(examIdRef.current, {
          trackIndex: idx,
          trackUrl: lastUrl,
          currentTime: 0,
          isDone: true,
        });

        const aid = attemptIdRef.current;
        if (aid) {
          attemptApi.syncAudioStatus(aid, {
            isDone: true,
            currentTimeS: 0,
            trackIndex: idx,
          });
        }

        console.info("[useListeningAudio] Sve audio trake završene.");
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasAudio) return;
    const id = setInterval(() => saveProgressRef.current?.(), 1_000);
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

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (iosWatchdogRef.current) clearTimeout(iosWatchdogRef.current);
      cleanupPendingPlay();

      const audio = audioRef.current;

      if (audio && !audio.paused) {
        audio.pause();
      } else {
        saveProgressRef.current?.();
      }

      const eid = examIdRef.current;
      const aid = attemptIdRef.current;

      if (aid && eid && hasAudioRef.current && !isDoneRef.current) {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const token = authTokenRef.current ?? SUPABASE_ANON_KEY;

        if (SUPABASE_URL && SUPABASE_ANON_KEY && token) {
          const rpcPayload = JSON.stringify({
            p_attempt_id: aid,
            p_audio_is_done: isDoneRef.current,
            p_current_time_s: Math.round(currentTimeRef.current * 100) / 100,
            p_track_index: Math.max(0, Math.floor(trackIndexRef.current)),
          });

          fetch(`${SUPABASE_URL}/rest/v1/rpc/sync_audio_status`, {
            method: "POST",
            body: rpcPayload,
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => {});
        }
      }
    };
  }, [cleanupPendingPlay]);

  const currentTrackPlays = currentTrack
    ? (playCountMap[currentTrack.url] ?? 0)
    : 0;
  const currentTrackLimitReached = currentTrackPlays >= maxPlaysPerTrack;

  const isIntroPlaying = !isDone && currentTrack?.type === "intro" && isPlaying;

  return {
    audioRef,
    progressBarRef,
    hasAudio,
    activePassageId: isDone ? null : (currentTrack?.passageId ?? null),
    trackIndex,
    currentTrack,
    isPlaying,
    isIntroPlaying,
    isLoadingTrack,
    hasStarted,
    isDone,
    hasError,
    hasBlockedAutoplay,
    trackSkipWarning,
    currentTrackPlays,
    currentTrackLimitReached,
    maxPlaysPerTrack,
    manualStart,
    currentTime,
    duration,
    formattedTime: formatTime(currentTime),
    formattedDuration: formatTime(duration),
    clearProgress,
    getAudioState: () => ({
      isDone: isDoneRef.current,
      trackIndex: trackIndexRef.current,
      currentTimeS: currentTimeRef.current,
      hasAudio: hasAudioRef.current,
    }),
  };
}
