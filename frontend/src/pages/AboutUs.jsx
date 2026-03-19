import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpenCheck,
  GraduationCap,
  Target,
  Code2,
  ExternalLink,
  Github,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SUBJECTS } from "@/utils/constants";
import { cn } from "@/utils/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 },
  }),
};

function StatPill({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 bg-white border border-warm-200 rounded-2xl shadow-card">
      <span className="text-2xl font-black text-warm-900 tabular-nums">
        {value}
      </span>
      <span className="text-xs text-warm-500 font-medium">{label}</span>
    </div>
  );
}

export function AboutUsPage() {
  usePageTitle("O projektu");

  return (
    <PageWrapper className="max-w-3xl mx-auto">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <BookOpenCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-warm-900 tracking-tight">
              O projektu MaturaPro
            </h1>
            <p className="text-sm text-warm-500">
              Završni rad · Školska godina 2024./2025.
            </p>
          </div>
        </div>

        <p className="text-warm-600 text-base leading-relaxed">
          MaturaPro je web aplikacija za pripremu državne mature namijenjena
          hrvatskim srednjoškolcima. Projekt je izrađen kao završni rad s ciljem
          da učenicima omogući vježbanje na stvarnim ispitima iz prethodnih
          godina u uvjetima što sličnijim pravom ispitu.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={1}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
      >
        <StatPill value="132+" label="Ispita" />
        <StatPill value={SUBJECTS.length.toString()} label="Predmeta" />
        <StatPill value="2010." label="Od godine" />
        <StatPill value="100%" label="Besplatno" />
      </motion.div>

      <div className="space-y-8">
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-primary-500" />
            <h2 className="text-lg font-bold text-warm-900">Cilj projekta</h2>
          </div>
          <div className="bg-white border border-warm-200 rounded-2xl p-5 shadow-card">
            <p className="text-warm-700 text-sm leading-relaxed mb-3">
              Priprema za maturu u Hrvatskoj uglavnom ovisi o fizičkim zbirkama
              zadataka i individualnom pronalaženju starih ispita na internetu.
              MaturaPro rješava taj problem jedinstvanom platformom koja:
            </p>
            <ul className="space-y-2">
              {[
                "Agregira sve dostupne NCVVO ispite na jednom mjestu",
                "Simulira stvarne uvjete ispita s odbrojavanjem",
                "Automatski ocjenjuje odgovore i prikazuje detaljan pregled grešaka",
                "Prati napredak korisnika kroz vrijeme po predmetima",
                "Prikazuje usporedbu s prosjekom zajednice korisnika",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-warm-600"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
        >
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={16} className="text-primary-500" />
            <h2 className="text-lg font-bold text-warm-900">Tehnički stack</h2>
          </div>
          <div className="bg-white border border-warm-200 rounded-2xl p-5 shadow-card">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  category: "Frontend",
                  items: [
                    "React 19 + Vite (SWC)",
                    "Tailwind CSS 3",
                    "Zustand 5",
                    "TanStack Query 5",
                    "Framer Motion",
                    "React Router 7",
                  ],
                  color: "primary",
                },
                {
                  category: "Backend & Infrastruktura",
                  items: [
                    "Supabase (PostgreSQL)",
                    "Row Level Security (RLS)",
                    "Supabase Auth + Google OAuth",
                    "Supabase Storage (audio)",
                    "Vercel (hosting)",
                  ],
                  color: "success",
                },
              ].map(({ category, items, color }) => (
                <div key={category}>
                  <p
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider mb-2",
                      color === "primary"
                        ? "text-primary-600"
                        : "text-success-600",
                    )}
                  >
                    {category}
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-warm-700"
                      >
                        <div
                          className={cn(
                            "w-1 h-1 rounded-full flex-shrink-0",
                            color === "primary"
                              ? "bg-primary-400"
                              : "bg-success-500",
                          )}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
        >
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={16} className="text-primary-500" />
            <h2 className="text-lg font-bold text-warm-900">
              Dostupni predmeti
            </h2>
          </div>
          <div className="bg-white border border-warm-200 rounded-2xl p-5 shadow-card">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SUBJECTS.map((s) => (
                <Link
                  key={s.id}
                  to={`/predmeti/${s.id}`}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border transition-all hover:-translate-y-0.5",
                    s.color.bg,
                    s.color.border,
                  )}
                >
                  <s.icon size={14} className={s.color.text} />
                  <span className={cn("text-xs font-bold", s.color.text)}>
                    {s.shortName}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={5}
          className="p-4 bg-amber-50 border border-amber-200 rounded-2xl"
        >
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Napomena:</span> Svi ispiti preuzeti su
            s javno dostupnih materijala Nacionalnog centra za vanjsko
            vrednovanje obrazovanja (NCVVO). MaturaPro nije u formalnoj suradnji
            s NCVVO-om — platforma služi isključivo u obrazovne svrhe.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={6}
          className="flex items-center justify-between p-4 bg-warm-900 rounded-2xl"
        >
          <div>
            <p className="text-white text-sm font-semibold">
              Izvorni kod projekta
            </p>
            <p className="text-warm-400 text-xs mt-0.5">Dostupno na GitHubu</p>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Github size={15} />
            GitHub
            <ExternalLink size={11} className="opacity-60" />
          </a>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
