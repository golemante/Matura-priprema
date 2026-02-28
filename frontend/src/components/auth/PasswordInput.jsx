// features/auth/components/PasswordInput.jsx
import { useState, forwardRef } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/utils/utils";

export const PasswordInput = forwardRef(function PasswordInput(
  { label, error, placeholder = "••••••••", className, ...props },
  ref,
) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-warm-700">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none">
          <Lock size={15} />
        </div>
        <input
          ref={ref}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className={cn(
            "w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border bg-white",
            "text-warm-900 placeholder:text-warm-400",
            "transition-all duration-150 outline-none",
            error
              ? "border-error-400 focus:border-error-500 focus:ring-2 focus:ring-error-100"
              : "border-warm-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 transition-colors p-0.5 rounded"
          aria-label={show ? "Sakrij lozinku" : "Prikaži lozinku"}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-error-600 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-error-500 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});
