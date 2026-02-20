import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { SUBJECTS } from "@/utils/constants";
import { cn } from "@/utils/utils";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export function HomePage() {
  const navigate = useNavigate();
  const popularSubjects = SUBJECTS.filter((s) => s.isPopular);
  const otherSubjects = SUBJECTS.filter((s) => !s.isPopular);

  return (
    <PageWrapper>
      {/* Hero section */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="bg-white rounded-3xl border border-warm-300 shadow-card px-6 py-8 md:px-10 md:py-10
                        overflow-hidden relative"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-100 rounded-full opacity-40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 left-24 w-40 h-40 bg-amber-100 rounded-full opacity-40 blur-3xl pointer-events-none" />

          <div className="relative">
            <div
              className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200
                            text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
            >
              <Sparkles size={12} />
              Stvarni ispiti iz prethodnih godina
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-warm-900 tracking-tight leading-tight text-balance max-w-lg">
              Pripremi se za maturu
              <span className="text-primary-600"> kao profesionalac</span>
            </h1>
            <p className="mt-3 text-warm-500 text-base max-w-md leading-relaxed">
              Riješite stvarne ispite iz prethodnih godina, odmah vidite
              rezultate i pratite napredak po predmetima.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-6">
              {[
                { value: "8", label: "Predmeta" },
                { value: "144", label: "Ispita" },
                { value: "∞", label: "Pokušaja" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <span className="text-2xl font-bold text-warm-900">
                    {value}
                  </span>
                  <span className="ml-1.5 text-sm text-warm-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Popular subjects */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-primary-600" />
          <h2 className="text-sm font-semibold text-warm-500 uppercase tracking-wider">
            Najpopularniji predmeti
          </h2>
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {popularSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              featured
              onClick={() => navigate(`/predmeti/${subject.id}`)}
            />
          ))}
        </motion.div>
      </section>

      {/* All subjects */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-warm-500 uppercase tracking-wider">
            Ostali predmeti
          </h2>
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {otherSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onClick={() => navigate(`/predmeti/${subject.id}`)}
            />
          ))}
        </motion.div>
      </section>
    </PageWrapper>
  );
}

function SubjectCard({ subject, featured = false, onClick }) {
  const Icon = subject.icon;

  return (
    <motion.div variants={itemVariants}>
      <Card
        hover
        onClick={onClick}
        className={cn(
          "group relative overflow-hidden",
          featured ? "p-0" : "p-0",
        )}
      >
        <div className={cn("p-5", featured ? "pb-5" : "pb-4")}>
          {/* Icon + badge row */}
          <div className="flex items-start justify-between mb-4">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                subject.color.bg,
              )}
            >
              <Icon size={20} className={subject.color.text} />
            </div>
            <Badge className={cn("text-xs", subject.color.badge)}>
              {subject.examCount} ispita
            </Badge>
          </div>

          {/* Title & description */}
          <h3 className="font-bold text-warm-900 text-base leading-snug">
            {subject.name}
          </h3>
          {featured && (
            <p className="mt-1 text-sm text-warm-500 leading-relaxed line-clamp-2">
              {subject.description}
            </p>
          )}
        </div>

        {/* Footer CTA */}
        <div
          className={cn(
            "px-5 py-3 border-t border-warm-200 flex items-center justify-between",
            "bg-warm-50 rounded-b-2xl",
          )}
        >
          <span className={cn("text-xs font-semibold", subject.color.text)}>
            {subject.shortName}
          </span>
          <ArrowRight
            size={15}
            className={cn(
              "transition-transform duration-200 group-hover:translate-x-1",
              subject.color.text,
            )}
          />
        </div>

        {/* Color accent line at top */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl",
            `bg-gradient-to-r ${subject.color.gradient}`,
          )}
        />
      </Card>
    </motion.div>
  );
}
