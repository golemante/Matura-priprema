// router/index.jsx
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Spinner } from "@/components/common/LoadingSpinner";

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
const ProfilePage = lazy(() =>
  import("@/pages/Profile").then((m) => ({ default: m.ProfilePage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFound").then((m) => ({ default: m.NotFoundPage })),
);
const TermsPage = lazy(() =>
  import("@/pages/Terms").then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("@/pages/Privacy").then((m) => ({ default: m.PrivacyPage })),
);
// Auth stranice (bez layouta)
const LoginPage = lazy(() =>
  import("@/pages/Login").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/Register").then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/ForgotPassword").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("@/pages/ResetPassword").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const AuthCallbackPage = lazy(() =>
  import("@/pages/AuthCallback").then((m) => ({
    default: m.AuthCallbackPage,
  })),
);
// Full-screen exam (bez headera)
const QuizPage = lazy(() =>
  import("@/pages/ExamTaking").then((m) => ({ default: m.QuizPage })),
);

function PageLoader() {
  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center">
      <Spinner size="md" variant="light" />
    </div>
  );
}

function withSuspense(element) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{element}</Suspense>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  // Auth routes (full-screen, bez headera)
  { path: "/login", element: withSuspense(<LoginPage />) },
  { path: "/register", element: withSuspense(<RegisterPage />) },
  {
    path: "/zaboravljena-lozinka",
    element: withSuspense(<ForgotPasswordPage />),
  },
  { path: "/reset-password", element: withSuspense(<ResetPasswordPage />) },
  { path: "/auth/callback", element: withSuspense(<AuthCallbackPage />) },

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
        path: "rezultati/pokusaj/:attemptId",
        element: withSuspense(<ResultsPage />),
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
        path: "uvjeti",
        element: withSuspense(<TermsPage />),
      },
      {
        path: "privatnost",
        element: withSuspense(<PrivacyPage />),
      },
      {
        path: "profil",
        element: (
          <ProtectedRoute>{withSuspense(<ProfilePage />)}</ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
]);
