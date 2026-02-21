// hooks/useTimer.js
import { useState, useEffect, useCallback, useRef } from "react";

export function useTimer(initialSeconds, { onExpire, autoStart = true } = {}) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          onExpire?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, onExpire]);

  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => setRunning(true), []);
  const reset = useCallback(() => {
    setTimeLeft(initialSeconds);
    setRunning(autoStart);
  }, [initialSeconds, autoStart]);

  const format = useCallback(() => {
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [timeLeft]);

  return {
    timeLeft,
    formatted: format(),
    running,
    pause,
    resume,
    reset,
    isWarning: timeLeft < 600, // last 10 min
    isDanger: timeLeft < 120, // last 2 min
  };
}
