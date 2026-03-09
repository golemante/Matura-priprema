// hooks/useTabVisibility.js
// ─────────────────────────────────────────────────────────────────────────────
// NOVO — Tab Focus Tracking (Security & UX Reliability audit item)
//
// ZAŠTO:
//   Bilježenje izlazaka iz taba tijekom ispita je standardna anti-cheat mjera.
//   Korisnik koji otvori rješenja u drugom tabu ostavlja trag.
//   Podaci se šalju zajedno s finish_attempt kao metadata.
//
// ŠTO RADI:
//   • Sluša `document.visibilitychange` event
//   • Svaki izlazak (hidden) broji kao jedan "tab switch"
//   • Akumulira ukupno vrijeme provedeno van taba (ms)
//   • Na re-fokus (visible) pokazuje Toast upozorenje
//   • Vraća ref s podacima — NE useState, da ne uzrokuje re-render
//
// KORIŠTENJE:
//   const tabRef = useTabVisibility({ enabled: isExamActive });
//   // Na kraju ispita: tabRef.current → { switchCount, totalHiddenMs }
//
// NAPOMENA:
//   DB shema (v4) nema metadata kolumnu na attempts tablici.
//   Podaci se za sada čuvaju u lastResult examStore-a.
//   → Backend zadatak: dodati `tab_switches INT DEFAULT 0` i
//     `total_hidden_seconds INT DEFAULT 0` na attempts tablicu,
//     te proširiti finish_attempt() RPC da prima ove parametre.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useCallback } from "react";
import { toast } from "@/store/toastStore";

/**
 * Prati izlaske iz taba za vrijeme aktivnog ispita.
 *
 * @param {{ enabled?: boolean, onSwitch?: (count: number) => void }} opts
 * @returns {React.MutableRefObject<{ switchCount: number, totalHiddenMs: number }>}
 */
export function useTabVisibility({ enabled = true, onSwitch } = {}) {
  // Ref umjesto state — ne smije uzrokovati re-render svaki tick
  const dataRef = useRef({
    switchCount: 0,
    totalHiddenMs: 0,
  });

  // Timestamp kad je tab postao skriven
  const hiddenSinceRef = useRef(null);

  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;

    if (document.hidden) {
      // Tab je napušten
      hiddenSinceRef.current = Date.now();
    } else {
      // Tab je vraćen u fokus
      if (hiddenSinceRef.current !== null) {
        const hiddenMs = Date.now() - hiddenSinceRef.current;
        hiddenSinceRef.current = null;

        dataRef.current = {
          switchCount: dataRef.current.switchCount + 1,
          totalHiddenMs: dataRef.current.totalHiddenMs + hiddenMs,
        };

        onSwitch?.(dataRef.current.switchCount);

        // Upozorenje korisniku — vidljivo i nenametljivo
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

      // Ako je tab bio skriven u trenutku unmount-a, finaliziraj mjerenje
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
