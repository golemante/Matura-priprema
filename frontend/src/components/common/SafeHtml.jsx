import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/utils/cn";
import {
  sanitizeInline,
  sanitizePassage,
  sanitizeFootnote,
  containsHtml,
} from "@/utils/sanitize";

const LATEX_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

function replaceLatexWithHtml(text) {
  if (!text || !text.includes("$")) return text;

  return text.replace(LATEX_REGEX, (match) => {
    const isBlock = match.startsWith("$$") && match.endsWith("$$");
    const formula = isBlock ? match.slice(2, -2) : match.slice(1, -1);
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: isBlock,
        output: "html",
      });
    } catch {
      return `<code class="katex-error text-red-500 text-xs">${formula}</code>`;
    }
  });
}

export function SafeHtml({ html, className, inline = false }) {
  const sanitized = useMemo(() => {
    if (!html || typeof html !== "string") return "";

    if (!containsHtml(html) && !html.includes("$")) return null;

    const withKatex = replaceLatexWithHtml(html);
    return sanitizeInline(withKatex);
  }, [html]);

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
