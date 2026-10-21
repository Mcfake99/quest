import assert from "node:assert/strict";
import { test } from "node:test";
import { autoMark, numericCorrect, paperScore, parseNumber } from "./mark.ts";
import type { RealPaper, RealPart } from "./types.ts";

const base: RealPart = { id: "p:1", label: "1", marks: 2, prompt: "", page: 1, kind: "self", scheme: "", topic: "" };

test("parses typed numbers", () => {
  assert.equal(parseNumber("£1,512"), 1512);
  assert.equal(parseNumber("speed = 630 km/h"), 630);
  assert.equal(parseNumber("6 x 10^-3"), 0.006);
  assert.equal(parseNumber("none"), null);
});

test("numeric answers within 1%", () => {
  assert.ok(numericCorrect("630", 630));
  assert.ok(numericCorrect("0.3168", 0.317));
  assert.ok(!numericCorrect("600", 630));
});

test("auto marks mcq and numeric parts", () => {
  const mcq: RealPart = { ...base, kind: "mcq", marks: 1, options: ["A", "B"], answer: ["B"] };
  assert.equal(autoMark(mcq, ["B"]), 1);
  assert.equal(autoMark(mcq, ["A"]), 0);
  const two: RealPart = { ...base, kind: "mcq", marks: 2, options: ["A", "B", "C", "D"], answer: ["B", "D"] };
  assert.equal(autoMark(two, ["B", "D"]), 2);
  assert.equal(autoMark(two, ["B", "C"]), 1);
  const num: RealPart = { ...base, kind: "numeric", numeric: 630 };
  assert.equal(autoMark(num, "630"), 2);
  assert.equal(autoMark(num, "12"), null);
  assert.equal(autoMark(base, "anything"), null);
});

test("paper score is capped at the cover maximum", () => {
  const paper: RealPaper = {
    id: "p", subjectId: "english", board: "AQA", spec: "8702", series: "June 2025", title: "", minutes: 60,
    totalMarks: 60, coverMarks: 30, choice: true, qp: "", ms: null, insert: null,
    questions: [{ number: 1, marks: 60, parts: [{ ...base, id: "a", marks: 30 }, { ...base, id: "b", marks: 30 }] }],
  };
  assert.deepEqual(paperScore(paper, { a: 25, b: 20 }), { score: 30, max: 30, pct: 100 });
});

test("numeric parts accept the scheme's alternative answers", () => {
  const part = { id: "x", label: "1", marks: 3, prompt: "", page: 1, kind: "numeric", numeric: 6.75, accept: [6.8], scheme: "", topic: "" } as RealPart;
  assert.equal(autoMark(part, "6.8"), 3);
  assert.equal(autoMark(part, "6.75 m/s²"), 3);
  assert.equal(autoMark(part, "2"), null);
});
