// hooks/useTimer.js
import { useState, useEffect, useCallback, useRef } from "react";

export function useTimer(
  initialSeconds,
  { onExpire, onWarning, warningAt = 600 } = {},
) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(true);
  const warned = useRef(false);

  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next <= warningAt && !warned.current) {
          warned.current = true;
          onWarning?.();
        }
        if (next <= 0) {
          setRunning(false);
          onExpire?.();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, timeLeft, onExpire, onWarning, warningAt]);

  const format = useCallback(
    (secs = timeLeft) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      if (h > 0)
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    },
    [timeLeft],
  );

  return {
    timeLeft,
    formatted: format(),
    running,
    pause: () => setRunning(false),
    resume: () => setRunning(true),
    isWarning: timeLeft < warningAt,
    isDanger: timeLeft < 120,
  };
}
