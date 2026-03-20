import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Play, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Bone } from "@/components/common/Skeleton";

export function InProgressBanner({ attempt }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl"
    >
      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Clock size={15} className="text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900">Nedovršeni ispit</p>
        <p className="text-xs text-amber-700">
          Imaš ispit koji čeka na nastavak.
        </p>
      </div>
      <button
        onClick={() => navigate(`/ispit/${attempt.exam_id}`)}
        className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Play size={11} />
        Nastavi
      </button>
    </motion.div>
  );
}

export function EmptyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="text-center py-14 px-4">
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Zap size={28} className="text-primary-500" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-bold text-warm-900 mb-2">Kreni vježbati!</h2>
      <p className="text-sm text-warm-500 max-w-xs mx-auto mb-6 leading-relaxed">
        Ovdje ćeš vidjeti sve svoje rezultate, napredak po predmetima i
        statistike. Odaberi prvi ispit i počni.
      </p>
      <Button
        variant="primary"
        size="lg"
        leftIcon={Play}
        onClick={() => navigate("/predmeti")}
      >
        Odaberi predmet
      </Button>
    </div>
  );
}

export function DashboardError({ onRetry }) {
  return (
    <div className="flex flex-col items-center py-20 gap-4 text-center">
      <AlertCircle size={36} className="text-warm-300" strokeWidth={1.5} />
      <p className="text-warm-700 font-semibold">
        Greška pri učitavanju podataka
      </p>
      <p className="text-warm-400 text-sm">
        Provjeri konekciju i pokušaj ponovo.
      </p>
      <Button variant="secondary" leftIcon={RefreshCw} onClick={onRetry}>
        Pokušaj ponovo
      </Button>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-600 p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-2">
            <Bone className="h-3.5 w-24 bg-white/20" />
            <Bone className="h-6 w-40 bg-white/30" />
            <Bone className="h-3 w-28 bg-white/20" />
          </div>
          <Bone className="h-14 w-20 rounded-xl bg-white/20 flex-shrink-0" />
        </div>
        <div className="flex items-end gap-1.5 mt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Bone className="w-8 h-8 rounded-lg bg-white/20" />
              <Bone className="h-2 w-4 bg-white/15" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-warm-200 shadow-card p-4"
          >
            <Bone className="w-9 h-9 rounded-xl mb-3" />
            <Bone className="h-7 w-16 mb-1.5" />
            <Bone className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-warm-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-3.5 w-12" />
          </div>
          <Bone className="h-14 w-full rounded-xl mb-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5 border-b border-warm-100 last:border-0"
            >
              <Bone className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3.5 w-40" />
                <Bone className="h-3 w-20" />
              </div>
              <Bone className="h-6 w-14 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-5">
          <Bone className="h-3.5 w-28 mb-5" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Bone className="w-7 h-7 rounded-lg flex-shrink-0" />
                <Bone className="h-3.5 flex-1" />
                <Bone className="h-3.5 w-10 flex-shrink-0" />
              </div>
              <Bone className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
