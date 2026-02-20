import { cn } from "@/utils/utils";

export function PageWrapper({ children, className }) {
  return (
    <main className={cn("flex-1 page-container py-8 md:py-10", className)}>
      {children}
    </main>
  );
}

export function PageHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-900 tracking-tight text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-warm-500 text-base">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
