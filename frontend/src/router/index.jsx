import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HomePage } from "@/pages/Landing";
import { SubjectsPage } from "@/pages/SubjectSelect";
import { QuizPage } from "@/pages/ExamTaking";
import { ResultsPage } from "@/pages/ExamResults";
import { NotFoundPage } from "@/pages/NotFound";
import { Dashboard } from "@/pages/Dashboard";
import { StatisticsPage } from "@/pages/Statistics";
import { LoginPage } from "@/pages/Login";
import { RegisterPage } from "@/pages/Register";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "predmeti/:subjectId", element: <SubjectsPage /> },
      {
        path: "rezultati",
        element: (
          <ProtectedRoute>
            <StatisticsPage />
          </ProtectedRoute>
        ),
      },
      { path: "rezultati/:examId", element: <ResultsPage /> },
      { path: "*", element: <NotFoundPage /> },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // QuizPage gets its own full-screen layout (no header)
  {
    path: "/ispit/:examId",
    element: (
      <ErrorBoundary>
        <QuizPage />
      </ErrorBoundary>
    ),
  },
]);
