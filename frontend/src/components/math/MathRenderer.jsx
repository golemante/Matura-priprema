import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/utils/cn";

const LATEX_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

export function MathText({ text, className, inline = true }) {
  const html = useMemo(() => {
    if (!text || typeof text !== "string") return "";
    if (!text.includes("$")) return text;

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
  }, [text]);

  const Tag = inline ? "span" : "div";

  if (!text?.includes("$")) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={cn(className)} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export function MathBlock({ formula, className }) {
  const html = useMemo(() => {
    if (!formula) return "";
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: true,
        output: "html",
      });
    } catch {
      return `<code class="katex-error text-red-500 text-sm">${formula}</code>`;
    }
  }, [formula]);

  return (
    <div
      className={cn("overflow-x-auto py-2", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
