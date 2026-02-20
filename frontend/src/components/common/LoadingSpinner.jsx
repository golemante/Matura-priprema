import { cn } from "@/utils/utils";

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
  xl: "w-12 h-12 border-4",
};

export function Spinner({ size = "md", className }) {
  return (
    <div
      className={cn(
        "rounded-full border-warm-200 border-t-primary-600 animate-spin",
        sizes[size],
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
