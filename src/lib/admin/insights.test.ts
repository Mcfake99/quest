import assert from "node:assert/strict";
import test from "node:test";
import { mockHistory, strengthsWeaknesses, topicStats, type Lookups, type SessionRow } from "./insights.ts";

const look: Lookups = {
  question: (id) => ({ q1: { subject: "maths", topic: "Algebra" }, q2: { subject: "maths", topic: "Geometry" } })[id],
  part: (id) => ({ "p:1": { subjectId: "physics", topic: "Energy" }, "p:2": { subjectId: "physics", topic: "Waves" } })[id],
  card: (id) => ({ c1: { subject: "biology", deck: "Cells" } })[id],
};
const row = (o: Partial<SessionRow>): SessionRow => ({
  client_id: "x", kind: "mock", mode: null, subject_id: null, ref: "paper", title: null, status: "completed",
  ended_by: null, started_at: new Date(0), ended_at: null, score: null, max_score: null, items: [], ...o,
});

test("topic stats combine quiz answers, paper marks and flashcards", () => {
  const stats = topicStats(
    { q1: { c: 9, w: 1 }, q2: { c: 1, w: 4 }, nope: { c: 3, w: 0 } },
    [
      row({ client_id: "a", items: [["p:1", 2, 3], ["p:1", 3, 3], ["p:2", 0, 4]] }),
      row({ client_id: "b", status: "in_progress", items: [["p:2", 4, 4]] }),
      row({ client_id: "c", kind: "flashcards", items: [["c1", 1, 1], ["c1", 0, 1]] }),
    ],
    look,
  );
  const get = (t: string) => stats.find((s) => s.topic === t)!;
  assert.equal(get("Algebra").pct, 90);
  assert.equal(get("Geometry").pct, 20);
  assert.deepEqual([get("Energy").got, get("Energy").of], [5, 6]);
  assert.deepEqual([get("Waves").got, get("Waves").of], [0, 4]); // in-progress mock ignored
  assert.equal(get("Cells").n, 2);
  const sw = strengthsWeaknesses(stats);
  assert.deepEqual(sw.strong.map((t) => t.topic), ["Algebra"]);
  assert.deepEqual(sw.weak.map((t) => t.topic), ["Geometry"]);
});

test("mock history matches saved attempts to logged sittings and keeps unfinished ones", () => {
  const t0 = Date.UTC(2026, 10, 1, 10);
  const rows = mockHistory(
    [
      { paperId: "p", at: t0 + 3_700_000, score: 40, max: 80, pct: 50 },
      { paperId: "p", at: t0 - 86_400_000, score: 10, max: 80, pct: 13 },
    ],
    [
      row({ client_id: "m1", ref: "p", mode: String(t0 + 3_700_000), started_at: new Date(t0), ended_at: new Date(t0 + 3_600_000), ended_by: "time" }),
      row({ client_id: "m2", ref: "p", status: "in_progress", started_at: new Date(t0 - 3 * 86_400_000) }),
      row({ client_id: "m3", ref: "p", status: "marking", started_at: new Date(t0), ended_at: new Date(t0 + 600_000) }),
    ],
    t0 + 4_000_000,
  );
  assert.equal(rows.length, 4);
  const logged = rows.find((r) => r.at === t0 + 3_700_000)!;
  assert.equal(logged.minutes, 60);
  assert.equal(logged.endedBy, "time");
  assert.equal(rows.find((r) => r.at === t0 - 86_400_000)!.source, "saved");
  assert.equal(rows.find((r) => r.key === "s:m2")!.status, "abandoned");
  assert.equal(rows.find((r) => r.key === "s:m3")!.status, "marking");
});
