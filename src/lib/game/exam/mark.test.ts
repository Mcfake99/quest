import assert from "node:assert/strict";
import test from "node:test";
import { businessU1 } from "./business-u1.ts";
import { businessU2 } from "./business-u2.ts";
import { mathsH1 } from "./maths-h1.ts";
import { markPaper, markPart, parseLoose } from "./mark.ts";
import type { ExamPaper, ExamPart, PartAnswer } from "./types.ts";

function partIn(paper: ExamPaper, id: string): ExamPart {
  for (const question of paper.questions) {
    const found = question.parts.find((item) => item.id === id);
    if (found) return found;
  }
  throw new Error(`missing ${id}`);
}

function part(id: string): ExamPart {
  return partIn(businessU1, id);
}

test("parseLoose reads money, percents, working and overdrawn balances", () => {
  assert.equal(parseLoose("£35"), 35);
  assert.equal(parseLoose("25 × 1.4 = 35"), 35);
  assert.equal(parseLoose("66.7%"), 66.7);
  assert.equal(parseLoose("24/36 × 100 = 66.67"), 66.67);
  assert.equal(parseLoose("(3700)"), -3700);
  assert.equal(parseLoose("3700 overdrawn"), -3700);
  assert.equal(parseLoose("−3,700"), -3700);
  assert.equal(parseLoose(""), null);
});

test("extra ticks score zero", () => {
  const tick = part("q1");
  const tooMany: PartAnswer = { kind: "tick", selected: ["a", "b", "c"] };
  const both: PartAnswer = { kind: "tick", selected: ["a", "b"] };
  const one: PartAnswer = { kind: "tick", selected: ["a"] };
  assert.equal(markPart(tick, tooMany).awarded, 0);
  assert.equal(markPart(tick, both).awarded, 2);
  assert.equal(markPart(tick, one).awarded, 1);
});

test("cost-plus, percentage and cash-flow figures", () => {
  const price = markPart(part("q5a"), { kind: "number", values: { price: "£35" }, working: "" });
  assert.equal(price.awarded, 2);
  const method = markPart(part("q5a"), { kind: "number", values: { price: "25 x 0.4 = 10" }, working: "" });
  assert.equal(method.awarded, 1);
  const wrong = markPart(part("q5a"), { kind: "number", values: { price: "10" }, working: "" });
  assert.equal(wrong.awarded, 0);

  const pct = markPart(part("q6d"), { kind: "number", values: { pct: "66.7%" }, working: "" });
  assert.equal(pct.awarded, 2);
  const methodPct = markPart(part("q6d"), { kind: "number", values: { pct: "36" }, working: "60-24" });
  assert.equal(methodPct.awarded, 1);
  const badPct = markPart(part("q6d"), { kind: "number", values: { pct: "40" }, working: "" });
  assert.equal(badPct.awarded, 0);

  const cash = markPart(part("q9e"), {
    kind: "number",
    values: { remain: "9000", ncf: "9,750", close: "3700 OD" },
    working: "",
  });
  assert.equal(cash.awarded, 3);
  const sign = markPart(part("q9e"), {
    kind: "number",
    values: { remain: "9000", ncf: "9750", close: "3700" },
    working: "",
  });
  assert.equal(sign.awarded, 2);
  assert.ok(sign.notes.some((note) => note.includes("overdrawn")));
});

test("lines do not double-credit and growth is excluded", () => {
  const hr = markPart(part("q6a"), { kind: "lines", lines: ["recruitment", "training"] });
  assert.equal(hr.awarded, 2);
  const same = markPart(part("q6a"), { kind: "lines", lines: ["recruitment", "hiring staff"] });
  assert.equal(same.awarded, 1);
  const aims = markPart(part("q8c"), { kind: "lines", lines: ["growth", "profit"] });
  assert.equal(aims.awarded, 1);
  assert.ok(aims.notes.some((note) => note.includes("Growth")));
});

