// pages/Statistics.jsx
// Prikaz svih rezultata i napretka korisnika.
// TODO: kad backend bude spreman, zamijeniti MOCK_ATTEMPTS s useQuery pozivima.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Target,
  TrendingUp,
  Clock,
  RotateCcw,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/layout/Wrapper";
import { Card, CardContent } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { SUBJECTS } from "@/utils/constants";
import { cn } from "@/utils/utils";

// ── Mock data (zamijeniti s API pozivima) ────────────────────────
const MOCK_ATTEMPTS = [
  {
    id: "1",
    examId: "matematika-2024-ljetni-visa",
    subjectId: "matematika",
    year: 2024,
    session: "Ljetni",
    level: "B razina",
    pct: 82,
    correct: 33,
    total: 40,
    date: "2025-06-10",
    elapsed: 4200,
  },
  {
    id: "2",
    examId: "engleski-2023-ljetni-osnovna",
    subjectId: "engleski",
    year: 2023,
    session: "Ljetni",
    level: "A razina",
    pct: 93,
    correct: 28,
    total: 30,
    date: "2025-06-08",
    elapsed: 2800,
  },
  {
    id: "3",
    examId: "matematika-2023-ljetni-visa",
    subjectId: "matematika",
    year: 2023,
    session: "Ljetni",
    level: "B razina",
    pct: 65,
    correct: 26,
    total: 40,
    date: "2025-06-05",
    elapsed: 5100,
  },
  {
    id: "4",
    examId: "hrvatski-2024-ljetni-osnovna",
    subjectId: "hrvatski",
    year: 2024,
    session: "Ljetni",
    level: "A razina",
    pct: 77,
    correct: 23,
    total: 30,
    date: "2025-06-01",
    elapsed: 3600,
  },
  {
    id: "5",
    examId: "fizika-2022-jesenski-osnovna",
    subjectId: "fizika",
    year: 2022,
    session: "Jesenski",
    level: "A razina",
    pct: 50,
    correct: 15,
    total: 30,
    date: "2025-05-28",
    elapsed: 4000,
  },
  {
    id: "6",
    examId: "engleski-2024-ljetni-visa",
    subjectId: "engleski",
    year: 2024,
    session: "Ljetni",
    level: "B razina",
    pct: 88,
    correct: 35,
    total: 40,
    date: "2025-05-22",
    elapsed: 3200,
  },
];

function getPctColor(pct) {
  if (pct >= 75) return "text-success-600";
  if (pct >= 50) return "text-amber-600";
  return "text-error-600";
}

function getPctBg(pct) {
  if (pct >= 75) return "bg-success-50 border-green-200";
  if (pct >= 50) return "bg-amber-50 border-amber-200";
  return "bg-error-50 border-red-200";
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "long",
  }).format(new Date(dateStr));
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

// ── Sub-components ───────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  color = "text-primary-600 bg-primary-50",
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 px-5 py-4 rounded-2xl",
        color,
      )}
    >
      <Icon size={18} className="mb-1 opacity-70" />
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium opacity-70">{label}</span>
    </div>
  );
}

