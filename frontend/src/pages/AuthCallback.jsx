import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { FullScreenSpinner } from "@/components/common/LoadingSpinner";

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

  return <FullScreenSpinner message="Završavam prijavu..." />;
}