test("ideas score even when the wording is not the mark scheme", () => {
  const role = markPart(part("q4a"), {
    kind: "written",
    text: "She spots a gap and takes a risk with her own money.",
  });
  assert.equal(role.awarded, 2, role.credited.join(" | "));

  const price = markPart(part("q5b"), {
    kind: "written",
    text: "The price can be too high so people will not buy it.",
  });
  assert.equal(price.awarded, 2, price.credited.join(" | "));

  const name = markPart(part("q8e"), {
    kind: "written",
    text: "To protect the name and stop another business copying it.",
  });
  assert.equal(name.awarded, 2, name.credited.join(" | "));
});

test("a developed evaluation can reach the top band", () => {
  const text = `Fern & Field used external growth by taking over 24 sites for £48 million. This is faster than opening new nurseries and it gained existing customers, so it became the largest chain in the Midlands. Bulk buying plants could lead to economies of scale. However the £48 million is huge next to a £4 million profit, therefore payback will be slow and they may need to borrow. Integrating two cultures can cause problems and some sites may be weak because Greenacre was already struggling. Overall I would say the takeover was worthwhile only because they stopped at 24 and did not buy the weaker sites, but they must watch the debt.`;
  const marked = markPart(part("q6e"), { kind: "written", text });
  assert.equal(marked.awarded, 8, marked.credited.join(" | "));
});

test("the paper still totals 100 marks", () => {
  const total = businessU1.questions.reduce((sum, question) => sum + question.marks, 0);
  assert.equal(total, 100);
  assert.equal(businessU1.questions.length, 9);
  const blank = markPaper(businessU1, {});
  assert.equal(blank.awarded, 0);
  assert.equal(blank.max, 100);
});

test("unit 2 totals 60 and the calculations follow the case figures", () => {
  const total = businessU2.questions.reduce((sum, question) => sum + question.marks, 0);
  assert.equal(total, 60);
  assert.equal(businessU2.questions.length, 2);
  assert.equal(businessU2.minutes, 90);
  const parts = businessU2.questions.reduce((sum, question) => sum + question.marks, 0);
  assert.equal(
    parts,
    businessU2.questions.reduce(
      (sum, question) => sum + question.parts.reduce((inner, item) => inner + item.marks, 0),
      0,
    ),
  );

  const npm = markPart(partIn(businessU2, "u2q1b"), { kind: "number", values: { npm: "27.8%" }, working: "" });
  assert.equal(npm.awarded, 2);
  const rounded = markPart(partIn(businessU2, "u2q1b"), { kind: "number", values: { npm: "28" }, working: "" });
  assert.equal(rounded.awarded, 2);
  const exact = markPart(partIn(businessU2, "u2q1b"), { kind: "number", values: { npm: "27.76" }, working: "" });
  assert.equal(exact.awarded, 2);
  const formulaOnly = markPart(partIn(businessU2, "u2q1b"), {
    kind: "number",
    values: { npm: "31" },
    working: "net profit / sales revenue x 100",
  });
  assert.equal(formulaOnly.awarded, 1);

  const growth = markPart(partIn(businessU2, "u2q2a"), { kind: "number", values: { pct: "50.7%" }, working: "" });
  assert.equal(growth.awarded, 2);
  const fiftyOne = markPart(partIn(businessU2, "u2q2a"), { kind: "number", values: { pct: "51" }, working: "" });
  assert.equal(fiftyOne.awarded, 2);
  const method = markPart(partIn(businessU2, "u2q2a"), {
    kind: "number",
    values: { pct: "3.5" },
    working: "10.4 - 6.9 = 3.5",
  });
  assert.equal(method.awarded, 1);
});

