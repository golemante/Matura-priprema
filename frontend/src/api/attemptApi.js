// api/attemptApi.js
// ─────────────────────────────────────────────────────────────────────────────
// IZMJENE vs. prethodne verzije:
//
//  ✅ NOVO: checkActive(examId)
//     Provjeri postoji li već in_progress ili paused attempt za ovaj exam+user.
//     Vraća attempt objekt ako postoji, null ako ne postoji.
//     Koristi se u useExamInit.js PRIJE create() poziva (P1-1 fix).
//
//  ✅ FIX: create() sada koristi throwNormalized umjesto `throw error`
//     Konzistentno s examApi.js (P3-1 fix).
//
//  ✅ NEIZMIJENJENO: finish(), pause(), resume(), getElapsed(), getAll(),
//     getById() — sve je ostalo identično prethodnoj verziji.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";
import { throwNormalized } from "@/lib/normalizeError";

export const attemptApi = {
  // ── 0. Provjeri postoji li aktivan attempt (P1-1: anti-duplicate) ─────────
  //
  // ZAŠTO: Bez ove provjere, svaki mount ExamTaking-a kreira novi attempt.
  // Korisnik koji refresha stranicu ili navigira back/forward akumulira
  // bezbroj `in_progress` pokušaja za isti ispit.
  //
  // IMPLEMENTACIJA:
  //   Querija attempts s filterom na user_id (RLS automatski) + exam_id +
  //   status IN ('in_progress', 'paused').
  //   Vraća null ako nema aktivnog pokušaja.
  //
  // POZIVA SE: u useExamInit.js, PRIJE create().
  //
  checkActive: async (examId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("attempts")
      .select("id, started_at, elapsed_seconds, status, paused_at")
      .eq("exam_id", examId)
      .eq("user_id", user.id)
      .in("status", ["in_progress", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(); // maybeSingle() vraća null umjesto error-a ako nema zapisa

    if (error) throwNormalized(error);
    return data ?? null; // null = nema aktivnog pokušaja
  },

  // ── 1. Kreiraj attempt na POČETKU ispita ──────────────────────────────────
  // Vraća null ako korisnik nije prijavljen (anon korisnici mogu čitati ispit,
  // ali rezultati se ne bilježe u bazi).
  //
  // ⚠️  POZIVAJ NAKON checkActive() — ako checkActive() vrati attempt,
  //     koristi taj attempt umjesto kreiranja novog!
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

    if (error) throwNormalized(error); // ← FIX P3-1: bio `throw error`
    return data; // { id: UUID, started_at: TIMESTAMPTZ }
  },

  // ── 2. Završi ispit — RPC finish_attempt ──────────────────────────────────
  //
  // p_answers mora biti JSONB OBJECT { "uuid": "a"|null }
  // DB RPC: v_chosen := p_answers ->> v_question.id::TEXT
  //
  // Returna: { correct_count, total_count, score_pct, elapsed_seconds }
  //
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
    return data; // { correct_count, total_count, score_pct, elapsed_seconds }
  },

  // ── 3. Pauziraj ispit — RPC pause_attempt ─────────────────────────────────
  //
  // p_answers mora biti JSONB OBJECT (isti razlog kao finish)
  //
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
  // Vraća: { elapsed_seconds, total_paused_seconds }
  resume: async (attemptId) => {
    const { data, error } = await supabase.rpc("resume_attempt", {
      p_attempt_id: attemptId,
    });

    if (error) throwNormalized(error);
    return data;
  },

  // ── 5. Dohvati elapsed + status (za server-sync timera) ───────────────────
  getElapsed: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempts")
      .select("elapsed_seconds, status")
      .eq("id", attemptId)
      .single();

    if (error) throwNormalized(error);
    return data;
  },

  // ── 6. Dohvati sve pokušaje korisnika (RLS automatski filtrira) ────────────
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

  // ── 7. Jedan pokušaj s detaljima ───────────────────────────────────────────
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
