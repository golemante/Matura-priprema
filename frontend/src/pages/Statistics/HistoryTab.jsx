import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";
import { SUBJECTS } from "@/utils/constants";
import { cn } from "@/utils/cn";
import {
  getPctBg,
  getPctColor,
  sessionName,
  levelName,
  formatElapsed,
  daysAgoLabel,
  groupByMonth,
} from "@/utils/statsHelpers";

function SubjectFilterChips({ attempts, active, onChange }) {
  const presentIds = useMemo(
    () => [...new Set(attempts.map((a) => a.exam?.subject_id).filter(Boolean))],
    [attempts],
  );

  if (presentIds.length < 2) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Chip active={active === null} onClick={() => onChange(null)}>
        Svi
      </Chip>
      {presentIds.map((sid) => {
        const s = SUBJECTS.find((x) => x.id === sid);
        if (!s) return null;
        return (
          <Chip
            key={sid}
            active={active === sid}
            onClick={() => onChange(active === sid ? null : sid)}
            activeCls={`${s.color.bg} ${s.color.text} border-transparent`}
          >
            <s.icon size={11} />
            {s.shortName}
          </Chip>
        );
      })}
    </div>
  );
}

function Chip({ active, onClick, children, activeCls }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
        active
          ? (activeCls ?? "bg-primary-600 text-white border-primary-600")
          : "bg-white text-warm-600 border-warm-200 hover:border-warm-300",
      )}
    >
      {children}
    </button>
  );
}

const SORT_OPTIONS = [
  { id: "newest", label: "Najnovije" },
  { id: "oldest", label: "Najstarije" },
  { id: "best", label: "Najbolji" },
  { id: "worst", label: "Najlošiji" },
];

const SORT_FNS = {
  newest: (a, b) => new Date(b.finished_at) - new Date(a.finished_at),
  oldest: (a, b) => new Date(a.finished_at) - new Date(b.finished_at),
  best: (a, b) => (b.score_pct ?? -1) - (a.score_pct ?? -1),
  worst: (a, b) => (a.score_pct ?? 101) - (b.score_pct ?? 101),
};

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const label = SORT_OPTIONS.find((o) => o.id === value)?.label;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-warm-200 hover:border-warm-300 text-warm-700 transition-all"
      >
        <ArrowUpDown size={11} />
        {label}
        <ChevronDown
          size={11}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-warm-200 rounded-xl shadow-lg overflow-hidden min-w-[140px]"
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-warm-50",
                    value === opt.id
                      ? "text-primary-700 bg-primary-50"
                      : "text-warm-700",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AttemptRow({ attempt, index }) {
  const navigate = useNavigate();
  const subject = SUBJECTS.find((s) => s.id === attempt.exam?.subject_id);
  const exam = attempt.exam;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
      onClick={() => navigate(`/rezultati/pokusaj/${attempt.id}`)}
      className="group flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-warm-200 hover:border-warm-300 hover:shadow-sm transition-all cursor-pointer"
    >
      {subject ? (
        <div
          className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            subject.color.bg,
          )}
        >
          <subject.icon size={16} className={subject.color.text} />
        </div>
      ) : (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-warm-100 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-warm-900 truncate">
          {subject?.shortName ?? exam?.subject_id}
          {exam?.year && (
            <span className="text-warm-500 font-normal"> · {exam.year}.</span>
          )}
          <span className="hidden xs:inline text-warm-400 font-normal">
            {exam?.session && ` ${sessionName(exam.session)}`}
          </span>
          <span className="hidden sm:inline text-warm-400 font-normal">
            {exam?.level && ` · ${levelName(exam.level)}`}
          </span>
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-warm-400">
          {attempt.elapsed_seconds && (
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {formatElapsed(attempt.elapsed_seconds)}
            </span>
          )}
          <span>{daysAgoLabel(attempt.finished_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className={cn(
            "text-xs font-black px-2 sm:px-2.5 py-1 rounded-full border",
            getPctBg(attempt.score_pct),
          )}
        >
          {attempt.score_pct != null ? `${attempt.score_pct}%` : "—"}
        </span>
        <button
          title="Ponovi ispit"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/ispit/${attempt.exam_id}`);
          }}
          className="p-1.5 rounded-lg text-warm-300 hover:text-warm-700 hover:bg-warm-100 transition-colors"
        >
          <RotateCcw size={13} />
        </button>
        <ChevronRight
          size={14}
          className="text-warm-300 group-hover:text-warm-500 transition-colors"
        />
      </div>
    </motion.div>
  );
}

function MonthGroup({ label, attempts }) {
  const [open, setOpen] = useState(true);

  const avg = attempts.length
    ? Math.round(
        attempts.reduce((s, a) => s + (a.score_pct ?? 0), 0) / attempts.length,
      )
    : null;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 mb-2.5"
      >
        <span className="text-xs font-bold text-warm-500 capitalize whitespace-nowrap">
          {label}
        </span>
        <div className="h-px flex-1 bg-warm-200" />
        <span
          className={cn("text-xs font-bold tabular-nums", getPctColor(avg))}
        >
          ∅ {avg ?? "—"}%
        </span>
        <span className="text-xs text-warm-400">{attempts.length}</span>
        <ChevronDown
          size={12}
          className={cn(
            "text-warm-300 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2 mb-4"
          >
            {attempts.map((a, i) => (
              <AttemptRow key={a.id} attempt={a} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HistoryTab({ completed }) {
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    const list = subjectFilter
      ? completed.filter((a) => a.exam?.subject_id === subjectFilter)
      : completed;
    return [...list].sort(SORT_FNS[sort]);
  }, [completed, subjectFilter, sort]);

  const useGrouping = sort === "newest" || sort === "oldest";
  const grouped = useGrouping ? groupByMonth(filtered) : null;

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between gap-3 mb-4 flex-col sm:flex-row">
        <SubjectFilterChips
          attempts={completed}
          active={subjectFilter}
          onChange={setSubjectFilter}
        />
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <CheckCircle2
            size={28}
            className="text-warm-200 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm text-warm-500">Nema ispita s ovim filterom.</p>
          <button
            onClick={() => setSubjectFilter(null)}
            className="text-xs text-primary-600 font-bold mt-2 underline underline-offset-2"
          >
            Ukloni filter
          </button>
        </div>
      ) : useGrouping && grouped ? (
        Object.entries(grouped).map(([label, items]) => (
          <MonthGroup key={label} label={label} attempts={items} />
        ))
      ) : (
        <div className="space-y-2">
          {filtered.map((a, i) => (
            <AttemptRow key={a.id} attempt={a} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
