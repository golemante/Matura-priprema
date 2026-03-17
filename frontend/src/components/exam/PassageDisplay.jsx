// components/exam/PassageDisplay.jsx
import { useState, useRef } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import {
  PassageSafeHtml,
  FootnoteSafeHtml,
} from "@/components/common/SafeHtml";
import { cn } from "@/utils/cn";

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
    badge: "bg-orange-100 text-amber-700",
    border: "border-orange-200",
  },
  audio: {
    label: "Ispit slušanja",
    bg: "bg-sky-50",
    badge: "bg-sky-100 text-sky-700",
    border: "border-sky-200",
  },
  other: {
    label: "Tekst",
    bg: "bg-warm-50",
    badge: "bg-warm-100 text-warm-600",
    border: "border-warm-200",
  },
};

function FootnoteList({ footnotes }) {
  if (!Array.isArray(footnotes) || footnotes.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-warm-200 space-y-1">
      {footnotes.map((fn, i) => (
        <p key={i} className="text-xs text-warm-500 leading-relaxed">
          <sup className="font-semibold mr-0.5">{fn.marker}</sup>
          <FootnoteSafeHtml html={fn.text} />
        </p>
      ))}
    </div>
  );
}

export function PassageDisplay({ passage }) {
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef(null);

  if (!passage) return null;

  const typeKey = passage.contentType ?? "other";
  const typeConfig = CONTENT_TYPES[typeKey] ?? CONTENT_TYPES.other;
  const isAudioOnly = typeKey === "audio";
  const hasText = !isAudioOnly && !!passage.content;

  if (isAudioOnly) return null;

  return (
    <div
      className={cn(
        "rounded-xl border flex flex-col",
        typeConfig.bg,
        typeConfig.border,
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-inherit">
        <BookOpen size={13} className="text-warm-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-warm-700 flex-1 truncate">
          {passage.title ?? (isAudioOnly ? "Ispit slušanja" : "Polazni tekst")}
        </span>
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0",
            typeConfig.badge,
          )}
        >
          {typeConfig.label}
        </span>

        {!isAudioOnly && hasText && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1 text-xs text-warm-500 hover:text-warm-700 transition-colors flex-shrink-0 ml-2 lg:hidden"
          >
            <span>{collapsed ? "Prikaži" : "Sakrij"}</span>
            <ChevronDown
              size={14}
              className={cn("transition-transform", collapsed && "-rotate-90")}
            />
          </button>
        )}
      </div>

      {!collapsed && (
        <div
          className={cn(
            "px-4 py-3 space-y-3",
            "max-h-64 overflow-y-auto",
            "lg:max-h-none lg:flex-1 lg:overflow-y-auto",
          )}
        >
          {hasText && (
            <div ref={contentRef}>
              <PassageSafeHtml
                html={passage.content}
                contentType={typeKey}
                className="passage-content"
              />
              <FootnoteList footnotes={passage.footnotes} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