function SubjectRow({ subject, attempts }) {
  const avg = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.pct, 0) / attempts.length)
    : 0;
  const best = Math.max(...attempts.map((a) => a.pct), 0);

  return (
    <div className="flex items-center gap-4 py-3 border-b border-warm-100 last:border-0">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          subject.color.bg,
        )}
      >
        <subject.icon size={16} className={subject.color.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warm-900 truncate">
          {subject.name}
        </p>
        <p className="text-xs text-warm-400">
          {attempts.length} {attempts.length === 1 ? "pokušaj" : "pokušaja"}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn("text-sm font-bold", getPctColor(avg))}>{avg}%</p>
        <p className="text-xs text-warm-400">prosjek</p>
      </div>
      <div className="text-right flex-shrink-0 hidden sm:block">
        <p className={cn("text-sm font-bold", getPctColor(best))}>{best}%</p>
        <p className="text-xs text-warm-400">najbolji</p>
      </div>
      {/* Mini progress bar */}
      <div className="w-16 hidden md:block">
        <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              avg >= 75
                ? "bg-green-500"
                : avg >= 50
                  ? "bg-amber-400"
                  : "bg-red-400",
            )}
            style={{ width: `${avg}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function StatisticsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("sve"); // "sve" | subjectId

  const attempts = MOCK_ATTEMPTS;
  const filtered =
    filter === "sve"
      ? attempts
      : attempts.filter((a) => a.subjectId === filter);

  // Aggregate stats
  const totalAttempts = attempts.length;
  const avgPct = totalAttempts
    ? Math.round(attempts.reduce((s, a) => s + a.pct, 0) / totalAttempts)
    : 0;
  const bestPct = totalAttempts ? Math.max(...attempts.map((a) => a.pct)) : 0;
  const totalTime = attempts.reduce((s, a) => s + (a.elapsed ?? 0), 0);

  // Subject breakdown
  const subjectsWithAttempts = SUBJECTS.filter((s) =>
    attempts.some((a) => a.subjectId === s.id),
  ).map((s) => ({
    subject: s,
    attempts: attempts.filter((a) => a.subjectId === s.id),
  }));

  return (
    <PageWrapper>
      <PageHeader
        title="Moji rezultati"
        subtitle="Praćenje napretka po predmetima"
      />

      {/* ── Overview stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatPill
          icon={BarChart2}
          label="Ispita riješeno"
          value={totalAttempts}
          color="text-primary-600 bg-primary-50"
        />
        <StatPill
          icon={TrendingUp}
          label="Prosječan rezultat"
          value={`${avgPct}%`}
          color={cn(getPctColor(avgPct), getPctBg(avgPct))}
        />
        <StatPill
          icon={Trophy}
          label="Najmanji rezultat"
          value={`${bestPct}%`}
          color="text-amber-600 bg-amber-50"
        />
        <StatPill
          icon={Clock}
          label="Ukupno vremena"
          value={formatTime(totalTime)}
          color="text-warm-600 bg-warm-100"
        />
      </div>

      {/* ── Subject breakdown ──────────────────────────────────── */}
      <Card className="mb-8 p-5">
        <h2 className="text-sm font-bold text-warm-700 mb-4 flex items-center gap-2">
          <Target size={15} />
          Napredak po predmetima
        </h2>
        {subjectsWithAttempts.length > 0 ? (
          <div>
            {subjectsWithAttempts.map(({ subject, attempts: subAttempts }) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                attempts={subAttempts}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-warm-400 text-center py-6">
            Još nema riješenih ispita. Počni s pripremom!
          </p>
        )}
      </Card>

      {/* ── History ────────────────────────────────────────────── */}
      <div>
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilter("sve")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full border transition-all",
              filter === "sve"
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white border-warm-300 text-warm-600 hover:border-warm-400",
            )}
          >
            Sve
          </button>
          {subjectsWithAttempts.map(({ subject }) => (
            <button
              key={subject.id}
              onClick={() => setFilter(subject.id)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full border transition-all",
                filter === subject.id
                  ? cn(subject.color.badge, subject.color.border)
                  : "bg-white border-warm-300 text-warm-600 hover:border-warm-400",
              )}
            >
              {subject.shortName}
            </button>
          ))}
        </div>

        {/* Attempt list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-sm text-warm-400 text-center py-10">
              Nema rezultata za odabrani predmet.
            </p>
          )}
          {filtered.map((attempt) => {
            const subject = SUBJECTS.find((s) => s.id === attempt.subjectId);
            return (
              <Card key={attempt.id} hover className="p-4 group">
                <div className="flex items-center gap-4">
                  {/* Subject icon */}
                  {subject && (
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        subject.color.bg,
                      )}
                    >
                      <subject.icon size={18} className={subject.color.text} />
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warm-900">
                      {subject?.name ?? attempt.subjectId} · {attempt.year}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-warm-400">
                      <span>{attempt.session}</span>
                      <span>·</span>
                      <span>{attempt.level}</span>
                      <span>·</span>
                      <span>{formatDate(attempt.date)}</span>
                    </div>
                  </div>
                  {/* Score */}
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full border text-sm font-bold flex-shrink-0",
                      getPctBg(attempt.pct),
                      getPctColor(attempt.pct),
                    )}
                  >
                    {attempt.pct}%
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Ponovi"
                      onClick={() => navigate(`/ispit/${attempt.examId}`)}
                    >
                      <RotateCcw size={15} />
                    </Button>
                    <ChevronRight
                      size={16}
                      className="text-warm-300 group-hover:text-warm-600 transition-colors"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
}
