// api/attemptApi.js
// ─────────────────────────────────────────────────────────────────────────────
// KRITIČNI ISPRAVCI:
//
//  BUG #1 — finish() i pause() slali su ARRAY umjesto JSONB OBJECT
//  ─────────────────────────────────────────────────────────────────
//  DB RPC finish_attempt ČITA odgovore ovako:
//    v_chosen := p_answers ->> v_question.id::TEXT;
//  Operator ->> radi NA OBJECTU: { "uuid": "a" }
//  Stari kod slao je: [{ question_id, chosen_option }] → ARRAY
//  Rezultat: v_chosen je uvijek NULL → score uvijek 0 / ukupan broj
//
//  ISPRAVAK: p_answers se šalje direktno kao objekt { [questionId]: letter }
//  što je upravo format koji examStore.answers već koristi.
//
//  BUG #2 — getAll() nije imao filter za authenticated korisnika
//  (RLS rješava ovo automatski, ali explicit ORDER je bio kriv)
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

export const attemptApi = {
  // ── 1. Kreiraj attempt na POČETKU ispita ──────────────────────────────────
  // Vraća null ako korisnik nije prijavljen (anon korisnici mogu čitati ispit,
  // ali rezultati se ne bilježe u bazi).
  create: async (examId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

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
    return data; // { id: UUID, started_at: TIMESTAMPTZ }
  },

  // ── 2. Završi ispit — RPC finish_attempt ──────────────────────────────────
  //
  // ISPRAVAK: p_answers mora biti JSONB OBJECT { "uuid": "a"|null }
  //           NE array [{ question_id, chosen_option }]
  //
  // DB RPC logika:
  //   FOR v_question IN SELECT q.id, y.correct_option FROM questions JOIN Youtubes ...
  //     v_chosen := p_answers ->> v_question.id::TEXT  ← KEY lookup na objectu
  //     INSERT attempt_answers ...
  //   END LOOP
  //
  // Returna: { correct_count, total_count, score_pct, elapsed_seconds }
  //
  finish: async (attemptId, answers, elapsedSeconds) => {
    // answers je već { [questionId]: letter } iz examStore — savršen format za RPC
    // Null vrijednosti (preskočena pitanja) trebaju eksplicitno biti null u JSON-u
    const answersObj = Object.fromEntries(
      Object.entries(answers).map(([qId, letter]) => [qId, letter ?? null]),
    );

    const { data, error } = await supabase.rpc("finish_attempt", {
      p_attempt_id: attemptId,
      p_answers: answersObj, // ← OBJECT, ne array
      p_elapsed_secs: elapsedSeconds,
    });

    if (error) throw error;
    return data; // { correct_count, total_count, score_pct, elapsed_seconds }
  },

  // ── 3. Pauziraj ispit — RPC pause_attempt ─────────────────────────────────
  //
  // ISPRAVAK: p_answers mora biti JSONB OBJECT (isti razlog kao gore)
  // pause_attempt iterira pitanja i radi: p_answers ->> question_id
  //
  pause: async (attemptId, elapsedSeconds, answers = null) => {
    // Ako nema odgovora, šaljemo null (RPC ima DEFAULT NULL za p_answers)
    const answersObj = answers
      ? Object.fromEntries(
          Object.entries(answers).map(([qId, letter]) => [qId, letter ?? null]),
        )
      : null;

    const { error } = await supabase.rpc("pause_attempt", {
      p_attempt_id: attemptId,
      p_elapsed_secs: elapsedSeconds,
      p_answers: answersObj, // ← OBJECT ili null
    });

    if (error) throw error;
  },

  // ── 4. Nastavi pauziran ispit — RPC resume_attempt ────────────────────────
  // Vraća: { elapsed_seconds, total_paused_seconds }
  resume: async (attemptId) => {
    const { data, error } = await supabase.rpc("resume_attempt", {
      p_attempt_id: attemptId,
    });

    if (error) throw error;
    return data;
  },

  // Koristi se za re-sync timera nakon refresh/reopen sesije.
  getElapsed: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempts")
      .select("elapsed_seconds, status")
      .eq("id", attemptId)
      .single();

    if (error) throw error;
    return data;
  },

  // ── 5. Dohvati sve pokušaje korisnika (RLS automatski filtrira) ────────────
  // JOIN na exams za prikaz metapodataka (predmet, godina, rok, razina).
  // Sortira: completed koji su završeni nedavno su prvi.
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
        exam:exams (
          id,
          subject_id,
          year,
          session,
          level,
          title,
          total_points,
          duration_minutes
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  // ── 6. Jedan pokušaj s detaljima ───────────────────────────────────────────
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

  // ── 7. Postavi abandoned status (korisnik napustio ispit bez predaje) ───────
  abandon: async (attemptId, elapsedSeconds) => {
    const { error } = await supabase
      .from("attempts")
      .update({
        status: "abandoned",
        finished_at: new Date().toISOString(),
        elapsed_seconds: elapsedSeconds,
      })
      .eq("id", attemptId);

    if (error) console.warn("[attemptApi.abandon]", error);
  },
};
