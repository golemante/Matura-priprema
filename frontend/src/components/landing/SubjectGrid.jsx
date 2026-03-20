import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SUBJECTS } from "@/utils/constants";
import { SubjectCard } from "@/components/subject/SubjectCard";
import { InViewSection } from "@/components/common/InViewSection";
import { SectionHeading } from "./SectionHeading";

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

function AnimatedSubjectCard({ subject, showDescription }) {
  return (
    <motion.div variants={cardReveal}>
      <SubjectCard subject={subject} showDescription={showDescription} />
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
            <AnimatedSubjectCard
              key={subject.id}
              subject={subject}
              showDescription
            />
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
          className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4"
        >
          {otherSubjects.map((subject) => (
            <AnimatedSubjectCard
              key={subject.id}
              subject={subject}
              showDescription={false}
            />
          ))}
        </motion.div>
      </InViewSection>
    </section>
  );
}
