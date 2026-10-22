import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyProgress, mergeProgress, sanitizeProgress } from "./papers-merge.ts";

test("merge unions attempts by timestamp", () => {
  const a = { ...emptyProgress(), attempts: { p1: [{ at: 1, score: 5, max: 10, pct: 50, xp: 1 }] } };
  const b = { ...emptyProgress(), attempts: { p1: [{ at: 1, score: 5, max: 10, pct: 50, xp: 1 }, { at: 2, score: 8, max: 10, pct: 80, xp: 2 }] } };
  const m = mergeProgress(a, b);
  assert.equal(m.attempts.p1!.length, 2);
});

test("cleared mistakes are not resurrected; newer mistakes survive", () => {
  const stale = { ...emptyProgress(), mistakes: { x: { paperId: "p", partId: "x", at: 10, got: 0, of: 2 } } };
  const fixed = { ...emptyProgress(), cleared: { x: 20 } };
  assert.deepEqual(mergeProgress(stale, fixed).mistakes, {});
  const again = { ...emptyProgress(), mistakes: { x: { paperId: "p", partId: "x", at: 30, got: 0, of: 2 } } };
  assert.ok(mergeProgress(mergeProgress(stale, fixed), again).mistakes.x);
});

test("flash keeps later-due card; sanitize drops junk", () => {
  const m = mergeProgress(
    { ...emptyProgress(), flash: { c: { box: 1, due: "2026-01-01" } } },
    { ...emptyProgress(), flash: { c: { box: 3, due: "2026-02-01" } } },
  );
  assert.equal(m.flash.c!.box, 3);
  const s = sanitizeProgress({ attempts: { p: [{ at: "x" }] }, flash: { a: 5 }, mistakes: null });
  assert.deepEqual(s, emptyProgress());
});
