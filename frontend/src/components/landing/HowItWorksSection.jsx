import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Zap, BarChart2 } from "lucide-react";
import { InViewSection } from "@/components/common/InViewSection";
import { SectionHeading } from "./SectionHeading";
import { cn } from "@/utils/cn";

const STEPS = [
  {
    step: "01",
    icon: GraduationCap,
    title: "Odaberi predmet",
    desc: "Pronađi predmet koji polažeš — od matematike do kemije. 8 najčešćih predmeta državne mature.",
    color: "primary",
  },
  {
    step: "02",
    icon: Zap,
    title: "Odaberi pravi ispit",
    desc: "Filtriraj po godini, roku i razini (A ili B). Rješavaš točno onaj ispit koji te zanima.",
    color: "amber",
  },
  {
    step: "03",
    icon: BarChart2,
    title: "Vidi rezultate",
    desc: "Odmah po predaji vidiš detaljnu analizu — koje si pogriješio, zašto, i kako napredovati.",
    color: "success",
  },
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

function StepCard({ step, icon: Icon, title, desc, color, index }) {
  return (
    <motion.div variants={cardReveal} custom={index} className="relative">
      <div className="bg-white border border-warm-200 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-300">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center",
              color === "primary" && "bg-primary-50 border border-primary-100",
              color === "amber" && "bg-amber-50 border border-amber-100",
              color === "success" && "bg-success-50 border border-green-100",
            )}
          >
            <Icon
              size={20}
              className={cn(
                color === "primary" && "text-primary-600",
                color === "amber" && "text-amber-600",
                color === "success" && "text-success-600",
              )}
            />
          </div>
          <span
            className={cn(
              "text-3xl font-black tabular-nums leading-none",
              color === "primary" && "text-primary-100",
              color === "amber" && "text-amber-100",
              color === "success" && "text-green-100",
            )}
          >
            {step}
          </span>
        </div>
        <h3 className="text-base font-bold text-warm-900 mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-warm-500 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="page-container py-14 md:py-16">
      <InViewSection>
        <SectionHeading
          label="Kako radi"
          title="Tri koraka do boljeg rezultata"
          subtitle="Jednostavno kao što se zvuči — odaberi ispit, riješi ga, vidi gdje griješiš."
        />
      </InViewSection>

      <div ref={ref} className="relative">
        <div className="hidden md:block absolute top-10 left-[calc(33%_-_1px)] right-[33%] h-px bg-gradient-to-r from-primary-200 via-amber-200 to-success-500/50" />

        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid md:grid-cols-3 gap-6"
        >
          {STEPS.map((step, i) => (
            <StepCard key={step.step} {...step} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
