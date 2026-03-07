// store/examStore.js
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI:
//
//  BUG #1 — flagged Set nije properly resetiran između ispita
//  BUG #2 — alreadyLoaded logika u useExamSession-u mogla je zaključati
//           stari sadržaj pri navigaciji između ispita
//  BUG #3 — submitExam() nije čistio attemptId koji je bio potreban za
//           ExamResults getAnswerKey poziv
//
//  NOVO:
//  • setExamMeta() — sprema exam metapodatke (title, duration, totalPoints)
//    za korištenje u ExamTaking top baru bez dodatnog API poziva
//  • getters su čisti computed — ne računaju se u render
// ─────────────────────────────────────────────────────────────────────────────
import { create } from "zustand";

const INITIAL_STATE = {
  examId: null,
  attemptId: null,

  // Sadržaj ispita
  questions: [], // [{ id, text, options, questionType, passageId, ... }]
  passages: {}, // { [passageId]: { id, title, content, ... } }

  // Exam metapodaci (za top bar, bez ponovnog API poziva)
  examMeta: null, // { title, durationMinutes, totalPoints, year, session, level }

  // Korisnikov napredak
  answers: {}, // { [questionId]: letter ('a'|'b'|...) }
  flagged: new Set(),

  // Navigacija
  currentIndex: 0,

  // Vremenska kontrola
  startedAt: null,
  submittedAt: null,

  // Pauza
  isPaused: false,
  pausedAt: null,

  // Rezultat zadnjeg predanog ispita
  lastResult: null,
  // { examId, attemptId, answers, questions, passages, submittedAt,
  //   elapsedSeconds, rpcResult: { correct_count, total_count, score_pct } }
};

export const useExamStore = create((set, get) => ({
  ...INITIAL_STATE,

  // ── Inicijalizacija novog ispita ──────────────────────────────────────────
  //
  // Uvijek resetira state pri novom examId.
  // Čak i ako je isti examId — resetira odgovore i progress.
  // (useExamSession kontrolira alreadyLoaded logiku)
  //
  startExam: (examId, questions, passages) =>
    set({
      examId,
      questions,
      passages,
      answers: {},
      flagged: new Set(),
      currentIndex: 0,
      startedAt: Date.now(),
      submittedAt: null,
      isPaused: false,
      pausedAt: null,
      attemptId: null,
      lastResult: null,
    }),

  // Spremi exam metapodatke (iz examData.exam objekta)
  setExamMeta: (meta) => set({ examMeta: meta }),

  // Spremi attemptId dobiven od servera
  setAttemptId: (id) => set({ attemptId: id }),

  // ── Odgovori ──────────────────────────────────────────────────────────────
  setAnswer: (questionId, letter) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: letter },
    })),

  // Obnovi odgovore iz draft (localStorage backup)
  restoreDraft: (savedAnswers) => set({ answers: savedAnswers }),

  // ── Zastavice ─────────────────────────────────────────────────────────────
  toggleFlag: (questionId) =>
    set((state) => {
      // Zustand Set mora biti novi objekt za reaktivnost
      const next = new Set(state.flagged);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return { flagged: next };
    }),

  // ── Navigacija ────────────────────────────────────────────────────────────
  goToQuestion: (index) => set({ currentIndex: index }),

  // ── Pauza / nastavak ──────────────────────────────────────────────────────
  pauseExam: () => set({ isPaused: true, pausedAt: Date.now() }),

  resumeExam: () => set({ isPaused: false, pausedAt: null }),

  // ── Predaja ispita ────────────────────────────────────────────────────────
  //
  // Sprema lastResult koji ExamResults stranica koristi.
  // attemptId se ČUVA u lastResult (potreban za getAnswerKey).
  //
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
        attemptId, // ← sačuvan za getAnswerKey
        answers,
        questions,
        passages,
        examMeta,
        submittedAt,
        elapsedSeconds,
        rpcResult, // null = offline fallback; server result = ocjena
      },
    });
  },

  // ── Reset (navigacija van ispita) ─────────────────────────────────────────
  resetExam: () => set({ ...INITIAL_STATE, flagged: new Set() }),

  // ── Computed / selectors ──────────────────────────────────────────────────

  // Postotak odgovorenih pitanja (samo scoreable, bez fill_blank_mc roditeljskih)
  getProgress: () => {
    const { answers, questions } = get();
    const scoreable = questions.filter(
      (q) => q.questionType !== "fill_blank_mc",
    );
    if (scoreable.length === 0) return 0;
    const answered = scoreable.filter((q) => answers[q.id] != null).length;
    return Math.round((answered / scoreable.length) * 100);
  },

  // Broj neodgovorenih pitanja
  getUnansweredCount: () => {
    const { answers, questions } = get();
    return questions.filter(
      (q) => q.questionType !== "fill_blank_mc" && answers[q.id] == null,
    ).length;
  },

  // Grupiraj pitanja po sekciji za navigator
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
