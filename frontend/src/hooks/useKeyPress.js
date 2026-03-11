// hooks/useKeyPress.js
import { useEffect, useRef } from "react";

const FORM_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

function isEditableTarget(target) {
  if (!target) return false;
  if (FORM_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  const role = target.getAttribute?.("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox")
    return true;
  if (target.closest?.("[data-no-shortcut]")) return true;
  return false;
}

/**
 * @param {Record<string, (e: KeyboardEvent) => void>} keyMap
 * @param {{ enabled?: boolean }} options
 */
export function useKeyPress(keyMap, { enabled = true } = {}) {
  const keyMapRef = useRef(keyMap);
  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      if (isEditableTarget(e.target)) return;
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
