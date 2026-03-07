// components/exam/PassageDisplay.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Prikazuje polazni tekst (passage) uz pitanje.
//   • Renderira HTML sadržaj (p, em, strong, sup, br, h3, span...)
//   • Renderira fusnote iz JSONB niza [{ marker: "1", text: "..." }]
//   • Na mobilnim uređajima: collapsible (expand/collapse)
//   • Na desktopu: statičan, scroll unutar fiksne visine
//   • SIGURNOST: content je iz baze kojom upravlja admin — DOMPurify nije
//     obavezan ali preporučljiv ako content dolazi iz vanjskih izvora
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen, FileText } from "lucide-react";
import { cn } from "@/utils/utils";

// Mapa labela za content_type
const CONTENT_TYPE_LABELS = {
  poem: "Pjesma",
  prose: "Proza",
  drama: "Drama",
  article: "Članak",
  essay: "Esej",
  other: "Tekst",
};

// ── Fusnote ───────────────────────────────────────────────────────────────────
function FootnoteList({ footnotes }) {
  if (!footnotes?.length) return null;

  return (
    <div className="mt-4 pt-3 border-t border-warm-200">
      <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-2">
        Bilješke
      </p>
      <ol className="space-y-1">
        {footnotes.map((fn) => (
          <li key={fn.marker} className="flex gap-2 text-xs text-warm-600">
            <sup className="font-bold text-warm-500 flex-shrink-0 mt-0.5">
              {fn.marker}
            </sup>
            <span
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: fn.text }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Glavni PassageDisplay ─────────────────────────────────────────────────────
export function PassageDisplay({ passage, className }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  // Na mobu: provjeri overflow za "prikaži više" dugme
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollHeight > el.clientHeight + 4);
  }, [passage?.content]);

  if (!passage) return null;

  const typeLabel = CONTENT_TYPE_LABELS[passage.content_type] ?? "Tekst";

  return (
    <div
      className={cn(
        "bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-100/60">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={15} className="text-amber-700 flex-shrink-0" />
          <div className="min-w-0">
            {passage.title && (
              <p className="text-sm font-bold text-amber-900 truncate">
                {passage.title}
              </p>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded font-medium">
                {typeLabel}
              </span>
              {passage.author && (
                <span className="text-xs text-amber-600 truncate">
                  {passage.author}
                </span>
              )}
              {passage.source && (
                <span className="text-xs text-amber-500 italic truncate hidden sm:block">
                  {passage.source}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Collapse dugme — samo na mobilnim */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="lg:hidden ml-2 p-1.5 rounded-lg text-amber-600 hover:bg-amber-200 transition-colors flex-shrink-0"
          aria-label={collapsed ? "Prikaži tekst" : "Sakrij tekst"}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          collapsed ? "max-h-0" : "max-h-none",
        )}
      >
        <div className="px-4 pt-4 pb-1">
          {/* Tekst — renderira HTML iz baze */}
          <div
            ref={contentRef}
            className={cn(
              "passage-content text-sm leading-relaxed text-warm-800",
              // Desktop: scroll unutar zadane visine
              "lg:max-h-[420px] lg:overflow-y-auto lg:pr-2",
              // Custom scrollbar
              "lg:scrollbar-thin lg:scrollbar-thumb-amber-300 lg:scrollbar-track-transparent",
            )}
            dangerouslySetInnerHTML={{ __html: passage.content }}
          />

          {/* "Prikaži više" na mobilnim ako tekst prelazi */}
          {isOverflowing && !collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="lg:hidden flex items-center gap-1 mt-2 text-xs text-amber-600 font-medium"
            >
              <ChevronUp size={12} />
              Sakrij
            </button>
          )}
        </div>

        {/* Fusnote */}
        <div className="px-4 pb-4">
          <FootnoteList footnotes={passage.footnotes} />
        </div>
      </div>
    </div>
  );
}

// ── Inline preview (mini verzija za sidebar) ──────────────────────────────────
export function PassagePreviewBadge({ passage, onClick }) {
  if (!passage) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors"
    >
      <FileText size={11} />
      <span className="font-medium">
        {passage.title ?? CONTENT_TYPE_LABELS[passage.content_type] ?? "Tekst"}
      </span>
    </button>
  );
}
