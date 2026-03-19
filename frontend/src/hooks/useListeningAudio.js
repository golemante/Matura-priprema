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

function calcProgressPct(queue, trackIdx, currentTime, trackDurationsRuntime) {
  if (queue.length === 0) return 0;

  const resolved = queue.map(
    (t) => trackDurationsRuntime[t.url] ?? t.knownDuration ?? null,
  );

  const knownValues = resolved.filter((d) => d !== null);

  if (knownValues.length === 0) {
    return Math.min(100, ((trackIdx + 0.5) / queue.length) * 100);
  }

  const avgKnown = knownValues.reduce((s, d) => s + d, 0) / knownValues.length;
  const effective = resolved.map((d) => d ?? avgKnown);
  const total = effective.reduce((s, d) => s + d, 0);
  if (total <= 0) return 0;

  const completedBefore = effective
    .slice(0, trackIdx)
    .reduce((s, d) => s + d, 0);
  const currentTrackDur = effective[trackIdx] ?? avgKnown;
  const subPct =
    currentTrackDur > 0 ? Math.min(1, currentTime / currentTrackDur) : 0.5;

  return Math.min(
    100,
    ((completedBefore + currentTrackDur * subPct) / total) * 100,
  );
}

const EMPTY_PROGRESS = {
  trackIndex: 0,
  trackUrl: null,
  currentTime: 0,
  isDone: false,
};

export function useListeningAudio(
  examId,
  orderedPassages,
  isPaused,
  { attemptId = null } = {},
) {
  const queue = useMemo(() => buildQueue(orderedPassages), [orderedPassages]);
  const hasAudio = queue.length > 0;

  const savedProgressRef = useRef(null);
  if (savedProgressRef.current === null && examId) {
    savedProgressRef.current =
      audioProgressStorage.load(examId) ?? EMPTY_PROGRESS;
  }
  const saved = savedProgressRef.current ?? EMPTY_PROGRESS;

  const savedTrack = queue[saved.trackIndex] ?? null;
  const seedDuration = savedTrack?.knownDuration ?? 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(saved.currentTime);
  const [duration, setDuration] = useState(seedDuration);
  const [hasError, setHasError] = useState(false);
  const [isDone, setIsDone] = useState(saved.isDone);
  const [hasStarted, setHasStarted] = useState(
    () => saved.currentTime > 0 || saved.isDone,
  );
  const [hasBlockedAutoplay, setHasBlockedAutoplay] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(
    () => queue[saved.trackIndex] ?? null,
  );
  const [trackSkipWarning, setTrackSkipWarning] = useState(null);

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const rafRef = useRef(null);

  const currentTimeRef = useRef(saved.currentTime);
  const trackIndexRef = useRef(saved.trackIndex);
  const isPausedRef = useRef(isPaused);
  const queueRef = useRef(queue);
  const isDoneRef = useRef(saved.isDone);
  const hasAudioRef = useRef(hasAudio);
  const hasErrorRef = useRef(false);
  const examIdRef = useRef(examId);
  const initDoneRef = useRef(null);
  const prevIsPausedRef = useRef(isPaused);
  const isLoadingTrackRef = useRef(false);

  const trackDurationsRef = useRef({});
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
    for (const t of queue) {
      if (t.knownDuration && !trackDurationsRef.current[t.url]) {
        trackDurationsRef.current[t.url] = t.knownDuration;
      }
    }
  }, [queue]);

  const scheduleProgressBarUpdate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = progressBarRef.current;
      if (!el) return;
      const pct = calcProgressPct(
        queueRef.current,
        trackIndexRef.current,
        currentTimeRef.current,
        trackDurationsRef.current,
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

      trackIndexRef.current = index;
      setCurrentTrack(queueRef.current[index] ?? null);

      setDuration(queueRef.current[index]?.knownDuration ?? 0);
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

        isLoadingTrackRef.current = false;
        setIsLoadingTrack(false);

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
                `[useListeningAudio] iOS watchdog: korigiram currentTime ` +
                  `${audio.currentTime.toFixed(1)}s → ${startTime.toFixed(1)}s`,
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
          isLoadingTrackRef.current = false;
          setIsLoadingTrack(false);
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

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) audio.pause();
    audio.src = "";
    audio.load();
  }, []);

  const manualStart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDoneRef.current || isPausedRef.current) return;
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
      if (url && audio.duration > 0) {
        trackDurationsRef.current[url] = audio.duration;
      }
      setDuration(audio.duration);
      scheduleProgressBarUpdate();
    };

    let skipWarningTimer = null;
    const onError = () => {
      isLoadingTrackRef.current = false;
      setIsLoadingTrack(false);
      cleanupPendingPlay();

      const failedTrack = queueRef.current[trackIndexRef.current];
      console.error(
        `[useListeningAudio] Audio load greška na traci: ${failedTrack?.url}`,
      );

      const q = queueRef.current;
      const nextIndex = trackIndexRef.current + 1;
      if (nextIndex < q.length) {
        console.warn(
          `[useListeningAudio] Preskačem pokvarenu traku → track ${nextIndex}`,
        );
        setTrackSkipWarning(failedTrack?.label ?? "Snimka");
        if (skipWarningTimer) clearTimeout(skipWarningTimer);
        skipWarningTimer = setTimeout(() => setTrackSkipWarning(null), 4_000);
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
      const nextIndex = idx + 1;

      if (nextIndex < q.length) {
        playTrackAtIndex(nextIndex, 0);
      } else {
        isDoneRef.current = true;
        setIsDone(true);
        audioProgressStorage.save(examIdRef.current, {
          trackIndex: idx,
          trackUrl: q[idx]?.url ?? null,
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

      if (!audio.paused) audio.pause();
      audio.src = "";
      audio.load();

      if (skipWarningTimer) clearTimeout(skipWarningTimer);
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
      saveProgressRef.current?.();

      const eid = examIdRef.current;
      const aid = attemptIdRef.current;
      if (aid && eid && hasAudioRef.current && !isDoneRef.current) {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const token = authTokenRef.current ?? SUPABASE_ANON_KEY;
        if (SUPABASE_URL && SUPABASE_ANON_KEY && token) {
          fetch(`${SUPABASE_URL}/rest/v1/rpc/sync_audio_status`, {
            method: "POST",
            body: JSON.stringify({
              p_attempt_id: aid,
              p_audio_is_done: isDoneRef.current,
              p_current_time_s: Math.round(currentTimeRef.current * 100) / 100,
              p_track_index: Math.max(0, Math.floor(trackIndexRef.current)),
            }),
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

  const isIntroPlaying = !isDone && currentTrack?.type === "intro" && isPlaying;

  return {
    audioRef,
    progressBarRef,
    hasAudio,
    activePassageId: isDone ? null : (currentTrack?.passageId ?? null),
    currentTrack,
    isPlaying,
    isIntroPlaying,
    isLoadingTrack,
    hasStarted,
    isDone,
    hasError,
    hasBlockedAutoplay,
    trackSkipWarning,
    manualStart,
    stopAudio,
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