test("unit 2 credits the idea without the exact words", () => {
  const portfolio = markPart(partIn(businessU2, "u2q1a"), {
    kind: "written",
    text: "It is the range of products the business sells.",
  });
  assert.equal(portfolio.awarded, 2, portfolio.credited.join(" | "));

  const channels = markPart(partIn(businessU2, "u2q1f"), {
    kind: "written",
    text: "The website and the shops reach more customers so sales can rise. However the marketplace fees cost more and the channels can compete with each other.",
  });
  assert.equal(channels.awarded, 6, channels.credited.join(" | "));

  const advice = `The world market is growing from 6.9 billion to 10.4 billion so there are more customers, and sales abroad would spread the risk if UK sales fall. However transport over a longer distance costs more, and the notes are only in English so language is a problem. The exchange rate could also mean less revenue. Overall I would advise a small trial in Belgium first, because the firm has never exported.`;
  const marked = markPart(partIn(businessU2, "u2q2e"), { kind: "written", text: advice });
  assert.ok(marked.awarded >= 8, `${marked.awarded} ${marked.credited.join(" | ")}`);
});

test("higher paper 1 is 80 marks and follows the June 2025 scheme", () => {
  const total = mathsH1.questions.reduce((sum, question) => sum + question.marks, 0);
  assert.equal(total, 80);
  assert.equal(mathsH1.questions.length, 25);
  assert.equal(mathsH1.minutes, 90);
  assert.equal(mathsH1.calculator, false);
  assert.equal(
    total,
    mathsH1.questions.reduce((sum, question) => sum + question.parts.reduce((inner, item) => inner + item.marks, 0), 0),
  );

  const pair = markPart(partIn(mathsH1, "m1"), {
    kind: "number",
    values: { pair: "x = 3/2, y = 3" },
    working: "",
  });
  assert.equal(pair.awarded, 3);

  const embedded = markPart(partIn(mathsH1, "m1"), {
    kind: "number",
    values: { pair: "" },
    working: "y = 3 and x = 1.5",
  });
  assert.equal(embedded.awarded, 2);

  const mass = markPart(partIn(mathsH1, "m3"), { kind: "number", values: { mass: "93.5" }, working: "" });
  assert.equal(mass.awarded, 2);
  const digits = markPart(partIn(mathsH1, "m3"), { kind: "number", values: { mass: "935" }, working: "" });
  assert.equal(digits.awarded, 1);
  const rounded = markPart(partIn(mathsH1, "m3"), {
    kind: "number",
    values: { mass: "94" },
    working: "11 × 8.5 = 93.5",
  });
  assert.equal(rounded.awarded, 2);

  const standard = markPart(partIn(mathsH1, "m6a"), {
    kind: "number",
    values: { sf: "6 × 10^-3" },
    working: "",
  });
  assert.equal(standard.awarded, 2);
  const notStandard = markPart(partIn(mathsH1, "m6a"), { kind: "number", values: { sf: "0.006" }, working: "" });
  assert.equal(notStandard.awarded, 1);

  const fraction = markPart(partIn(mathsH1, "m8"), { kind: "number", values: { frac: "2/3" }, working: "" });
  assert.equal(fraction.awarded, 3);
  const equivalent = markPart(partIn(mathsH1, "m8"), { kind: "number", values: { frac: "10/15" }, working: "" });
  assert.equal(equivalent.awarded, 3);
  const addedFirst = markPart(partIn(mathsH1, "m8"), { kind: "number", values: { frac: "14/15" }, working: "" });
  assert.equal(addedFirst.awarded, 2);

  const iqr = markPart(partIn(mathsH1, "m4"), { kind: "number", values: { iqr: "16" }, working: "" });
  assert.equal(iqr.awarded, 2);

  const bare = markPart(partIn(mathsH1, "m25"), { kind: "number", values: { n: "16" }, working: "" });
  assert.equal(bare.awarded, 1);
  const algebraic = markPart(partIn(mathsH1, "m25"), {
    kind: "number",
    values: { n: "16" },
    working: "6/n × 5/(n-1) = 1/8 so n(n-1) = 240, n^2 - n - 240 = 0, (n-16)(n+15) = 0",
  });
  assert.equal(algebraic.awarded, 5);

  const blank = markPaper(mathsH1, {});
  assert.equal(blank.awarded, 0);
  assert.equal(blank.max, 80);
});
