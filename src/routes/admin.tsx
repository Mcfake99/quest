import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getAdminOverview, getAdminUser, type AdminUserRow } from "@/lib/admin/api";
import { cn } from "@/lib/utils";

type Search = { user?: string };

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): Search => (typeof s.user === "string" && s.user ? { user: s.user } : {}),
  head: () => ({ meta: [{ title: "Admin · QuestForge" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;
type Detail = Awaited<ReturnType<typeof getAdminUser>>;

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric" });
const fmtTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const date = (v: string | null) => (v ? fmt.format(new Date(v)) : "—");
const time = (v: string | number | null) => (v ? fmtTime.format(new Date(v)) : "—");
const pct = (v: number | null) => (v == null ? "—" : `${v}%`);

function ago(v: string | null) {
  if (!v) return "never";
  const mins = Math.round((Date.now() - new Date(v).getTime()) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  useEffect(() => {
    let live = true;
    setState({ loading: true });
    fn()
      .then((data) => live && setState({ data, loading: false }))
      .catch((e: unknown) => live && setState({ error: e instanceof Error ? e.message : String(e), loading: false }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-xs uppercase tracking-widest text-muted">404</p>
      <h1 className="mt-2 font-display text-3xl">Nothing here</h1>
      <p className="mt-2 text-sm text-muted">This page doesn’t exist.</p>
      <Link to="/" className="mt-6 inline-block text-sm text-accent hover:underline">
        Back to the hall
      </Link>
    </div>
  );
}

function AdminPage() {
  const { user } = Route.useSearch();
  const overview = useLoad(() => getAdminOverview(), []);
  if (overview.loading) return <p className="py-20 text-center text-sm text-muted">Loading…</p>;
  if (overview.error || !overview.data) return <NotFound />;
  return user ? <UserDetail id={user} /> : <OverviewView data={overview.data} />;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
      {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-fg)",
  fontSize: 12,
};

type SortKey = keyof AdminUserRow;
const COLUMNS: { key: SortKey; label: string; render?: (u: AdminUserRow) => string; num?: boolean }[] = [
  { key: "joined", label: "Joined", render: (u) => date(u.joined) },
  { key: "lastLogin", label: "Last login", render: (u) => ago(u.lastLogin) },
  { key: "lastSeen", label: "Last seen", render: (u) => ago(u.lastSeen) },
  { key: "visits7", label: "Visits 7d", num: true },
  { key: "visits", label: "Visits", num: true },
  { key: "activeDays7", label: "Days 7d", num: true },
  { key: "activeDays", label: "Active days", num: true },
  { key: "logins30", label: "Logins 30d", num: true },
  { key: "xp", label: "XP", num: true },
  { key: "level", label: "Lvl", num: true },
  { key: "coins", label: "Marks", num: true },
  { key: "mocks", label: "Mocks", num: true },
  { key: "avgPct", label: "Avg", render: (u) => pct(u.avgPct), num: true },
  { key: "bestPct", label: "Best", render: (u) => pct(u.bestPct), num: true },
  { key: "lastPct", label: "Last mock", render: (u) => (u.lastPct == null ? "—" : `${u.lastPct}% · ${u.lastMockPaper}`) },
  { key: "flashReviewed", label: "Cards", num: true },
  { key: "mistakesOpen", label: "Mistakes", num: true },
];

function OverviewView({ data }: { data: Overview }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "lastSeen", dir: -1 });
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? data.users.filter((u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle))
      : [...data.users];
    return list.sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [data.users, q, sort]);
  const chart = data.daily.map((d) => ({ ...d, label: d.day.slice(8) }));
  const t = data.totals;
  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: -1 }));

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs uppercase tracking-widest text-muted">Admin</p>
      <h1 className="mt-2 font-display text-3xl md:text-4xl">Students</h1>
      <p className="mt-2 text-sm text-muted">
        Visits, logins and progress across every account. A visit is a stretch of use (opening the app, counted at most once per
        30 minutes), so students who stay signed in still show up. Times in UK time.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Users" value={t.users} />
        <Stat label="Active today" value={t.activeToday} />
        <Stat label="Active 7 days" value={t.active7} hint={`avg ${t.dau7} a day`} />
        <Stat label="Active 30 days" value={t.active30} hint={`avg ${t.dau30} a day`} />
        <Stat label="Visits 7d" value={t.visits7} />
        <Stat label="Sign-ins 30d" value={t.signIns30} />
        <Stat label="Mocks taken" value={t.mocks} />
        <Stat label="Daily active (7d avg)" value={t.dau7} hint={`30d avg ${t.dau30}`} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Last 30 days</h2>
        <p className="mt-1 text-sm text-muted">Sign-ins and app visits per day.</p>
        <div className="mt-4 h-56 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "color-mix(in oklab, var(--color-fg) 4%, transparent)" }}
                contentStyle={tooltipStyle}
                labelFormatter={(_, p) => (p?.[0]?.payload as { day?: string } | undefined)?.day ?? ""}
              />
              <Bar dataKey="signIns" name="Sign-ins" stackId="a" fill="var(--color-accent)" />
              <Bar dataKey="visits" name="Visits" stackId="a" fill="var(--color-muted)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl">Every student</h2>
          <Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <Th label="Student" active={sort.key === "name"} dir={sort.dir} onClick={() => toggle("name")} />
                {COLUMNS.map((c) => (
                  <Th key={c.key} label={c.label} active={sort.key === c.key} dir={sort.dir} onClick={() => toggle(c.key)} num={c.num} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-raised/50">
                  <td className="px-3 py-2">
                    <Link to="/admin" search={{ user: u.id }} className="font-medium hover:text-accent">
                      {u.name || "—"}
                    </Link>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className={cn("whitespace-nowrap px-3 py-2", c.num && "text-right tabular-nums")}>
                      {c.render ? c.render(u) : String(u[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-3 py-8 text-center text-muted">
                    No students match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Th({ label, active, dir, onClick, num }: { label: string; active: boolean; dir: 1 | -1; onClick: () => void; num?: boolean }) {
  return (
    <th className={cn("whitespace-nowrap px-3 py-2 font-medium", num && "text-right")}>
      <button type="button" onClick={onClick} className={cn("hover:text-fg", active && "text-fg")}>
        {label}
        {active ? (dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
}

const STATUS_STYLE: Record<string, string> = {
  completed: "text-fg",
  marking: "text-accent",
  in_progress: "text-accent",
  "in progress": "text-accent",
  abandoned: "text-muted",
  "left early": "text-muted",
};
const STATUS_LABEL: Record<string, string> = {
  completed: "Completed",
  marking: "Handed in, not marked",
  in_progress: "In progress",
  abandoned: "Not finished",
};
const mins = (v: number | null) => (v == null ? "—" : v < 60 ? `${v} min` : `${Math.floor(v / 60)}h ${v % 60}m`);

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TopicList({ title, list, tone }: { title: string; list: Detail["strong"]; tone: "good" | "bad" }) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs uppercase tracking-widest text-muted">{title}</p>
      {list.length === 0 ? <p className="mt-3 text-sm text-muted">Not enough answers yet.</p> : null}
      <ul className="mt-3 space-y-2.5">
        {list.map((t) => (
          <li key={`${t.source}-${t.subjectId}-${t.topic}`} className="text-sm">
            <div className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {t.topic} <span className="text-muted">· {t.subject}</span>
              </span>
              <span className={cn("shrink-0 tabular-nums", tone === "good" ? "text-accent" : "text-fg")}>{t.pct}%</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={t.pct} className="h-1 flex-1" />
              <span className="shrink-0 text-[11px] tabular-nums text-muted">
                {t.got}/{t.of} {t.source === "paper" ? "marks" : t.source === "flashcards" ? "cards" : "right"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserDetail({ id }: { id: string }) {
  const s = useLoad<Detail>(() => getAdminUser({ data: { id } }), [id]);
  const [allTopics, setAllTopics] = useState(false);
  if (s.loading) return <p className="py-20 text-center text-sm text-muted">Loading…</p>;
  if (s.error || !s.data) return <p className="py-20 text-center text-sm text-muted">{s.error ?? "Not found"}</p>;
  const { user: u, events, subjects, mistakes, papers, sessions, trend, activity, topics, strong, weak, thresholds, subjectAccuracy } = s.data;
  const trendData = trend.map((a, i) => ({ n: i + 1, pct: a.pct, label: `${a.title} · ${time(a.at)}` }));
  const activityData = activity.map((d) => ({
    ...d,
    label: d.day.slice(5),
    accuracy: d.answered ? Math.round((d.correct / d.answered) * 100) : null,
  }));
  const completedPapers = papers.filter((p) => p.status === "completed").length;

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/admin" className="text-xs uppercase tracking-widest text-muted hover:text-fg">
        ← All students
      </Link>
      <h1 className="mt-2 font-display text-3xl md:text-4xl">{u.name || u.email}</h1>
      <p className="mt-1 text-sm text-muted">
        {u.email} · joined {date(u.joined)} · last seen {ago(u.lastSeen)} · last sign-in {ago(u.lastLogin)}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Visits" value={u.visits7} hint={`7 days · ${u.visits30} in 30 · ${u.visits} total`} />
        <Stat label="Active days" value={u.activeDays7} hint={`7 days · ${u.activeDays} total`} />
        <Stat label="Sign-ins" value={u.logins30} hint={`30 days · ${u.logins7} in 7`} />
        <Stat label="Level" value={u.level} hint={`${u.xp} XP · ${u.coins} marks`} />
        <Stat label="Mocks" value={completedPapers} hint={`avg ${pct(u.avgPct)} · best ${pct(u.bestPct)}`} />
        <Stat label="Flashcards" value={u.flashReviewed} hint={`${u.mistakesOpen} mistakes open · ${u.streak}d streak`} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Mock scores over time</h2>
          <p className="mt-1 text-sm text-muted">Percentage on each saved mock, oldest first.</p>
          <div className="mt-4 h-56 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
            {trendData.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted">No mocks saved yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="n" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(_, p) => (p?.[0]?.payload as { label?: string } | undefined)?.label ?? ""}
                    formatter={(v) => [`${v}%`, "Score"]}
                  />
                  <Line type="monotone" dataKey="pct" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl">Activity per day</h2>
          <p className="mt-1 text-sm text-muted">Questions answered (bars) and quiz accuracy (line), last 90 days.</p>
          <div className="mt-4 h-56 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
            {activityData.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted">No activity yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activityData} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={16} />
                  <YAxis yAxisId="n" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis yAxisId="p" orientation="right" domain={[0, 100]} hide />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, p) => (p?.[0]?.payload as { day?: string } | undefined)?.day ?? ""} />
                  <Bar yAxisId="n" dataKey="answered" name="Answered" fill="var(--color-muted)" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="n" dataKey="visits" name="Visits" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="p" dataKey="accuracy" name="Accuracy %" stroke="var(--color-fg)" dot={false} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <Section
        title="Strengths and weaknesses"
        hint={`By topic, from quiz answers, marks on real-paper questions and flashcards. A topic needs at least ${thresholds.items} answers and ${thresholds.marks} marks to be listed.`}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TopicList title="Strongest" list={strong} tone="good" />
          <TopicList title="Weakest" list={weak} tone="bad" />
        </div>
        {topics.length ? (
          <div className="mt-4">
            <button type="button" className="text-sm text-accent hover:underline" onClick={() => setAllTopics((v) => !v)}>
              {allTopics ? "Hide" : "Show"} all {topics.length} topics
            </button>
            {allTopics ? (
              <div className="mt-3 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted">
                      <th className="px-3 py-2 font-medium">Subject</th>
                      <th className="px-3 py-2 font-medium">Topic</th>
                      <th className="px-3 py-2 font-medium">From</th>
                      <th className="px-3 py-2 text-right font-medium">Score</th>
                      <th className="px-3 py-2 text-right font-medium">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.map((t) => (
                      <tr key={`${t.source}-${t.subjectId}-${t.topic}`} className={cn("border-b border-border/60 last:border-0", t.n < thresholds.items && "text-muted")}>
                        <td className="px-3 py-1.5">{t.subject}</td>
                        <td className="px-3 py-1.5">{t.topic}</td>
                        <td className="px-3 py-1.5 text-muted">{t.source === "paper" ? "Paper questions" : t.source === "flashcards" ? "Flashcards" : "Quizzes"}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {t.got}/{t.of}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{t.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section title="By subject">
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Subject</th>
                <th className="px-3 py-2 font-medium">Quiz mastery</th>
                <th className="px-3 py-2 text-right font-medium">Accuracy</th>
                <th className="px-3 py-2 text-right font-medium">Mocks</th>
                <th className="px-3 py-2 text-right font-medium">Avg</th>
                <th className="px-3 py-2 text-right font-medium">Best</th>
                <th className="px-3 py-2 text-right font-medium">Cards</th>
                <th className="px-3 py-2 text-right font-medium">Mistakes</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((x) => (
                <tr key={x.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{x.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Progress value={x.mastery} className="h-1.5 w-28" />
                      <span className="text-xs tabular-nums text-muted">
                        {x.mastery}% · {x.seen}/{x.total} seen
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(subjectAccuracy[x.id] ?? null)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{x.mocks}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(x.avgPct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(x.bestPct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{x.cards}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{x.mistakes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Paper history" hint="Every timed mock: saved scores, plus sittings started but not finished. Time taken is recorded for sittings from now on.">
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Paper</th>
                <th className="px-3 py-2 font-medium">Subject</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 text-right font-medium">Marks</th>
                <th className="px-3 py-2 text-right font-medium">%</th>
                <th className="px-3 py-2 text-right font-medium">Time taken</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {papers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted">
                    No mocks yet.
                  </td>
                </tr>
              ) : null}
              {papers.map((p) => (
                <tr key={p.key} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">
                    <p className="max-w-[18rem] truncate">{p.title}</p>
                    <p className="text-xs text-muted">{p.series}</p>
                  </td>
                  <td className="px-3 py-2">{p.subject || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{time(p.startedAt ?? p.at)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.score == null ? "—" : `${p.score}/${p.max}`}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(p.pct)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                    {mins(p.minutes)}
                    {p.limit ? <span className="text-muted"> / {p.limit}m</span> : null}
                  </td>
                  <td className={cn("whitespace-nowrap px-3 py-2", STATUS_STYLE[p.status])}>
                    {STATUS_LABEL[p.status] ?? p.status}
                    {p.endedBy === "time" ? <span className="text-muted"> · time ran out</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Quizzes, Daily Mix and flashcards" hint="Each run with its score. Recorded from this update onwards.">
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Activity</th>
                <th className="px-3 py-2 font-medium">Subject</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 text-right font-medium">Score</th>
                <th className="px-3 py-2 text-right font-medium">%</th>
                <th className="px-3 py-2 text-right font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted">
                    None recorded yet.
                  </td>
                </tr>
              ) : null}
              {sessions.slice(0, 200).map((x) => (
                <tr key={x.key} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">
                    <p>{x.kind}</p>
                    {x.title && x.title !== x.kind ? <p className="max-w-[16rem] truncate text-xs text-muted">{x.title}</p> : null}
                  </td>
                  <td className="px-3 py-2">{x.subject}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{time(x.at)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {x.score}/{x.max}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(x.pct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{mins(x.minutes)}</td>
                  <td className={cn("whitespace-nowrap px-3 py-2 capitalize", STATUS_STYLE[x.status])}>{x.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Open mistakes</h2>
          <ul className="mt-4 max-h-[28rem] divide-y divide-border/60 overflow-y-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {mistakes.length === 0 ? <li className="px-4 py-6 text-center text-sm text-muted">None open.</li> : null}
            {mistakes.slice(0, 50).map((m) => (
              <li key={m.partId} className="flex justify-between gap-3 px-4 py-2 text-sm">
                <span className="truncate">{m.title}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {m.got}/{m.of} · {time(m.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl">Visits and sign-ins</h2>
          <ul className="mt-4 max-h-[28rem] divide-y divide-border/60 overflow-y-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {events.length === 0 ? <li className="px-4 py-6 text-center text-sm text-muted">No activity.</li> : null}
            {events.map((e, i) => (
              <li key={i} className="flex justify-between px-4 py-2 text-sm">
                <span className={e.type === "sign_in" ? "text-accent" : "text-muted"}>{e.type === "sign_in" ? "Sign-in" : "Visit"}</span>
                <span className="tabular-nums text-muted">{time(e.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
