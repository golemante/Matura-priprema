// store/toastStore.js
import { create } from "zustand";

// Timeout map živi VAN stora da ne trigerira reaktivnost Zustand-a
const timeoutIds = new Map();

const useToastStore = create((set) => ({
  toasts: [],

  add: (toastConfig) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = toastConfig.duration ?? 4000;

    set((s) => ({ toasts: [...s.toasts, { ...toastConfig, id }] }));

    // Pohrani timeout id da ga možemo cancelati ako se toast ručno zatvori
    const timeoutId = setTimeout(() => {
      timeoutIds.delete(id);
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);

    timeoutIds.set(id, timeoutId);
  },

  remove: (id) => {
    // Cancel timeout — spriječi beskoristan re-render nakon ručnog zatvaranja
    const timeoutId = timeoutIds.get(id);
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutIds.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  // Korisno za testove ili "dismiss all" UI gumb
  removeAll: () => {
    timeoutIds.forEach((id) => clearTimeout(id));
    timeoutIds.clear();
    set({ toasts: [] });
  },
}));

export const toast = {
  success: (message, opts) =>
    useToastStore.getState().add({ type: "success", message, ...opts }),
  error: (message, opts) =>
    useToastStore.getState().add({ type: "error", message, ...opts }),
  info: (message, opts) =>
    useToastStore.getState().add({ type: "info", message, ...opts }),
  warning: (message, opts) =>
    useToastStore.getState().add({ type: "warning", message, ...opts }),
};

export default useToastStore;
