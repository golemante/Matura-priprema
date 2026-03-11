// src/pages/AuthCallback.jsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const toastShown = useRef(false);

  useEffect(() => {
    if (!token) return;

    if (!toastShown.current) {
      toastShown.current = true;
      toast.success("Uspješna prijava!");
    }
    navigate("/", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) {
        toast.error("Prijava nije uspjela. Pokušaj ponovo.");
        navigate("/login", { replace: true });
      }
    }, 10_000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
      <p className="text-sm text-warm-500 font-medium">Završavam prijavu...</p>
      <p className="text-xs text-warm-400">Ovo može potrajati koji trenutak.</p>
    </div>
  );
}
