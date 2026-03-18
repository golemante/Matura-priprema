import { create } from "zustand";

const timeoutIds = new Map();

const useToastStore = create((set, get) => ({
  toasts: [],

  add: (toastConfig) => {
    const duration = toastConfig.duration ?? 4000;

    const exists = get().toasts.some(
      (t) => t.message === toastConfig.message && t.type === toastConfig.type,
    );
    if (exists) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    set((s) => ({ toasts: [...s.toasts, { ...toastConfig, id }] }));

    const timeoutId = setTimeout(() => {
      timeoutIds.delete(id);
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);

    timeoutIds.set(id, timeoutId);
  },

  remove: (id) => {
    const timeoutId = timeoutIds.get(id);
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutIds.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

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
