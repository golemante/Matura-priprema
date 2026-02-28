// src/pages/AuthCallback.jsx
// Ova stranica prima Google/Apple OAuth redirect.
// Supabase detektira token iz URL-a (detectSessionInUrl: true),
// mi samo čekamo onAuthStateChange event i onda redirectamo.
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/store/toastStore";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const handled = useRef(false); // sprječava dvostruki redirect u Strict Mode

  useEffect(() => {
    // App.jsx već sluša sve auth evente i ažurira store.
    // Ova komponenta SAMO treba znati kada je SIGNED_IN gotov → navigate.
    // Ne diramo store ovdje — App.jsx to već rješava.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (handled.current) return;

      // SIGNED_IN: Supabase je uspješno procesirao OAuth token iz URL hash-a
      if (event === "SIGNED_IN" && session) {
        handled.current = true;
        toast.success("Uspješna prijava!");
        navigate("/", { replace: true });
        return;
      }

      // INITIAL_SESSION s aktivnom sesijom znači da je korisnik VEĆ bio prijavljen
      // (refresh stranice na /auth/callback) — redirect na home
      if (event === "INITIAL_SESSION" && session) {
        handled.current = true;
        navigate("/", { replace: true });
        return;
      }

      // INITIAL_SESSION bez sesije + nije SIGNED_IN → prijava nije uspjela
      if (event === "INITIAL_SESSION" && !session) {
        // Ne redirectamo odmah — čekamo da li će doći SIGNED_IN
        // (Supabase nekad emitira INITIAL_SESSION pa tek onda SIGNED_IN)
        return;
      }

      // Eksplicitna odjava ili error
      if (event === "SIGNED_OUT") {
        handled.current = true;
        toast.error("Prijava nije uspjela. Pokušaj ponovo.");
        navigate("/login", { replace: true });
      }
    });

    // Timeout fallback: ako za 8s nema SIGNED_IN → nešto je krenulo krivo
    const timeout = setTimeout(() => {
      if (!handled.current) {
        handled.current = true;
        toast.error("Prijava je istekla. Pokušaj ponovo.");
        navigate("/login", { replace: true });
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-warm-100 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
      <p className="text-sm text-warm-500 font-medium">Završavam prijavu...</p>
      <p className="text-xs text-warm-400">Ovo može potrajati koji trenutak.</p>
    </div>
  );
}
