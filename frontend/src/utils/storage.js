// utils/storage.js — type-safe localStorage wrapper s error handlingom
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
      console.warn("localStorage full");
    }
  },
  remove: (key) => localStorage.removeItem(PREFIX + key),
  clear: () =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k)),
};

// Specifičan helper za draft odgovore (ako korisnik napusti stranicu)
export const draftStorage = {
  save: (examId, answers) =>
    storage.set(`draft_${examId}`, { answers, savedAt: Date.now() }),
  load: (examId) => storage.get(`draft_${examId}`),
  clear: (examId) => storage.remove(`draft_${examId}`),
};
