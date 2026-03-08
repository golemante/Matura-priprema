// hooks/useTimer.js
// ─────────────────────────────────────────────────────────────────────────────
// FIX: Timer drift eliminiran.
//
// PROBLEM (stari kod):
//   setInterval(1000ms) → decrement timeLeft za 1 svaku sekundu
//   JS event loop kasni → setInterval nije garantiran na točno 1000ms
//   Na 90-minutnom ispitu: do 3-4 minute greške
//
// RJEŠENJE (novi kod):
//   Pamtimo `startedAt = Date.now()` i `initialSeconds` pri inicijalizaciji.
//   Svaki tick: timeLeft = initialSeconds - Math.floor((Date.now() - startedAt) / 1000)
//   → Drift je uvijek < 1 sekunda, neovisno o trajanju ispita.
//
// API ostaje IDENTIČAN — nije potrebno mijenjati pozivaoce:
//   { timeLeft, formatted, running, pause, resume, resync, isReady, isWarning, isDanger }
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_WARNING_AT = 600; // 10 minuta

/**
 * @param {number|null} initialSeconds - Ukupno trajanje u sekundama (null = bez timera)
 * @param {{ onExpire?: () => void, onWarning?: () => void, warningAt?: number }} options
 */
export function useTimer(initialSeconds, options = {}) {
  const { onExpire, onWarning, warningAt = DEFAULT_WARNING_AT } = options;

  // Koristimo ref-ove za callback-e da izbjegnemo re-kreiranje effecta
  const onExpireRef = useRef(onExpire);
  const onWarningRef = useRef(onWarning);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  // ── Interna stanja ────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(initialSeconds ?? 0);
  const [running, setRunning] = useState(false);
  const initialized = useRef(false);
  const warned = useRef(false);

  // Anchor za drift-free računanje:
  //   anchorTime    — Date.now() kada je timer krenuo (ili resyncao)
  //   anchorSeconds — timeLeft u trenutku anchora
  const anchorTime = useRef(null);
  const anchorSeconds = useRef(initialSeconds ?? 0);

  // ── Inicijalizacija ───────────────────────────────────────────────────────
  useEffect(() => {
    if (initialSeconds == null || initialized.current) return;
    initialized.current = true;
    anchorSeconds.current = initialSeconds;
    anchorTime.current = Date.now();
    setTimeLeft(initialSeconds);
    setRunning(true);
    warned.current = false;
  }, [initialSeconds]);

  // ── Tick loop (drift-free) ────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      if (!anchorTime.current) return;

      // Uvijek računamo od anchora → nema akumulacije greške
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
    }, 500); // Tick 2x/s za smooth display, ali računamo od anchora

    return () => clearInterval(id);
  }, [running, warningAt]);

  // ── Format hh:mm:ss / mm:ss ───────────────────────────────────────────────
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

  // ── Pause ─────────────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    if (!running) return;
    // Snimamo trenutni timeLeft kao novi anchor
    const elapsed = anchorTime.current
      ? Math.floor((Date.now() - anchorTime.current) / 1000)
      : 0;
    const remaining = Math.max(0, anchorSeconds.current - elapsed);
    anchorSeconds.current = remaining;
    anchorTime.current = null; // Nema aktivnog ticking-a
    setTimeLeft(remaining);
    setRunning(false);
  }, [running]);

  // ── Resume ────────────────────────────────────────────────────────────────
  const resume = useCallback(() => {
    if (running) return;
    // Postavljamo novi anchor od trenutnog timeLeft
    anchorTime.current = Date.now();
    // anchorSeconds ostaje kao što je bio (timeLeft koji smo imali)
    setRunning(true);
  }, [running]);

  // ── Resync (za server-sync) ───────────────────────────────────────────────
  // Poziva se nakon pause/resume API poziva kad dobijemo server elapsed.
  const resync = useCallback(
    (nextSeconds, { running: nextRunning } = {}) => {
      if (nextSeconds == null) return;
      const normalized = Math.max(0, Number(nextSeconds) || 0);

      initialized.current = true;
      warned.current = normalized <= warningAt;
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
