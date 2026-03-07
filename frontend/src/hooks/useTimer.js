// hooks/useTimer.js
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI:
//
//  BUG — Timer race condition s null initialSeconds
//  ─────────────────────────────────────────────────
//  useExamSession pozivao je useTimer() PRIJE nego što su examData pristigli.
//  Timer je startan s undefined/fallback vrijednošću.
//
//  ISPRAVAK:
//  • Prihvata initialSeconds = null → timer NE TECE dok ne dobije pravu vrijednost
//  • Kada initialSeconds pristignu (nije null), setTimeLeft + startaj timer
//  • Ovo rješava problem bez kršenja React hooks pravila (redoslijed ostaje isti)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";

export function useTimer(
  initialSeconds, // null = čekaj, broj = starta timer
  { onExpire, onWarning, warningAt = 600 } = {},
) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds ?? 0);
  const [running, setRunning] = useState(false); // Ne krece dok initialSeconds nije postavljen
  const warned = useRef(false);
  const initialized = useRef(false);

  const onExpireRef = useRef(onExpire);
  const onWarningRef = useRef(onWarning);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  // Kada initialSeconds PRVI PUT postane broj (pristigli podaci iz API-ja)
  // postavi timeLeft i startaj timer.
  useEffect(() => {
    if (initialSeconds == null || initialized.current) return;
    initialized.current = true;
    setTimeLeft(initialSeconds);
    setRunning(true);
    warned.current = false;
  }, [initialSeconds]);

  // Tick
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
    isReady: initialized.current,
    isWarning: timeLeft <= warningAt && timeLeft > 120,
    isDanger: timeLeft <= 120,
  };
}
