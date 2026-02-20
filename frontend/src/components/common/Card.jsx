import { cn } from "@/utils/utils";

export function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        "card-base",
        hover &&
          "transition-all duration-200 hover:shadow-card-md hover:-translate-y-0.5 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("p-5 pb-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-t border-warm-200 bg-warm-50 rounded-b-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
