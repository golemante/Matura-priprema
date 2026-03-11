// hooks/useBeforeUnload.js
import { useEffect } from "react";

export function useBeforeUnload(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);
}
