// components/common/SafeHtml.jsx
import { useMemo } from "react";
import { sanitizeInline, containsHtml } from "@/utils/sanitize";
import { cn } from "@/utils/utils";

// Lazy import KaTeX — samo kad je potreban
let katexLoaded = false;
let renderToString = null;

function getKatex() {
  if (katexLoaded) return renderToString;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const katex = require("katex");
    renderToString = katex.renderToString;
    katexLoaded = true;
  } catch {
    katexLoaded = true; // ne pokušavaj više puta
  }
  return renderToString;
}

// ── LaTeX parser + replacer ───────────────────────────────────────────────────
// Regex koji hvata $$...$$ (block) i $...$ (inline) LaTeX
const LATEX_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

function replaceLatexWithHtml(text) {
  const katex = getKatex();
  if (!katex || !text.includes("$")) return text;

  return text.replace(LATEX_REGEX, (match) => {
    const isBlock = match.startsWith("$$") && match.endsWith("$$");
    const formula = isBlock ? match.slice(2, -2) : match.slice(1, -1);
    try {
      return katex(formula.trim(), {
        throwOnError: false,
        displayMode: isBlock,
        output: "html",
      });
    } catch {
      return `<code class="katex-error">${formula}</code>`;
    }
  });
}

// ── Glavni SafeHtml ───────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {string} props.html        - Tekst koji može sadržavati HTML i/ili LaTeX
 * @param {string} [props.className] - Tailwind klase
 * @param {boolean} [props.inline]   - Renderira kao <span> umjesto <div>
 * @param {'inline'|'passage'|'footnote'} [props.context] - Sanitizacijski profil
 */
export function SafeHtml({
  html,
  className,
  inline = false,
  context = "inline",
}) {
  const sanitized = useMemo(() => {
    if (!html || typeof html !== "string") return "";

    // 1. Ako NEMA HTML-a i NEMA LaTeX-a → plain text (najbrže)
    if (!containsHtml(html) && !html.includes("$")) {
      return null; // signal za plain text render
    }

    // 2. Zamijeni LaTeX s KaTeX HTML-om
    const withKatex = replaceLatexWithHtml(html);

    // 3. Sanitiziraj rezultat
    return sanitizeInline(withKatex);
  }, [html, context]);

  const Tag = inline ? "span" : "div";

  if (sanitized === null) {
    return <Tag className={className}>{html}</Tag>;
  }

  return (
    <Tag
      className={cn("safe-html", className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

import { sanitizePassage } from "@/utils/sanitize";

export function PassageSafeHtml({ html, className }) {
  const sanitized = useMemo(() => {
    if (!html) return "";
    const withKatex = replaceLatexWithHtml(html);
    return sanitizePassage(withKatex);
  }, [html]);

  return (
    <div
      className={cn("passage-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

import { sanitizeFootnote } from "@/utils/sanitize";

export function FootnoteSafeHtml({ html, className }) {
  const sanitized = useMemo(() => {
    if (!html) return "";
    return sanitizeFootnote(html);
  }, [html]);

  return (
    <span
      className={cn("leading-relaxed", className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
