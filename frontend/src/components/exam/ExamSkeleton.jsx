// components/exam/ExamSkeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loader za vrijeme učitavanja ispita.
// Prikazuje se dok TanStack Query dohvaća pitanja iz Supabase.
// Animacija je pulse (Tailwind animate-pulse) — lagana, ne distraktivna.
// ─────────────────────────────────────────────────────────────────────────────
import { cn } from "@/utils/utils";

// ── Generički skeleton blok ───────────────────────────────────────────────────
function Bone({ className }) {
  return (
    <div className={cn("bg-warm-200 rounded-lg animate-pulse", className)} />
  );
}

// ── Skeleton jednog pitanja ───────────────────────────────────────────────────
function QuestionSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-6 mb-4">
      {/* Header: badge + bodovi */}
      <div className="flex justify-between items-center mb-5">
        <Bone className="h-6 w-24 rounded-full" />
        <Bone className="h-5 w-12" />
      </div>
      {/* Tekst pitanja — 3 retka */}
      <Bone className="h-4 w-full mb-2" />
      <Bone className="h-4 w-4/5 mb-2" />
      <Bone className="h-4 w-3/5" />
    </div>
  );
}

// ── Skeleton opcija ───────────────────────────────────────────────────────────
function OptionsSkeleton({ count = 4 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-warm-100 bg-white"
        >
          <Bone className="h-6 w-6 rounded-full flex-shrink-0" />
          <Bone className={cn("h-4 flex-1", i % 2 === 0 ? "w-2/3" : "w-1/2")} />
        </div>
      ))}
    </div>
  );
}

// ── Skeleton passage-a (lijeva kolona na desktopu) ────────────────────────────
function PassageSkeleton() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
      {/* Naslov passage */}
      <div className="flex items-center gap-2 mb-4">
        <Bone className="h-4 w-4 rounded" />
        <Bone className="h-4 w-32" />
      </div>
      {/* Redovi teksta */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Bone
          key={i}
          className={cn(
            "h-3 mb-2",
            i % 5 === 4 ? "w-2/3" : "w-full", // prirodni lom reda
          )}
        />
      ))}
    </div>
  );
}

// ── Top bar skeleton ──────────────────────────────────────────────────────────
function TopBarSkeleton() {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-warm-300 shadow-card">
      <div className="page-container">
        <div className="flex items-center justify-between h-14 gap-4">
          <div className="flex items-center gap-3">
            <Bone className="h-8 w-8 rounded-lg" />
            <Bone className="h-4 w-24 hidden sm:block" />
          </div>
          <Bone className="h-2 flex-1 max-w-xs rounded-full hidden md:block" />
          <div className="flex items-center gap-2">
            <Bone className="h-8 w-20 rounded-lg" />
            <Bone className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar navigator skeleton ────────────────────────────────────────────────
function NavSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 p-4">
      <Bone className="h-4 w-20 mb-3" />
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <Bone key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── Glavni ExamSkeleton ───────────────────────────────────────────────────────
export function ExamSkeleton({ showPassage = false }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col">
      <TopBarSkeleton />

      <div className="flex-1 page-container py-6 flex flex-col lg:flex-row gap-6">
        {/* Passage panel (samo ako ispit ima passages) */}
        {showPassage && (
          <div className="lg:w-2/5 xl:w-1/3">
            <PassageSkeleton />
          </div>
        )}

        {/* Pitanje + opcije */}
        <div className="flex-1 min-w-0">
          <QuestionSkeleton />
          <OptionsSkeleton count={4} />

          {/* Prev/Next dugmad */}
          <div className="flex justify-between mt-6">
            <Bone className="h-10 w-28 rounded-xl" />
            <Bone className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* Navigator sidebar */}
        <div className="lg:w-56 xl:w-64">
          <NavSkeleton />
        </div>
      </div>
    </div>
  );
}

// ── Mini skeleton za SubjectSelect popis ispita ───────────────────────────────
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
          <Bone className="h-9 w-24 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
