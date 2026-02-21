// components/common/Input.jsx
import { cn } from "@/utils/utils";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState, forwardRef } from "react";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    type = "text",
    className,
    wrapperClassName,
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      {label && (
        <label className="block text-sm font-medium text-warm-700">
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400">
            <LeftIcon size={16} />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            "w-full px-4 py-2.5 text-sm",
            "border-2 border-warm-300 rounded-xl",
            "bg-white text-warm-900 placeholder:text-warm-400",
            "transition-all duration-150",
            "focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none",
            error &&
              "border-error-500 focus:border-error-500 focus:ring-red-100",
            LeftIcon && "pl-10",
            (RightIcon || isPassword) && "pr-10",
            "disabled:bg-warm-50 disabled:text-warm-400 disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-700"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {RightIcon && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400">
            <RightIcon size={16} />
          </div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-error-600">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-warm-500">{hint}</p>}
    </div>
  );
});
