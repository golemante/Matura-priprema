import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpenCheck, GraduationCap, Star } from "lucide-react";

const STATS = [
  { value: "132+", label: "Pravih ispita", icon: BookOpenCheck },
  { value: "8", label: "Predmeta", icon: GraduationCap },
  { value: "15k+", label: "Pitanja", icon: Star },
];

const cardReveal = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 },
  }),
};

export function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section className="border-y border-warm-200 bg-white">
      <div className="page-container py-6 md:py-10">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6"
        >
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              variants={cardReveal}
              custom={i}
              className="text-center"
            >
              <div className="flex justify-center mb-1.5 sm:mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center">
                  <Icon size={15} className="text-primary-600 sm:text-[17px]" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-warm-900 tracking-tight leading-none mb-0.5 sm:mb-1">
                {value}
              </div>
              <div className="text-[10px] sm:text-xs text-warm-500 font-medium leading-tight">
                {label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
