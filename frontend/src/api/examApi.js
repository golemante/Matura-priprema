// api/examApi.js
// ─────────────────────────────────────────────────────────────────────────────
// FIX P2-2: Svi `throw error` zamijenjeni s `throwNormalized(error)`
//
// ZAŠTO: Raw Supabase PostgrestError sadrži poruke poput:
//   "JWT expired", "violates row-level security policy", "PGRST116"
// koje su besmislene krajnjem korisniku.
// throwNormalized() prevodi na: "Sesija je istekla", "Nemate dozvolu", itd.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";
import { throwNormalized } from "@/lib/normalizeError";

export const examApi = {
  // ── Ispiti s community statistikama (SubjectSelect stranica) ──────────────
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

    if (error) throwNormalized(error);
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

    if (error) throwNormalized(error);
    return data;
  },

  // ── Ispit + pitanja + passages (ExamTaking) ───────────────────────────────
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

    let examData = examRes.data;

    // Fallback: neki anon setupi dopuštaju čitanje preko exams_with_stats view-a,
    // ali ne i direktno iz `exams` tablice. U tom slučaju pokušaj dohvatiti
    // metapodatke iz view-a da odabir ispita ne pada odmah na grešku.
    if (examRes.error) {
      const { data: examFromView, error: viewError } = await supabase
        .from("exams_with_stats")
        .select(
          "id, subject_id, year, session, level, duration_minutes, title, total_points, component, question_count",
        )
        .eq("id", examId)
        .single();

      if (viewError) throwNormalized(examRes.error);
      examData = examFromView;
    }

    if (questionsRes.error) throwNormalized(questionsRes.error);

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
      imageUrl: row.image_url ?? null,
      options: Array.isArray(row.options) ? row.options : [],
    }));

    return { exam: examData, questions, passages: passagesMap };
  },

  // ── Answer Key (točni odgovori — samo za completed attempts) ─────────────
  getAnswerKey: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempt_details")
      .select("question_id, correct_option, explanation, explanation_source")
      .eq("attempt_id", attemptId);

    if (error) throwNormalized(error);

    return (data ?? []).reduce((acc, row) => {
      acc[row.question_id] = {
        correctOption: row.correct_option,
        explanation: row.explanation ?? null,
        explanationSource: row.explanation_source ?? null,
      };
      return acc;
    }, {});
  },
};
