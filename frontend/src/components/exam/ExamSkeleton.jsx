import { cn } from "@/utils/cn";
import { Bone } from "@/components/common/Skeleton";

function TopBarSkeleton() {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-warm-200 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
      <div className="page-container">
        <div className="flex items-center h-14 gap-3">
          <Bone className="h-8 w-8 rounded-lg flex-shrink-0" />
          <Bone className="h-4 w-48 hidden sm:block" />
          <div className="flex-1 hidden sm:block" />
          <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-[200px]">
            <Bone className="h-1.5 flex-1 rounded-full" />
            <Bone className="h-3.5 w-10" />
          </div>
          <div className="flex-1 sm:hidden" />
          <Bone className="h-8 w-24 rounded-lg flex-shrink-0" />
          <Bone className="h-8 w-20 rounded-lg flex-shrink-0" />
          <Bone className="h-8 w-24 rounded-lg flex-shrink-0 hidden lg:block" />
          <Bone className="h-8 w-8 rounded-lg flex-shrink-0 lg:hidden" />
        </div>
      </div>
    </div>
  );
}

function QuestionSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 mb-3">
      <div className="flex items-start justify-between mb-4">
        <Bone className="h-6 w-28 rounded-full" />
        <div className="flex items-center gap-1.5">
          <Bone className="h-4 w-10" />
          <Bone className="h-6 w-6 rounded-lg" />
        </div>
      </div>
      <Bone className="h-[15px] w-full mb-2.5" />
      <Bone className="h-[15px] w-5/6 mb-2.5" />
      <Bone className="h-[15px] w-3/5" />
    </div>
  );
}

function OptionsSkeleton({ count = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-warm-100 bg-white"
        >
          <Bone className="h-8 w-8 rounded-full flex-shrink-0" />
          <Bone
            className={cn(
              "h-4",
              i === 0
                ? "w-3/5"
                : i === 1
                  ? "w-2/3"
                  : i === 2
                    ? "w-1/2"
                    : "w-4/5",
            )}
          />
        </div>
      ))}
    </div>
  );
}

function PassageSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-4 border-b border-warm-100 bg-amber-50/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Bone className="h-5 w-14 rounded-full mb-2" />
            <Bone className="h-4 w-36 mb-1.5" />
            <Bone className="h-3 w-24" />
          </div>
          <Bone className="h-6 w-6 rounded-lg flex-shrink-0 lg:hidden" />
        </div>
      </div>
      <div className="p-5">
        {Array.from({ length: 16 }).map((_, i) => (
          <Bone
            key={i}
            className={cn(
              "h-3 mb-2.5",
              i % 6 === 5 ? "w-2/5" : i % 4 === 3 ? "w-4/5" : "w-full",
            )}
          />
        ))}
        <div className="mt-4 pt-4 border-t border-warm-100">
          <Bone className="h-3 w-16 mb-2.5" />
          <Bone className="h-3 w-3/4 mb-1.5" />
          <Bone className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

function NavSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 sticky top-20 flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <Bone className="h-3.5 w-20" />
        <Bone className="h-3.5 w-8" />
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <Bone className="h-3 w-16" />
          <Bone className="h-3 w-8" />
        </div>
        <Bone className="h-1.5 w-full rounded-full" />
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 25 }).map((_, i) => (
          <Bone key={i} className="aspect-square rounded-lg" />
        ))}
      </div>

      <div className="pt-3 border-t border-warm-100">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Bone className="w-3 h-3 rounded flex-shrink-0" />
              <Bone className="h-2.5 w-14" />
            </div>
          ))}
        </div>
      </div>

      <Bone className="h-10 w-full rounded-xl" />
    </div>
  );
}

function BottomNavSkeleton() {
  return (
    <div className="flex items-center justify-between mt-4">
      <Bone className="h-10 w-28 rounded-xl" />
      <Bone className="h-10 w-28 rounded-xl" />
    </div>
  );
}

export function ExamSkeleton({ showPassage = false }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col">
      <TopBarSkeleton />

      <div className="flex-1 page-container py-5 pb-20 lg:pb-5 flex flex-col lg:flex-row gap-5">
        {showPassage && (
          <div className="lg:w-[42%] xl:w-[38%] flex-shrink-0">
            <PassageSkeleton />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <QuestionSkeleton />
          <OptionsSkeleton count={4} />
          <BottomNavSkeleton />
        </div>

        <div className="hidden lg:block lg:w-56 xl:w-64 flex-shrink-0">
          <NavSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ExamListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-warm-200 p-4 flex items-center justify-between"
        >
          <div className="flex-1">
            <Bone className="h-4 w-48 mb-2" />
            <Bone className="h-3 w-32" />
          </div>
          <Bone className="h-9 w-24 rounded-xl ml-4 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
