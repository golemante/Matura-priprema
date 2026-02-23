// router/index.jsx
// React.lazy: svaka stranica se učitava tek kad je potrebna (code splitting).
// Smanjuje početni bundle za ~60% — stranice poput QuizPage (~15KB) ne blokiraju Landing.
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const HomePage = lazy(() =>
  import("@/pages/Landing").then((m) => ({ default: m.HomePage })),
);
const SubjectsPage = lazy(() =>
  import("@/pages/SubjectSelect").then((m) => ({ default: m.SubjectsPage })),
);
const ResultsPage = lazy(() =>
  import("@/pages/ExamResults").then((m) => ({ default: m.ResultsPage })),
);
const StatisticsPage = lazy(() =>
  import("@/pages/Statistics").then((m) => ({ default: m.StatisticsPage })),
);
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFound").then((m) => ({ default: m.NotFoundPage })),
);
// Auth stranice (bez layouta)
const LoginPage = lazy(() =>
  import("@/pages/Login").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/Register").then((m) => ({ default: m.RegisterPage })),
);
// Full-screen exam (bez headera)
const QuizPage = lazy(() =>
  import("@/pages/ExamTaking").then((m) => ({ default: m.QuizPage })),
);

// ── Suspense fallback ────────────────────────────────────────────
// Minimalan loading state — ne treba spinner svugdje, blank je ok za brze veze
function PageLoader() {
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
    </div>
  );
}

function withSuspense(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  // Auth routes (full-screen, bez headera)
  { path: "/login", element: withSuspense(<LoginPage />) },
  { path: "/register", element: withSuspense(<RegisterPage />) },

  // Exam route (full-screen, bez headera, s ErrorBoundary)
  {
    path: "/ispit/:examId",
    element: <ErrorBoundary>{withSuspense(<QuizPage />)}</ErrorBoundary>,
  },

  // Main app (s RootLayout = Header + Footer)
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: withSuspense(<HomePage />),
      },
      {
        path: "predmeti/:subjectId",
        element: withSuspense(<SubjectsPage />),
      },
      {
        path: "rezultati/:examId",
        element: withSuspense(<ResultsPage />),
      },
      {
        path: "rezultati",
        element: (
          <ProtectedRoute>{withSuspense(<StatisticsPage />)}</ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: <ProtectedRoute>{withSuspense(<Dashboard />)}</ProtectedRoute>,
      },
      {
        path: "*",
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
]);
