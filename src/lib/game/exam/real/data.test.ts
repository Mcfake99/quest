// Integrity checks for the generated real-paper data (scripts/papers/extract.py).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RealPaper } from "./types.ts";

const dir = dirname(fileURLToPath(import.meta.url));
const papers: RealPaper[] = readdirSync(dir)
  .filter((f) => /^(aqa|edexcel)-.+\.ts$/.test(f) && !f.endsWith(".test.ts"))
  .map((f) => {
    const src = readFileSync(join(dir, f), "utf8");
    return JSON.parse(src.slice(src.indexOf("= ") + 2).trim().replace(/;$/, "")) as RealPaper;
  });

test("all 20 papers are present", () => {
  assert.equal(papers.length, 20);
});

for (const paper of papers) {
  const parts = paper.questions.flatMap((q) => q.parts);

  test(`${paper.id}: every part has scheme text or an explicit PDF link`, () => {
    for (const p of parts) {
      const hasScheme = p.scheme.trim().length > 0 && !p.scheme.startsWith("See the official");
      assert.ok(hasScheme || Boolean(paper.ms || paper.qp), `${p.id} has no scheme and no PDF`);
      assert.ok(hasScheme, `${p.id} has no mark-scheme text`);
      assert.ok(p.prompt.trim().length > 0, `${p.id} has no prompt`);
      assert.ok(p.marks > 0, `${p.id} has no marks`);
    }
  });

  test(`${paper.id}: marks add up to the cover total`, () => {
    const sum = paper.questions.reduce((n, q) => n + q.marks, 0);
    assert.equal(sum, paper.totalMarks);
    for (const q of paper.questions) {
      const own = q.parts.reduce((n, p) => n + p.marks + (p.spag ?? 0), 0);
      if (q.alternatives) assert.ok(q.parts.every((p) => p.marks + (p.spag ?? 0) === q.marks), `Q${q.number}`);
      else assert.equal(own, q.marks, `Q${q.number} parts`);
    }
    // Choice papers (answer one question per section) print more marks than the cover total.
    if (paper.choice) assert.ok(paper.totalMarks > paper.coverMarks);
    else assert.equal(paper.totalMarks, paper.coverMarks);
  });

  test(`${paper.id}: auto-marked answers are well formed`, () => {
    for (const p of parts) {
      if (p.kind === "mcq") {
        assert.ok(p.options && p.answer && p.answer.length > 0, p.id);
        for (const a of p.answer!) assert.ok(p.options!.includes(a), `${p.id}: ${a} not an option`);
      }
      if (p.kind === "numeric") assert.equal(typeof p.numeric, "number", p.id);
      assert.ok(!/[\uf000-\uf0ff]/.test(p.prompt + p.scheme), `${p.id} has symbol-font glyphs`);
    }
  });
}

test("hand-verified answers", () => {
  const find = (id: string) => papers.flatMap((p) => p.questions.flatMap((q) => q.parts)).find((p) => p.id === id)!;
  assert.equal(find("aqa-8464-physics-paper2h:02.1").numeric, 6.75);
  assert.equal(find("edexcel-1ma1-paper3h:23").numeric, 3.75);
  assert.equal(find("aqa-8464-physics-paper2h:04.2").kind, "self");
  assert.equal(find("edexcel-1ma1-paper1h:15").kind, "self");
});
