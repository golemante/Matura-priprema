import { Modal, ModalBody } from "@/components/common/Modal";
import { Keyboard } from "lucide-react";
import { cn } from "@/utils/cn";

const SHORTCUTS = [
  {
    group: "Navigacija",
    items: [
      { keys: ["←"], label: "Prethodno pitanje" },
      { keys: ["→"], label: "Sljedeće pitanje" },
    ],
  },
  {
    group: "Odgovaranje",
    items: [
      { keys: ["A"], label: "Odaberi opciju A" },
      { keys: ["B"], label: "Odaberi opciju B" },
      { keys: ["C"], label: "Odaberi opciju C" },
      { keys: ["D"], label: "Odaberi opciju D" },
    ],
  },
  {
    group: "Ispit",
    items: [
      { keys: ["F"], label: "Označi / ukloni zastavicu" },
      { keys: ["P"], label: "Pauziraj ispit" },
      { keys: ["?"], label: "Prikaži ove prečace" },
    ],
  },
];

function KeyChip({ children }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[1.75rem] h-7 px-2 rounded-lg",
        "bg-warm-100 border border-warm-300 border-b-2",
        "text-xs font-bold text-warm-700 font-mono",
        "shadow-[0_1px_0_0_rgba(0,0,0,0.08)]",
      )}
    >
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Tipkovnički prečaci" size="sm">
      <ModalBody className="pb-5">
        <div className="flex items-center gap-2 mb-4 p-3 bg-primary-50 border border-primary-100 rounded-xl">
          <Keyboard size={15} className="text-primary-500 flex-shrink-0" />
          <p className="text-xs text-primary-700 leading-relaxed">
            Prečaci rade samo kad fokus nije u tekstualnom polju.
          </p>
        </div>

        <div className="space-y-4">
          {SHORTCUTS.map(({ group, items }) => (
            <div key={group}>
              <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wider mb-2">
                {group}
              </p>
              <div className="space-y-2">
                {items.map(({ keys, label }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-warm-700">{label}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {keys.map((k) => (
                        <KeyChip key={k}>{k}</KeyChip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ModalBody>
    </Modal>
  );
}
