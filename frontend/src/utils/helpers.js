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

export const truncate = (str, n) =>
  str.length > n ? `${str.slice(0, n)}...` : str;

export const groupQuestionsBySection = (questions) =>
  questions.reduce((acc, q) => {
    const key = q.sectionLabel ?? "Ostalo";
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});

export const countAnswered = (answers, questions) =>
  questions.filter((q) => q.questionType !== "fill_blank_mc" && answers[q.id])
    .length;

export const countScoreable = (questions) =>
  questions.filter((q) => q.questionType !== "fill_blank_mc").length;

export function debounce(fn, ms) {
  let id;
  const d = (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
  d.flush = (...args) => {
    clearTimeout(id);
    fn(...args);
  };
  d.cancel = () => clearTimeout(id);
  return d;
}
