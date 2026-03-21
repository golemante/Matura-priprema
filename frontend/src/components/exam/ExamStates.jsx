import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  Construction,
  Pause,
  Play,
  Loader2,
} from "lucide-react";

function parseExamError(error) {
  if (!error) return null;
  const msg = error.message ?? String(error);
  if (msg.includes("PGRST116") || msg.includes("not found"))
    return "Ispit nije pronađen ili nije objavljen.";
  if (msg.includes("403") || msg.includes("permission"))
    return "Nemate pristup ovom ispitu. Prijavite se.";
  return "Greška pri učitavanju ispita. Pokušajte ponovo.";
}

function StateCard({ backLink, icon: Icon, iconCls, children }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-warm-200 shadow-sm p-8 text-center space-y-4">
        <Icon size={32} className={iconCls} />
        {children}
        {backLink && (
          <Link
            to={backLink}
            className="inline-flex items-center gap-2 bg-warm-100 text-warm-700 border border-warm-300 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-warm-200 transition-colors"
          >
            <ArrowLeft size={15} />
            Natrag
          </Link>
        )}
      </div>
    </div>
  );
}

export function ExamErrorState({ error, backLink }) {
  return (
    <StateCard
      backLink={backLink}
      icon={AlertCircle}
      iconCls="text-red-400 mx-auto"
    >
      <p className="text-sm text-warm-700 leading-relaxed">
        {parseExamError(error)}
      </p>
    </StateCard>
  );
}

export function ExamEmptyState({ backLink, examTitle }) {
  return (
    <StateCard
      backLink={backLink}
      icon={Construction}
      iconCls="text-warm-400 mx-auto"
    >
      <p className="text-sm text-warm-600 leading-relaxed">
        Ispit{" "}
        {examTitle && (
          <strong className="font-semibold text-warm-800">{examTitle}</strong>
        )}{" "}
        još nema unesena pitanja.
      </p>
    </StateCard>
  );
}

export function BlockedByTabState({ backLink }) {
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-warm-200 shadow-sm p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
          <AlertCircle size={22} className="text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-warm-900 text-base">
            Ispit je otvoren u drugom tabu
          </p>
          <p className="text-sm text-warm-500 mt-1.5 leading-relaxed">
            Ovaj ispit je aktivan u drugom prozoru ili tabu preglednika. Zatvori
            drugi tab pa pokušaj ponovo.
          </p>
        </div>
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 bg-warm-100 text-warm-700 border border-warm-300 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-warm-200 transition-colors"
        >
          <ArrowLeft size={15} />
          Natrag
        </Link>
      </div>
    </div>
  );
}

export function PausedOverlay({ onResume, isSyncing }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-x-0 bottom-0 top-14 z-20 flex items-center justify-center bg-warm-100/98 backdrop-blur-md px-4"
    >
      <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-5">
          {isSyncing ? (
            <Loader2
              size={28}
              className="text-warm-400 animate-spin"
              strokeWidth={1.5}
            />
          ) : (
            <Pause size={28} className="text-warm-400" strokeWidth={1.5} />
          )}
        </div>
        <h2 className="text-xl font-bold text-warm-900 mb-2">
          {isSyncing ? "Sinkronizacija..." : "Ispit je pauziran"}
        </h2>
        <p className="text-warm-500 text-sm mb-6 leading-relaxed">
          {isSyncing
            ? "Čekamo potvrdu poslužitelja. Trenutak..."
            : "Odgovori su sačuvani. Nastavi kad budeš spreman/a."}
        </p>
        {!isSyncing && (
          <button
            onClick={onResume}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 active:scale-95 transition-all"
          >
            <Play size={14} />
            Nastavi ispit
          </button>
        )}
      </div>
    </motion.div>
  );
}
