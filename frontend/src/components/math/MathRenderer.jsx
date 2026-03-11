// components/math/MathRenderer.jsx
import "katex/dist/katex.min.css";
import { memo, useMemo } from "react";
import { InlineMath, BlockMath } from "react-katex";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { cn } from "@/utils/utils";

const MATH_SPLIT_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

/**
 * Renderira pojedinačni LaTeX izraz (inline ili block).
 * Memoiziran jer su `math` i `block` gotovo uvijek isti između rendera.
 */
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

/**
 * Glavni parser koji prepoznaje $...$ i $$...$$ unutar običnog teksta.
 *
 * @param {object} props
 * @param {string} props.text      - Tekst koji može sadržavati LaTeX
 * @param {string} [props.className]
 */
export const MathText = memo(function MathText({ text, className }) {
  // Brza provjera: nema "$" → samo plain text, nema parsiranja
  if (!text || !text.includes("$")) {
    return <span className={className}>{text}</span>;
  }

  // useMemo: `parts` se re-računa SAMO kad se `text` promijeni.
  // Bez ovoga: regex split radi na svakom parent re-renderu.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const parts = useMemo(() => text.split(MATH_SPLIT_REGEX), [text]);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        // Block math: $$...$$
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <MathRenderer key={i} math={part.slice(2, -2)} block />;
        }
        // Inline math: $...$
        if (part.startsWith("$") && part.endsWith("$")) {
          return <MathRenderer key={i} math={part.slice(1, -1)} />;
        }
        // Obični tekst
        return part ? <span key={i}>{part}</span> : null;
      })}
    </span>
  );
});
