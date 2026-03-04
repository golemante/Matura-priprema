// store/examStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Custom Set serialization ──────────────────────────────────────────────────
// JSON ne podržava Set nativno, pa ga serijaliziramo kao { __type: "Set", values: [...] }

const setReplacer = (_key, value) =>
  value instanceof Set ? { __type: "Set", values: [...value] } : value;

const setReviver = (_key, value) =>
  value?.__type === "Set" ? new Set(value.values) : value;

// FIX: Ne koristimo createJSONStorage jer ono interno radi dodatni JSON.parse
// koji ne koristi naš setReviver → flagged dolazi kao {} umjesto Set → .has() puca.
// Zustand persist prima storage direktno ako storage sam radi ser/deser.
const sessionStorageWithSet = {
  getItem: (name) => {
    try {
      const str = sessionStorage.getItem(name);
      if (!str) return null;
      // Vraćamo parsed objekt — Zustand ga direktno koristi, bez dodatnog parsiranja
      return JSON.parse(str, setReviver);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      // value je već objekt — serijaliziramo ga s Set replacer-om
      sessionStorage.setItem(name, JSON.stringify(value, setReplacer));
    } catch {
      // sessionStorage full (npr. Safari private mode) — tiho ignoriraj
    }
  },
  removeItem: (name) => sessionStorage.removeItem(name),
};

export const useExamStore = create(
  persist(
    (set, get) => ({
      // ─── Aktivna sesija ─────────────────────────────────────
      examId: null,
      questions: [],
      answers: {}, // { questionId: selectedOptionId }
      flagged: new Set(),
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

      restoreDraft: (savedAnswers) =>
        set((state) => ({
          answers: { ...state.answers, ...savedAnswers },
        })),

      setAnswer: (questionId, optionId) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: optionId },
        })),

      toggleFlag: (questionId) =>
        set((state) => {
          // Defensive guard: osiguraj da je flagged uvijek Set
          const current =
            state.flagged instanceof Set
              ? state.flagged
              : new Set(state.flagged?.values ?? []);
          const next = new Set(current);
          next.has(questionId) ? next.delete(questionId) : next.add(questionId);
          return { flagged: next };
        }),

      goToQuestion: (index) => set({ currentIndex: index }),

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
      // FIX: storage direktno (bez createJSONStorage wrappera)
      storage: sessionStorageWithSet,
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
