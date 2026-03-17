import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "@/router";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ToastContainer } from "@/components/common/Toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { draftStorage } from "@/utils/storage";
import { resetServerTimeCache } from "@/hooks/useExamInit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function extractName(user) {
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0]?.trim() ??
    "Korisnik"
  );
}

function App() {
  useEffect(() => {
    draftStorage.purgeExpired();
  }, []);

  const [authReady, setAuthReady] = useState(false);
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        if (session) {
          setAuth(
            { ...session.user, name: extractName(session.user) },
            session.access_token,
          );
        } else {
          clearAuth();
        }
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
        resetServerTimeCache();
        return;
      }

      if (event === "TOKEN_REFRESHED" && session) {
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

  if (!authReady) {
    return (
      <div className="min-h-dvh bg-warm-100 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-warm-600 font-medium animate-pulse">
          Provjera prijave...
        </p>
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
