// Small, dependency-free helpers shared by the UI and the regression tests.
'use strict';
const AppLogic = (() => {
  const duration = 30 * 60 * 1000;
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0 && value <= 1e9;
  const empty = () => ({stats: {}, exams: [], active: null, practice: {}});
  const choices = q => [q.correct, ...q.wrong];
  function session(raw, questions, now) {
    if (!record(raw) || !['learn', 'exam'].includes(raw.mode) || !Array.isArray(raw.ids) ||
        !raw.ids.length || raw.ids.length > (raw.mode === 'exam' ? 25 : questions.length) ||
        new Set(raw.ids).size !== raw.ids.length || !raw.ids.every(id => questions.some(q => q.id === id)) ||
        !integer(raw.index) || raw.index >= raw.ids.length || !record(raw.answers) ||
        !Number.isFinite(raw.startedAt) || raw.startedAt <= 0 || raw.startedAt > now + 1000 ||
        raw.duration !== duration) return null;
    const clean = {mode: raw.mode, ids: [...raw.ids], index: raw.index, answers: {}, confirmed: {},
      startedAt: raw.startedAt, duration, reviewMistakes: raw.reviewMistakes === true, only2023: raw.only2023 === true};
    for (const id of clean.ids) {
      const valid = choices(questions.find(q => q.id === id));
      if (valid.includes(raw.answers[id]) && (raw.mode === 'exam' || raw.confirmed?.[id] === true)) {
        clean.answers[id] = raw.answers[id];
        if (raw.mode === 'learn' && raw.confirmed?.[id] === true) clean.confirmed[id] = true;
      }
      const opts = raw['opts' + id];
      if (Array.isArray(opts) && opts.length === 4 && new Set(opts).size === 4 && opts.every(o => valid.includes(o))) {
        clean['opts' + id] = [...opts];
      }
    }
    return clean;
  }
  function sanitize(raw, questions, now = Date.now()) {
    const clean = empty();
    if (!record(raw)) return clean;
    for (const q of questions) {
      const s = raw.stats?.[q.id];
      if (record(s) && integer(s.attempts) && integer(s.correct) && s.correct <= s.attempts) {
        clean.stats[q.id] = {attempts: s.attempts, correct: s.correct, lastWrong: s.attempts > 0 && s.lastWrong === true};
      }
    }
    if (Array.isArray(raw.exams)) clean.exams = raw.exams.filter(e => record(e) &&
      integer(e.correct) && integer(e.total) && e.total > 0 && e.total <= questions.length && e.correct <= e.total &&
      typeof e.date === 'string' && e.date.length <= 40 && Number.isFinite(Date.parse(e.date)))
      .slice(0, 20).map(e => ({date: e.date, correct: e.correct, total: e.total}));
    for (let i = 0; i < 7; i++) if (raw.practice?.[i] === true) clean.practice[i] = true;
    clean.active = session(raw.active, questions, now);
    return clean;
  }
  function score(ids, answers, questions) {
    return ids.filter(id => {const q = questions.find(q => q.id === id); return q && answers[id] === q.correct;}).length;
  }
  function parseGrams(value) {
    const text = String(value).trim();
    if (!/^\d+(?:[.,]\d+)?$/.test(text)) return null;
    const number = Number(text.replace(',', '.'));
    return Number.isFinite(number) ? number : null;
  }
  const scale = (grams, portions, original = 10) => grams * portions / original;
  // Facts transcribed from Neamț 2023, written paper III.2 (kg converted to g).
  const recipe = [['Cartofi',1000],['Supă de oase',2500],['Tăiței',300],['Ceapă',150],['Ulei',50],
    ['Pastă de tomate',50],['Piper măcinat',1],['Pătrunjel verde',50],['Smântână',100],['Sare',30]];
  const practical = [['Cartofi','300 g'],['Ceapă','30 g'],['Făină','8 g'],['Lapte','60 g'],['Pâine albă','45 g'],
    ['Margarină sau unt','23 g'],['Ouă','5 g'],['Supă de oase','450 ml'],['Sare','3 g']];
  return {duration, empty, sanitize, score, parseGrams, scale, recipe, practical};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = AppLogic;
