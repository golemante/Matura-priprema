// hooks/useTabVisibility.js
import { useEffect, useRef, useCallback } from "react";
import { toast } from "@/store/toastStore";

/**
 * Prati izlaske iz taba za vrijeme aktivnog ispita.
 *
 * @param {{ enabled?: boolean, onSwitch?: (count: number) => void }} opts
 * @returns {React.MutableRefObject<{ switchCount: number, totalHiddenMs: number }>}
 */
export function useTabVisibility({ enabled = true, onSwitch } = {}) {
  const dataRef = useRef({
    switchCount: 0,
    totalHiddenMs: 0,
  });

  const hiddenSinceRef = useRef(null);

  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;

    if (document.hidden) {
      hiddenSinceRef.current = Date.now();
    } else {
      if (hiddenSinceRef.current !== null) {
        const hiddenMs = Date.now() - hiddenSinceRef.current;
        hiddenSinceRef.current = null;

        dataRef.current = {
          switchCount: dataRef.current.switchCount + 1,
          totalHiddenMs: dataRef.current.totalHiddenMs + hiddenMs,
        };

        onSwitch?.(dataRef.current.switchCount);

        toast.warning(
          `Izlazak iz ispita zabilježen (${dataRef.current.switchCount}×).`,
        );
      }
    }
  }, [enabled, onSwitch]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (hiddenSinceRef.current !== null) {
        const hiddenMs = Date.now() - hiddenSinceRef.current;
        dataRef.current = {
          ...dataRef.current,
          totalHiddenMs: dataRef.current.totalHiddenMs + hiddenMs,
        };
        hiddenSinceRef.current = null;
      }
    };
  }, [enabled, handleVisibilityChange]);

  return dataRef;
}
