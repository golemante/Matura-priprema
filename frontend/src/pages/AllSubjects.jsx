import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { SUBJECTS } from "@/utils/constants";
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { cn } from "@/utils/cn";
import { usePageTitle } from "@/hooks/usePageTitle";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
};

function SubjectCard({ subject }) {
  const navigate = useNavigate();
  const Icon = subject.icon;

  return (
    <motion.div variants={cardAnim}>
      <motion.div
        onClick={() => navigate(`/predmeti/${subject.id}`)}
        whileHover={{ y: -3, transition: { duration: 0.18 } }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative bg-white rounded-2xl border border-warm-200 overflow-hidden cursor-pointer",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
          "hover:shadow-[0_8px_30px_-4px_rgba(45,84,232,0.10)] hover:border-warm-300",
          "transition-all duration-250",
        )}
      >
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl",
            `bg-gradient-to-r ${subject.color.gradient}`,
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          )}
        />

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border",
                subject.color.bg,
                subject.color.border,
              )}
            >
              <Icon size={22} className={subject.color.text} />
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

          <h3 className="font-bold text-warm-900 text-base tracking-tight mb-1">
            {subject.name}
          </h3>
          <p className="text-sm text-warm-500 leading-relaxed line-clamp-2 mb-4">
            {subject.description}
          </p>

          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xs font-bold tracking-wide",
                subject.color.text,
              )}
            >
              {subject.shortName}
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-warm-400 group-hover:text-primary-600 transition-colors duration-200">
              <span>Odaberi ispit</span>
              <ArrowRight
                size={13}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AllSubjectsPage() {
  usePageTitle("Predmeti");

  const popularSubjects = SUBJECTS.filter((s) => s.isPopular);
  const otherSubjects = SUBJECTS.filter((s) => !s.isPopular);

  return (
    <PageWrapper>
      <PageHeader
        title="Odaberi predmet"
        subtitle="Pronađi predmet koji polažeš i kreni vježbati s pravim NCVVO ispitima."
      />

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider">
              Obavezni predmeti
            </h2>
          </div>
          <div className="h-px flex-1 bg-warm-200" />
          <span className="text-xs text-warm-400">
            {popularSubjects.length} predmeta
          </span>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {popularSubjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </motion.div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-warm-400" />
            <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider">
              Izborni predmeti
            </h2>
          </div>
          <div className="h-px flex-1 bg-warm-200" />
          <span className="text-xs text-warm-400">
            {otherSubjects.length} predmeta
          </span>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {otherSubjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-10 flex items-start gap-3 p-4 bg-primary-50 border border-primary-100 rounded-2xl"
      >
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <BookOpenCheck size={15} className="text-primary-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary-900 mb-0.5">
            Svi ispiti su službeni NCVVO materijali
          </p>
          <p className="text-xs text-primary-700 leading-relaxed">
            Koristimo originalne ispite od 2010. do danas. Ispiti su
            kategorizirani po godini, ispitnom roku i razini (A = viša, B =
            osnovna razina).
          </p>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
