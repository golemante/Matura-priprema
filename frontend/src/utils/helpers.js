// utils/helpers.js
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = typeof key === "function" ? key(item) : item[key];
    return { ...acc, [k]: [...(acc[k] ?? []), item] };
  }, {});

export const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const calculateScore = (answers, questions) => {
  const correct = questions.filter((q) => answers[q.id] === q.correct).length;
  const totalPoints = questions.reduce(
    (s, q) => s + (answers[q.id] === q.correct ? q.points : 0),
    0,
  );
  const maxPoints = questions.reduce((s, q) => s + q.points, 0);
  return {
    correct,
    incorrect: questions.filter(
      (q) => answers[q.id] && answers[q.id] !== q.correct,
    ).length,
    skipped: questions.filter((q) => !answers[q.id]).length,
    totalPoints,
    maxPoints,
    percentage:
      questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
  };
};

export const truncate = (str, n) =>
  str.length > n ? `${str.slice(0, n)}...` : str;
