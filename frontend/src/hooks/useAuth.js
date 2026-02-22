// hooks/useAuth.js
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

  return () => {
    useAuthStore.setState({ user: null, token: null });
    toast.info("Uspješno ste se odjavili");
    navigate("/login");
  };
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => !!s.token);
}
