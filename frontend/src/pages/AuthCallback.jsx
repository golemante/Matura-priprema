// src/pages/AuthCallback.jsx
// Prima Google/Apple OAuth redirect.
//
// ARHITEKTURA (zašto ovako):
// App.jsx je jedini Supabase onAuthStateChange listener u cijeloj aplikaciji.
// Kada Supabase procesira OAuth token iz URL-a, App.jsx poziva setAuth() →
// Zustand store dobiva token. Ova stranica SAMO čeka da token postane dostupan
// u storeu, a onda redirecta.
//
// Prethodni pristup (vlastiti onAuthStateChange ovdje) uzrokovao je:
//  • Race condition: navigate("/") se okidao prije nego App.jsx postavio authReady=true
//  • Korisnik bi bio redirectan na "/" ali stranica se renderala bez prijavljenog usera
//  • React StrictMode duplo montiranje remetilo je handled.current logiku
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

    // Token je dostupan → App.jsx je već obradio OAuth event i pozvao setAuth()
    // Sada je sigurno navigirati jer je cijeli auth state konzistentan
    if (!toastShown.current) {
      toastShown.current = true;
      toast.success("Uspješna prijava!");
    }
    navigate("/", { replace: true });
  }, [token, navigate]);

  // Timeout fallback: ako za 10s nema tokena → nešto je krenulo krivo
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
