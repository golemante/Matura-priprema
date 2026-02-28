// src/pages/AuthCallback.jsx
// Ova stranica prima Google/Apple OAuth redirect.
// Supabase detektira token iz URL-a (detectSessionInUrl: true),
// mi samo čekamo onAuthStateChange event i onda redirectamo.
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const handled = useRef(false); // sprječava dvostruki redirect u Strict Mode

  useEffect(() => {
    // Slušaj auth event — Supabase će automatski procesirati hash iz URL-a
    // i emitirati SIGNED_IN event s ispravnom sesijom
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (handled.current) return;

      if (event === "SIGNED_IN" && session) {
        handled.current = true;

        setAuth(
          {
            ...session.user,
            name:
              session.user.user_metadata?.full_name ??
              session.user.user_metadata?.name ??
              session.user.email,
          },
          session.access_token,
        );

        toast.success("Uspješna prijava!");
        navigate("/", { replace: true });
      }

      if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        handled.current = true;
        toast.error("Prijava nije uspjela. Pokušaj ponovo.");
        navigate("/login", { replace: true });
      }
    });

    // Timeout fallback — ako se ništa ne dogodi za 5s, idi na login
    const timeout = setTimeout(() => {
      if (!handled.current) {
        handled.current = true;
        navigate("/login", { replace: true });
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, setAuth]);

  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
      <p className="text-sm text-warm-500">Završavam prijavu...</p>
    </div>
  );
}
