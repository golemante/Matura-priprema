// components/results/FilterTabs.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Filter tabovi na stranici rezultata: Sva | Netočna | Preskočena | Označena
// ─────────────────────────────────────────────────────────────────────────────
import { Filter, XCircle, Minus, Flag } from "lucide-react";
import { cn } from "@/utils/utils";

const FILTERS = [
  { id: "all", label: "Sva", Icon: Filter },
  { id: "wrong", label: "Netočna", Icon: XCircle },
  { id: "skipped", label: "Preskočena", Icon: Minus },
  { id: "flagged", label: "Označena", Icon: Flag },
];

/**
 * @param {object}   props
 * @param {string}   props.active    — trenutno aktivni filter id
 * @param {Function} props.onChange  — (filterId: string) => void
 * @param {object}   [props.counts]  — { all, wrong, skipped, flagged }
 */
export function FilterTabs({ active, onChange, counts = {} }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {FILTERS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        const count = counts[id];

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold",
              "transition-all duration-150 select-none",
              isActive
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-white text-warm-600 border border-warm-200 hover:border-warm-300 hover:bg-warm-50",
            )}
          >
            {Icon && <Icon size={11} />}
            {label}
            {count != null && count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none",
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-warm-100 text-warm-600",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
