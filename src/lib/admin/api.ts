import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { adminMiddleware } from "./middleware";

const TZ = "Europe/London";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  joined: string;
  lastLogin: string | null;
  lastSeen: string | null;
  logins7: number;
  logins30: number;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  mocks: number;
  avgPct: number | null;
  bestPct: number | null;
  lastPct: number | null;
  lastMockPaper: string | null;
  flashReviewed: number;
  mistakesOpen: number;
};

type RawUser = {
  id: string;
  name: string;
  email: string;
  joined: string | Date;
  save: unknown;
  progress: unknown;
  last_login: string | Date | null;
  last_seen: string | Date | null;
  logins7: number;
  logins30: number;
};

const iso = (v: string | Date | null) => (v == null ? null : new Date(v).toISOString());
const json = (v: unknown): Record<string, unknown> => {
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
};

async function helpers() {
  const [{ sanitizeProgress }, { levelFromXp }, { realPaper }] = await Promise.all([
    import("@/lib/game/papers-merge"),
    import("@/lib/game/scoring"),
    import("@/lib/game/exam/real/lookup"),
  ]);
  return { sanitizeProgress, levelFromXp, realPaper };
}

function summarise(r: RawUser, h: Awaited<ReturnType<typeof helpers>>): AdminUserRow {
  const save = json(r.save);
  const p = h.sanitizeProgress(json(r.progress));
  const attempts = Object.entries(p.attempts).flatMap(([paperId, list]) => list.map((a) => ({ ...a, paperId })));
  attempts.sort((a, b) => a.at - b.at);
  const last = attempts[attempts.length - 1];
  const xp = typeof save.xp === "number" ? save.xp : 0;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    joined: iso(r.joined)!,
    lastLogin: iso(r.last_login),
    lastSeen: iso(r.last_seen),
    logins7: Number(r.logins7) || 0,
    logins30: Number(r.logins30) || 0,
    xp,
    level: h.levelFromXp(xp),
    coins: typeof save.marks === "number" ? save.marks : 0,
    streak: typeof save.streak === "number" ? save.streak : 0,
    mocks: attempts.length,
    avgPct: attempts.length ? Math.round(attempts.reduce((n, a) => n + a.pct, 0) / attempts.length) : null,
    bestPct: attempts.length ? Math.max(...attempts.map((a) => a.pct)) : null,
    lastPct: last ? last.pct : null,
    lastMockPaper: last ? (h.realPaper(last.paperId)?.title ?? last.paperId) : null,
    flashReviewed: Object.keys(p.flash).length,
    mistakesOpen: Object.keys(p.mistakes).length,
  };
}

const USER_SQL = `
  select u.id, u.name, u.email, u."createdAt" as joined, gs.save, pp.data as progress,
    (select max(created_at) from activity_events e where e.user_id = u.id and e.type = 'sign_in') as last_login,
    (select max(created_at) from activity_events e where e.user_id = u.id) as last_seen,
    (select count(*) from activity_events e where e.user_id = u.id and e.type = 'sign_in' and e.created_at > now() - interval '7 days') as logins7,
    (select count(*) from activity_events e where e.user_id = u.id and e.type = 'sign_in' and e.created_at > now() - interval '30 days') as logins30
  from "user" u
  left join game_saves gs on gs.user_id = u.id
  left join papers_progress pp on pp.user_id = u.id`;

