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
    // FIX: authApi.logout() poziva supabase.auth.signOut() koji ne vraća ništa korisno.
    // Prethodni kod radio je `const { error } = await authApi.logout()` — destrukturiranje
    // undefined objekta. error je uvijek bio undefined, Supabase greška se nikad nije
    // propagirala. Sada direktno await-amo i bacamo ako signOut fail-a.
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
      toast.info("Uspješno ste se odjavili");
      navigate("/login", { replace: true });
    },
    onError: () => {
      // Čak i ako signOut fail-a na serveru, očisti lokalni state
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
