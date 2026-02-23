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

  const { mutate: logoutMutation, isPending } = useMutation({
    mutationFn: authApi.logout, // invalidira refresh token na serveru
    onSettled: () => {
      useAuthStore.getState().logout();
      toast.info("Uspješno ste se odjavili");
      navigate("/login");
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
