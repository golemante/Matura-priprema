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

  setAnswer: (questionId, letter) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: letter } })),

  restoreDraft: (savedAnswers) => set({ answers: { ...(savedAnswers ?? {}) } }),

  toggleFlag: (questionId) =>
    set((s) => {
      const next = new Set(s.flagged);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return { flagged: next };
    }),

  goToQuestion: (index) => set({ currentIndex: index }),

  pauseExam: () => set({ isPaused: true, pausedAt: Date.now() }),
  resumeExam: () => set({ isPaused: false, pausedAt: null }),

  submitExam: (rpcResult = null, trustedElapsed = null) => {
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

    const elapsedSeconds =
      trustedElapsed != null
        ? Math.max(0, Math.round(trustedElapsed))
        : Math.round((submittedAt - (startedAt ?? submittedAt)) / 1000);

    const flaggedArray = Array.from(get().flagged);

    set({
      submittedAt,
      lastResult: {
        examId,
        attemptId,
        answers,
        questions,
        passages,
        flagged: flaggedArray,
        examMeta,
        submittedAt,
        elapsedSeconds,
        rpcResult,
      },
    });
  },

  resetExam: () => set({ ...INITIAL_STATE, flagged: new Set() }),

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
