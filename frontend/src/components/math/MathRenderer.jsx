import "katex/dist/katex.min.css";
import { memo, useMemo } from "react";
import { InlineMath, BlockMath } from "react-katex";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { cn } from "@/utils/cn";

const MATH_SPLIT_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

export const MathRenderer = memo(function MathRenderer({
  math,
  block = false,
  className,
}) {
  const cleanMath = math?.trim();
  if (!cleanMath) return null;

  return (
    <ErrorBoundary
      fallbackMessage={block ? "Greška u matematičkom bloku" : "!"}
    >
      {block ? (
        <div
          className={cn(
            "my-4 p-4 bg-warm-50 rounded-xl border border-warm-200 overflow-x-auto",
            className,
          )}
        >
          <BlockMath math={cleanMath} />
        </div>
      ) : (
        <span className={cn("inline-block mx-0.5", className)}>
          <InlineMath math={cleanMath} />
        </span>
      )}
    </ErrorBoundary>
  );
});

export const MathText = memo(function MathText({ text, className }) {
  if (!text || !text.includes("$")) {
    return <span className={className}>{text}</span>;
  }

  const parts = useMemo(() => text.split(MATH_SPLIT_REGEX), [text]);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <MathRenderer key={i} math={part.slice(2, -2)} block />;
        }
        if (part.startsWith("$") && part.endsWith("$")) {
          return <MathRenderer key={i} math={part.slice(1, -1)} />;
        }
        return part ? <span key={i}>{part}</span> : null;
      })}
    </span>
  );
});
