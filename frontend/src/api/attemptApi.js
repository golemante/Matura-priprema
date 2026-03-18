// api/attemptApi.js
import { supabase } from "@/lib/supabase";
import { throwNormalized } from "@/lib/normalizeError";

export const attemptApi = {
  checkActive: async (examId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("attempts")
      .select(
        "id, status, started_at, elapsed_seconds, total_paused_seconds, paused_at, " +
          "audio_is_done, audio_current_time_s, audio_track_index",
      )
      .eq("exam_id", examId)
      .eq("user_id", user.id)
      .in("status", ["in_progress", "paused"])
      .order("created_at", { ascending: false });

    if (error) throwNormalized(error);
    if (!data?.length) return null;

    const [latest, ...older] = data;

    const ghostIds = older.map((a) => a.id);
    if (ghostIds.length > 0) {
      console.info(
        `[attemptApi.checkActive] Pronađeno ${ghostIds.length} starijih attempt(a) za examId="${examId}". Abandoniranje...`,
      );
      Promise.allSettled(ghostIds.map((id) => attemptApi.abandon(id))).then(
        (results) => {
          results.forEach((r, i) => {
            if (r.status === "rejected") {
              console.warn(
                `[attemptApi.checkActive] Abandon attempt ${ghostIds[i]} pao:`,
                r.reason?.message,
              );
            }
          });
        },
      );
    }

    return latest;
  },

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
    return data;
  },

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

  resume: async (attemptId) => {
    const { data, error } = await supabase.rpc("resume_attempt", {
      p_attempt_id: attemptId,
    });
    if (error) throwNormalized(error);
    return data;
  },

  getStatus: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempts")
      .select(
        "status, started_at, elapsed_seconds, total_paused_seconds, paused_at",
      )
      .eq("id", attemptId)
      .maybeSingle();
    if (error) throwNormalized(error);
    return data ?? null;
  },

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

  getServerTime: async () => {
    try {
      const { data, error } = await supabase.rpc("server_now");
      if (error) {
        console.warn(
          "[attemptApi.getServerTime] RPC server_now pao:",
          error.message,
        );
        return null;
      }
      return new Date(data).getTime();
    } catch (err) {
      console.warn(
        "[attemptApi.getServerTime] Neočekivana greška:",
        err?.message,
      );
      return null;
    }
  },

  abandon: async (attemptId) => {
    try {
      const { data, error } = await supabase.rpc("abandon_attempt", {
        p_attempt_id: attemptId,
      });
      if (error) {
        console.warn(
          `[attemptApi.abandon] RPC abandon_attempt pao za ${attemptId}:`,
          error.message,
        );
        return null;
      }
      return data;
    } catch (err) {
      console.warn(
        `[attemptApi.abandon] Neočekivana greška za ${attemptId}:`,
        err?.message,
      );
      return null;
    }
  },

  syncAudioStatus: async (
    attemptId,
    { isDone = false, currentTimeS = null, trackIndex = null } = {},
  ) => {
    if (!attemptId) return;

    try {
      const { error } = await supabase.rpc("sync_audio_status", {
        p_attempt_id: attemptId,
        p_audio_is_done: isDone,
        p_current_time_s:
          currentTimeS != null ? Math.round(currentTimeS * 100) / 100 : null,
        p_track_index:
          trackIndex != null ? Math.max(0, Math.floor(trackIndex)) : null,
      });

      if (error) {
        if (error.code === "42883") {
          console.warn(
            "[attemptApi.syncAudioStatus] RPC sync_audio_status ne postoji. " +
              "Pokreni migration_audio_is_done.sql da aktiviraš server-side audio tracking.",
          );
        } else {
          console.warn(
            "[attemptApi.syncAudioStatus] RPC greška:",
            error.message,
          );
        }
      } else {
        console.debug(
          `[attemptApi.syncAudioStatus] OK — isDone=${isDone}, ` +
            `t=${currentTimeS?.toFixed(1) ?? "?"}s, track=${trackIndex ?? "?"}`,
        );
      }
    } catch (err) {
      console.warn(
        "[attemptApi.syncAudioStatus] Neočekivana greška:",
        err?.message,
      );
    }
  },

  getAudioStatus: async (attemptId) => {
    if (!attemptId) return null;

    try {
      const { data, error } = await supabase.rpc("get_audio_status", {
        p_attempt_id: attemptId,
      });

      if (error) {
        if (error.code === "42883") {
          console.warn(
            "[attemptApi.getAudioStatus] RPC get_audio_status ne postoji. " +
              "Koristim lokalnu pohranu kao fallback.",
          );
        } else {
          console.warn(
            "[attemptApi.getAudioStatus] RPC greška:",
            error.message,
          );
        }
        return null;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;

      return {
        audioIsDone: row.audio_is_done ?? false,
        audioCurrentTimeS: row.audio_current_time_s ?? null,
        audioTrackIndex: row.audio_track_index ?? null,
      };
    } catch (err) {
      console.warn(
        "[attemptApi.getAudioStatus] Neočekivana greška:",
        err?.message,
      );
      return null;
    }
  },
};
