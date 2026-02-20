import { cn } from "@/utils/utils";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm",
  secondary:
    "bg-warm-100 text-warm-800 hover:bg-warm-200 active:bg-warm-300 border border-warm-300",
  ghost: "text-warm-700 hover:bg-warm-100 active:bg-warm-200",
  danger:
    "bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-sm",
  outline:
    "border border-primary-300 text-primary-700 hover:bg-primary-50 active:bg-primary-100",
};

const sizes = {
  sm: "h-8  px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
  xl: "h-12 px-6 text-base gap-2.5",
  icon: "h-9 w-9 p-0",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  children,
  className,
  ...props
}) {
  return (
    <button
      className={cn("btn-base", variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === "sm" ? 14 : 16} />
      ) : LeftIcon ? (
        <LeftIcon size={size === "sm" ? 14 : 16} />
      ) : null}
      {children}
      {!loading && RightIcon && <RightIcon size={size === "sm" ? 14 : 16} />}
    </button>
  );
}
