import test from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";
import { loadQuestions, measure } from "./option-lengths.mjs";

const questions = await loadQuestions();
const { stats, rows } = measure(questions);

test("correct MCQ option is not usually the longest", () => {
  // Chance is ~25% for four options; allow a small slack above chance.
  assert.ok(
    stats.pct <= stats.chancePct + 3,
    `correct answer strictly longest in ${stats.pct}% of MCQs (chance ${stats.chancePct}%)`,
  );
});

test("no correct option is far longer than every distractor", () => {
  const worst = rows.filter((r) => r.lead > 20).map((r) => `${r.id} (+${r.lead})`);
  assert.deepEqual(worst, [], "correct answer more than 20 chars longer than all distractors");
});

test("few MCQs have wildly mismatched option lengths", () => {
  assert.ok(stats.unbalanced <= Math.ceil(stats.mcqs * 0.04), `${stats.unbalanced} unbalanced MCQs`);
});

test("option shuffle is deterministic and keeps the same options", async () => {
  const { withShuffledOptions, pickQuestions } = await createJiti(import.meta.url).import(
    "../../src/lib/game/questions.ts",
  );
  const q = questions.find((x) => x.type === "mcq" && x.options.length === 4);
  const a = withShuffledOptions(q, "seed-1");
  assert.deepEqual(withShuffledOptions(q, "seed-1").options, a.options);
  assert.deepEqual([...a.options].sort(), [...q.options].sort());
  assert.equal(a.answer, q.answer);
  const p1 = pickQuestions({ count: 10, seed: "2026-10-24-daily" });
  const p2 = pickQuestions({ count: 10, seed: "2026-10-24-daily" });
  assert.deepEqual(p1.map((x) => x.options), p2.map((x) => x.options));
  // Across many questions the answer should land in every slot.
  const slots = new Set(
    questions.filter((x) => x.type === "mcq" && x.options.length === 4)
      .map((x) => withShuffledOptions(x, "s").options.indexOf(x.answer)),
  );
  assert.equal(slots.size, 4);
});
