// api/examApi.js
// ─────────────────────────────────────────────────────────────────────────────
// FIX: Dodan fallback za questions_full VIEW grešku
//
// PROBLEM: Ako GRANT SELECT ON questions_full nije primijenjen (ili VIEW ima
// problem), `questionsRes.error` je postavljen i odmah se baca iznimka.
// Korisnik vidi grešku iako exams, questions i options tablice rade normalno.
//
// RJEŠENJE: Ako questions_full VIEW ne radi, pokušaj direktni query na
// `questions` + `options` tablicama (bez passage podataka u flat formatu).
// Passages se dohvaćaju zasebno ako pitanja imaju passage_id.
//
// FIX P2-2: Svi `throw error` zamijenjeni s `throwNormalized(error)`
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";
import { throwNormalized } from "@/lib/normalizeError";

// ── Interna helper funkcija: mapiranje redaka u questions array ───────────────
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
      options: Array.isArray(row.options) ? row.options : [],
    }));
}

// ── Interna helper: dedupliciraj passages iz flat question_full redaka ────────
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
      };
    }
  });
  return passagesMap;
}

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

    // ── Fallback #1: exams tablica → exams_with_stats VIEW ────────────────
    // Neki anon setupi dopuštaju čitanje preko exams_with_stats view-a
    // ali ne i direktno iz `exams` tablice.
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

    // ── Fallback #2: questions_full VIEW → direktni questions + options ────
    //
    // ZAŠTO: questions_full VIEW zahtijeva GRANT SELECT koji možda nije
    // primijenjen (schema v4 sekcija 8). Direktne tablice imaju zasebne
    // GRANT-ove i mogu raditi čak i kad VIEW ne radi.
    //
    // KOMPROMIS: Ovaj fallback ne vraća passage podatke u flat formatu
    // jer questions_full VIEW joinuje passages. Umjesto toga, passages
    // se dohvaćaju zasebno ako postoje passage_id-ovi u pitanjima.
    //
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
        // Ni direktni query ne radi — baci originalnu grešku (questions_full)
        // jer je vjerojatno informativnija (npr. 42501 permission denied)
        throwNormalized(questionsRes.error);
      }

      const questionRows = Array.isArray(directQuestions)
        ? directQuestions
        : [];

      // Dohvati passages zasebno ako postoje passage_id-ovi
      const passageIds = [
        ...new Set(questionRows.map((q) => q.passage_id).filter(Boolean)),
      ];

      let passagesMap = {};
      if (passageIds.length > 0) {
        const { data: passagesData } = await supabase
          .from("passages")
          .select("id, title, author, source, content_type, content, footnotes")
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

    // ── Normalan put: questions_full VIEW je radio ─────────────────────────
    const questionRows = Array.isArray(questionsRes.data)
      ? questionsRes.data
      : [];

    return {
      exam: examData ?? null,
      questions: mapQuestionRows(questionRows),
      passages: extractPassagesMap(questionRows),
    };
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
