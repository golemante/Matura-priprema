// hooks/useTimer.js
import { useState, useEffect, useCallback, useRef } from "react";

export function useTimer(
  initialSeconds,
  { onExpire, onWarning, warningAt = 600 } = {},
) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(true);
  const warned = useRef(false);

  const onExpireRef = useRef(onExpire);
  const onWarningRef = useRef(onWarning);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;

        if (next <= warningAt && !warned.current) {
          warned.current = true;
          onWarningRef.current?.();
        }

        if (next <= 0) {
          setRunning(false);
          onExpireRef.current?.();
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running, warningAt]);

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
    isWarning: timeLeft <= warningAt && timeLeft > 120,
    isDanger: timeLeft <= 120,
  };
}
