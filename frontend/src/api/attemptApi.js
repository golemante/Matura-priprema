// api/attemptApi.js — v7
// ─────────────────────────────────────────────────────────────────────────────
// IZMJENE vs. v5/v6:
//
//  ✅ ISPRAVAK: getElapsed() vraćalo je { elapsed_seconds, status } OBJEKT ali
//     se koristio kao broj → NaN → timer se resetirao na puno trajanje.
//     NOVO: getStatus() vraća sve timing podatke. Staro getElapsed() uklonjeno.
//
//  ✅ NOVO: getAnswers(attemptId) — dohvaća snimljene odgovore iz DB.
//     Koristi se za obnavljanje odgovora pauziranog attempta na drugom uređaju.
//
//  ✅ checkActive() — dodan total_paused_seconds za točan elapsed izračun.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";
import { throwNormalized } from "@/lib/normalizeError";

export const attemptApi = {
  // ── Provjeri aktivan attempt ───────────────────────────────────────────────
  checkActive: async (examId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("attempts")
      .select(
        "id, status, started_at, elapsed_seconds, total_paused_seconds, paused_at",
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

  // ── Kreiraj attempt ────────────────────────────────────────────────────────
  create: async (examId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("attempts")
      .insert({ user_id: user.id, exam_id: examId, status: "in_progress" })
      .select("id, started_at")
      .single();

    if (error) throwNormalized(error);
    return data; // { id, started_at }
  },

  // ── Završi ispit ──────────────────────────────────────────────────────────
  finish: async (attemptId, answers, elapsedSeconds) => {
    const answersObj = Object.fromEntries(
      Object.entries(answers).map(([k, v]) => [k, v ?? null]),
    );
    const { data, error } = await supabase.rpc("finish_attempt", {
      p_attempt_id: attemptId,
      p_answers: answersObj,
      p_elapsed_secs: Math.max(0, Math.round(elapsedSeconds)),
    });
    if (error) throwNormalized(error);
    return data;
  },

  // ── Pauziraj ──────────────────────────────────────────────────────────────
  pause: async (attemptId, elapsedSeconds, answers = null) => {
    const answersObj = answers
      ? Object.fromEntries(
          Object.entries(answers).map(([k, v]) => [k, v ?? null]),
        )
      : null;
    const { error } = await supabase.rpc("pause_attempt", {
      p_attempt_id: attemptId,
      p_elapsed_secs: Math.max(0, Math.round(elapsedSeconds)),
      p_answers: answersObj,
    });
    if (error) throwNormalized(error);
  },

  // ── Nastavi ───────────────────────────────────────────────────────────────
  resume: async (attemptId) => {
    const { data, error } = await supabase.rpc("resume_attempt", {
      p_attempt_id: attemptId,
    });
    if (error) throwNormalized(error);
    return data; // { elapsed_seconds, total_paused_seconds }
  },

  // ── Dohvati timing status ─────────────────────────────────────────────────
  // ISPRAVAK: stara getElapsed() vraćala objekt a ne broj!
  // Ova funkcija vraća sve timing podatke potrebne za točan sync.
  getStatus: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempts")
      .select(
        "status, started_at, elapsed_seconds, total_paused_seconds, paused_at",
      )
      .eq("id", attemptId)
      .single();
    if (error) throwNormalized(error);
    return data;
    // { status, started_at, elapsed_seconds, total_paused_seconds, paused_at }
  },

  // ── Dohvati snimljene odgovore ────────────────────────────────────────────
  // Koristi se za restore pauziranog attempta (drugi uređaj / refresh).
  getAnswers: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempt_answers")
      .select("question_id, chosen_option")
      .eq("attempt_id", attemptId)
      .not("chosen_option", "is", null);
    if (error) throwNormalized(error);
    if (!data?.length) return null;
    return Object.fromEntries(
      data.map((r) => [r.question_id, r.chosen_option]),
    );
  },

  // ── Svi pokušaji korisnika ────────────────────────────────────────────────
  getAll: async () => {
    const { data, error } = await supabase
      .from("attempts")
      .select(
        `id, exam_id, status, started_at, finished_at,
         elapsed_seconds, score_pct, correct_count, total_count,
         exam:exams (
           id, subject_id, year, session, level,
           title, total_points, duration_minutes
         )`,
      )
      .order("created_at", { ascending: false });
    if (error) throwNormalized(error);
    return data ?? [];
  },

  // ── Jedan pokušaj s detaljima ─────────────────────────────────────────────
  getById: async (id) => {
    const { data, error } = await supabase
      .from("attempts")
      .select(
        `*, exam:exams (*),
         attempt_answers (question_id, chosen_option, is_correct)`,
      )
      .eq("id", id)
      .single();
    if (error) throwNormalized(error);
    return data;
  },
};
