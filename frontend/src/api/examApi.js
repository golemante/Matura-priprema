// api/examApi.js
import { supabase } from "@/lib/supabase";
import { throwNormalized } from "@/lib/normalizeError";

function mapQuestionRows(rows) {
  return rows
    .filter((row) => row?.id)
    .map((row) => ({
      id: row.id,
      examId: row.exam_id,
      position: row.position,
      positionLabel: row.position_label ?? String(row.position),
      sectionLabel: row.section_label ?? null,
      questionType: row.question_type ?? "multiple_choice",
      parentQuestionId: row.parent_question_id ?? null,
      text: row.text ?? "",
      inlineText: row.inline_text ?? null,
      points: row.points ?? 1,
      passageId: row.passage_id ?? null,
      imageUrl: row.image_url ?? null,
      audioUrl: row.question_audio_url ?? null,
      audioDurationSeconds: row.question_audio_duration ?? null,
      options: Array.isArray(row.options) ? row.options : [],
    }));
}

function extractPassagesMap(rows) {
  const passagesMap = {};
  rows.forEach((row) => {
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
        audioUrl: row.passage_audio_url ?? null,
        audioDurationSeconds: row.passage_audio_duration ?? null,
        transcript: row.passage_transcript ?? null,
      };
    }
  });
  return passagesMap;
}

export const examApi = {
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

    if (questionsRes.error) {
      console.warn(
        "[examApi] questions_full VIEW failed, trying direct query:",
        questionsRes.error.message,
      );

      const { data: directQuestions, error: directError } = await supabase
        .from("questions")
        .select(
          `id, exam_id, passage_id, parent_question_id, position,
           position_label, section_label, question_type, text,
           inline_text, points, image_url,
           options (id, letter, text)`,
        )
        .eq("exam_id", examId)
        .order("position", { ascending: true });

      if (directError) {
        throwNormalized(questionsRes.error);
      }

      const questionRows = Array.isArray(directQuestions)
        ? directQuestions
        : [];

      const passageIds = [
        ...new Set(questionRows.map((q) => q.passage_id).filter(Boolean)),
      ];

      let passagesMap = {};
      if (passageIds.length > 0) {
        const { data: passagesData } = await supabase
          .from("passages")
          .select(
            "id, title, author, source, content_type, content, footnotes, audio_url, audio_duration_seconds, transcript",
          )
          .in("id", passageIds);

        if (passagesData) {
          passagesData.forEach((p) => {
            passagesMap[p.id] = {
              id: p.id,
              title: p.title ?? null,
              author: p.author ?? null,
              source: p.source ?? null,
              contentType: p.content_type ?? "prose",
              content: p.content ?? "",
              footnotes: Array.isArray(p.footnotes) ? p.footnotes : [],
              audioUrl: p.audio_url ?? null,
              audioDurationSeconds: p.audio_duration_seconds ?? null,
              transcript: p.transcript ?? null,
            };
          });
        }
      }

      return {
        exam: examData ?? null,
        questions: mapQuestionRows(questionRows),
        passages: passagesMap,
      };
    }

    const questionRows = Array.isArray(questionsRes.data)
      ? questionsRes.data
      : [];

    return {
      exam: examData ?? null,
      questions: mapQuestionRows(questionRows),
      passages: extractPassagesMap(questionRows),
    };
  },

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
