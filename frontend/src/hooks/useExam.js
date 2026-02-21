// hooks/useExam.js
import { useQuery } from "@tanstack/react-query";
import { examApi } from "@/api/examApi";

export function useExams(subjectId) {
  return useQuery({
    queryKey: ["exams", subjectId],
    queryFn: () => examApi.getBySubject(subjectId),
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 15, // 15 min
  });
}

export function useExam(examId) {
  return useQuery({
    queryKey: ["exam", examId],
    queryFn: () => examApi.getById(examId),
    enabled: !!examId,
    staleTime: 1000 * 60 * 30, // 30 min — ispiti se rijetko mijenjaju
  });
}