/** Cheap probe for showing the admin link; never throws. */
export const checkAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const { isAdminEmail } = await import("./access");
  const user = await getSessionUser().catch(() => null);
  return { admin: Boolean(user && isAdminEmail(user.email, process.env.ADMIN_EMAILS)) };
});

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const sql = await getSql();
    const h = await helpers();
    const [raw, active, daily] = await Promise.all([
      sql.query<RawUser>(`${USER_SQL} order by u."createdAt" desc`),
      sql.query<{ today: number; d7: number; d30: number }>(
        `select
           count(distinct user_id) filter (where created_at >= (date_trunc('day', now() at time zone $1) at time zone $1)) as today,
           count(distinct user_id) filter (where created_at > now() - interval '7 days') as d7,
           count(distinct user_id) filter (where created_at > now() - interval '30 days') as d30
         from activity_events`,
        [TZ],
      ),
      sql.query<{ day: string; sign_ins: number; visits: number; users: number }>(
        `with days as (
           select generate_series((now() at time zone $1)::date - 29, (now() at time zone $1)::date, interval '1 day')::date as day
         )
         select to_char(d.day, 'YYYY-MM-DD') as day,
           count(e.id) filter (where e.type = 'sign_in') as sign_ins,
           count(e.id) filter (where e.type = 'visit') as visits,
           count(distinct e.user_id) as users
         from days d
         left join activity_events e on (e.created_at at time zone $1)::date = d.day
         group by d.day order by d.day`,
        [TZ],
      ),
    ]);
    const users = raw.map((r) => summarise(r, h));
    const a = active[0] ?? { today: 0, d7: 0, d30: 0 };
    return {
      totals: {
        users: users.length,
        activeToday: Number(a.today),
        active7: Number(a.d7),
        active30: Number(a.d30),
        signIns30: daily.reduce((n, d) => n + Number(d.sign_ins), 0),
        mocks: users.reduce((n, u) => n + u.mocks, 0),
      },
      daily: daily.map((d) => ({ day: d.day, signIns: Number(d.sign_ins), visits: Number(d.visits), users: Number(d.users) })),
      users,
    };
  });

export const getAdminUser = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator((data: unknown) => {
    const id = (data as { id?: unknown })?.id;
    if (typeof id !== "string" || !id || id.length > 200) throw new Error("Bad user id");
    return { id };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const h = await helpers();
    const { SUBJECTS } = await import("@/lib/game/types");
    const { subjectMastery } = await import("@/lib/game/questions");
    const raw = await sql.query<RawUser>(`${USER_SQL} where u.id = $1`, [data.id]);
    if (!raw[0]) throw new Error("User not found");
    const row = summarise(raw[0], h);
    const events = await sql.query<{ type: string; created_at: string | Date }>(
      `select type, created_at from activity_events where user_id = $1 order by created_at desc limit 300`,
      [data.id],
    );
    const save = json(raw[0].save);
    const answers = (save.answers ?? {}) as Record<string, { c: number; w: number }>;
    const p = h.sanitizeProgress(json(raw[0].progress));
    const attempts = Object.entries(p.attempts)
      .flatMap(([paperId, list]) =>
        list.map((a) => {
          const paper = h.realPaper(paperId);
          return { ...a, paperId, title: paper?.title ?? paperId, series: paper?.series ?? "", subjectId: paper?.subjectId ?? "" };
        }),
      )
      .sort((a, b) => b.at - a.at);
    const { FLASHCARDS } = await import("@/lib/game/flashcards");
    const cardSubject = new Map(FLASHCARDS.map((c) => [c.id, c.subject as string]));
    const subjectOf = (cardId: string) => cardSubject.get(cardId) ?? "";
    const subjects = SUBJECTS.map((s) => {
      const m = subjectMastery(s.id, answers);
      const mine = attempts.filter((a) => a.subjectId === s.id);
      const cards = Object.keys(p.flash).filter((id) => subjectOf(id) === s.id);
      const mistakes = Object.values(p.mistakes).filter((x) => h.realPaper(x.paperId)?.subjectId === s.id).length;
      return {
        id: s.id,
        name: s.name,
        mastery: Math.round(m.ratio * 100),
        seen: m.seen,
        total: m.total,
        mocks: mine.length,
        avgPct: mine.length ? Math.round(mine.reduce((n, a) => n + a.pct, 0) / mine.length) : null,
        bestPct: mine.length ? Math.max(...mine.map((a) => a.pct)) : null,
        cards,
        mistakes,
      };
    }).map((s) => ({ ...s, cards: s.cards.length }));
    const mistakes = Object.values(p.mistakes)
      .sort((a, b) => b.at - a.at)
      .map((m) => ({ ...m, title: h.realPaper(m.paperId)?.title ?? m.paperId }));
    return {
      user: row,
      events: events.map((e) => ({ type: e.type, at: iso(e.created_at)! })),
      attempts,
      subjects,
      mistakes,
    };
  });
