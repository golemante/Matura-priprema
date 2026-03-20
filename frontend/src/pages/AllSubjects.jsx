import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, Search } from "lucide-react";
import { useState } from "react";
import { SUBJECTS } from "@/utils/constants";
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/utils/cn";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
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
            "absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            `bg-gradient-to-r ${subject.color.gradient}`,
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

function SectionDivider({ label, count }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-warm-400" />
        <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider">
          {label}
        </h2>
      </div>
      <div className="h-px flex-1 bg-warm-200" />
      <span className="text-xs text-warm-400">{count} predmeta</span>
    </div>
  );
}

export function AllSubjectsPage() {
  usePageTitle("Predmeti");
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = query
    ? SUBJECTS.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.shortName.toLowerCase().includes(query),
      )
    : null;

  const popular = (filtered ?? SUBJECTS).filter((s) => s.isPopular);
  const other = (filtered ?? SUBJECTS).filter((s) => !s.isPopular);
  const hasResults = popular.length > 0 || other.length > 0;

  return (
    <PageWrapper>
      <PageHeader
        title="Odaberi predmet"
        subtitle="Pronađi predmet koji polažeš i kreni vježbati s pravim NCVVO ispitima."
      />

      <div className="relative mb-8 max-w-sm">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Traži predmet..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-warm-300 rounded-xl bg-white text-warm-900 placeholder:text-warm-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
        />
      </div>

      {!hasResults && (
        <div className="text-center py-16">
          <p className="text-warm-500 font-semibold mb-2">
            Nema rezultata za "{search}"
          </p>
          <button
            onClick={() => setSearch("")}
            className="text-xs text-primary-600 font-bold underline underline-offset-2"
          >
            Pokaži sve predmete
          </button>
        </div>
      )}

      {popular.length > 0 && (
        <section className="mb-10">
          <SectionDivider label="Obavezni predmeti" count={popular.length} />
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {popular.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </motion.div>
        </section>
      )}

      {other.length > 0 && (
        <section>
          <SectionDivider label="Izborni predmeti" count={other.length} />
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {other.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </motion.div>
        </section>
      )}

      {!query && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
              Originalni ispiti od 2010. do danas, kategorizirani po godini,
              roku i razini (A = viša, B = osnovna razina).
            </p>
          </div>
        </motion.div>
      )}
    </PageWrapper>
  );
}
