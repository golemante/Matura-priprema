import { motion } from "framer-motion";
import {
  BookOpenCheck,
  BarChart2,
  Clock,
  TrendingUp,
  Star,
  Zap,
} from "lucide-react";
import { InViewSection } from "@/components/common/InViewSection";
import { SectionHeading } from "./SectionHeading";
import { cn } from "@/utils/cn";

const FEATURES = [
  {
    icon: BookOpenCheck,
    title: "Pravi NCVVO ispiti",
    desc: "Koristimo originalne ispite Nacionalnog centra za vanjsko vrednovanje obrazovanja.",
    color: "primary",
  },
  {
    icon: BarChart2,
    title: "Detaljna analiza",
    desc: "Po predaji odmah vidiš koji si odgovor pogriješio, koji bio točan, i koliko bodova imaš.",
    color: "amber",
  },
  {
    icon: Clock,
    title: "Vremensko ograničenje",
    desc: "Ispit rješavaš pod pravim uvjetima — s odbrojavanjem kao na stvarnoj maturi.",
    color: "success",
  },
  {
    icon: TrendingUp,
    title: "Praćenje napretka",
    desc: "Vidi kako ti se rezultati poboljšavaju kroz tjedne. Streak motivira nastavak.",
    color: "primary",
  },
  {
    icon: Star,
    title: "Označi pitanja",
    desc: "Označi pitanja na koja nisi siguran i vrati im se na kraju — baš kao na pravom ispitu.",
    color: "amber",
  },
  {
    icon: Zap,
    title: "Brzo i lagano",
    desc: "Bez instalacije, bez registracije za osnovno korištenje. Otvori i počni odmah.",
    color: "success",
  },
];

const cardReveal = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
  }),
};

export function FeatureHighlightsSection() {
  return (
    <section className="bg-white border-y border-warm-200">
      <div className="page-container py-14 md:py-16">
        <InViewSection>
          <SectionHeading
            label="Zašto MaturaPro"
            title="Sve što trebaš za maturu"
          />
        </InViewSection>

        <InViewSection delay={0.1}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                variants={cardReveal}
                whileInView="show"
                initial="hidden"
                viewport={{ once: true, margin: "-30px" }}
                custom={i}
                className="p-5 bg-warm-50 rounded-2xl border border-warm-200 hover:border-warm-300 hover:bg-white transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                    color === "primary" && "bg-primary-100",
                    color === "amber" && "bg-amber-100",
                    color === "success" && "bg-success-50",
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      color === "primary" && "text-primary-600",
                      color === "amber" && "text-amber-600",
                      color === "success" && "text-success-600",
                    )}
                  />
                </div>
                <h3 className="font-bold text-warm-900 text-sm mb-1.5 tracking-tight">
                  {title}
                </h3>
                <p className="text-sm text-warm-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </InViewSection>
      </div>
    </section>
  );
}
