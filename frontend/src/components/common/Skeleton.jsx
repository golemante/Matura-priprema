// components/common/Skeleton.jsx
import { cn } from "@/utils/utils";

export function Skeleton({ className }) {
  return (
    <div className={cn("animate-pulse bg-warm-200 rounded-lg", className)} />
  );
}

export function ExamCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-300 p-4 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-18" />
      </div>
    </div>
  );
}

export function SubjectCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-300 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
