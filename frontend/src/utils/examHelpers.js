import {
  EXAM_SESSIONS,
  DIFFICULTY_LEVELS,
  normalizeSession,
  sessionDisplayName,
} from "@/utils/constants";

export function transformExam(dbExam) {
  const normId = normalizeSession(dbExam.session);

  const session = EXAM_SESSIONS.find((s) => s.id === normId) ?? {
    id: normId,
    name: sessionDisplayName(dbExam.session),
    order: 99,
  };

  const difficulty = DIFFICULTY_LEVELS.find((d) => d.id === dbExam.level) ?? {
    id: dbExam.level,
    name: dbExam.level,
    short: dbExam.level,
  };

  return {
    id: dbExam.id,
    subjectId: dbExam.subject_id,
    year: dbExam.year,
    session,
    difficulty,
    component: dbExam.component ?? null,
    title: dbExam.title ?? null,
    questionCount: dbExam.question_count ?? null,
    totalPoints: dbExam.total_points ?? null,
    duration: dbExam.duration_minutes,
    communityScore: dbExam.avg_community_score_pct ?? null,
    communityAttempts: dbExam.community_attempts_count ?? 0,
    _sessionNorm: normId,
  };
}
