import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  PassageSafeHtml,
  FootnoteSafeHtml,
  SafeHtml,
} from "@/components/common/SafeHtml";
import { cn } from "@/utils/cn";

const CONTENT_TYPES = {
  poem: {
    label: "Pjesma",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
    border: "border-purple-200",
    divider: "border-purple-200",
  },
  prose: {
    label: "Proza",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    divider: "border-amber-200",
  },
  drama: {
    label: "Dramski tekst",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
    divider: "border-blue-200",
  },
  article: {
    label: "Članak",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    divider: "border-emerald-200",
  },
  essay: {
    label: "Esej",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-amber-700",
    border: "border-orange-200",
    divider: "border-orange-200",
  },
  other: {
    label: "Tekst",
    bg: "bg-warm-50",
    badge: "bg-warm-100 text-warm-600",
    border: "border-warm-200",
    divider: "border-warm-200",
  },
};

function FootnoteList({ footnotes }) {
  if (!Array.isArray(footnotes) || footnotes.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-warm-200 space-y-1.5">
      {footnotes.map((fn, i) => (
        <p key={i} className="text-xs text-warm-500 leading-relaxed">
          <sup className="font-semibold mr-0.5">{fn.marker}</sup>
          <FootnoteSafeHtml html={fn.text} />
        </p>
      ))}
    </div>
  );
}

function MetaText({ html, className }) {
  if (!html) return null;
  return <SafeHtml html={html} inline className={className} />;
}

export function PassageDisplay({ passage, className }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!passage) return null;
  if (passage.contentType === "audio") return null;
  if (!passage.content) return null;

  const typeKey = passage.contentType ?? "other";
  const cfg = CONTENT_TYPES[typeKey] ?? CONTENT_TYPES.other;

  const hasTitle = !!passage.title;
  const hasAuthor = !!passage.author;
  const hasSource = !!passage.source;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border overflow-hidden bg-white",
        cfg.border,
        className,
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 px-4 py-2.5 border-b",
          cfg.bg,
          cfg.divider,
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <span
              className={cn(
                "inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                cfg.badge,
              )}
            >
              {cfg.label}
            </span>

            {hasTitle && (
              <MetaText
                html={passage.title}
                className="block text-xs font-bold text-warm-900 leading-snug"
              />
            )}

            {(hasAuthor || hasSource) && (
              <p className="text-[11px] text-warm-500 leading-snug">
                {hasAuthor && (
                  <MetaText html={passage.author} className="inline" />
                )}
                {hasAuthor && hasSource && (
                  <span className="mx-1 opacity-50">·</span>
                )}
                {hasSource && (
                  <MetaText html={passage.source} className="inline italic" />
                )}
              </p>
            )}
          </div>

          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Prikaži tekst" : "Sakrij tekst"}
            className={cn(
              "flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg",
              "text-[11px] font-medium text-warm-500",
              "hover:bg-black/5 transition-colors lg:hidden",
            )}
          >
            <span>{collapsed ? "Prikaži" : "Sakrij"}</span>
            <ChevronDown
              size={12}
              className={cn(
                "transition-transform duration-200",
                collapsed && "-rotate-90",
              )}
            />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          className={cn(
            "overflow-y-auto",
            "scrollbar-thin scrollbar-thumb-warm-300 scrollbar-track-transparent",
            "max-h-56",
            "lg:flex-1 lg:max-h-none",
          )}
        >
          <div className="px-4 py-3">
            <PassageSafeHtml
              html={passage.content}
              className={cn(
                "passage-content",
                typeKey === "poem" && "passage-poem",
                typeKey === "drama" && "passage-drama",
                typeKey === "article" && "passage-article",
              )}
            />
            <FootnoteList footnotes={passage.footnotes} />
          </div>
        </div>
      )}
    </div>
  );
}
