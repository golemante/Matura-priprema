// hooks/useKeyPress.js
import { useEffect } from "react";

export function useKeyPress(keyMap, { enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        action(e);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyMap, enabled]);
}
