import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { FloatingExamCard } from "./FloatingExamCard";
import { cn } from "@/utils/cn";

const TRUST_SIGNALS = ["132+ ispita", "8 predmeta", "Besplatno"];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-primary-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-amber-100 rounded-full opacity-25 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-primary-50 rounded-full opacity-40 blur-2xl" />
      </div>

      <div className="relative page-container py-14 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5"
            >
              <Sparkles size={11} />
              Pravi NCVVO ispiti · Odmah dostupno
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.08,
              }}
              className="text-4xl md:text-5xl lg:text-[52px] font-bold text-warm-900 tracking-tight leading-[1.12] text-balance mb-5"
            >
              Pripremi se za
              <br />
              <span className="relative inline-block">
                <span className="text-primary-600">državnu maturu</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.6,
                  }}
                  className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-primary-400 to-primary-600 rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.18,
              }}
              className="text-warm-500 text-lg leading-relaxed mb-8 max-w-md"
            >
              Riješi stvarne ispite iz prethodnih godina, odmah vidi analizu
              grešaka i prati napredak po predmetima.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.26,
              }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/predmeti")}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold text-sm",
                  "shadow-[0_4px_20px_rgba(45,84,232,0.28)] hover:shadow-[0_8px_30px_rgba(45,84,232,0.36)]",
                  "hover:bg-primary-700",
                )}
              >
                Počni vježbati
                <ArrowRight size={16} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() =>
                  document
                    .getElementById("predmeti")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className={cn(
                  "flex items-center gap-2 bg-white text-warm-700 px-6 py-3 rounded-xl font-semibold text-sm",
                  "border border-warm-200 hover:border-warm-300 hover:bg-warm-50",
                  "shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                )}
              >
                Pregledaj predmete
                <ChevronRight size={15} />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              {TRUST_SIGNALS.map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-sm text-warm-500"
                >
                  <CheckCircle2
                    size={14}
                    className="text-success-500 flex-shrink-0"
                  />
                  <span>{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="hidden lg:block">
            <FloatingExamCard />
          </div>
        </div>
      </div>
    </section>
  );
}
