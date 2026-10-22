/**
 * Pure merge for the 'questforge-papers-v1' progress (mock attempts, flashcard
 * boxes, mistakes) so two devices / the server copy combine without loss.
 * No imports beyond types — runs in node tests and on the server.
 */
export type SyncAttempt = { at: number; score: number; max: number; pct: number; xp: number };
export type SyncCard = { box: number; due: string };
export type SyncMistake = { paperId: string; partId: string; at: number; got: number; of: number };
export type PapersProgress = {
  attempts: Record<string, SyncAttempt[]>;
  flash: Record<string, SyncCard>;
  mistakes: Record<string, SyncMistake>;
  /** partId -> when it was cleared; stops a stale copy resurrecting a fixed mistake. */
  cleared: Record<string, number>;
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function emptyProgress(): PapersProgress {
  return { attempts: {}, flash: {}, mistakes: {}, cleared: {} };
}

/** Coerce untrusted input into a well-formed progress object (drops junk). */
export function sanitizeProgress(raw: unknown): PapersProgress {
  const out = emptyProgress();
  if (!isObj(raw)) return out;
  if (isObj(raw.attempts))
    for (const [paper, list] of Object.entries(raw.attempts)) {
      if (!Array.isArray(list)) continue;
      const clean = list.flatMap((a) => {
        if (!isObj(a)) return [];
        const at = num(a.at), score = num(a.score), max = num(a.max);
        if (at == null || score == null || max == null) return [];
        return [{ at, score, max, pct: num(a.pct) ?? (max ? Math.round((score / max) * 100) : 0), xp: num(a.xp) ?? 0 }];
      });
      if (clean.length) out.attempts[paper.slice(0, 200)] = clean.slice(-500);
    }
  if (isObj(raw.flash))
    for (const [id, c] of Object.entries(raw.flash)) {
      if (!isObj(c)) continue;
      const box = num(c.box);
      if (box == null || typeof c.due !== "string") continue;
      out.flash[id.slice(0, 300)] = { box, due: c.due.slice(0, 10) };
    }
  if (isObj(raw.mistakes))
    for (const [id, m] of Object.entries(raw.mistakes)) {
      if (!isObj(m)) continue;
      const at = num(m.at), got = num(m.got), of = num(m.of);
      if (at == null || got == null || of == null || typeof m.paperId !== "string") continue;
      out.mistakes[id.slice(0, 300)] = { paperId: m.paperId.slice(0, 200), partId: id.slice(0, 300), at, got, of };
    }
  if (isObj(raw.cleared))
    for (const [id, at] of Object.entries(raw.cleared)) {
      const n = num(at);
      if (n != null) out.cleared[id.slice(0, 300)] = n;
    }
  return out;
}

/** Union of both sides; nothing recorded on either device is lost. */
export function mergeProgress(a: PapersProgress, b: PapersProgress): PapersProgress {
  const out = emptyProgress();
  for (const paper of new Set([...Object.keys(a.attempts), ...Object.keys(b.attempts)])) {
    const byAt = new Map<number, SyncAttempt>();
    for (const x of [...(a.attempts[paper] ?? []), ...(b.attempts[paper] ?? [])]) byAt.set(x.at, x);
    out.attempts[paper] = [...byAt.values()].sort((x, y) => x.at - y.at);
  }
  for (const id of new Set([...Object.keys(a.flash), ...Object.keys(b.flash)])) {
    const x = a.flash[id], y = b.flash[id];
    // Later due date = the more recently reviewed card state.
    out.flash[id] = !x ? y! : !y ? x : y.due > x.due || (y.due === x.due && y.box > x.box) ? y : x;
  }
  for (const id of new Set([...Object.keys(a.cleared), ...Object.keys(b.cleared)]))
    out.cleared[id] = Math.max(a.cleared[id] ?? 0, b.cleared[id] ?? 0);
  for (const id of new Set([...Object.keys(a.mistakes), ...Object.keys(b.mistakes)])) {
    const x = a.mistakes[id], y = b.mistakes[id];
    const m = !x ? y! : !y ? x : y.at > x.at ? y : x;
    if (m.at > (out.cleared[id] ?? 0)) out.mistakes[id] = m;
  }
  return out;
}

export function progressEqual(a: PapersProgress, b: PapersProgress): boolean {
  return stable(a) === stable(b);
}

function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (isObj(v))
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(v[k])}`)
      .join(",")}}`;
  return JSON.stringify(v);
}
