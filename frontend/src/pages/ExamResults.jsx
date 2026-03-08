// pages/ExamResults.jsx — v5 PREMIUM REDESIGN
// ═══════════════════════════════════════════════════════════════════════════
// POBOLJŠANJA:
//
//  BUG #1  — question.text.replace(/<[^>]+>/g, "") → SafeHtml (HTML se renderira)
//  BUG #2  — opt.text plain text → SafeHtml
//  BUG #3  — explanation plain text → SafeHtml
//
//  UX #1   — Filter tabovi: Sva | Netočna | Preskočena | Označena
//  UX #2   — Hero score kartica: veliki score + točno/netočno/preskočeno
//             pills + stacked progress bar + bodovi ako postoje
//  UX #3   — Sekcije: mini progress bar u headeru svake sekcije
//  UX #4   — QuestionReview: tekst pitanja u headeru renderiran (SafeHtml)
//  UX #5   — QuestionReview: opcije renderiraju HTML, vizualno jasne
//  UX #6   — QuestionReview: explanation ima plavu chip s ikonom
//  UX #7   — Sticky CTA traka na dnu (Pokušaj opet / Natrag)
//  UX #8   — keyError state sa retry gumbom
//  UX #9   — loadingKey state sa skeleton opcijama unutar kartica
//  UX #10  — Animirani brojač postotka (count-up efekt)
// ═══════════════════════════════════════════════════════════════════════════
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
  useMotionValue,
} from "framer-motion";
import { useEffect, useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Minus,
  ArrowLeft,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb,
  AlertCircle,
  Filter,
  Flag,
  Send,
  TrendingUp,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { Button } from "@/components/common/Button";
import { SUBJECTS } from "@/utils/constants";
import { useExamStore } from "@/store/examStore";
import { examApi } from "@/api/examApi";
import { attemptApi } from "@/api/attemptApi";
import { SafeHtml } from "@/components/common/SafeHtml";
import { cn } from "@/utils/utils";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getScoreConfig(pct) {
  if (pct >= 90)
    return {
      label: "Izvrsno!",
      emoji: "🏆",
      color: "green",
      ringFg: "#16A34A",
      ringBg: "#DCFCE7",
      textCls: "text-green-700",
      bgCls: "bg-green-50",
      borderCls: "border-green-200",
    };
  if (pct >= 75)
    return {
      label: "Vrlo dobro!",
      emoji: "🎉",
      color: "green",
      ringFg: "#22C55E",
      ringBg: "#DCFCE7",
      textCls: "text-green-600",
      bgCls: "bg-green-50",
      borderCls: "border-green-200",
    };
  if (pct >= 60)
    return {
      label: "Dobro!",
      emoji: "👍",
      color: "amber",
      ringFg: "#D97706",
      ringBg: "#FEF3C7",
      textCls: "text-amber-700",
      bgCls: "bg-amber-50",
      borderCls: "border-amber-200",
    };
  if (pct >= 50)
    return {
      label: "Dovoljno",
      emoji: "📖",
      color: "amber",
      ringFg: "#F59E0B",
      ringBg: "#FEF9C3",
      textCls: "text-amber-600",
      bgCls: "bg-amber-50",
      borderCls: "border-amber-200",
    };
  return {
    label: "Treba vježbe",
    emoji: "💪",
    color: "red",
    ringFg: "#DC2626",
    ringBg: "#FEE2E2",
    textCls: "text-red-600",
    bgCls: "bg-red-50",
    borderCls: "border-red-200",
  };
}

function formatElapsed(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  useEffect(() => {
    if (!active) return;
    import("canvas-confetti").then((mod) => {
      mod.default({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#2D54E8", "#22C55E", "#F59E0B", "#EC4899"],
      });
    });
  }, [active]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED SCORE RING
// ─────────────────────────────────────────────────────────────────────────────
function ScoreRing({ pct, cfg }) {
  const r = 52;
  const circ = 2 * Math.PI * r;

  // Animirani count-up za postotak
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let frame;
    const duration = 1200;
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplayed(Math.round(eased * pct));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [pct]);

  return (
    <div className="relative flex-shrink-0">
      <svg
        width={128}
        height={128}
        viewBox="0 0 128 128"
        className="rotate-[-90deg]"
      >
        {/* Track */}
        <circle
          cx={64}
          cy={64}
          r={r}
          fill="none"
          stroke={cfg.ringBg}
          strokeWidth={11}
        />
        {/* Fill */}
        <circle
          cx={64}
          cy={64}
          r={r}
          fill="none"
          stroke={cfg.ringFg}
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          style={{
            transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </svg>
      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-2xl font-black tabular-nums leading-none",
            cfg.textCls,
          )}
        >
          {displayed}%
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STACKED PROGRESS BAR  (točno / netočno / preskočeno)
// ─────────────────────────────────────────────────────────────────────────────
function StackedBar({ correct, wrong, skipped, total }) {
  const pCorrect = total > 0 ? (correct / total) * 100 : 0;
  const pWrong = total > 0 ? (wrong / total) * 100 : 0;
  const pSkipped = total > 0 ? (skipped / total) * 100 : 0;

  return (
    <div className="w-full h-2.5 bg-warm-200 rounded-full overflow-hidden flex">
      <motion.div
        className="h-full bg-green-500"
        initial={{ width: 0 }}
        animate={{ width: `${pCorrect}%` }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
      />
      <motion.div
        className="h-full bg-red-400"
        initial={{ width: 0 }}
        animate={{ width: `${pWrong}%` }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 }}
      />
      <motion.div
        className="h-full bg-warm-300"
        initial={{ width: 0 }}
        animate={{ width: `${pSkipped}%` }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SCORE CARD
// ─────────────────────────────────────────────────────────────────────────────
function ScoreHero({
  pct,
  correctCount,
  totalCount,
  elapsedSeconds,
  rpcResult,
  examMeta,
}) {
  const cfg = getScoreConfig(pct ?? 0);
  const wrong =
    correctCount != null && totalCount != null
      ? totalCount -
        correctCount -
        (totalCount - (rpcResult?.answered_count ?? totalCount))
      : null;
  const skipped =
    rpcResult?.skipped_count ??
    (totalCount != null && correctCount != null
      ? Math.max(0, totalCount - (rpcResult?.answered_count ?? totalCount))
      : null);

  // Izračun iz dostupnih podataka
  const correctNum = correctCount ?? 0;
  const totalNum = totalCount ?? 0;
  const skippedNum = skipped ?? 0;
  const wrongNum = Math.max(0, totalNum - correctNum - skippedNum);

  const elapsed = formatElapsed(rpcResult?.elapsed_seconds ?? elapsedSeconds);
  const hasPoints = examMeta?.total_points != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("rounded-2xl border-2 p-6 mb-2", cfg.bgCls, cfg.borderCls)}
    >
      {/* Top row: ring + tekst */}
      <div className="flex items-center gap-6 mb-5">
        <ScoreRing pct={pct ?? 0} cfg={cfg} />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-warm-500 uppercase tracking-widest mb-1">
            Rezultat ispita
          </p>
          <h1
            className={cn(
              "text-2xl font-black leading-tight mb-1",
              cfg.textCls,
            )}
          >
            {cfg.emoji} {cfg.label}
          </h1>

          {/* Bodovi ako postoje */}
          {hasPoints && correctCount != null && (
            <p className="text-sm text-warm-600 font-medium">
              ≈ {Math.round((correctCount / totalNum) * examMeta.total_points)}{" "}
              / {examMeta.total_points} bodova
            </p>
          )}

          {/* Vrijeme */}
          {elapsed && (
            <p className="text-xs text-warm-400 mt-1 flex items-center gap-1.5">
              <Clock size={11} />
              Riješeno za {elapsed}
            </p>
          )}
        </div>
      </div>

      {/* Pills: točno / netočno / preskočeno */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-3 bg-white/70 rounded-xl border border-green-200/60">
          <p className="text-xl font-black text-green-600 tabular-nums leading-none mb-1">
            {correctNum}
          </p>
          <p className="text-[11px] font-semibold text-green-700/80">Točno</p>
        </div>
        <div className="text-center p-3 bg-white/70 rounded-xl border border-red-200/60">
          <p className="text-xl font-black text-red-500 tabular-nums leading-none mb-1">
            {wrongNum}
          </p>
          <p className="text-[11px] font-semibold text-red-600/80">Netočno</p>
        </div>
        <div className="text-center p-3 bg-white/70 rounded-xl border border-warm-200/60">
          <p className="text-xl font-black text-warm-500 tabular-nums leading-none mb-1">
            {skippedNum}
          </p>
          <p className="text-[11px] font-semibold text-warm-500">Preskočeno</p>
        </div>
      </div>

      {/* Stacked progress bar */}
      <StackedBar
        correct={correctNum}
        wrong={wrongNum}
        skipped={skippedNum}
        total={totalNum}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2.5 flex-wrap">
        {[
          { color: "bg-green-500", label: "Točno" },
          { color: "bg-red-400", label: "Netočno" },
          { color: "bg-warm-300", label: "Preskočeno" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", color)}
            />
            <span className="text-[11px] text-warm-500 font-medium">
              {label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER TABS
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: "all", label: "Sva pitanja", icon: null },
  { id: "wrong", label: "Netočna", icon: XCircle },
  { id: "skipped", label: "Preskočena", icon: Minus },
  { id: "flagged", label: "Označena", icon: Flag },
];

function FilterTabs({ active, onChange, counts }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {FILTERS.map(({ id, label, icon: Icon }) => {
        const count = counts[id];
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              isActive
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-white text-warm-600 border border-warm-200 hover:border-warm-300 hover:bg-warm-50",
            )}
          >
            {Icon && <Icon size={11} />}
            {label}
            {count != null && count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none",
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-warm-100 text-warm-600",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION REVIEW CARD
// ─────────────────────────────────────────────────────────────────────────────
function QuestionReview({
  question,
  chosenLetter,
  answerInfo,
  passage,
  loadingKey,
  index,
}) {
  const [expanded, setExpanded] = useState(false);

  const isSkipped = !chosenLetter;
  const isCorrect = answerInfo?.isCorrect ?? false;
  const correctLetter = answerInfo?.correctOption ?? null;
  const explanation = answerInfo?.explanation ?? null;

  // Automatski otvori netočna pitanja
  const autoExpand = !isCorrect && !isSkipped && !loadingKey;
  useEffect(() => {
    if (autoExpand) setExpanded(true);
  }, [autoExpand]);

  const statusIcon = isSkipped ? (
    <Minus size={16} className="text-warm-400 flex-shrink-0" />
  ) : isCorrect ? (
    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
  ) : (
    <XCircle size={16} className="text-red-500 flex-shrink-0" />
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-colors bg-white",
        isSkipped
          ? "border-warm-200"
          : isCorrect
            ? "border-green-200"
            : "border-red-200",
      )}
    >
      {/* ── Header (uvijek vidljiv) ─────────────────────────────────── */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02] transition-colors"
      >
        {/* Status */}
        <div className="mt-0.5">{statusIcon}</div>

        {/* Broj + tekst pitanja */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "inline-block text-[10px] font-black px-1.5 py-0.5 rounded mr-1.5 mb-0.5",
              isSkipped
                ? "bg-warm-100 text-warm-500"
                : isCorrect
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700",
            )}
          >
            {question.positionLabel ?? String(question.position ?? 0)}
          </span>
          {/* SafeHtml — renderira HTML iz pitanja, ne strippe ga */}
          <SafeHtml
            html={question.text}
            inline
            className="text-sm text-warm-800 leading-snug line-clamp-2"
          />
        </div>

        {/* Odabrani / točni badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          {chosenLetter && (
            <span
              className={cn(
                "text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2",
                isCorrect
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-red-100 text-red-600 border-red-300",
              )}
            >
              {chosenLetter.toUpperCase()}
            </span>
          )}
          {!isCorrect && correctLetter && (
            <span className="text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 bg-green-100 text-green-700 border-green-300">
              {correctLetter.toUpperCase()}
            </span>
          )}
          <ChevronDown
            size={14}
            className={cn(
              "text-warm-300 transition-transform flex-shrink-0",
              expanded && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* ── Expanded detalji ───────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-warm-100 pt-3">
              {/* Passage badge */}
              {passage && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <BookOpen
                    size={12}
                    className="text-amber-600 flex-shrink-0"
                  />
                  <span className="text-xs text-amber-800 font-medium">
                    Polazni tekst: {passage.title ?? "Priloženi tekst"}
                  </span>
                </div>
              )}

              {/* Loading skeleton za opcije dok se dohvaća answerKey */}
              {loadingKey ? (
                <div className="space-y-2">
                  {[...Array(question.options?.length || 4)].map((_, i) => (
                    <div key={i} className="h-9 rounded-lg skeleton-shimmer" />
                  ))}
                </div>
              ) : (
                /* Sve opcije */
                question.options?.length > 0 && (
                  <div className="space-y-1.5">
                    {question.options.map((opt) => {
                      const isCorrectOpt = opt.letter === correctLetter;
                      const isUserPick = opt.letter === chosenLetter;
                      const isNeutral = !isCorrectOpt && !isUserPick;

                      return (
                        <div
                          key={opt.id ?? opt.letter}
                          className={cn(
                            "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-none",
                            isCorrectOpt
                              ? "bg-green-50 border-green-300"
                              : isUserPick && !isCorrectOpt
                                ? "bg-red-50 border-red-300"
                                : "bg-warm-50 border-warm-200",
                          )}
                        >
                          {/* Letter circle */}
                          <span
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5",
                              isCorrectOpt
                                ? "bg-green-200 text-green-800"
                                : isUserPick
                                  ? "bg-red-200 text-red-700"
                                  : "bg-warm-200 text-warm-600",
                            )}
                          >
                            {opt.letter.toUpperCase()}
                          </span>

                          {/* Tekst opcije — SafeHtml */}
                          <SafeHtml
                            html={opt.text}
                            inline
                            className={cn(
                              "flex-1 leading-snug",
                              isCorrectOpt
                                ? "text-green-900 font-medium"
                                : isUserPick
                                  ? "text-red-800 line-through opacity-75"
                                  : "text-warm-600",
                            )}
                          />

                          {/* Status ikona desno */}
                          {isCorrectOpt && (
                            <CheckCircle2
                              size={14}
                              className="text-green-600 flex-shrink-0 mt-0.5"
                            />
                          )}
                          {isUserPick && !isCorrectOpt && (
                            <XCircle
                              size={14}
                              className="text-red-400 flex-shrink-0 mt-0.5"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Objašnjenje — SafeHtml */}
              {explanation && (
                <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <Lightbulb
                    size={14}
                    className="text-blue-500 flex-shrink-0 mt-0.5"
                  />
                  <SafeHtml
                    html={explanation}
                    className="text-xs text-blue-900 leading-relaxed"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION REVIEW — sklopiva sekcija s mini progress barom
// ─────────────────────────────────────────────────────────────────────────────
function SectionReview({
  sectionLabel,
  questions,
  answers,
  answerKey,
  passages,
  flagged,
  filter,
  loadingKey,
}) {
  const [open, setOpen] = useState(true);

  // Filtriraj pitanja po odabranom filteru
  const filtered = useMemo(() => {
    const scoreable = questions.filter(
      (q) =>
        (q.sectionLabel ?? "Ostalo") === sectionLabel &&
        q.questionType !== "fill_blank_mc",
    );
    if (filter === "all") return scoreable;
    if (filter === "wrong")
      return scoreable.filter(
        (q) => answers[q.id] && !answerKey?.[q.id]?.isCorrect,
      );
    if (filter === "skipped") return scoreable.filter((q) => !answers[q.id]);
    if (filter === "flagged")
      return scoreable.filter((q) => flagged?.has(q.id));
    return scoreable;
  }, [questions, sectionLabel, filter, answers, answerKey, flagged]);

  // Statistike za sekciju (uvijek na svim pitanjima, ne na filtriranim)
  const allScoreable = questions.filter(
    (q) =>
      (q.sectionLabel ?? "Ostalo") === sectionLabel &&
      q.questionType !== "fill_blank_mc",
  );
  const correctInSection = allScoreable.filter(
    (q) => answerKey?.[q.id]?.isCorrect,
  ).length;
  const pctSection =
    allScoreable.length > 0
      ? Math.round((correctInSection / allScoreable.length) * 100)
      : 0;

  if (filtered.length === 0) return null;

  return (
    <div className="mb-3">
      {/* Header sekcije */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-2.5 px-1 group mb-2"
      >
        <h3 className="text-sm font-bold text-warm-800 group-hover:text-warm-900 transition-colors">
          {sectionLabel}
        </h3>
        <div className="flex items-center gap-3">
          {/* Mini section progress bar */}
          {!loadingKey && (
            <div className="flex items-center gap-2 hidden sm:flex">
              <div className="w-20 h-1.5 bg-warm-100 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    pctSection >= 75
                      ? "bg-green-500"
                      : pctSection >= 50
                        ? "bg-amber-400"
                        : "bg-red-400",
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${pctSection}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-bold tabular-nums w-8 text-right",
                  pctSection >= 75
                    ? "text-green-600"
                    : pctSection >= 50
                      ? "text-amber-600"
                      : "text-red-600",
                )}
              >
                {pctSection}%
              </span>
            </div>
          )}
          <span className="text-xs text-warm-400">
            {correctInSection}/{allScoreable.length}
          </span>
          {open ? (
            <ChevronUp size={14} className="text-warm-300" />
          ) : (
            <ChevronDown size={14} className="text-warm-300" />
          )}
        </div>
      </button>

      {/* Lista pitanja */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2"
          >
            {filtered.map((q, idx) => (
              <QuestionReview
                key={q.id}
                question={q}
                index={idx}
                chosenLetter={answers[q.id] ?? null}
                answerInfo={answerKey?.[q.id] ?? null}
                passage={q.passageId ? (passages?.[q.passageId] ?? null) : null}
                loadingKey={loadingKey}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANSWER KEY ERROR BANNER
// ─────────────────────────────────────────────────────────────────────────────
function AnswerKeyError({ onRetry }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
      <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-900">
          Točni odgovori nisu dostupni
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Nije moguće dohvatiti točne odgovore. Provjeri internetsku vezu.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex-shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2"
      >
        Pokušaj ponovo
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function ResultsPage() {
  const { examId: examIdParam, attemptId: attemptIdParam } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const lastResult = useExamStore((s) => s.lastResult);
  const hasStoreResult =
    !!lastResult &&
    (!examIdParam || lastResult.examId === examIdParam) &&
    (!attemptIdParam || lastResult.attemptId === attemptIdParam);

  const {
    data: attemptData,
    isLoading: loadingAttempt,
    error: attemptError,
  } = useQuery({
    queryKey: ["attempt", attemptIdParam],
    queryFn: () => attemptApi.getById(attemptIdParam),
    enabled: !hasStoreResult && !!attemptIdParam,
    retry: 1,
  });

  const {
    data: examContent,
    isLoading: loadingExam,
    error: examError,
  } = useQuery({
    queryKey: ["exam-with-questions", attemptData?.exam_id],
    queryFn: () => examApi.getWithQuestions(attemptData.exam_id),
    enabled: !hasStoreResult && !!attemptData?.exam_id,
    staleTime: Infinity,
  });

  const effectiveAttemptId = hasStoreResult
    ? lastResult?.attemptId
    : (attemptData?.id ?? attemptIdParam);

  const {
    data: answerKey,
    isLoading: loadingKey,
    error: keyError,
    refetch: retryKey,
  } = useQuery({
    queryKey: ["answer-key", effectiveAttemptId],
    queryFn: () => examApi.getAnswerKey(effectiveAttemptId),
    enabled: !!effectiveAttemptId,
    staleTime: Infinity,
    retry: 2,
  });

  const resolvedData = useMemo(() => {
    if (hasStoreResult && lastResult) {
      return {
        examId: lastResult.examId,
        attemptId: lastResult.attemptId,
        questions: lastResult.questions ?? [],
        answers: lastResult.answers ?? {},
        passages: lastResult.passages ?? {},
        flagged: lastResult.flagged ?? new Set(),
        elapsedSeconds: lastResult.elapsedSeconds ?? null,
        rpcResult: lastResult.rpcResult ?? null,
        examMeta: lastResult.examMeta ?? null,
      };
    }

    if (!attemptData || !examContent) return null;

    const restoredAnswers = (attemptData.attempt_answers ?? []).reduce(
      (acc, row) => {
        acc[row.question_id] = row.chosen_option ?? null;
        return acc;
      },
      {},
    );

    return {
      examId: attemptData.exam_id,
      attemptId: attemptData.id,
      questions: examContent.questions ?? [],
      answers: restoredAnswers,
      passages: examContent.passages ?? {},
      flagged: new Set(),
      elapsedSeconds: attemptData.elapsed_seconds ?? null,
      rpcResult: {
        score_pct: attemptData.score_pct,
        correct_count: attemptData.correct_count,
        total_count: attemptData.total_count,
        elapsed_seconds: attemptData.elapsed_seconds,
        answered_count: (attemptData.attempt_answers ?? []).filter(
          (row) => row.chosen_option != null,
        ).length,
        skipped_count: (attemptData.attempt_answers ?? []).filter(
          (row) => row.chosen_option == null,
        ).length,
      },
      examMeta: attemptData.exam ?? examContent.exam ?? null,
    };
  }, [hasStoreResult, lastResult, attemptData, examContent]);

  if (!hasStoreResult && !attemptIdParam) {
    return (
      <PageWrapper className="max-w-2xl mx-auto py-10">
        <div className="p-5 rounded-xl border border-warm-300 bg-warm-100">
          <p className="text-sm font-semibold text-warm-800">
            Rezultat nije dostupan.
          </p>
          <p className="text-sm text-warm-600 mt-1">
            Otvori rezultat preko trajnog linka oblika
            <span className="font-mono"> /rezultati/pokusaj/:attemptId</span>.
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (!hasStoreResult && (loadingAttempt || loadingExam)) {
    return (
      <PageWrapper className="max-w-2xl mx-auto py-12">
        <div className="flex items-center gap-2 text-warm-600 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
          Učitavanje rezultata pokušaja...
        </div>
      </PageWrapper>
    );
  }

  if (attemptError || examError || !resolvedData) {
    return (
      <PageWrapper className="max-w-2xl mx-auto py-10">
        <div className="p-5 rounded-xl border border-red-200 bg-red-50">
          <p className="text-sm font-semibold text-red-700">
            Rezultat nije dostupan ili attemptId ne postoji.
          </p>
          <p className="text-sm text-red-600 mt-1">
            Provjeri poveznicu ili pokušaj kasnije.
          </p>
        </div>
      </PageWrapper>
    );
  }

  const {
    questions,
    answers,
    passages,
    flagged,
    elapsedSeconds,
    rpcResult,
    examMeta,
    examId,
  } = resolvedData;

  const pct = rpcResult?.score_pct ?? null;
  const correctCount = rpcResult?.correct_count ?? null;
  const totalCount =
    rpcResult?.total_count ??
    questions.filter((q) => q.questionType !== "fill_blank_mc").length;

  const subjectId = examMeta?.subject_id ?? examId?.split("-")[0];
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  const backLink = subject ? `/predmeti/${subject.id}` : "/";

  const sections = useMemo(
    () => [...new Set(questions.map((q) => q.sectionLabel ?? "Ostalo"))],
    [questions],
  );

  const scoreable = questions.filter((q) => q.questionType !== "fill_blank_mc");
  const filterCounts = useMemo(
    () => ({
      all: scoreable.length,
      wrong: scoreable.filter(
        (q) => answers[q.id] && !answerKey?.[q.id]?.isCorrect,
      ).length,
      skipped: scoreable.filter((q) => !answers[q.id]).length,
      flagged: scoreable.filter((q) => flagged?.has?.(q.id)).length,
    }),
    [scoreable, answers, answerKey, flagged],
  );

  return (
    <>
      <PageWrapper className="max-w-2xl mx-auto pb-24">
        <Confetti active={pct !== null && pct >= 75} />

        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-warm-800 mb-5 transition-colors font-medium"
        >
          <ArrowLeft size={15} />
          Natrag na ispite
        </Link>

        {examMeta && (
          <p className="text-xs text-warm-500 mb-3">
            {subject?.name ?? subjectId?.toUpperCase()} · {examMeta.year}. ·{" "}
            {examMeta.session} · {examMeta.level}
          </p>
        )}
        {pct !== null && (
          <ScoreHero
            pct={pct}
            correctCount={correctCount}
            totalCount={totalCount}
            elapsedSeconds={elapsedSeconds}
            rpcResult={rpcResult}
            examMeta={examMeta}
          />
        )}

        {pct === null && (
          <div className="flex items-start gap-3 p-4 bg-warm-100 border border-warm-300 rounded-xl mb-4">
            <AlertCircle
              size={18}
              className="text-warm-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-warm-700">
              Rezultat nije dostupan — možeš svejedno pregledati sve odgovore
              ispod.
            </p>
          </div>
        )}

        {keyError && <AnswerKeyError onRetry={retryKey} />}

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-base font-bold text-warm-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-warm-400" />
              Pregled odgovora
            </h2>
            <FilterTabs
              active={filter}
              onChange={setFilter}
              counts={filterCounts}
            />
          </div>

          {sections.map((section) => (
            <SectionReview
              key={section}
              sectionLabel={section}
              questions={questions}
              answers={answers}
              answerKey={answerKey}
              passages={passages}
              flagged={flagged}
              filter={filter}
              loadingKey={loadingKey}
            />
          ))}

          {sections.every((s) => {
            const sq = questions.filter(
              (q) =>
                (q.sectionLabel ?? "Ostalo") === s &&
                q.questionType !== "fill_blank_mc",
            );
            if (filter === "all") return sq.length === 0;
            if (filter === "wrong")
              return !sq.some(
                (q) => answers[q.id] && !answerKey?.[q.id]?.isCorrect,
              );
            if (filter === "skipped") return !sq.some((q) => !answers[q.id]);
            if (filter === "flagged")
              return !sq.some((q) => flagged?.has?.(q.id));
            return false;
          }) && (
            <div className="text-center py-12">
              <CheckCircle2
                size={32}
                className="text-green-400 mx-auto mb-3"
                strokeWidth={1.5}
              />
              <p className="text-sm font-semibold text-warm-600 mb-1">
                {filter === "wrong" && "Nema netočnih odgovora!"}
                {filter === "skipped" && "Nijedno pitanje nije preskočeno!"}
                {filter === "flagged" &&
                  "Nijedno pitanje nije označeno zastavicom."}
              </p>
              <button
                onClick={() => setFilter("all")}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold underline underline-offset-2 mt-1"
              >
                Prikaži sva pitanja
              </button>
            </div>
          )}
        </div>
      </PageWrapper>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-warm-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <Link
            to={backLink}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-warm-300 text-warm-700 hover:bg-warm-50 transition-colors"
          >
            <ArrowLeft size={14} />
            Natrag
          </Link>

          <button
            onClick={() => navigate(examId ? `/ispit/${examId}` : "/")}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-[0_2px_8px_-2px_rgba(45,84,232,0.4)]"
          >
            <RotateCcw size={14} />
            Pokušaj ponovo
          </button>
        </div>
      </div>
    </>
  );
}
