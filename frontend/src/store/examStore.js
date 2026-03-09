// store/examStore.js — v7
// ─────────────────────────────────────────────────────────────────────────────
import { create } from "zustand";

const INITIAL_STATE = {
  examId: null,
  attemptId: null,
  questions: [],
  passages: {},
  examMeta: null,
  answers: {},
  flagged: new Set(),
  currentIndex: 0,
  startedAt: null,
  submittedAt: null,
  isPaused: false,
  pausedAt: null,
  lastResult: null,
};

export const useExamStore = create((set, get) => ({
  ...INITIAL_STATE,

  // ── Inicijalizacija ────────────────────────────────────────────────────────
  startExam: (examId, questions, passages) =>
    set({
      ...INITIAL_STATE,
      flagged: new Set(),
      examId,
      questions,
      passages,
      startedAt: Date.now(),
    }),

  setExamMeta: (meta) => set({ examMeta: meta }),
  setAttemptId: (id) => set({ attemptId: id }),

  // ── Odgovori ──────────────────────────────────────────────────────────────
  setAnswer: (questionId, letter) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: letter } })),

  restoreDraft: (savedAnswers) => set({ answers: { ...(savedAnswers ?? {}) } }),

  // ── Zastavice ─────────────────────────────────────────────────────────────
  toggleFlag: (questionId) =>
    set((s) => {
      const next = new Set(s.flagged);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return { flagged: next };
    }),

  // ── Navigacija ────────────────────────────────────────────────────────────
  goToQuestion: (index) => set({ currentIndex: index }),

  // ── Pauza ─────────────────────────────────────────────────────────────────
  pauseExam: () => set({ isPaused: true, pausedAt: Date.now() }),
  resumeExam: () => set({ isPaused: false, pausedAt: null }),

  // ── Predaja ───────────────────────────────────────────────────────────────
  submitExam: (rpcResult = null) => {
    const {
      examId,
      attemptId,
      answers,
      questions,
      passages,
      startedAt,
      examMeta,
    } = get();
    const submittedAt = Date.now();
    const elapsedSeconds = Math.round(
      (submittedAt - (startedAt ?? submittedAt)) / 1000,
    );
    set({
      submittedAt,
      lastResult: {
        examId,
        attemptId,
        answers,
        questions,
        passages,
        flagged: get().flagged,
        examMeta,
        submittedAt,
        elapsedSeconds,
        rpcResult,
      },
    });
  },

  // ── Reset ─────────────────────────────────────────────────────────────────
  resetExam: () => set({ ...INITIAL_STATE, flagged: new Set() }),

  // ── Computed ──────────────────────────────────────────────────────────────
  getProgress: () => {
    const { answers, questions } = get();
    const scoreable = questions.filter(
      (q) => q.questionType !== "fill_blank_mc",
    );
    if (!scoreable.length) return 0;
    return Math.round(
      (scoreable.filter((q) => answers[q.id] != null).length /
        scoreable.length) *
        100,
    );
  },

  getUnansweredCount: () => {
    const { answers, questions } = get();
    return questions.filter(
      (q) => q.questionType !== "fill_blank_mc" && answers[q.id] == null,
    ).length;
  },

  getQuestionsBySection: () => {
    const { questions } = get();
    return questions.reduce((acc, q) => {
      const key = q.sectionLabel ?? "Ostalo";
      if (!acc[key]) acc[key] = [];
      acc[key].push(q);
      return acc;
    }, {});
  },
}));
