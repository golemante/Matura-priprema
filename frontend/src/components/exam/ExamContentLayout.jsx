import { useRef } from "react";
import { cn } from "@/utils/cn";
import { QuestionNav } from "./QuestionNav";

export function ExamContentLayout({
  header,
  children,
  navButtons,
  hasPassage = false,
  passage,
}) {
  const questionScrollRef = useRef(null);

  return (
    <div className="h-dvh flex flex-col bg-warm-50 overflow-hidden">
      <div className="flex-shrink-0">{header}</div>

      <div className="flex flex-1 min-h-0">
        <aside
          className={cn(
            "hidden md:flex flex-col flex-shrink-0",
            "w-52 border-r border-warm-100 bg-white",
          )}
        >
          <QuestionNav variant="desktop" />
        </aside>

        <div className="flex flex-1 min-h-0 flex-col">
          <div className="md:hidden">
            <QuestionNav variant="mobile" />
          </div>

          {hasPassage && passage ? (
            <PassageSplitLayout
              passage={passage}
              questionRef={questionScrollRef}
            >
              {children}
            </PassageSplitLayout>
          ) : (
            <div
              ref={questionScrollRef}
              className={cn(
                "flex-1 min-h-0 overflow-y-auto",
                "overscroll-contain",
                "scrollbar-thin scrollbar-thumb-warm-200 scrollbar-track-transparent",
              )}
            >
              <div className="w-full max-w-2xl mx-auto px-4 py-5 pb-2">
                {children}
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex-shrink-0",
              "border-t border-warm-100 bg-white",
              "h-[64px] flex items-center",
              "px-4 gap-3",
            )}
          >
            <div className="w-full max-w-2xl mx-auto flex items-center gap-3">
              {navButtons}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PassageSplitLayout({ passage, children, questionRef }) {
  return (
    <div className="flex flex-1 min-h-0">
      <div
        className={cn(
          "hidden lg:flex lg:w-1/2 lg:flex-shrink-0",
          "flex-col overflow-y-auto",
          "border-r border-warm-100 bg-amber-50/40",
          "scrollbar-thin scrollbar-thumb-warm-200 scrollbar-track-transparent",
        )}
      >
        <div className="px-5 py-5">{passage}</div>
      </div>

      <div
        ref={questionRef}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto",
          "overscroll-contain",
          "scrollbar-thin scrollbar-thumb-warm-200 scrollbar-track-transparent",
        )}
      >
        <div className="lg:hidden border-b border-warm-100 bg-amber-50/60">
          <MobilePassageAccordion>{passage}</MobilePassageAccordion>
        </div>

        <div className="w-full max-w-xl mx-auto px-4 py-5 pb-2">{children}</div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function MobilePassageAccordion({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-amber-600" />
          <span className="text-xs font-semibold text-amber-800">
            Polazni tekst
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-amber-600 transition-transform",
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
            <div className="px-4 pb-3 max-h-[40vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
