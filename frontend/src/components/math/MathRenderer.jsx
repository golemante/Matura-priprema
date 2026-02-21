// components/math/MathRenderer.jsx
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { cn } from "@/utils/utils";

export function MathRenderer({ math, block = false, className }) {
  if (block) {
    return (
      <div
        className={cn(
          "my-4 p-4 bg-warm-50 rounded-xl border border-warm-200 overflow-x-auto",
          className,
        )}
      >
        <BlockMath math={math} />
      </div>
    );
  }
  return <InlineMath math={math} />;
}

// Pametan text parser — prepoznaje LaTeX u tekstu
export function MathText({ text, className }) {
  // Parsira $...$ inline i $$...$$ block izraze
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <MathRenderer key={i} math={part.slice(2, -2)} block />;
        }
        if (part.startsWith("$") && part.endsWith("$")) {
          return <MathRenderer key={i} math={part.slice(1, -1)} />;
        }
        return part;
      })}
    </span>
  );
}
