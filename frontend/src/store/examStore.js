import { create } from "zustand";

/**
 * Manages the active exam session state.
 * Persists answers, tracks time, and stores results.
 */
export const useExamStore = create((set, get) => ({
  // Current session
  examId: null,
  questions: [],
  answers: {}, // { questionId: selectedOptionId }
  flagged: [], // [questionId, ...]
  currentIndex: 0,
  startedAt: null,
  submittedAt: null,

  // Actions
  startExam: (examId, questions) =>
    set({
      examId,
      questions,
      answers: {},
      flagged: [],
      currentIndex: 0,
      startedAt: Date.now(),
      submittedAt: null,
    }),

  setAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionId },
    })),

  toggleFlag: (questionId) =>
    set((state) => ({
      flagged: state.flagged.includes(questionId)
        ? state.flagged.filter((id) => id !== questionId)
        : [...state.flagged, questionId],
    })),

  goToQuestion: (index) => set({ currentIndex: index }),

  submitExam: () => set({ submittedAt: Date.now() }),

  resetExam: () =>
    set({
      examId: null,
      questions: [],
      answers: {},
      flagged: [],
      currentIndex: 0,
      startedAt: null,
      submittedAt: null,
    }),

  // Selectors
  getProgress: () => {
    const { answers, questions } = get();
    return questions.length > 0
      ? Math.round((Object.keys(answers).length / questions.length) * 100)
      : 0;
  },
}));
