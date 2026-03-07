// store/examStore.js
// ─────────────────────────────────────────────────────────────────────────────
// PROMJENE u odnosu na staru verziju:
//   • DODANO: passages — mapa { passageId: passageObject } za O(1) lookup
//   • DODANO: attemptId — UUID kreiran pri startu ispita (potreban za RPC)
//   • DODANO: isPaused, pausedAt — stanje pauze za UI blokadu
//   • DODANO: pauseExam / resumeExam akcije
//   • DODANO: setAttemptId akcija
//   • answers format ostaje { questionId: letter } — slova 'a'|'b'|'c'|'d'
//   • questions VIŠE NEMAJU 'correct' polje (vidi examApi.js)
//   • lastResult.rpcResult — čuva odgovor iz finish_attempt RPC-a
// ─────────────────────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Custom Set serijalizacija (nepromijenjeno) ────────────────────────────────
const setReplacer = (_key, value) =>
  value instanceof Set ? { __type: "Set", values: [...value] } : value;

const setReviver = (_key, value) =>
  value?.__type === "Set" ? new Set(value.values) : value;

const sessionStorageWithSet = {
  getItem: (name) => {
    try {
      const str = sessionStorage.getItem(name);
      if (!str) return null;
      return JSON.parse(str, setReviver);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      sessionStorage.setItem(name, JSON.stringify(value, setReplacer));
    } catch {
      // sessionStorage full — tiho ignoriraj
    }
  },
  removeItem: (name) => sessionStorage.removeItem(name),
};

export const useExamStore = create(
  persist(
    (set, get) => ({
      // ─── Aktivna sesija ──────────────────────────────────────────────────
      examId: null,
      attemptId: null, // UUID iz Supabase attempts tablice
      questions: [], // bez correct_option
      passages: {}, // { passageId: { id, title, content, footnotes, ... } }
      answers: {}, // { questionId: letter } — 'a'|'b'|'c'|'d'
      flagged: new Set(),
      currentIndex: 0,
      startedAt: null,
      submittedAt: null,
      isPaused: false,
      pausedAt: null,

      // ─── Posljednji rezultat ─────────────────────────────────────────────
      lastResult: null,
      // Struktura lastResult:
      // {
      //   examId,
      //   attemptId,
      //   answers,             ← kopija answers pri predaji
      //   questions,           ← kopija questions (za prikaz u Results)
      //   passages,            ← kopija passages
      //   submittedAt,
      //   elapsedSeconds,
      //   rpcResult: {         ← direktan odgovor finish_attempt RPC-a
      //     correct_count,
      //     total_count,
      //     score_pct,
      //     elapsed_seconds,
      //   }
      // }

      // ─── Actions ─────────────────────────────────────────────────────────

      startExam: (examId, questions, passages = {}) =>
        set({
          examId,
          attemptId: null, // setAttemptId() se zove async nakon create()
          questions,
          passages,
          answers: {},
          flagged: new Set(),
          currentIndex: 0,
          startedAt: Date.now(),
          submittedAt: null,
          isPaused: false,
          pausedAt: null,
        }),

      setAttemptId: (attemptId) => set({ attemptId }),

      restoreDraft: (savedAnswers) =>
        set((state) => ({
          answers: { ...state.answers, ...savedAnswers },
        })),

      setAnswer: (questionId, letter) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: letter },
        })),

      toggleFlag: (questionId) =>
        set((state) => {
          const current =
            state.flagged instanceof Set
              ? state.flagged
              : new Set(state.flagged?.values ?? []);
          const next = new Set(current);
          next.has(questionId) ? next.delete(questionId) : next.add(questionId);
          return { flagged: next };
        }),

      goToQuestion: (index) => set({ currentIndex: index }),

      pauseExam: () =>
        set({
          isPaused: true,
          pausedAt: Date.now(),
        }),

      resumeExam: () =>
        set({
          isPaused: false,
          pausedAt: null,
        }),

      submitExam: (rpcResult = null) => {
        const { examId, attemptId, answers, questions, passages, startedAt } =
          get();
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
            submittedAt,
            elapsedSeconds,
            rpcResult, // null ako je predaja offline (fallback)
          },
        });
      },

      resetExam: () =>
        set({
          examId: null,
          attemptId: null,
          questions: [],
          passages: {},
          answers: {},
          flagged: new Set(),
          currentIndex: 0,
          startedAt: null,
          submittedAt: null,
          isPaused: false,
          pausedAt: null,
        }),

      // ─── Derived selectors ─────────────────────────────────────────────
      getProgress: () => {
        const { answers, questions } = get();
        // fill_blank_mc parent se ne broji (nema answer)
        const scoreable = questions.filter(
          (q) => q.questionType !== "fill_blank_mc",
        );
        return scoreable.length > 0
          ? Math.round(
              (Object.keys(answers).filter((id) =>
                scoreable.some((q) => q.id === id),
              ).length /
                scoreable.length) *
                100,
            )
          : 0;
      },

      getUnansweredCount: () => {
        const { answers, questions } = get();
        return questions.filter(
          (q) => q.questionType !== "fill_blank_mc" && !answers[q.id],
        ).length;
      },

      // Grupiraj pitanja po sectionLabel za navigator
      getQuestionsBySection: () => {
        const { questions } = get();
        return questions.reduce((acc, q) => {
          const key = q.sectionLabel ?? "Ostalo";
          if (!acc[key]) acc[key] = [];
          acc[key].push(q);
          return acc;
        }, {});
      },
    }),
    {
      name: "exam-session",
      storage: sessionStorageWithSet,
      partialize: (s) => ({
        examId: s.examId,
        attemptId: s.attemptId,
        questions: s.questions,
        passages: s.passages,
        answers: s.answers,
        flagged: s.flagged,
        currentIndex: s.currentIndex,
        startedAt: s.startedAt,
        isPaused: s.isPaused,
        lastResult: s.lastResult,
      }),
    },
  ),
);
