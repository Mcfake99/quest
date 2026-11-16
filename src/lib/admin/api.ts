import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { adminMiddleware } from "./middleware";
import { MIN_ITEMS, MIN_MARKS, type SessionRow } from "./insights";

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
  /** App sessions (sign-ins + visits, one per 30 min of use). */
  visits: number;
  visits7: number;
  visits30: number;
  /** Distinct UK days with any recorded activity (visits, study, answered questions). */
  activeDays: number;
  activeDays7: number;
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
  visits: number;
  visits7: number;
  visits30: number;
  event_days: string[] | null;
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

const DAY_MS = 86_400_000;
const ukDay = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Active UK days: activity events + study sessions (SQL) ∪ days the save recorded answers/XP. */
function activeDaysOf(r: RawUser, save: Record<string, unknown>) {
  const days = new Set(r.event_days ?? []);
  const sd = save.days;
  if (sd && typeof sd === "object")
    for (const [k, v] of Object.entries(sd as Record<string, { attempted?: number; xp?: number }>))
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && ((v?.attempted ?? 0) > 0 || (v?.xp ?? 0) > 0)) days.add(k);
  return days;
}

function summarise(r: RawUser, h: Awaited<ReturnType<typeof helpers>>): AdminUserRow {
  const save = json(r.save);
  const days = activeDaysOf(r, save);
  const weekAgo = ukDay.format(new Date(Date.now() - 6 * DAY_MS));
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
    visits: Number(r.visits) || 0,
    visits7: Number(r.visits7) || 0,
    visits30: Number(r.visits30) || 0,
    activeDays: days.size,
    activeDays7: [...days].filter((d) => d >= weekAgo).length,
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
    greatest(
      (select max(created_at) from activity_events e where e.user_id = u.id),
      (select last_seen from user_presence up where up.user_id = u.id),
      (select max(coalesce(ended_at, started_at)) from study_sessions ss where ss.user_id = u.id)
    ) as last_seen,
    (select count(*) from activity_events e where e.user_id = u.id) as visits,
    (select count(*) from activity_events e where e.user_id = u.id and e.created_at > now() - interval '7 days') as visits7,
    (select count(*) from activity_events e where e.user_id = u.id and e.created_at > now() - interval '30 days') as visits30,
    (select array_agg(distinct d) from (
       select to_char(created_at at time zone '${TZ}', 'YYYY-MM-DD') as d from activity_events e where e.user_id = u.id
       union
       select to_char(started_at at time zone '${TZ}', 'YYYY-MM-DD') from study_sessions ss where ss.user_id = u.id
     ) x) as event_days,
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
    const avg = (list: typeof daily) => (list.length ? Math.round((list.reduce((n, d) => n + Number(d.users), 0) / list.length) * 10) / 10 : 0);
    return {
      totals: {
        users: users.length,
        activeToday: Number(a.today),
        active7: Number(a.d7),
        active30: Number(a.d30),
        signIns30: daily.reduce((n, d) => n + Number(d.sign_ins), 0),
        visits7: daily.slice(-7).reduce((n, d) => n + Number(d.sign_ins) + Number(d.visits), 0),
        dau7: avg(daily.slice(-7)),
        dau30: avg(daily),
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
      `select type, created_at from activity_events where user_id = $1 order by created_at desc limit 3000`,
      [data.id],
    );
    const sessions = await sql.query<SessionRow>(
      `select client_id, kind, mode, subject_id, ref, title, status, ended_by, started_at, ended_at, score, max_score, items
       from study_sessions where user_id = $1 order by started_at desc limit 1000`,
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
    const { questionById } = await import("@/lib/game/questions");
    const { realPart } = await import("@/lib/game/exam/real/lookup");
    const { mockHistory, topicStats, strengthsWeaknesses, items: itemsOf } = await import("./insights");
    const cardById = new Map(FLASHCARDS.map((c) => [c.id, c]));
    const subjectName = new Map<string, string>(SUBJECTS.map((s) => [s.id, s.name]));
    const now = Date.now();

    // (1) Paper history: saved attempts (historical) + logged sittings (timing, unfinished).
    const papers = mockHistory(attempts, sessions, now).map((r) => {
      const paper = h.realPaper(r.paperId);
      return {
        ...r,
        title: paper?.title ?? r.paperId,
        series: paper?.series ?? "",
        subject: subjectName.get(String(paper?.subjectId ?? "")) ?? "",
        limit: paper?.minutes ?? null,
      };
    });
    const KIND_LABEL: Record<string, string> = {
      quiz: "Quiz",
      "paper-quiz": "Paper quick quiz",
      mistakes: "Mistakes redo",
      flashcards: "Flashcards",
      revision: "Revision run",
    };
    const MODE_LABEL: Record<string, string> = {
      mix: "Daily Mix",
      spotlight: "Daily Spotlight",
      sprint: "Daily Sprint",
      target: "Daily Target",
      subject: "Subject quiz",
      review: "Review quiz",
      figures: "Figures quiz",
    };
    const other = sessions
      .filter((s) => s.kind !== "mock")
      .map((s) => {
        const st = new Date(s.started_at).getTime();
        const en = s.ended_at ? new Date(s.ended_at).getTime() : null;
        const its = itemsOf(s.items);
        const score = s.score ?? its.reduce((n, i) => n + i[1], 0);
        const max = s.max_score ?? its.reduce((n, i) => n + i[2], 0);
        const stale = s.status === "in_progress" && now - (en ?? st) > 2 * 3_600_000;
        return {
          key: s.client_id,
          kind: (s.kind === "quiz" && s.mode && MODE_LABEL[s.mode]) || KIND_LABEL[s.kind] || s.kind,
          title: s.title ?? "",
          subject: subjectName.get(s.subject_id ?? "") ?? (s.subject_id ? s.subject_id : "Mixed"),
          at: st,
          minutes: en != null ? Math.max(0, Math.round((en - st) / 60_000)) : null,
          answered: its.length,
          score,
          max,
          pct: max ? Math.round((score / max) * 100) : null,
          status: stale ? "left early" : s.status === "in_progress" ? "in progress" : s.status,
        };
      });

    // (2) Progress over time: mock % per sitting, and activity per UK day.
    const trend = attempts
      .slice()
      .sort((a, b) => a.at - b.at)
      .map((a) => ({ at: a.at, pct: a.pct, subjectId: a.subjectId, title: a.title }));
    const days: Record<string, { answered: number; correct: number; xp: number; visits: number; sessions: number; marks: number; of: number }> = {};
    const day = (k: string) => (days[k] ??= { answered: 0, correct: 0, xp: 0, visits: 0, sessions: 0, marks: 0, of: 0 });
    const saveDays = save.days && typeof save.days === "object" ? (save.days as Record<string, { xp?: number; correct?: number; attempted?: number }>) : {};
    for (const [k, v] of Object.entries(saveDays)) {
      const d = day(k);
      d.answered += Number(v?.attempted) || 0;
      d.correct += Number(v?.correct) || 0;
      d.xp += Number(v?.xp) || 0;
    }
    for (const e of events) day(ukDay.format(new Date(e.created_at))).visits += 1;
    for (const s of sessions) {
      const d = day(ukDay.format(new Date(s.started_at)));
      d.sessions += 1;
      if (s.kind !== "quiz" && s.kind !== "revision" && (s.kind !== "mock" || s.status === "completed"))
        for (const [, got, of] of itemsOf(s.items)) {
          d.marks += got;
          d.of += of;
        }
    }
    const firstDay = Object.keys(days).sort()[0];
    const activity: { day: string; answered: number; correct: number; xp: number; visits: number; sessions: number; marks: number; of: number }[] = [];
    if (firstDay) {
      const start = Math.max(new Date(`${firstDay}T12:00:00Z`).getTime(), now - 89 * DAY_MS);
      for (let t = start; t <= now + DAY_MS / 2; t += DAY_MS) {
        const k = ukDay.format(new Date(t));
        if (activity.at(-1)?.day !== k) activity.push({ day: k, ...(days[k] ?? { answered: 0, correct: 0, xp: 0, visits: 0, sessions: 0, marks: 0, of: 0 }) });
      }
    }

    // (3) Strengths and weaknesses by topic.
    const stats = topicStats(answers, sessions, {
      question: (id) => {
        const q = questionById(id);
        return q ? { subject: q.subject, topic: q.topic } : undefined;
      },
      part: (id) => {
        const p = realPart(id);
        return p ? { subjectId: String(p.paper.subjectId), topic: p.part.topic } : undefined;
      },
      card: (id) => {
        const c = cardById.get(id);
        return c ? { subject: c.subject, deck: c.deck } : undefined;
      },
    }).map((t) => ({ ...t, subject: subjectName.get(t.subjectId) ?? t.subjectId }));
    const sw = strengthsWeaknesses(stats);
    const subjectAcc = new Map<string, { got: number; of: number }>();
    for (const t of stats) {
      if (t.source === "flashcards") continue;
      const a = subjectAcc.get(t.subjectId) ?? { got: 0, of: 0 };
      a.got += t.got;
      a.of += t.of;
      subjectAcc.set(t.subjectId, a);
    }

    const mistakes = Object.values(p.mistakes)
      .sort((a, b) => b.at - a.at)
      .map((m) => ({ ...m, title: h.realPaper(m.paperId)?.title ?? m.paperId }));
    return {
      user: row,
      events: events.slice(0, 300).map((e) => ({ type: e.type, at: iso(e.created_at)! })),
      papers,
      sessions: other,
      trend,
      activity,
      topics: stats.sort((a, b) => a.subject.localeCompare(b.subject) || b.of - a.of),
      strong: sw.strong,
      weak: sw.weak,
      thresholds: { items: MIN_ITEMS, marks: MIN_MARKS },
      subjectAccuracy: Object.fromEntries([...subjectAcc].map(([k, v]) => [k, v.of ? Math.round((v.got / v.of) * 100) : null])),
      attempts,
      subjects,
      mistakes,
    };
  });
