import { Filter, XCircle, Minus, Flag } from "lucide-react";
import { cn } from "@/utils/cn";

const FILTERS = [
  {
    id: "all",
    label: "Sva",
    labelShort: "Sva",
    Icon: Filter,
    activeColor: "bg-primary-600 text-white border-primary-600",
    countColor: "bg-white/25 text-white",
  },
  {
    id: "wrong",
    label: "Netočna",
    labelShort: "Netočna",
    Icon: XCircle,
    activeColor: "bg-red-500 text-white border-red-500",
    countColor: "bg-white/25 text-white",
  },
  {
    id: "skipped",
    label: "Preskočena",
    labelShort: "Skip",
    Icon: Minus,
    activeColor: "bg-warm-700 text-white border-warm-700",
    countColor: "bg-white/25 text-white",
  },
  {
    id: "flagged",
    label: "Označena",
    labelShort: "Označ.",
    Icon: Flag,
    activeColor: "bg-amber-500 text-white border-amber-500",
    countColor: "bg-white/25 text-white",
  },
];

export function FilterTabs({ active, onChange, counts = {} }) {
  return (
    <div
      className="flex items-center gap-1 flex-wrap"
      role="tablist"
      aria-label="Filteri odgovora"
    >
      {FILTERS.map(
        ({ id, label, labelShort, Icon, activeColor, countColor }) => {
          const isActive = active === id;
          const count = counts[id];
          if (id !== "all" && count === 0) return null;

          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold",
                "border transition-all duration-150 select-none",
                isActive
                  ? cn(activeColor, "shadow-sm")
                  : "bg-white text-warm-600 border-warm-200 hover:border-warm-300 hover:bg-warm-50",
              )}
            >
              <Icon size={10} className="flex-shrink-0" />
              <span className="hidden xs:inline">{label}</span>
              <span className="xs:hidden">{labelShort}</span>

              {count != null && count > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none",
                    isActive ? countColor : "bg-warm-100 text-warm-600",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        },
      )}
    </div>
  );
}
