import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { Button } from "@/components/common/Button";
import { Bone } from "@/components/common/Skeleton";
import { cn } from "@/utils/cn";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import { useStatistics } from "./useStatistics";
import { SummaryBar } from "./SummaryBar";
import { HistoryTab } from "./HistoryTab";
import { SubjectsTab } from "./SubjectsTab";

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-warm-200 p-4"
          >
            <Bone className="h-8 w-8 rounded-xl mb-2.5" />
            <Bone className="h-7 w-16 mb-1" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="flex gap-1 bg-warm-100 rounded-xl p-1 w-fit">
        <Bone className="h-9 w-36 rounded-lg" />
        <Bone className="h-9 w-36 rounded-lg" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-warm-200 p-4 flex items-center gap-3"
        >
          <Bone className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-48" />
            <Bone className="h-3 w-28" />
          </div>
          <Bone className="h-7 w-14 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: "history", label: "Povijest ispita" },
  { id: "subjects", label: "Po predmetima" },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 mb-5 bg-warm-100 rounded-xl p-1 w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all",
            active === tab.id
              ? "bg-white text-warm-900 shadow-sm"
              : "text-warm-500 hover:text-warm-700",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function StatisticsPage() {
  usePageTitle(PAGE_TITLES.statistics);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    params.get("tab") === "subjects" ? "subjects" : "history",
  );

  const {
    attempts,
    completed,
    subjectStats,
    stats,
    isLoading,
    error,
    refetch,
    isEmpty,
  } = useStatistics();

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title="Statistike" />
        <StatsSkeleton />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title="Statistike" />
        <div className="text-center py-16">
          <AlertCircle
            size={32}
            className="text-red-400 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-warm-700 font-semibold mb-4">
            Greška pri učitavanju
          </p>
          <Button
            variant="secondary"
            leftIcon={RefreshCw}
            onClick={() => refetch()}
          >
            Pokušaj ponovo
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (isEmpty) {
    return (
      <PageWrapper>
        <PageHeader
          title="Statistike"
          subtitle="Pregled tvojih rezultata i napretka"
        />
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-warm-400" strokeWidth={1.5} />
          </div>
          <p className="text-warm-700 font-semibold mb-2">
            Još nema riješenih ispita
          </p>
          <p className="text-warm-400 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            Odaberi ispit, riješi ga, i ovdje će se pojaviti detaljne statistike
            tvog napretka.
          </p>
          <Button
            variant="primary"
            leftIcon={BookOpen}
            onClick={() => navigate("/predmeti")}
          >
            Odaberi ispit
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Statistike"
        subtitle="Pregled tvojih rezultata i napretka"
      />

      <SummaryBar stats={stats} />

      <TabBar active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "history" ? (
            <HistoryTab completed={completed} />
          ) : (
            <SubjectsTab subjectStats={subjectStats} attempts={attempts} />
          )}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}
