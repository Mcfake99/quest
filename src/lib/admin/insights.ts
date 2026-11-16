/**
 * Pure admin analytics: topic strengths/weaknesses and session history.
 * Lookups are injected so this runs in node tests without the question banks.
 */
export type TopicSource = "quiz" | "paper" | "flashcards";
export type TopicStat = { subjectId: string; topic: string; source: TopicSource; got: number; of: number; n: number; pct: number };

export type SessionRow = {
  client_id: string;
  kind: string;
  mode: string | null;
  subject_id: string | null;
  ref: string | null;
  title: string | null;
  status: string;
  ended_by: string | null;
  started_at: string | Date;
  ended_at: string | Date | null;
  score: number | null;
  max_score: number | null;
  items: unknown;
};

export type Lookups = {
  question: (id: string) => { subject: string; topic: string } | undefined;
  part: (id: string) => { subjectId: string; topic: string } | undefined;
  card: (id: string) => { subject: string; deck: string } | undefined;
};

export const MIN_ITEMS = 4;
export const MIN_MARKS = 5;

export function items(v: unknown): [string, number, number][] {
  const raw = typeof v === "string" ? safeJson(v) : v;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((it) =>
    Array.isArray(it) && typeof it[0] === "string" && typeof it[1] === "number" && typeof it[2] === "number"
      ? [[it[0], it[1], it[2]] as [string, number, number]]
      : [],
  );
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * Accuracy per subject+topic.
 *  - quiz: the save's cumulative per-question right/wrong counts (historical);
 *  - paper: marks per real-paper part from logged mocks / paper quizzes / mistake redos;
 *  - flashcards: know / don't-know per deck from logged flashcard runs.
 */
export function topicStats(answers: Record<string, { c?: number; w?: number }>, sessions: SessionRow[], look: Lookups): TopicStat[] {
  const acc = new Map<string, TopicStat>();
  const add = (subjectId: string, topic: string, source: TopicSource, got: number, of: number, n: number) => {
    const key = `${source}|${subjectId}|${topic}`;
    const t = acc.get(key) ?? { subjectId, topic, source, got: 0, of: 0, n: 0, pct: 0 };
    t.got += got;
    t.of += of;
    t.n += n;
    acc.set(key, t);
  };
  for (const [id, rec] of Object.entries(answers ?? {})) {
    const q = look.question(id);
    const c = Number(rec?.c) || 0, w = Number(rec?.w) || 0;
    if (!q || c + w === 0) continue;
    add(q.subject, q.topic || "General", "quiz", c, c + w, c + w);
  }
  for (const s of sessions) {
    if (s.kind === "mock" && s.status !== "completed") continue;
    if (s.kind === "mock" || s.kind === "paper-quiz" || s.kind === "mistakes") {
      for (const [id, got, of] of items(s.items)) {
        const p = look.part(id);
        if (p && of > 0) add(String(p.subjectId), p.topic || "General", "paper", got, of, 1);
      }
    } else if (s.kind === "flashcards") {
      for (const [id, got, of] of items(s.items)) {
        const c = look.card(id);
        if (c && of > 0) add(c.subject, c.deck || "Cards", "flashcards", got, of, 1);
      }
    }
  }
  return [...acc.values()].map((t) => ({ ...t, pct: t.of ? Math.round((t.got / t.of) * 100) : 0 }));
}

export function enough(t: TopicStat) {
  return t.n >= MIN_ITEMS && t.of >= MIN_MARKS;
}

/** Strongest and weakest topics with enough evidence; no topic appears in both. */
export function strengthsWeaknesses<T extends TopicStat>(stats: T[], size = 5) {
  const ok = stats.filter(enough);
  const strong = ok.filter((t) => t.pct >= 50).sort((a, b) => b.pct - a.pct || b.of - a.of).slice(0, size);
  const taken = new Set(strong.map((t) => `${t.source}|${t.subjectId}|${t.topic}`));
  const weak = [...ok]
    .sort((a, b) => a.pct - b.pct || b.of - a.of)
    .filter((t) => !taken.has(`${t.source}|${t.subjectId}|${t.topic}`))
    .slice(0, size);
  return { strong: strong, weak, considered: ok.length, total: stats.length };
}

export type MockHistoryRow = {
  key: string;
  paperId: string;
  at: number;
  startedAt: number | null;
  submittedAt: number | null;
  minutes: number | null;
  score: number | null;
  max: number | null;
  pct: number | null;
  status: "completed" | "marking" | "in_progress" | "abandoned";
  endedBy: string | null;
  source: "saved" | "logged";
};

const ms = (v: string | Date | null | undefined) => (v == null ? null : new Date(v).getTime());

/**
 * Every mock sitting: saved attempts (historical, from synced progress) matched to
 * logged sittings (start/finish times, how it ended), plus unfinished sittings.
 */
export function mockHistory(
  attempts: { paperId: string; at: number; score: number; max: number; pct: number }[],
  sessions: SessionRow[],
  now = Date.now(),
): MockHistoryRow[] {
  const mocks = sessions.filter((s) => s.kind === "mock");
  const byAttempt = new Map<string, SessionRow>();
  for (const s of mocks) if (s.status === "completed" && s.mode) byAttempt.set(`${s.ref}|${s.mode}`, s);
  const used = new Set<string>();
  const rows: MockHistoryRow[] = attempts.map((a) => {
    const s = byAttempt.get(`${a.paperId}|${a.at}`);
    if (s) used.add(s.client_id);
    const st = ms(s?.started_at), en = ms(s?.ended_at);
    return {
      key: `a:${a.paperId}:${a.at}`,
      paperId: a.paperId,
      at: a.at,
      startedAt: st,
      submittedAt: en,
      minutes: st != null && en != null ? Math.max(0, Math.round((en - st) / 60_000)) : null,
      score: a.score,
      max: a.max,
      pct: a.pct,
      status: "completed",
      endedBy: s?.ended_by ?? null,
      source: s ? "logged" : "saved",
    };
  });
  for (const s of mocks) {
    if (used.has(s.client_id) || s.status === "completed") continue;
    const st = ms(s.started_at)!, en = ms(s.ended_at);
    // A sitting left open for over a day is treated as abandoned.
    const stale = s.status === "in_progress" && now - st > 86_400_000;
    rows.push({
      key: `s:${s.client_id}`,
      paperId: s.ref ?? "",
      at: en ?? st,
      startedAt: st,
      submittedAt: en,
      minutes: en != null ? Math.max(0, Math.round((en - st) / 60_000)) : null,
      score: null,
      max: null,
      pct: null,
      status: stale ? "abandoned" : (s.status as MockHistoryRow["status"]),
      endedBy: s.ended_by,
      source: "logged",
    });
  }
  return rows.sort((a, b) => b.at - a.at);
}
