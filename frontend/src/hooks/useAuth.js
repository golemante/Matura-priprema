// hooks/useAuth.js
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/authApi";
import { toast } from "@/store/toastStore";
import { useNavigate } from "react-router-dom";

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      toast.success(`Dobrodošao, ${user.name}!`);
      navigate("/");
    },
    onError: (err) => toast.error(err.message ?? "Greška pri prijavi"),
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  const { mutate: logoutMutation, isPending } = useMutation({
    mutationFn: async () => {
      // Samo JEDAN signOut poziv — stari kod ga je zvao dvaput:
      // jednom ovdje kroz authApi.logout(), i jednom u authStore.logout()
      const { error } = await authApi.logout();
      if (error) throw error;
    },
    onSuccess: () => {
      // clearAuth čisti Zustand store (bez window.location redirect — koristimo navigate)
      clearAuth();
      toast.info("Uspješno ste se odjavili");
      navigate("/login", { replace: true });
    },
    onError: () => {
      // Čak i ako signOut fail-a, očisti lokalni state i redirectaj
      clearAuth();
      navigate("/login", { replace: true });
    },
  });

  const logout = useCallback(() => logoutMutation(), [logoutMutation]);

  return { logout, isPending };
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => !!s.token);
}
