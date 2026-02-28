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

function extractName(user) {
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Korisnik"
  );
}

function App() {
  const [authReady, setAuthReady] = useState(false);
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // JEDINI onAuthStateChange listener u cijeloj aplikaciji.
    // authStore.js više NEMA vlastiti listener — uklonjeno jer je uzrokovalo:
    //   • race condition pri Google OAuth redirect-u
    //   • dupli setAuth pozivi koji su se međusobno gazili
    //   • memory leak (nije bio moguć unsubscribe)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        // Uvijek se okine pri startu — sa sesijom ili bez nje
        if (session) {
          setAuth(
            { ...session.user, name: extractName(session.user) },
            session.access_token,
          );
        }
        // Bez obzira ima li sesije, authReady = true → renderaj app
        setAuthReady(true);
        return;
      }

      if (event === "SIGNED_IN" && session) {
        setAuth(
          { ...session.user, name: extractName(session.user) },
          session.access_token,
        );
        return;
      }

      if (event === "SIGNED_OUT") {
        clearAuth();
        return;
      }

      if (event === "TOKEN_REFRESHED" && session) {
        // Tiho ažuriraj samo token — user objekt se nije promijenio
        useAuthStore.setState({ token: session.access_token });
        return;
      }

      if (event === "USER_UPDATED" && session) {
        setAuth(
          { ...session.user, name: extractName(session.user) },
          session.access_token,
        );
        return;
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth, clearAuth]);

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
