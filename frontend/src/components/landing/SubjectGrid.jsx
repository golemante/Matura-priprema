import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SUBJECTS } from "@/utils/constants";
import { InViewSection } from "@/components/common/InViewSection";
import { SectionHeading } from "./SectionHeading";
import { cn } from "@/utils/cn";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

function SubjectCard({ subject, featured = false }) {
  const navigate = useNavigate();
  const Icon = subject.icon;

  return (
    <motion.div variants={cardReveal}>
      <motion.div
        onClick={() => navigate(`/predmeti/${subject.id}`)}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className={cn(
          "group relative bg-white rounded-2xl border border-warm-200 overflow-hidden cursor-pointer",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
          "hover:shadow-[0_8px_30px_-4px_rgba(45,84,232,0.12)] hover:border-warm-300",
          "transition-all duration-300",
        )}
      >
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl",
            `bg-gradient-to-r ${subject.color.gradient}`,
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          )}
        />

        <div className={cn("p-5", featured ? "pb-4" : "pb-3")}>
          <div className="flex items-start justify-between mb-3">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border",
                subject.color.bg,
                subject.color.border,
              )}
            >
              <Icon size={19} className={subject.color.text} />
            </div>
            <span
              className={cn(
                "text-[11px] font-bold px-2 py-1 rounded-lg",
                subject.color.badge,
              )}
            >
              {subject.examCount} ispita
            </span>
          </div>

          <h3 className="font-bold text-warm-900 text-base leading-snug tracking-tight">
            {subject.name}
          </h3>
          {featured && (
            <p className="mt-1 text-sm text-warm-500 leading-relaxed line-clamp-2">
              {subject.description}
            </p>
          )}
        </div>

        <div
          className={cn(
            "px-5 py-3 border-t border-warm-100 flex items-center justify-between",
            "bg-warm-50 group-hover:bg-primary-50 transition-colors duration-300",
          )}
        >
          <span
            className={cn(
              "text-xs font-bold tracking-wide",
              subject.color.text,
            )}
          >
            {subject.shortName}
          </span>
          <div className="flex items-center gap-1 text-xs font-semibold text-warm-400 group-hover:text-primary-600 transition-colors duration-200">
            <span className="hidden sm:inline">Počni</span>
            <ArrowRight
              size={13}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PopularSubjectsSection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const popularSubjects = SUBJECTS.filter((s) => s.isPopular);

  return (
    <section id="predmeti" className="bg-white border-y border-warm-200">
      <div className="page-container py-14 md:py-16">
        <InViewSection>
          <div className="flex items-end justify-between gap-4 mb-8">
            <SectionHeading
              label="Popularni predmeti"
              title="Najčešće polagani predmeti"
              subtitle="Matematika, Hrvatski i Engleski — tri obavezna predmeta s najviše dostupnih ispita."
            />
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate("/predmeti")}
              className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 mb-8 transition-colors"
            >
              Svi predmeti
              <ArrowRight size={14} />
            </motion.button>
          </div>
        </InViewSection>

        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid md:grid-cols-3 gap-5"
        >
          {popularSubjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} featured />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function OtherSubjectsSection() {
  const otherSubjects = SUBJECTS.filter((s) => !s.isPopular);

  return (
    <section className="page-container py-14 md:py-16">
      <InViewSection>
        <SectionHeading
          title="Ostali predmeti"
          subtitle="Polažeš izborni predmet? Imamo ispite i za fiziku, kemiju, biologiju i ostale."
        />
      </InViewSection>

      <InViewSection delay={0.1}>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {otherSubjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </motion.div>
      </InViewSection>
    </section>
  );
}
