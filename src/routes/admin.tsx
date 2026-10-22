import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
  { key: "logins7", label: "Logins 7d", num: true },
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
      <p className="mt-2 text-sm text-muted">Logins and progress across every account. Times in UK time.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Users" value={t.users} />
        <Stat label="Active today" value={t.activeToday} />
        <Stat label="Active 7 days" value={t.active7} />
        <Stat label="Active 30 days" value={t.active30} />
        <Stat label="Sign-ins 30d" value={t.signIns30} />
        <Stat label="Mocks taken" value={t.mocks} />
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

function UserDetail({ id }: { id: string }) {
  const s = useLoad<Detail>(() => getAdminUser({ data: { id } }), [id]);
  if (s.loading) return <p className="py-20 text-center text-sm text-muted">Loading…</p>;
  if (s.error || !s.data) return <p className="py-20 text-center text-sm text-muted">{s.error ?? "Not found"}</p>;
  const { user: u, events, attempts, subjects, mistakes } = s.data;
  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin" className="text-xs uppercase tracking-widest text-muted hover:text-fg">
        ← All students
      </Link>
      <h1 className="mt-2 font-display text-3xl md:text-4xl">{u.name || u.email}</h1>
      <p className="mt-1 text-sm text-muted">
        {u.email} · joined {date(u.joined)} · last seen {ago(u.lastSeen)}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Level" value={u.level} hint={`${u.xp} XP · ${u.coins} marks`} />
        <Stat label="Logins" value={u.logins7} hint={`7 days · ${u.logins30} in 30`} />
        <Stat label="Mocks" value={u.mocks} hint={`avg ${pct(u.avgPct)} · best ${pct(u.bestPct)}`} />
        <Stat label="Flashcards" value={u.flashReviewed} hint={`${u.mistakesOpen} mistakes open · ${u.streak}d streak`} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">By subject</h2>
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Subject</th>
                <th className="px-3 py-2 font-medium">Quiz mastery</th>
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
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section>
          <h2 className="font-display text-2xl">Mock attempts</h2>
          <ul className="mt-4 divide-y divide-border/60 rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {attempts.length === 0 ? <li className="px-4 py-6 text-center text-sm text-muted">No mocks yet.</li> : null}
            {attempts.map((a) => (
              <li key={`${a.paperId}-${a.at}`} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate">{a.title}</p>
                  <p className="text-xs text-muted">
                    {a.series} · {time(a.at)}
                  </p>
                </div>
                <p className="shrink-0 tabular-nums">
                  {a.score}/{a.max} <span className="text-muted">· {a.pct}%</span>
                </p>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 font-display text-2xl">Open mistakes</h2>
          <ul className="mt-4 divide-y divide-border/60 rounded-xl bg-surface shadow-[var(--shadow-border)]">
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
          <h2 className="font-display text-2xl">Login history</h2>
          <ul className="mt-4 max-h-[36rem] divide-y divide-border/60 overflow-y-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
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
