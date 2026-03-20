import { motion } from "framer-motion";
import { BookOpenCheck, Search } from "lucide-react";
import { useState } from "react";
import { SUBJECTS } from "@/utils/constants";
import { SubjectCard } from "@/components/subject/SubjectCard";
import { PageWrapper, PageHeader } from "@/components/layout/PageLayout";
import { usePageTitle } from "@/hooks/usePageTitle";

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

function AnimatedSubjectCard({ subject }) {
  return (
    <motion.div variants={cardAnim}>
      <SubjectCard subject={subject} showDescription />
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
              <AnimatedSubjectCard key={subject.id} subject={subject} />
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
              <AnimatedSubjectCard key={subject.id} subject={subject} />
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
