// api/examApi.js
// Zamijenio axios/apiClient s direktnim Supabase upitima.
// Isti pattern kao authApi.js koji je već migriran.
import { supabase } from "@/lib/supabase";

export const examApi = {
  /**
   * Dohvati sve ispite za određeni predmet.
   * Koristi SubjectSelect za prikaz liste ispita.
   */
  getBySubject: async (subjectId) => {
    const { data, error } = await supabase
      .from("exams")
      .select("id, subject_id, year, session, level, duration_minutes")
      .eq("subject_id", subjectId)
      .order("year", { ascending: false })
      .order("session");

    if (error) throw error;
    return data;
  },

  /**
   * Dohvati metapodatke jednog ispita (bez pitanja).
   * Korisno za ExamTaking header (naziv, duration).
   */
  getById: async (examId) => {
    const { data, error } = await supabase
      .from("exams")
      .select("id, subject_id, year, session, level, duration_minutes")
      .eq("id", examId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Dohvati ispit + sva pitanja + sve opcije u jednom pozivu.
   * Koristi useExamSession za inicijalizaciju ispita.
   *
   * Transformacija:
   *   DB:    { correct_option: 'a', options: [{id, text}] }
   *   Store: { correct: 'a',        options: [{id, text}] }
   */
  getWithQuestions: async (examId) => {
    // Parallelni pozivi — brže od sekvencijalnog
    const [examRes, questionsRes] = await Promise.all([
      supabase
        .from("exams")
        .select("id, subject_id, year, session, level, duration_minutes")
        .eq("id", examId)
        .single(),

      supabase
        .from("questions")
        .select(
          `
          id,
          position,
          text,
          image_url,
          correct_option,
          points,
          options ( id, text )
        `,
        )
        .eq("exam_id", examId)
        .order("position", { ascending: true }),
    ]);

    if (examRes.error) throw examRes.error;
    if (questionsRes.error) throw questionsRes.error;

    // Transformiraj pitanja u format koji store i ExamResults očekuju
    const questions = questionsRes.data.map((q) => ({
      id: q.id, // UUID string
      text: q.text,
      imageUrl: q.image_url ?? null,
      correct: q.correct_option, // 'a' | 'b' | 'c' | 'd'
      points: q.points,
      // Sortiraj opcije a→d jer Supabase ne garantira redoslijed
      options: [...q.options].sort((a, b) => a.id.localeCompare(b.id)),
    }));

    return {
      exam: examRes.data,
      questions,
    };
  },
};
