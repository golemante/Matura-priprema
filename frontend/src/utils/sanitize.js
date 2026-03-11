// utils/sanitize.js
let DOMPurify = null;

// Lazy init — DOMPurify treba window koji nije dostupan u SSR
function getDOMPurify() {
  if (DOMPurify) return DOMPurify;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    DOMPurify = require("dompurify");
    // Named export vs default export
    if (DOMPurify.default) DOMPurify = DOMPurify.default;
  } catch {
    console.warn(
      "[sanitize] dompurify nije instaliran. Pokrenite: npm install dompurify",
    );
    DOMPurify = null;
  }
  return DOMPurify;
}

// ── Konfiguracije po kontekstu ────────────────────────────────────────────────

const CONFIG_INLINE = {
  ALLOWED_TAGS: ["em", "strong", "u", "s", "sup", "sub", "span", "br", "code"],
  ALLOWED_ATTR: ["class"],
  KEEP_CONTENT: true,
};

const CONFIG_PASSAGE = {
  ALLOWED_TAGS: [
    "em",
    "strong",
    "u",
    "s",
    "sup",
    "sub",
    "span",
    "br",
    "code",
    "p",
    "h2",
    "h3",
    "h4",
    "ol",
    "ul",
    "li",
    "blockquote",
    "hr",
    "div",
    "section",
  ],
  ALLOWED_ATTR: ["class", "id"],
  KEEP_CONTENT: true,
};

const CONFIG_FOOTNOTE = {
  ALLOWED_TAGS: ["em", "strong", "sup", "sub", "span", "br"],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

// ── Javni API ─────────────────────────────────────────────────────────────────

/**
 * Sanitizira inline HTML (tekst pitanja, tekst opcije, inline_text).
 * Dopušta samo formatacijske tagove: em, strong, u, sup, sub, span, br.
 */
export function sanitizeInline(html) {
  if (!html || typeof html !== "string") return "";
  const purify = getDOMPurify();
  if (!purify) return html; // fallback bez sanitizacije (nije idealno)
  return purify.sanitize(html, CONFIG_INLINE);
}

/**
 * Sanitizira HTML polaznog teksta (passage.content).
 * Dopušta paragraphe, naslove, liste, blockquote uz sve inline tagove.
 */
export function sanitizePassage(html) {
  if (!html || typeof html !== "string") return "";
  const purify = getDOMPurify();
  if (!purify) return html;
  return purify.sanitize(html, CONFIG_PASSAGE);
}

/**
 * Sanitizira tekst fusnote.
 */
export function sanitizeFootnote(html) {
  if (!html || typeof html !== "string") return "";
  const purify = getDOMPurify();
  if (!purify) return html;
  return purify.sanitize(html, CONFIG_FOOTNOTE);
}

/**
 * Provjera: sadrži li string HTML tagove koji zahtijevaju renderiranje.
 * Koristi se za optimizaciju — ako nema HTML-a, koristimo plain text.
 */
export function containsHtml(str) {
  return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
}
