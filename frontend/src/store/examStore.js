import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const setReplacer = (_key, value) =>
  value instanceof Set ? { __type: "Set", values: [...value] } : value;

const setReviver = (_key, value) =>
  value?.__type === "Set" ? new Set(value.values) : value;

const sessionStorageWithSet = {
  getItem: (name) => {
    const str = sessionStorage.getItem(name);
    if (!str) return null;
    return JSON.parse(str, setReviver);
  },
  setItem: (name, value) =>
    sessionStorage.setItem(name, JSON.stringify(value, setReplacer)),
  removeItem: (name) => sessionStorage.removeItem(name),
};

export const useExamStore = create(
  persist(
    (set, get) => ({
      // ─── Aktivna sesija ─────────────────────────────────────
      examId: null,
      questions: [],
      answers: {}, // { questionId: selectedOptionId }
      flagged: new Set(), // FIX: Set umjesto Array
      currentIndex: 0,
      startedAt: null,
      submittedAt: null,

      // ─── Posljednji rezultat (čita ExamResults) ─────────────
      lastResult: null, // { examId, answers, questions, submittedAt, elapsedSeconds }

      // ─── Actions ────────────────────────────────────────────
      startExam: (examId, questions) =>
        set({
          examId,
          questions,
          answers: {},
          flagged: new Set(),
          currentIndex: 0,
          startedAt: Date.now(),
          submittedAt: null,
        }),

      // Restoriraj odgovore iz draftStorage (kad korisnik potvrdi nastavak)
      restoreDraft: (savedAnswers) =>
        set((state) => ({
          answers: { ...state.answers, ...savedAnswers },
        })),

      setAnswer: (questionId, optionId) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: optionId },
        })),

      // FIX: Set operacije umjesto filter/includes
      toggleFlag: (questionId) =>
        set((state) => {
          const next = new Set(state.flagged);
          next.has(questionId) ? next.delete(questionId) : next.add(questionId);
          return { flagged: next };
        }),

      goToQuestion: (index) => set({ currentIndex: index }),

      // FIX: submitExam sprema lastResult → nema više location.state problema
      submitExam: () => {
        const { examId, answers, questions, startedAt } = get();
        const submittedAt = Date.now();
        const elapsedSeconds = Math.round(
          (submittedAt - (startedAt ?? submittedAt)) / 1000,
        );

        set({
          submittedAt,
          lastResult: {
            examId,
            answers,
            questions,
            submittedAt,
            elapsedSeconds,
          },
        });
      },

      resetExam: () =>
        set({
          examId: null,
          questions: [],
          answers: {},
          flagged: new Set(),
          currentIndex: 0,
          startedAt: null,
          submittedAt: null,
          // lastResult se namjerno ne resetira — dostupan je u ExamResults
        }),

      // ─── Derived selectors ──────────────────────────────────
      getProgress: () => {
        const { answers, questions } = get();
        return questions.length > 0
          ? Math.round((Object.keys(answers).length / questions.length) * 100)
          : 0;
      },

      getUnansweredCount: () => {
        const { answers, questions } = get();
        return questions.filter((q) => !answers[q.id]).length;
      },
    }),
    {
      name: "exam-session",
      storage: createJSONStorage(() => sessionStorageWithSet),
      // Persist samo što je potrebno — ne persisti derived state
      partialize: (s) => ({
        examId: s.examId,
        questions: s.questions,
        answers: s.answers,
        flagged: s.flagged,
        currentIndex: s.currentIndex,
        startedAt: s.startedAt,
        lastResult: s.lastResult,
      }),
    },
  ),
);
