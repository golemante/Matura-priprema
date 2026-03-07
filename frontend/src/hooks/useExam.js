// hooks/useExam.js
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI:
//   • staleTime za popis ispita smanjen na 2 min (bio 15 min)
//     → novi ispiti dodani u DB postaju vidljivi brzo
//   • refetchOnWindowFocus: true za exam list → refetch kad se korisnik vrati
//   • exam content (pitanja) ostaje 30 min — sadržaj se ne mijenja često
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { examApi } from "@/api/examApi";

// ── Popis ispita za predmet — s community statistikama ────────────────────────
// Koristi exams_with_stats VIEW (anon + auth).
// Novi ispiti se pojavljuju odmah pri sljedećem dohvatu (staleTime = 2 min).
export function useExams(subjectId) {
  return useQuery({
    queryKey: ["exams", subjectId],
    queryFn: () => examApi.getBySubjectWithStats(subjectId),
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 2, // 2 min — novi ispiti brzo vidljivi
    refetchOnWindowFocus: true, // Refetch kad se korisnik vrati na tab
    refetchOnMount: true,
  });
}

// ── Metapodaci jednog ispita ──────────────────────────────────────────────────
export function useExam(examId) {
  return useQuery({
    queryKey: ["exam", examId],
    queryFn: () => examApi.getById(examId),
    enabled: !!examId,
    staleTime: 1000 * 60 * 10,
  });
}

// ── Ispit s pitanjima i passages (ExamTaking) ─────────────────────────────────
// Sadržaj ispita se ne mijenja — duži staleTime je ok.
// Retry 2x u slučaju mrežne greške.
export function useExamWithQuestions(examId) {
  return useQuery({
    queryKey: ["exam-with-questions", examId],
    queryFn: () => examApi.getWithQuestions(examId),
    enabled: !!examId,
    staleTime: 1000 * 60 * 30, // 30 min — sadržaj ispita se rijetko mijenja
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
