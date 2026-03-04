// api/attemptApi.js
// Zamijenio axios/apiClient s direktnim Supabase upitima.
import { supabase } from "@/lib/supabase";

export const attemptApi = {
  /**
   * Spremi završeni pokušaj rješavanja ispita u bazu.
   * Radi u dvije transakcije:
   *   1. INSERT attempts → dohvati attempt.id
   *   2. INSERT attempt_answers (batch) za sva pitanja
   *
   * Poziva se fire-and-forget iz useExamSession.handleSubmit —
   * navigacija ne čeka na ovaj poziv.
   *
   * @param {{ examId, questions, answers, elapsedSeconds, scorePct, correctCount, totalCount }} params
   */
  submit: async ({
    examId,
    questions,
    answers,
    elapsedSeconds,
    scorePct,
    correctCount,
    totalCount,
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Korisnik nije prijavljen");

    // ── 1. Kreiraj attempt ────────────────────────────────────────
    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .insert({
        user_id: user.id,
        exam_id: examId,
        finished_at: new Date().toISOString(),
        elapsed_seconds: elapsedSeconds,
        score_pct: scorePct,
        correct_count: correctCount,
        total_count: totalCount,
      })
      .select("id")
      .single();

    if (attemptError) throw attemptError;

    // ── 2. Batch insert svih odgovora ─────────────────────────────
    // Svako pitanje dobiva red — preskočena pitanja imaju chosen_option NULL
    const rows = questions.map((q) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      chosen_option: answers[q.id] ?? null,
      is_correct: answers[q.id] === q.correct, // false za NULL odgovore
    }));

    const { error: answersError } = await supabase
      .from("attempt_answers")
      .insert(rows);

    if (answersError) throw answersError;

    return attempt;
  },

  /**
   * Dohvati sve pokušaje prijavljenog korisnika.
   * Koristi Statistics.jsx za prikaz povijesti.
   * JOIN s exams za metapodatke (predmet, godina, razina).
   */
  getAll: async () => {
    const { data, error } = await supabase
      .from("attempts")
      .select(
        `
        id,
        exam_id,
        started_at,
        finished_at,
        elapsed_seconds,
        score_pct,
        correct_count,
        total_count,
        exam:exams ( id, subject_id, year, session, level )
      `,
      )
      .order("finished_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Dohvati jedan pokušaj s detaljnim odgovorima.
   * Rezervirano za buduću stranicu detalja pokušaja.
   */
  getById: async (id) => {
    const { data, error } = await supabase
      .from("attempts")
      .select(
        `
        *,
        exam:exams ( * ),
        attempt_answers ( question_id, chosen_option, is_correct )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },
};
