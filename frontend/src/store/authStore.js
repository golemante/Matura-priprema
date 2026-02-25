// store/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),
      logout: async () => {
        await supabase.auth.signOut();
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
supabase.auth.onAuthStateChange((event, session) => {
  const { setAuth, logout } = useAuthStore.getState();

  if (session) {
    setAuth(
      {
        ...session.user,
        name: session.user.user_metadata?.name ?? session.user.email,
      },
      session.access_token,
    );
  } else {
    // SIGNED_OUT event — očisti store bez redirecta (logout() već radi redirect)
    useAuthStore.setState({ user: null, token: null });
  }
});
