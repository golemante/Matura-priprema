// hooks/useBeforeUnload.js
// Upozorenje korisniku koji pokušava napustiti stranicu za vrijeme aktivnog ispita.
// Standardni browser dialog — poruka se ne može customizirati (sigurnosno ograničenje).
import { useEffect } from "react";

export function useBeforeUnload(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      e.preventDefault();
      // Chrome zahtijeva returnValue
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);
}
