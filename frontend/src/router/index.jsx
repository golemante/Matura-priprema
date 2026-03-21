// router/index.jsx
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Spinner } from "@/components/common/LoadingSpinner";

const HomePage = lazy(() =>
  import("@/pages/Landing").then((m) => ({ default: m.HomePage })),
);
const AllSubjectsPage = lazy(() =>
  import("@/pages/AllSubjects").then((m) => ({ default: m.AllSubjectsPage })),
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
const AboutUsPage = lazy(() =>
  import("@/pages/AboutUs").then((m) => ({ default: m.AboutUsPage })),
);
const ContactPage = lazy(() =>
  import("@/pages/Contact").then((m) => ({ default: m.ContactPage })),
);
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
  { path: "/login", element: withSuspense(<LoginPage />) },
  { path: "/register", element: withSuspense(<RegisterPage />) },
  {
    path: "/zaboravljena-lozinka",
    element: withSuspense(<ForgotPasswordPage />),
  },
  { path: "/reset-password", element: withSuspense(<ResetPasswordPage />) },
  { path: "/auth/callback", element: withSuspense(<AuthCallbackPage />) },

  {
    path: "/ispit/:examId",
    element: (
      <ErrorBoundary>
        <ProtectedRoute>{withSuspense(<QuizPage />)}</ProtectedRoute>
      </ErrorBoundary>
    ),
  },

  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: withSuspense(<HomePage />),
      },

      {
        path: "predmeti",
        element: withSuspense(<AllSubjectsPage />),
      },

      {
        path: "predmeti/:subjectId",
        element: withSuspense(<SubjectsPage />),
      },

      {
        path: "rezultati/pokusaj/:attemptId",
        element: (
          <ProtectedRoute>{withSuspense(<ResultsPage />)}</ProtectedRoute>
        ),
      },

      {
        path: "rezultati/:examId",
        element: <Navigate to="/rezultati" replace />,
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
        path: "profil",
        element: (
          <ProtectedRoute>{withSuspense(<ProfilePage />)}</ProtectedRoute>
        ),
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
        path: "o-nama",
        element: withSuspense(<AboutUsPage />),
      },
      {
        path: "kontakt",
        element: withSuspense(<ContactPage />),
      },

      {
        path: "*",
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
]);
