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
    // Pri pokretanju app — provjeri postoji li aktivna sesija (npr. refresh stranice)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuth(
          {
            ...session.user,
            name: session.user.user_metadata?.name ?? session.user.email,
          },
          session.access_token,
        );
      }
      setAuthReady(true); // tek sada renderaj app — izbjegava flash na protected routeovima
    });
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
