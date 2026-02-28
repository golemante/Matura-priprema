import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "@/router";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ToastContainer } from "@/components/common/Toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [authReady, setAuthReady] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    // FIX: Koristi onAuthStateChange umjesto getSession()
    // razlog: kada Google redirecta na /auth/callback, token je u URL hash-u.
    // Supabase ga procesira asinkrono i emitira INITIAL_SESSION event —
    // getSession() pozvan prerano vraća null jer hash još nije procesiran.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        // Prva inicijalizacija — sesija može biti null (nije prijavljen)
        // ili aktivna (refresh stranice dok je prijavljen)
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
        }
        // Tek nakon INITIAL_SESSION znamo stvarno stanje → renderaj app
        setAuthReady(true);
      }

      if (event === "SIGNED_IN" && session) {
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
      }

      if (event === "SIGNED_OUT") {
        useAuthStore.setState({ user: null, token: null });
      }

      if (event === "TOKEN_REFRESHED" && session) {
        // Tiho ažuriraj token u storeu kad Supabase automatski refresha
        useAuthStore.setState({ token: session.access_token });
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth]);

  // Kratki loading dok Supabase ne vrati sesiju (obično <100ms)
  if (!authReady) {
    return (
      <div className="min-h-dvh bg-warm-100 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <ToastContainer />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
