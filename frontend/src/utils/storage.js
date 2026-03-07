// utils/storage.js
// ─────────────────────────────────────────────────────────────────────────────
// PROMJENE: draftStorage.save sada prima i attemptId
//   → bez njega ne možemo nastaviti prekinutu sesiju u bazi
// ─────────────────────────────────────────────────────────────────────────────
const PREFIX = "matura_";

export const storage = {
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      console.warn("[storage] localStorage pun — draft nije snimljen.");
    }
  },
  remove: (key) => localStorage.removeItem(PREFIX + key),
  clear: () =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k)),
};

// ── Draft odgovora (LocalStorage backup za pad interneta) ─────────────────────
//
// Čuva: { answers, attemptId, savedAt }
//   answers   — { questionId: letter } — duplikat Zustand persista, ali za LocalStorage
//   attemptId — UUID iz Supabase (potreban za finish_attempt nakon refresh-a)
//   savedAt   — timestamp za UI prikaz ("Snimljeno u 14:32")
//
export const draftStorage = {
  save: (examId, answers = {}, attemptId = null) =>
    storage.set(`draft_${examId}`, {
      answers,
      attemptId,
      savedAt: Date.now(),
    }),

  load: (examId) => storage.get(`draft_${examId}`),

  clear: (examId) => storage.remove(`draft_${examId}`),

  // Ažuriraj samo attemptId bez mijenjanja answers
  setAttemptId: (examId, attemptId) => {
    const existing = storage.get(`draft_${examId}`) ?? {};
    storage.set(`draft_${examId}`, { ...existing, attemptId });
  },
};
