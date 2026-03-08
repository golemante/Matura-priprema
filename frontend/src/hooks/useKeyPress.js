// hooks/useKeyPress.js
// ─────────────────────────────────────────────────────────────────────────────
// FIX P2-8: Kompletna zaštita od shortcuta na svim interaktivnim elementima.
//
// Prethodni kod: provjeravao samo INPUT, TEXTAREA, SELECT tagName-ove.
// PROBLEM: Propuštao je:
//   • <div contenteditable="true"> (rich text editori)
//   • <div role="textbox"> (ARIA editable divovi)
//   • Elementi unutar [data-no-shortcut] containera
//
// NOVO: isEditableTarget() hvata sve gore navedene slučajeve.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";

const FORM_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

function isEditableTarget(target) {
  if (!target) return false;
  // Standardni form elementi
  if (FORM_TAGS.has(target.tagName)) return true;
  // contenteditable (rich text, divovi)
  if (target.isContentEditable) return true;
  // ARIA editable
  const role = target.getAttribute?.("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox")
    return true;
  // Escape hatch za specifične containere — dodaj [data-no-shortcut] na wrapper
  if (target.closest?.("[data-no-shortcut]")) return true;
  return false;
}

/**
 * @param {Record<string, (e: KeyboardEvent) => void>} keyMap
 * @param {{ enabled?: boolean }} options
 */
export function useKeyPress(keyMap, { enabled = true } = {}) {
  // keyMapRef sprječava stale closure u event listeneru
  const keyMapRef = useRef(keyMap);
  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      // Ne okidaj shortcute dok korisnik tipka u forme/editore
      if (isEditableTarget(e.target)) return;
      // Ne okidaj uz modifier tipke (browser/OS prečaci)
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
