// features/auth/pages/AuthCallbackPage.jsx
// Ova stranica se prikazuje nakon OAuth redirect-a (Google/Apple)
// Supabase detectSessionInUrl: true automatski procesira token iz URL-a
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    // Supabase detectSessionInUrl automatski obrađuje hash/query params
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        toast.error("Greška pri OAuth prijavi. Pokušaj ponovo.");
        navigate("/login", { replace: true });
        return;
      }

      if (session) {
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
      } else {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate, setAuth]);

  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-warm-500">Završavam prijavu...</p>
      </div>
    </div>
  );
}
