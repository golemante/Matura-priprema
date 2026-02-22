// store/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        set({ user: null, token: null });
        window.location.href = "/login";
      },
      updateUser: (data) => set((s) => ({ user: { ...s.user, ...data } })),
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);
