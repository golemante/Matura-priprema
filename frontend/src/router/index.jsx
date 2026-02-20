import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/Landing";
import { SubjectsPage } from "@/pages/SubjectSelect";
import { QuizPage } from "@/pages/ExamTaking";
import { ResultsPage } from "@/pages/ExamResults";
import { NotFoundPage } from "@/pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "predmeti/:subjectId", element: <SubjectsPage /> },
      { path: "rezultati/:examId", element: <ResultsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  // QuizPage gets its own full-screen layout (no header)
  {
    path: "/ispit/:examId",
    element: <QuizPage />,
  },
]);
