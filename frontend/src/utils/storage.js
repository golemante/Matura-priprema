// utils/storage.js
import { useAuthStore } from "@/store/authStore";

const PREFIX = "matura_";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dana

function getUserId() {
  return useAuthStore.getState().user?.id ?? "anon";
}

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
  _key: (examId) => `draft_${getUserId()}_${examId}`,

  save: (examId, answers = {}, attemptId = null) =>
    storage.set(draftStorage._key(examId), {
      answers,
      attemptId,
      savedAt: Date.now(),
      expiresAt: Date.now() + DRAFT_TTL_MS,
    }),

  load: (examId) => {
    const draft = storage.get(draftStorage._key(examId));
    if (!draft) return null;
    const expiresAt = draft.expiresAt ?? 0;
    if (Date.now() > expiresAt) {
      storage.remove(draftStorage._key(examId));
      console.info(`[draftStorage] Draft za examId="${examId}" je istekao.`);
      return null;
    }
    return draft;
  },

  clear: (examId) => storage.remove(draftStorage._key(examId)),

  setAttemptId: (examId, attemptId) => {
    const key = draftStorage._key(examId);
    const existing = storage.get(key) ?? {};
    storage.set(key, { ...existing, attemptId });
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

export const audioProgressStorage = {
  _key: (examId) => `audio_${getUserId()}_${examId}`,

  save: (
    examId,
    { trackIndex, trackUrl = null, currentTime, isDone = false },
  ) => {
    storage.set(audioProgressStorage._key(examId), {
      trackIndex,
      trackUrl,
      currentTime,
      isDone,
      savedAt: Date.now(),
      expiresAt: Date.now() + DRAFT_TTL_MS,
    });
  },

  load: (examId) => {
    const data = storage.get(audioProgressStorage._key(examId));
    if (!data) return null;
    if (Date.now() > (data.expiresAt ?? 0)) {
      storage.remove(audioProgressStorage._key(examId));
      return null;
    }
    return {
      trackIndex: data.trackIndex ?? 0,
      trackUrl: data.trackUrl ?? null,
      currentTime: data.currentTime ?? 0,
      isDone: data.isDone ?? false,
    };
  },

  clear: (examId) => storage.remove(audioProgressStorage._key(examId)),
};

export const questionAudioStorage = {
  _key: (examId) => `qaud_${getUserId()}_${examId}`,

  _load: (examId) => {
    const data = storage.get(questionAudioStorage._key(examId));
    if (!data) return new Set();
    if (Date.now() > (data.expiresAt ?? 0)) {
      storage.remove(questionAudioStorage._key(examId));
      return new Set();
    }
    return new Set(Array.isArray(data.played) ? data.played : []);
  },

  markPlayed: (examId, questionId) => {
    if (!examId || !questionId) return;
    const played = questionAudioStorage._load(examId);
    played.add(questionId);
    storage.set(questionAudioStorage._key(examId), {
      played: [...played],
      savedAt: Date.now(),
      expiresAt: Date.now() + DRAFT_TTL_MS,
    });
  },

  hasPlayed: (examId, questionId) => {
    if (!examId || !questionId) return false;
    return questionAudioStorage._load(examId).has(questionId);
  },

  clear: (examId) => {
    if (!examId) return;
    storage.remove(questionAudioStorage._key(examId));
  },
};
