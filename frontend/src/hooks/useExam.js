// hooks/useExam.js
import { useQuery } from "@tanstack/react-query";
import { examApi } from "@/api/examApi";

export function useExams(subjectId) {
  return useQuery({
    queryKey: ["exams", subjectId],
    queryFn: () => examApi.getBySubjectWithStats(subjectId),
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useExam(examId) {
  return useQuery({
    queryKey: ["exam", examId],
    queryFn: () => examApi.getById(examId),
    enabled: !!examId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useExamWithQuestions(examId) {
  return useQuery({
    queryKey: ["exam-with-questions", examId],
    queryFn: () => examApi.getWithQuestions(examId),
    enabled: !!examId,
    staleTime: 1000 * 60 * 30,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
