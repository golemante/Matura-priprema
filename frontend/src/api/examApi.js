// api/examApi.js
// ─────────────────────────────────────────────────────────────────────────────
// PROMJENE u odnosu na staru verziju:
//   • getWithQuestions koristi 'questions_full' view (uključuje passages + options)
//   • options sada imaju { id: UUID, letter: 'a'|..., text } — koristimo letter
//   • questions NEMAJU correct_option — odgovori su u Youtubes (sigurnost)
//   • exam sada ima title i total_points
//   • nova funkcija getAnswerKey — dohvata točne odgovore tek NAKON završetka ispita
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

export const examApi = {
  // ── Dohvati sve ispite za predmet ──────────────────────────────────────────
  getBySubject: async (subjectId) => {
    const { data, error } = await supabase
      .from("exams")
      .select(
        "id, subject_id, year, session, level, duration_minutes, title, total_points, component, is_published",
      )
      .eq("subject_id", subjectId)
      .eq("is_published", true)
      .order("year", { ascending: false })
      .order("session");

    if (error) throw error;
    return data;
  },

  // ── Metapodaci jednog ispita (bez pitanja) ─────────────────────────────────
  getById: async (examId) => {
    const { data, error } = await supabase
      .from("exams")
      .select(
        "id, subject_id, year, session, level, duration_minutes, title, total_points, component",
      )
      .eq("id", examId)
      .single();

    if (error) throw error;
    return data;
  },

  // ── Ispit + pitanja + passages u jednom pozivu ─────────────────────────────
  //
  // Koristi 'questions_full' view koji vraća:
  //   - sva polja pitanja (BEZ correct_option)
  //   - passage podatke inline (passage_id, passage_title, passage_content, itd.)
  //   - options kao JSONB niz: [{ id: UUID, letter: 'a', text: '...' }]
  //
  // Transformacija:
  //   1. Iz pitanja izvlačimo passage objekte u Map (deduplikacija)
  //   2. questions dobivaju samo passage_id (ne cijeli objekt)
  //   3. options se sortiraju a→f prema letter stupcu
  //   4. fill_blank_mc parent pitanja grupiramo s djeca pitanjima
  //
  getWithQuestions: async (examId) => {
    const [examRes, questionsRes] = await Promise.all([
      supabase
        .from("exams")
        .select(
          "id, subject_id, year, session, level, duration_minutes, title, total_points, component",
        )
        .eq("id", examId)
        .single(),

      // questions_full view — sve u jednom upitu, bez correct_option
      supabase
        .from("questions_full")
        .select("*")
        .eq("exam_id", examId)
        .order("position", { ascending: true }),
    ]);

    if (examRes.error) throw examRes.error;
    if (questionsRes.error) throw questionsRes.error;

    // ── Izvuci passages u mapu ─────────────────────────────────────────────
    const passagesMap = {};
    questionsRes.data.forEach((row) => {
      if (row.passage_id && !passagesMap[row.passage_id]) {
        passagesMap[row.passage_id] = {
          id: row.passage_id,
          title: row.passage_title ?? null,
          content_type: row.passage_content_type ?? "prose",
          content: row.passage_content ?? "",
          footnotes: row.passage_footnotes ?? [],
          author: row.passage_author ?? null,
          source: row.passage_source ?? null,
        };
      }
    });

    // ── Transformiraj pitanja ─────────────────────────────────────────────
    const questions = questionsRes.data.map((row) => ({
      id: row.id,
      examId: row.exam_id,
      position: row.position,
      // position_label je "58.1" za podpitanja, inače null
      positionLabel: row.position_label ?? String(row.position),
      sectionLabel: row.section_label ?? null,
      questionType: row.question_type ?? "multiple_choice",
      text: row.text,
      // inline_text: kratki citat/poem koji ide uz pitanje
      inlineText: row.inline_text ?? null,
      points: row.points ?? 1,
      passageId: row.passage_id ?? null,
      parentQuestionId: row.parent_question_id ?? null,
      // options: JSONB niz iz viewa, sortiran a→f
      options: Array.isArray(row.options)
        ? [...row.options].sort((a, b) => a.letter.localeCompare(b.letter))
        : [],
    }));

    return {
      exam: examRes.data,
      questions,
      passages: passagesMap,
    };
  },

  // ── Dohvati točne odgovore NAKON završetka ispita ─────────────────────────
  //
  // attempt_details view: JOIN attempt_answers + Youtubes
  // RLS blokira pristup dok attempt.status != 'completed'
  // Vraća: [{ question_id, chosen_option, correct_option, explanation, is_correct }]
  //
  getAnswerKey: async (attemptId) => {
    const { data, error } = await supabase
      .from("attempt_details")
      .select(
        "question_id, chosen_option, correct_option, explanation, is_correct",
      )
      .eq("attempt_id", attemptId);

    if (error) throw error;

    // Pretvori u mapu za O(1) lookup: { question_id: { correct_option, explanation, is_correct } }
    return data.reduce((acc, row) => {
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
