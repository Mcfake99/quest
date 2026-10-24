// Measures whether MCQ correct answers stand out by length.
// Usage: node scripts/quiz/option-lengths.mjs [--list]
import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";

export async function loadQuestions() {
  const jiti = createJiti(import.meta.url);
  const { ALL_QUESTIONS } = await jiti.import("../../src/lib/game/questions.ts");
  return ALL_QUESTIONS;
}

export function measure(questions) {
  const mcqs = questions.filter((q) => q.options && q.options.length > 2);
  let longest = 0, unbalanced = 0, expected = 0, maxLead = 0;
  const rows = [];
  for (const q of mcqs) {
    const lens = q.options.map((o) => o.length);
    const maxOther = Math.max(...q.options.filter((o) => o !== q.answer).map((o) => o.length));
    const lead = q.answer.length - maxOther;
    const strict = lead > 0;
    expected += 1 / q.options.length;
    if (strict) { longest++; maxLead = Math.max(maxLead, lead); }
    const ratio = Math.max(...lens) / Math.max(1, Math.min(...lens));
    const bad = Math.max(...lens) >= 25 && ratio > 2.5;
    if (bad) unbalanced++;
    if (strict || bad) rows.push({ id: q.id, lead, ratio: +ratio.toFixed(2), strict, bad });
  }
  return {
    stats: {
      mcqs: mcqs.length,
      correctStrictlyLongest: longest,
      pct: +((100 * longest) / mcqs.length).toFixed(1),
      chancePct: +((100 * expected) / mcqs.length).toFixed(1),
      unbalanced,
      maxLead,
    },
    rows,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { stats, rows } = measure(await loadQuestions());
  console.log(JSON.stringify(stats));
  if (process.argv.includes("--list"))
    for (const r of rows.sort((x, y) => y.lead - x.lead))
      console.log(r.id, r.lead, r.ratio, r.strict ? "LONGEST" : "", r.bad ? "UNBALANCED" : "");
}
