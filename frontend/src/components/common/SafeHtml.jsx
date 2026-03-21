import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { sanitizeInline, containsHtml } from "@/utils/sanitize";
import { cn } from "@/utils/cn";

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
      return `<code class="katex-error">${formula}</code>`;
    }
  });
}

export function SafeHtml({
  html,
  className,
  inline = false,
  context = "inline",
}) {
  const sanitized = useMemo(() => {
    if (!html || typeof html !== "string") return "";

    if (!containsHtml(html) && !html.includes("$")) {
      return null;
    }

    const withKatex = replaceLatexWithHtml(html);

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
