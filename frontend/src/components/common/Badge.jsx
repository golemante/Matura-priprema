import { cn } from "@/utils/utils";

const variants = {
  default: "bg-warm-100 text-warm-700 border-warm-200",
  primary: "bg-primary-100 text-primary-700 border-primary-200",
  success: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  error: "bg-red-100 text-red-700 border-red-200",
  outline: "bg-transparent text-warm-600 border-warm-300",
};

const sizes = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
  lg: "text-sm px-3 py-1 gap-1.5",
};

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  icon: Icon,
  children,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
      )}
      {Icon && <Icon size={12} className="flex-shrink-0" />}
      {children}
    </span>
  );
}
