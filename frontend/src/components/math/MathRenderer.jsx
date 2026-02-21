// components/math/MathRenderer.jsx
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { cn } from "@/utils/utils";

/**
 * Komponenta koja renderira pojedinačni LaTeX izraz.
 * Koristi ErrorBoundary jer try-catch ne hvata greške tijekom renderiranja React komponenti.
 */
export function MathRenderer({ math, block = false, className }) {
  // Čistimo string od suvišnih razmaka i novih redova koji mogu zbuniti KaTeX
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
}

/**
 * Glavni parser koji prepoznaje $...$ i $$...$$ unutar običnog teksta.
 */
export function MathText({ text, className }) {
  // 1. Optimizacija: Ako nema znaka $, samo vrati običan tekst
  if (!text || !text.includes("$")) {
    return <span className={className}>{text}</span>;
  }

  // 2. Regex koji odvaja block ($$ ... $$) i inline ($ ... $) matematiku
  // Koristimo [\\s\\S] kako bi blokovi mogli biti u više redova
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        // Provjera za Block Math ($$ ... $$)
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2);
          return <MathRenderer key={i} math={formula} block />;
        }

        // Provjera za Inline Math ($ ... $)
        if (part.startsWith("$") && part.endsWith("$")) {
          const formula = part.slice(1, -1);
          return <MathRenderer key={i} math={formula} />;
        }

        // Običan tekst
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
