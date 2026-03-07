// components/exam/PassageDisplay.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI (v2):
//   • Koristi PassageSafeHtml (DOMPurify) umjesto raw dangerouslySetInnerHTML
//   • FootnoteSafeHtml za fusnote
//   • Ispravan pristup passage.contentType (camelCase iz examApi.js transformacije)
//   • Bolje mobile UX — sticky header s expand/collapse
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen, FileText } from "lucide-react";
import {
  PassageSafeHtml,
  FootnoteSafeHtml,
} from "@/components/common/SafeHtml";
import { cn } from "@/utils/utils";

const CONTENT_TYPE_LABELS = {
  poem: "Pjesma",
  prose: "Proza",
  drama: "Dramski tekst",
  article: "Članak",
  essay: "Esej",
  other: "Tekst",
};

// ── Fusnote ───────────────────────────────────────────────────────────────────
function FootnoteList({ footnotes }) {
  if (!footnotes?.length) return null;
  return (
    <div className="mt-4 pt-3 border-t border-amber-200">
      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2">
        Bilješke
      </p>
      <ol className="space-y-1.5 list-none">
        {footnotes.map((fn) => (
          <li key={fn.marker} className="flex gap-1.5 text-xs text-amber-800">
            <sup className="font-bold text-amber-600 flex-shrink-0 mt-0.5 leading-none">
              {fn.marker}
            </sup>
            <FootnoteSafeHtml html={fn.text} className="leading-relaxed" />
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Izvor (source info) ───────────────────────────────────────────────────────
function SourceLine({ author, source }) {
  if (!author && !source) return null;
  return (
    <p className="mt-3 text-xs text-amber-600 italic leading-snug">
      {author && <span className="font-semibold not-italic">{author}</span>}
      {author && source && ", "}
      {source && <PassageSafeHtml html={source} className="inline" />}
    </p>
  );
}

// ── Glavni PassageDisplay ─────────────────────────────────────────────────────
export function PassageDisplay({ passage, className }) {
  const [collapsed, setCollapsed] = useState(false);

  // NAPOMENA: passage.contentType dolazi camelCase iz examApi.js transformacije
  // (passage_content_type → contentType)
  const typeLabel =
    CONTENT_TYPE_LABELS[passage?.contentType ?? passage?.content_type] ??
    "Tekst";

  if (!passage) return null;

  return (
    <div
      className={cn(
        "bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden",
        className,
      )}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-100/70 sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={14} className="text-amber-700 flex-shrink-0" />
          <div className="min-w-0">
            {passage.title && (
              <p className="text-sm font-bold text-amber-900 leading-tight truncate">
                {passage.title}
              </p>
            )}
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                {typeLabel}
              </span>
              {passage.author && (
                <span className="text-xs text-amber-700 font-medium truncate">
                  {passage.author}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Collapse toggle — samo na mobilnom */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="lg:hidden ml-2 p-1.5 rounded-lg text-amber-600 hover:bg-amber-200 transition-colors flex-shrink-0"
          aria-label={
            collapsed ? "Prikaži polazni tekst" : "Sakrij polazni tekst"
          }
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* ── Sadržaj ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "max-h-0 overflow-hidden" : "max-h-none",
        )}
      >
        <div className="px-4 pt-4 pb-1">
          {/* PassageSafeHtml koristi DOMPurify + renderira HTML elemente */}
          <PassageSafeHtml
            html={passage.content ?? passage.content_html ?? ""}
            className={cn(
              // Desktop: scroll unutar fiksne visine
              "lg:max-h-[480px] lg:overflow-y-auto lg:pr-1",
            )}
          />
        </div>

        <div className="px-4 pb-4">
          {/* Izvor */}
          <SourceLine
            author={null} // author je već u headeru
            source={passage.source}
          />
          {/* Fusnote */}
          <FootnoteList footnotes={passage.footnotes} />
        </div>
      </div>
    </div>
  );
}

// ── Mini badge za sidebar ─────────────────────────────────────────────────────
export function PassagePreviewBadge({ passage, onClick }) {
  if (!passage) return null;
  const typeLabel =
    CONTENT_TYPE_LABELS[passage?.contentType ?? passage?.content_type] ??
    "Tekst";
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors"
    >
      <FileText size={11} />
      <span className="font-medium">{passage.title ?? typeLabel}</span>
    </button>
  );
}
