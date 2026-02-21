// store/useToastStore.js
import { create } from "zustand";

const useToastStore = create((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration || 4000);
  },
  remove: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  success: (message) =>
    useToastStore.getState().add({ type: "success", message }),
  error: (message) => useToastStore.getState().add({ type: "error", message }),
  info: (message) => useToastStore.getState().add({ type: "info", message }),
  warning: (message) =>
    useToastStore.getState().add({ type: "warning", message }),
};

export default useToastStore;
