import { cn } from "@/utils/cn";

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
  xl: "w-12 h-12 border-4",
};

const variants = {
  default: "border-warm-200 border-t-primary-600",
  white: "border-white/30 border-t-white",
  light: "border-primary-200 border-t-primary-600",
};

export function Spinner({ size = "md", variant = "default", className }) {
  return (
    <div
      className={cn(
        "rounded-full animate-spin flex-shrink-0",
        sizes[size],
        variants[variant],
        className,
      )}
      role="status"
      aria-label="Učitavanje..."
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-warm-500 font-medium">Učitavanje...</p>
      </div>
    </div>
  );
}

export function FullScreenSpinner({ message = "Učitavanje..." }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col items-center justify-center gap-4">
      <Spinner size="xl" variant="light" />
      <p className="text-warm-600 font-medium animate-pulse">{message}</p>
    </div>
  );
}
