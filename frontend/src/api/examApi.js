// api/examApi.js
import { supabase } from "@/lib/supabase";

export const examApi = {
  // ── Ispiti s community statistikama (SubjectSelect stranica) ──────────────
  // Koristi exams_with_stats VIEW: exams + subjects + community stats
  // question_count dolazi iz DB (trigger ga ažurira automatski)
  getBySubjectWithStats: async (subjectId) => {
    const { data, error } = await supabase
      .from("exams_with_stats")
      .select(
        `id, subject_id, year, session, level, component,
         duration_minutes, title, total_points, question_count,
         avg_community_score_pct, community_attempts_count`,
      )
      .eq("subject_id", subjectId)
      .order("year", { ascending: false })
      .order("session");

    if (error) throw error;
    return data ?? [];
  },

  // ── Metapodaci jednog ispita ───────────────────────────────────────────────
  getById: async (examId) => {
    const { data, error } = await supabase
      .from("exams")
      .select(
        "id, subject_id, year, session, level, duration_minutes, title, total_points, component, question_count",
      )
      .eq("id", examId)
      .single();

    if (error) throw error;
    return data;
  },

  // ── Ispit + pitanja + passages (ExamTaking) ───────────────────────────────
  // Paralelni upiti: exams + questions_full VIEW
  // questions_full: pitanja + passages inline + options JSONB (BEZ correct_option)
  getWithQuestions: async (examId) => {
    const [examRes, questionsRes] = await Promise.all([
      supabase
        .from("exams")
        .select(
          "id, subject_id, year, session, level, duration_minutes, title, total_points, component, question_count",
        )
        .eq("id", examId)
        .single(),

      supabase
        .from("questions_full")
        .select("*")
        .eq("exam_id", examId)
        .order("position", { ascending: true }),
    ]);

    if (examRes.error) throw examRes.error;
    if (questionsRes.error) throw questionsRes.error;

    // Dedupliciraj passages u mapu
    const passagesMap = {};
    questionsRes.data.forEach((row) => {
      if (row.passage_id && !passagesMap[row.passage_id]) {
        passagesMap[row.passage_id] = {
          id: row.passage_id,
          title: row.passage_title ?? null,
          author: row.passage_author ?? null,
          source: row.passage_source ?? null,
          contentType: row.passage_content_type ?? "prose",
          content: row.passage_content ?? "",
          footnotes: Array.isArray(row.passage_footnotes)
            ? row.passage_footnotes
            : [],
        };
      }
    });

    const questions = questionsRes.data.map((row) => ({
      id: row.id,
      examId: row.exam_id,
      position: row.position,
      positionLabel: row.position_label ?? String(row.position),
      sectionLabel: row.section_label ?? null,
      questionType: row.question_type ?? "multiple_choice",
      parentQuestionId: row.parent_question_id ?? null,
      text: row.text,
      inlineText: row.inline_text ?? null,
      points: row.points ?? 1,
      passageId: row.passage_id ?? null,
      options: Array.isArray(row.options)
        ? [...row.options].sort((a, b) => a.letter.localeCompare(b.letter))
        : [],
    }));

    return { exam: examRes.data, questions, passages: passagesMap };
  },

  // ── Točni odgovori NAKON završetka (attempt_details VIEW + Youtubes RLS) ──
  getAnswerKey: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempt_details")
      .select(
        "question_id, chosen_option, correct_option, explanation, is_correct",
      )
      .eq("attempt_id", attemptId);

    if (error) throw error;

    return (data ?? []).reduce((acc, row) => {
      acc[row.question_id] = {
        correctOption: row.correct_option,
        explanation: row.explanation ?? null,
        isCorrect: row.is_correct,
        chosenOption: row.chosen_option,
      };
      return acc;
    }, {});
  },
};
