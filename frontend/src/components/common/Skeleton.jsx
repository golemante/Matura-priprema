import { cn } from "@/utils/cn";

export function Bone({ className }) {
  return <div className={cn("skeleton-shimmer rounded-lg", className)} />;
}

export function Skeleton({ className }) {
  return <Bone className={className} />;
}

export function ExamCardSkeleton() {
  return (
    <div className="relative bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-warm-200 rounded-l-2xl" />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Bone className="h-5 w-16 rounded-md" />
          <Bone className="h-5 w-14 rounded-md" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Bone className="h-4 w-40 mb-2" />
            <div className="flex gap-3">
              <Bone className="h-3 w-16" />
              <Bone className="h-3 w-14" />
              <Bone className="h-3 w-12" />
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Bone className="h-5 w-10" />
            <Bone className="h-2.5 w-8" />
          </div>
        </div>

        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-warm-100">
          <Bone className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

export function ExamListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-8">
      {[0, 1].map((group) => (
        <div key={group}>
          <div className="flex items-center gap-3 mb-3">
            <Bone className="h-3.5 w-10" />
            <div className="h-px flex-1 bg-warm-200" />
            <Bone className="h-3 w-14" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from({ length: count }).map((_, i) => (
              <ExamCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
