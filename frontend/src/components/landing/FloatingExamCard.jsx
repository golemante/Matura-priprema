import { motion } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";
import { cn } from "@/utils/cn";

export function FloatingExamCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute inset-0 -m-6 bg-gradient-to-br from-primary-200 via-primary-100 to-transparent rounded-3xl blur-2xl opacity-60 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        style={{ perspective: "1000px" }}
        className="relative bg-white rounded-2xl border border-warm-200 shadow-[0_8px_40px_-8px_rgba(45,84,232,0.18)] overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-primary-700" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-[11px] font-bold text-primary-600 uppercase tracking-widest">
                  Matematika · B razina
                </span>
              </div>
              <p className="text-xs text-warm-500">
                Ljetni rok 2024 · 40 pitanja
              </p>
            </div>
            <div className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-primary-100">
              90 min
            </div>
          </div>

          <div className="bg-warm-50 rounded-xl p-4 mb-3 border border-warm-200">
            <p className="text-xs font-semibold text-warm-700 mb-3 leading-relaxed">
              1. Kolika je vrijednost izraza{" "}
              <span className="font-mono text-primary-600">3x² + 2x - 1</span>{" "}
              za <span className="font-mono text-primary-600">x = 2</span>?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "A", val: "11", correct: false },
                { id: "B", val: "15", correct: true },
                { id: "C", val: "13", correct: false },
                { id: "D", val: "9", correct: false },
              ].map(({ id, val, correct }) => (
                <div
                  key={id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium",
                    correct
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-white border-warm-200 text-warm-700",
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                      correct
                        ? "bg-white/20 text-white"
                        : "bg-warm-100 text-warm-500",
                    )}
                  >
                    {id}
                  </span>
                  {val}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-warm-500 mb-1.5">
            <span className="font-medium">12 / 40 pitanja</span>
            <span className="text-primary-600 font-bold">30%</span>
          </div>
          <div className="w-full h-1.5 bg-warm-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "30%" }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 1 }}
        className="absolute -bottom-4 -right-4 bg-white rounded-xl border border-warm-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-3.5 py-2.5 flex items-center gap-2.5"
      >
        <div className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center">
          <TrendingUp size={16} className="text-success-600" />
        </div>
        <div>
          <p className="text-[10px] text-warm-400 font-medium leading-none mb-0.5">
            Zadnji rezultat
          </p>
          <p className="text-sm font-bold text-warm-900 leading-none">87% ✓</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 1.15 }}
        className="absolute -top-3 -left-4 bg-white rounded-xl border border-warm-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-3 py-2 flex items-center gap-2"
      >
        <Clock size={13} className="text-amber-500" />
        <span className="text-xs font-bold text-warm-800 font-mono">68:23</span>
      </motion.div>
    </div>
  );
}
