import { Filter, XCircle, Minus, Flag } from "lucide-react";
import { cn } from "@/utils/cn";

const FILTERS = [
  {
    id: "all",
    label: "Sva pitanja",
    short: "Sva",
    Icon: Filter,
    activeCls: "bg-primary-600 text-white border-primary-600 shadow-sm",
    countCls: "bg-white/25 text-white",
    alwaysShow: true,
  },
  {
    id: "wrong",
    label: "Netočna",
    short: "Netočna",
    Icon: XCircle,
    activeCls: "bg-red-500 text-white border-red-500 shadow-sm",
    countCls: "bg-white/25 text-white",
    alwaysShow: false,
  },
  {
    id: "skipped",
    label: "Preskočena",
    short: "Skip",
    Icon: Minus,
    activeCls: "bg-warm-700 text-white border-warm-700 shadow-sm",
    countCls: "bg-white/25 text-white",
    alwaysShow: false,
  },
  {
    id: "flagged",
    label: "Označena",
    short: "Označ.",
    Icon: Flag,
    activeCls: "bg-amber-500 text-white border-amber-500 shadow-sm",
    countCls: "bg-white/25 text-white",
    alwaysShow: false,
  },
];

export function FilterTabs({
  active,
  onChange,
  counts = {},
  hasFlagged = true,
}) {
  return (
    <div
      className="flex items-center gap-1 flex-wrap"
      role="tablist"
      aria-label="Filteri odgovora"
    >
      {FILTERS.map(
        ({ id, label, short, Icon, activeCls, countCls, alwaysShow }) => {
          const isActive = active === id;
          const count = counts[id] ?? 0;

          if (!alwaysShow && count === 0) return null;
          if (id === "flagged" && !hasFlagged) return null;

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
                  ? activeCls
                  : "bg-white text-warm-600 border-warm-200 hover:border-warm-300 hover:bg-warm-50 active:bg-warm-100",
              )}
            >
              <Icon size={10} className="flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>

              {count > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none",
                    isActive ? countCls : "bg-warm-100 text-warm-600",
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
