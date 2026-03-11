// components/exam/PassageDisplay.jsx
import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import {
  PassageSafeHtml,
  FootnoteSafeHtml,
} from "@/components/common/SafeHtml";
import { cn } from "@/utils/utils";

// Labele i boje po tipu sadržaja
const CONTENT_TYPES = {
  poem: {
    label: "Pjesma",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
    border: "border-purple-200",
  },
  prose: {
    label: "Proza",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
  },
  drama: {
    label: "Dramski tekst",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
  },
  article: {
    label: "Članak",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
  },
  essay: {
    label: "Esej",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
  },
  other: {
    label: "Tekst",
    bg: "bg-warm-50",
    badge: "bg-warm-100 text-warm-600",
    border: "border-warm-200",
  },
};

// ── Fusnote ───────────────────────────────────────────────────────────────────
function FootnoteList({ footnotes }) {
  if (!footnotes?.length) return null;
  return (
    <div className="mt-4 pt-4 border-t border-warm-200/70">
      <p className="text-[10px] font-bold text-warm-500 uppercase tracking-widest mb-2.5">
        Bilješke
      </p>
      <ol className="space-y-2 list-none">
        {footnotes.map((fn, i) => (
          <li key={fn.marker ?? i} className="flex gap-2 text-xs text-warm-700">
            <sup className="font-bold text-warm-500 flex-shrink-0 mt-0.5 leading-none text-[10px]">
              {fn.marker}
            </sup>
            <FootnoteSafeHtml html={fn.text} className="leading-relaxed" />
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Glavni PassageDisplay ─────────────────────────────────────────────────────
export function PassageDisplay({ passage, className }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!passage) return null;

  // contentType dolazi camelCase iz examApi.js (passage_content_type → contentType)
  const typeKey = passage?.contentType ?? passage?.content_type ?? "other";
  const typeConfig = CONTENT_TYPES[typeKey] ?? CONTENT_TYPES.other;

  return (
    <div
      className={cn(
        // Base
        "bg-white rounded-2xl border border-warm-200 overflow-hidden",
        "shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
        // Sticky scroll na desktopu
        "lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:flex lg:flex-col",
        className,
      )}
    >
      {/* ── Sticky header ───────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-start justify-between gap-3 p-4 flex-shrink-0",
          "border-b border-warm-100",
          typeConfig.bg,
        )}
      >
        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md",
                typeConfig.badge,
              )}
            >
              {typeConfig.label}
            </span>
          </div>

          {/* Naslov */}
          {passage.title && (
            <p className="text-sm font-bold text-warm-900 leading-snug line-clamp-2">
              {passage.title}
            </p>
          )}

          {/* Autor + izvor */}
          {(passage.author || passage.source) && (
            <p className="text-xs text-warm-500 mt-0.5 line-clamp-1">
              {passage.author && (
                <span className="font-semibold text-warm-700 not-italic">
                  {passage.author}
                </span>
              )}
              {passage.author && passage.source && (
                <span className="mx-1 text-warm-300">·</span>
              )}
              {passage.source && (
                <PassageSafeHtml
                  html={passage.source}
                  className="inline italic"
                />
              )}
            </p>
          )}
        </div>

        {/* Mobile collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "lg:hidden flex-shrink-0 p-1.5 rounded-lg transition-colors",
            "text-warm-400 hover:text-warm-700 hover:bg-warm-100",
          )}
          aria-label={collapsed ? "Prikaži tekst" : "Sakrij tekst"}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            size={16}
            className={cn(
              "transition-transform duration-200",
              collapsed ? "rotate-180" : "",
            )}
          />
        </button>
      </div>

      {/* ── Sadržaj (scrollable) ─────────────────────────────────────── */}
      <div
        className={cn(
          "overflow-y-auto flex-1 p-4 lg:p-5",
          collapsed ? "hidden lg:block" : "block",
        )}
      >
        <PassageSafeHtml
          html={passage.content}
          className={cn(
            "passage-content",
            typeKey === "poem" && "passage-poem",
            typeKey === "drama" && "passage-drama",
          )}
        />
        <FootnoteList footnotes={passage.footnotes} />
      </div>
    </div>
  );
}
