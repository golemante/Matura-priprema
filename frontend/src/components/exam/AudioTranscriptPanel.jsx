// components/exam/AudioTranscriptPanel.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/utils/cn";

function TranscriptItem({ passage }) {
  const [open, setOpen] = useState(false);

  if (!passage?.transcript) return null;

  return (
    <div className="border border-warm-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-warm-50 hover:bg-warm-100 transition-colors text-left"
      >
        <FileText size={14} className="text-warm-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-warm-800 flex-1 truncate">
          {passage.title ?? "Audio snimka"}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-warm-400 transition-transform flex-shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-t border-warm-200 bg-white">
              <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-3">
                Transkript
              </p>
              <div className="text-sm text-warm-700 leading-relaxed whitespace-pre-wrap font-mono bg-warm-50 rounded-xl p-4 border border-warm-200">
                {passage.transcript}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AudioTranscriptPanel({ passages }) {
  const audioPassages = Object.values(passages ?? {}).filter(
    (p) => p?.transcript && p.contentType === "audio",
  );

  if (audioPassages.length === 0) return null;

  return (
    <div className="mt-5 mb-2">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={15} className="text-warm-400" />
        <h2 className="text-base font-bold text-warm-900">
          Transkripti audio snimki
        </h2>
      </div>
      <div className="space-y-2">
        {audioPassages.map((p) => (
          <TranscriptItem key={p.id} passage={p} />
        ))}
      </div>
    </div>
  );
}
