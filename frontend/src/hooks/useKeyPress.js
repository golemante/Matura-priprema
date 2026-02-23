// hooks/useKeyPress.js
import { useEffect, useRef } from "react";

export function useKeyPress(keyMap, { enabled = true } = {}) {
  const keyMapRef = useRef(keyMap);
  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const action = keyMapRef.current[e.key];
      if (action) {
        e.preventDefault();
        action(e);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
