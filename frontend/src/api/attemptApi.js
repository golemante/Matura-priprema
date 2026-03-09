// api/attemptApi.js
// ─────────────────────────────────────────────────────────────────────────────
// ISPRAVCI v5:
//
//  ✅ FIX KRITIČNI: getElapsed() sada vraća started_at i total_paused_seconds
//     PRIJE: SELECT elapsed_seconds, status → za in_progress attempt elapsed
//            je uvijek NULL → timer se uvijek resetirao na puni trajanje!
//     SADA:  SELECT + started_at + total_paused_seconds → syncElapsed može
//            izračunati stvarno proteklo vrijeme čak i bez prethodne pauze.
//
//  ✅ NOVO: getAnswers(attemptId)
//     Učitava spremljene odgovore iz attempt_answers za pauziran attempt.
//     Koristi se u useExamInit kada nema lokalnog drafta (npr. drugi uređaj).
//
//  ✅ FIX: checkActive() sada vraća total_paused_seconds za kompletni sync.
//
//  ✅ NEIZMIJENJENO: create(), finish(), pause(), resume(), getAll(), getById()
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";
import { throwNormalized } from "@/lib/normalizeError";

export const attemptApi = {
  // ── 0. Provjeri postoji li aktivan attempt (anti-duplicate) ───────────────
  checkActive: async (examId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("attempts")
      .select(
        "id, started_at, elapsed_seconds, status, paused_at, total_paused_seconds",
      )
      .eq("exam_id", examId)
      .eq("user_id", user.id)
      .in("status", ["in_progress", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throwNormalized(error);
    return data ?? null;
  },

  // ── 1. Kreiraj attempt na POČETKU ispita ──────────────────────────────────
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

    if (error) throwNormalized(error);
    return data;
  },

  // ── 2. Završi ispit — RPC finish_attempt ──────────────────────────────────
  finish: async (attemptId, answers, elapsedSeconds) => {
    const answersObj = Object.fromEntries(
      Object.entries(answers).map(([qId, letter]) => [qId, letter ?? null]),
    );

    const { data, error } = await supabase.rpc("finish_attempt", {
      p_attempt_id: attemptId,
      p_answers: answersObj,
      p_elapsed_secs: elapsedSeconds,
    });

    if (error) throwNormalized(error);
    return data;
  },

  // ── 3. Pauziraj ispit — RPC pause_attempt ─────────────────────────────────
  pause: async (attemptId, elapsedSeconds, answers = null) => {
    const answersObj = answers
      ? Object.fromEntries(
          Object.entries(answers).map(([qId, letter]) => [qId, letter ?? null]),
        )
      : null;

    const { error } = await supabase.rpc("pause_attempt", {
      p_attempt_id: attemptId,
      p_elapsed_secs: elapsedSeconds,
      p_answers: answersObj,
    });

    if (error) throwNormalized(error);
  },

  // ── 4. Nastavi pauziran ispit — RPC resume_attempt ────────────────────────
  resume: async (attemptId) => {
    const { data, error } = await supabase.rpc("resume_attempt", {
      p_attempt_id: attemptId,
    });

    if (error) throwNormalized(error);
    return data; // { elapsed_seconds, total_paused_seconds }
  },

  // ── 5. Dohvati elapsed + status za server-sync timera ─────────────────────
  //
  // FIX KRITIČNI: Dodan started_at i total_paused_seconds.
  //
  // ZAŠTO: Za in_progress attempt, elapsed_seconds je NULL u bazi
  // (postavljeno je samo pri pauzi/završetku). Bez started_at, timer bi
  // se uvijek resetirao na puno trajanje pri refreshu stranice.
  //
  // syncElapsed u useExamInit.js koristi ove podatke za računanje:
  //   elapsed = Date.now() - started_at - total_paused_seconds
  //
  getElapsed: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempts")
      .select(
        "elapsed_seconds, status, started_at, total_paused_seconds, paused_at",
      )
      .eq("id", attemptId)
      .single();

    if (error) throwNormalized(error);
    return data;
    // Vraća: {
    //   elapsed_seconds: number|null,  — NULL za in_progress koji nije bio pauziran
    //   status: 'in_progress'|'paused'|'completed'|'abandoned',
    //   started_at: string,             — ISO timestamp
    //   total_paused_seconds: number,   — ukupno pauzirano vrijeme
    //   paused_at: string|null
    // }
  },

  // ── 6. Učitaj odgovore za pauziran attempt ────────────────────────────────
  //
  // NOVO: Koristi se u useExamInit kada nema lokalnog drafta ali postoji
  // pauziran attempt u bazi (npr. korisnik se prijavio s drugog uređaja).
  //
  // Vraća: { [questionId]: letter } ili null ako nema odgovora.
  //
  getAnswers: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempt_answers")
      .select("question_id, chosen_option")
      .eq("attempt_id", attemptId)
      .not("chosen_option", "is", null); // Preskači NULL = preskočena pitanja

    if (error) throwNormalized(error);
    if (!data?.length) return null;

    return Object.fromEntries(
      data.map((row) => [row.question_id, row.chosen_option]),
    );
  },

  // ── 7. Dohvati sve pokušaje korisnika ─────────────────────────────────────
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

    if (error) throwNormalized(error);
    return data ?? [];
  },

  // ── 8. Jedan pokušaj s detaljima ───────────────────────────────────────────
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

    if (error) throwNormalized(error);
    return data;
  },
};
