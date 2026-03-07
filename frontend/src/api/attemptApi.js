// api/attemptApi.js
// ─────────────────────────────────────────────────────────────────────────────
// PROMJENE u odnosu na staru verziju:
//   • submit() je UKLONJEN — zamijenjen s create() + finish()
//   • finish() poziva RPC finish_attempt — server računa score iz Youtubes tablice
//   • pause() poziva RPC pause_attempt — server bilježi paused_at + akumulira pauze
//   • resume() poziva RPC resume_attempt — server briše paused_at, zbraja pauze
//   • is_correct se više ne računa na frontendu (nema correct_option na pitanjima)
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

export const attemptApi = {
  // ── 1. Kreiraj attempt na POČETKU ispita ──────────────────────────────────
  //
  // Važno: attempt se kreira odmah pri učitavanju, ne pri predaji.
  // Razlog: finish_attempt RPC treba postojeći attempt_id.
  // Status je 'in_progress' dok se ne pozove finish().
  //
  create: async (examId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null; // Neprijavljen korisnik — vraćamo null (bez DB snimanja)

    const { data, error } = await supabase
      .from("attempts")
      .insert({
        user_id: user.id,
        exam_id: examId,
        status: "in_progress",
      })
      .select("id, started_at")
      .single();

    if (error) throw error;
    return data; // { id: UUID, started_at: timestamp }
  },

  // ── 2. Završi ispit — RPC koji atomarno sve sprema ────────────────────────
  //
  // RPC finish_attempt(p_attempt_id, p_answers JSONB, p_elapsed_secs INT):
  //   1. Validira da je attempt.user_id = auth.uid()
  //   2. Batch INSERT attempt_answers
  //   3. Čita correct_option iz Youtubes tablice
  //   4. Računa score
  //   5. UPDATE attempts SET status='completed', score_pct=..., itd.
  //   6. Vraća: { correct_count, total_count, score_pct, elapsed_seconds }
  //
  // p_answers format: [{ question_id: "uuid", chosen_option: "a" }, ...]
  // null chosen_option = preskočeno pitanje
  //
  finish: async (attemptId, answers, elapsedSeconds) => {
    // Pretvori answers objekt { questionId: letter } u niz za RPC
    const answersArray = Object.entries(answers).map(
      ([question_id, chosen_option]) => ({
        question_id,
        chosen_option: chosen_option ?? null,
      }),
    );

    const { data, error } = await supabase.rpc("finish_attempt", {
      p_attempt_id: attemptId,
      p_answers: answersArray,
      p_elapsed_secs: elapsedSeconds,
    });

    if (error) throw error;
    // data: { correct_count, total_count, score_pct, elapsed_seconds }
    return data;
  },

  // ── 3. Pauziraj ispit ─────────────────────────────────────────────────────
  //
  // RPC pause_attempt(p_attempt_id, p_elapsed_secs, p_answers JSONB):
  //   - Sprema trenutno stanje odgovora (opcionalno)
  //   - Postavlja status='paused', paused_at=NOW()
  //   - Pohranjuje elapsed do ovog trenutka
  //
  pause: async (attemptId, elapsedSeconds, answers = null) => {
    const answersArray = answers
      ? Object.entries(answers).map(([question_id, chosen_option]) => ({
          question_id,
          chosen_option: chosen_option ?? null,
        }))
      : null;

    const { error } = await supabase.rpc("pause_attempt", {
      p_attempt_id: attemptId,
      p_elapsed_secs: elapsedSeconds,
      p_answers: answersArray,
    });

    if (error) throw error;
  },

  // ── 4. Nastavi pauziran ispit ─────────────────────────────────────────────
  //
  // RPC resume_attempt(p_attempt_id):
  //   - Računa total_paused_seconds += (NOW() - paused_at)
  //   - Briše paused_at, postavlja status='in_progress'
  //   - Vraća: { total_paused_seconds }
  //
  resume: async (attemptId) => {
    const { data, error } = await supabase.rpc("resume_attempt", {
      p_attempt_id: attemptId,
    });

    if (error) throw error;
    return data; // { total_paused_seconds }
  },

  // ── Dohvati sve pokušaje korisnika ────────────────────────────────────────
  getAll: async () => {
    const { data, error } = await supabase
      .from("attempts")
      .select(
        `
        id,
        exam_id,
        status,
        started_at,
        finished_at,
        elapsed_seconds,
        score_pct,
        correct_count,
        total_count,
        exam:exams ( id, subject_id, year, session, level, title, total_points )
      `,
      )
      .order("finished_at", { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data;
  },

  // ── Dohvati jedan pokušaj s detalijma ─────────────────────────────────────
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
