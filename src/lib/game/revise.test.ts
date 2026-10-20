import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  advanceCard,
  BOX_DAYS,
  duePhrase,
  emptyRevision,
  FOCUS_MS,
  formatClock,
  freshDay,
  gradeFeynman,
  FEYNMAN,
  pickRunQuestion,
  reconcileRevision,
  runMode,
  BREAK_MS,
} from "./revise.ts";

const TODAY = "2026-10-06";

test("Leitner intervals are 1 day, 3 days, 1 week, 2 weeks, 1 month", () => {
  assert.deepEqual(BOX_DAYS, [0, 1, 3, 7, 14, 30]);
  assert.equal(duePhrase(1), "tomorrow");
  assert.equal(duePhrase(2), "in 3 days");
  assert.equal(duePhrase(3), "in a week");
  assert.equal(duePhrase(4), "in 2 weeks");
  assert.equal(duePhrase(5), "in a month");
});

test("a miss returns to box 1 tomorrow, a first hit waits 3 days, later hits promote", () => {
  const miss = advanceCard(undefined, false, TODAY);
  assert.deepEqual(miss, { box: 1, due: "2026-10-07" });

  let card = advanceCard(undefined, true, TODAY);
  assert.equal(card.box, 2);
  assert.equal(card.due, addDays(TODAY, 3));

  card = advanceCard(card, true, TODAY);
  assert.equal(card.box, 3);
  assert.equal(card.due, addDays(TODAY, 7));

  card = advanceCard(card, true, TODAY);
  assert.equal(card.box, 4);
  assert.equal(card.due, addDays(TODAY, 14));

  card = advanceCard(card, true, TODAY);
  assert.equal(card.box, 5);
  assert.equal(card.due, addDays(TODAY, 30));

  card = advanceCard(card, true, TODAY);
  assert.equal(card.box, 5);

  const dropped = advanceCard(card, false, TODAY);
  assert.deepEqual(dropped, { box: 1, due: addDays(TODAY, 1) });
});

test("Feynman credit needs two ideas, or one idea in a real explanation", () => {
  const ram = FEYNMAN.find((item) => item.id === "f-ram");
  assert.ok(ram);
  assert.equal(gradeFeynman("it stores data", ram).ok, false);
  assert.equal(gradeFeynman("RAM is memory for programs and it is lost when the power goes off", ram).ok, true);
  const thin = gradeFeynman("memory ".repeat(20), ram);
  assert.equal(thin.ok, true);
  assert.equal(thin.hits.length, 1);
});

test("a run that outlasts both windows is already done", () => {
  const started = emptyRevision(TODAY, 1_000);
  assert.equal(started.phase, "focus");
  assert.equal(started.focusEndsAt, 1_000 + FOCUS_MS);

  const midBreak = reconcileRevision(started, 1_000 + FOCUS_MS + 1_000);
  assert.equal(midBreak.phase, "break");
  assert.equal(midBreak.breakEndsAt, started.focusEndsAt! + BREAK_MS);

  const later = reconcileRevision(started, started.focusEndsAt! + BREAK_MS);
  assert.equal(later.phase, "done");

  const still = reconcileRevision(started, 1_000 + 60_000);
  assert.equal(still, started);

  assert.equal(freshDay({ ...started, date: "2026-10-05" }, TODAY, 9_000), null);
  const finished = freshDay(started, TODAY, started.focusEndsAt! + BREAK_MS);
  assert.ok(finished);
  assert.equal(finished.phase, "done");
});

test("teach and map land on schedule, flashcards every fourth item", () => {
  assert.equal(runMode(0, false, false), "recall");
  assert.equal(runMode(3, false, false), "card");
  assert.equal(runMode(4, false, false), "map");
  assert.equal(runMode(6, false, false), "feynman");
  assert.equal(runMode(6, true, true), "recall");
  assert.equal(runMode(7, true, true), "card");
});

test("a due card is picked before an unseen one, and the pick stays stable", () => {
  const due = pickRunQuestion({ "cs-lab-01": { box: 1, due: TODAY } }, [], TODAY, "seed");
  assert.equal(due?.id, "cs-lab-01");
  const first = pickRunQuestion({}, ["cs-lab-01"], TODAY, "seed");
  const again = pickRunQuestion({}, ["cs-lab-01"], TODAY, "seed");
  assert.ok(first);
  assert.notEqual(first?.id, "cs-lab-01");
  assert.equal(again?.id, first?.id);
});

test("the clock formats a full block", () => {
  assert.equal(formatClock(FOCUS_MS), "30:00");
  assert.equal(formatClock(90_000), "1:30");
  assert.equal(formatClock(0), "0:00");
  assert.equal(formatClock(-20), "0:00");
});
