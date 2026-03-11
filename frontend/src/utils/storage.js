// utils/storage.js

const PREFIX = "matura_";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dana

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

export const draftStorage = {
  save: (examId, answers = {}, attemptId = null) =>
    storage.set(`draft_${examId}`, {
      answers,
      attemptId,
      savedAt: Date.now(),
      expiresAt: Date.now() + DRAFT_TTL_MS,
    }),

  load: (examId) => {
    const draft = storage.get(`draft_${examId}`);
    if (!draft) return null;

    const expiresAt = draft.expiresAt ?? 0;
    if (Date.now() > expiresAt) {
      storage.remove(`draft_${examId}`);
      console.info(
        `[draftStorage] Draft za examId="${examId}" je istekao i obrisan.`,
      );
      return null;
    }

    return draft;
  },

  clear: (examId) => storage.remove(`draft_${examId}`),

  setAttemptId: (examId, attemptId) => {
    const existing = storage.get(`draft_${examId}`) ?? {};
    storage.set(`draft_${examId}`, { ...existing, attemptId });
  },

  purgeExpired: () => {
    const now = Date.now();
    const draftPrefix = `${PREFIX}draft_`;
    const expired = Object.keys(localStorage).filter((k) => {
      if (!k.startsWith(draftPrefix)) return false;
      try {
        const item = JSON.parse(localStorage.getItem(k));
        return !item?.expiresAt || now > item.expiresAt;
      } catch {
        return true;
      }
    });

    expired.forEach((k) => localStorage.removeItem(k));

    if (expired.length > 0) {
      console.info(
        `[draftStorage] Obrisano ${expired.length} isteklih draft(ova).`,
      );
    }
  },
};
