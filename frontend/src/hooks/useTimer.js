// hooks/useTimer.js
import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_WARNING_AT = 600;

/**
 * @param {number|null} initialSeconds
 * @param {{ onExpire?: () => void, onWarning?: () => void, warningAt?: number }} options
 */
export function useTimer(initialSeconds, options = {}) {
  const { onExpire, onWarning, warningAt = DEFAULT_WARNING_AT } = options;

  const onExpireRef = useRef(onExpire);
  const onWarningRef = useRef(onWarning);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  const [timeLeft, setTimeLeft] = useState(initialSeconds ?? 0);
  const [running, setRunning] = useState(false);
  const initialized = useRef(false);
  const warned = useRef(false);

  const anchorTime = useRef(null);
  const anchorSeconds = useRef(initialSeconds ?? 0);

  useEffect(() => {
    if (initialSeconds == null || initialized.current) return;
    initialized.current = true;
    anchorSeconds.current = initialSeconds;
    anchorTime.current = Date.now();
    setTimeLeft(initialSeconds);
    setRunning(true);
    warned.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      if (!anchorTime.current) return;

      const elapsed = Math.floor((Date.now() - anchorTime.current) / 1000);
      const next = Math.max(0, anchorSeconds.current - elapsed);

      setTimeLeft(next);

      if (next <= warningAt && !warned.current) {
        warned.current = true;
        onWarningRef.current?.();
      }

      if (next <= 0) {
        setRunning(false);
        onExpireRef.current?.();
      }
    }, 500);

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

  const pause = useCallback(() => {
    if (!running) return;
    const elapsed = anchorTime.current
      ? Math.floor((Date.now() - anchorTime.current) / 1000)
      : 0;
    const remaining = Math.max(0, anchorSeconds.current - elapsed);
    anchorSeconds.current = remaining;
    anchorTime.current = null;
    setTimeLeft(remaining);
    setRunning(false);
  }, [running]);

  const resume = useCallback(() => {
    if (running) return;
    anchorTime.current = Date.now();
    setRunning(true);
  }, [running]);

  const resync = useCallback(
    (nextSeconds, { running: nextRunning } = {}) => {
      if (nextSeconds == null) return;
      const normalized = Math.max(0, Number(nextSeconds) || 0);

      initialized.current = true;

      if (nextRunning === true) {
        warned.current = false;
      } else {
        warned.current = normalized <= warningAt;
      }

      anchorSeconds.current = normalized;
      anchorTime.current =
        typeof nextRunning === "boolean" && nextRunning ? Date.now() : null;

      setTimeLeft(normalized);
      if (typeof nextRunning === "boolean") {
        setRunning(nextRunning);
      }
    },
    [warningAt],
  );

  return {
    timeLeft,
    formatted: format(),
    running,
    pause,
    resume,
    resync,
    isReady: initialized.current,
    isWarning: timeLeft <= warningAt && timeLeft > 120,
    isDanger: timeLeft <= 120,
  };
}
