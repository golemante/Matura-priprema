// components/common/Modal.jsx
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/utils/utils";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}) {
  const ref = useRef(null);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const fn = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, onClose]);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            ref={ref}
            className={cn(
              "bg-white rounded-2xl shadow-card-lg border border-warm-200 w-full",
              SIZES[size],
              className,
            )}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200">
                <h2 className="font-bold text-warm-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalBody({ children, className }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function ModalFooter({ children, className }) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-warm-200 flex gap-3 justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
