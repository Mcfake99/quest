import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Progress } from "@/components/ui/progress";
import { BADGES } from "@/lib/game/badges";
import { todayKey } from "@/lib/game/date";
import { subjectMastery } from "@/lib/game/questions";
import { dueTomorrow } from "@/lib/game/revise";
import { levelFromXp, rankForLevel, xpIntoLevel } from "@/lib/game/scoring";
import { useGameStore } from "@/lib/game/store";
import { SUBJECTS } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({ component: Ledger });

function lastDays(days: Record<string, { xp: number; correct: number; attempted: number }>, n: number) {
  const out: { day: string; xp: number; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = todayKey(d);
    const label = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d);
    out.push({ day: key, xp: days[key]?.xp ?? 0, label });
  }
  return out;
}

function Ledger() {
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const longest = useGameStore((s) => s.longestStreak);
  const badges = useGameStore((s) => s.badges);
  const answers = useGameStore((s) => s.answers);
  const days = useGameStore((s) => s.days);
  const reviews = useGameStore((s) => s.reviews);
  const name = useGameStore((s) => s.name);
  const { level, current, needed, ratio } = xpIntoLevel(xp);
  const chart = useMemo(() => lastDays(days, 7), [days]);
  const attempted = Object.values(answers ?? {}).reduce((n, r) => n + r.c + r.w, 0);
  const correct = Object.values(answers ?? {}).reduce((n, r) => n + r.c, 0);
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const today = todayKey();
  const due = dueTomorrow(reviews ?? {}, today);
  const boxCounts = [1, 2, 3, 4, 5].map(
    (box) => Object.values(reviews ?? {}).filter((card) => card.box === box).length,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-widest text-muted">Ledger</p>
      <h1 className="mt-2 font-display text-3xl md:text-4xl">{name}’s record</h1>
      <p className="mt-2 text-sm text-muted">
        {rankForLevel(levelFromXp(xp))} · level {level}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Streak" value={`${streak}d`} />
        <Stat label="Best streak" value={`${longest}d`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Answered" value={`${attempted}`} />
      </div>

      <div className="mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Level {level}</span>
          <span className="tabular-nums">
            {current}/{needed} XP
          </span>
        </div>
        <Progress value={ratio * 100} className="mt-3" />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Cards coming back</h2>
        <p className="mt-1 text-sm text-muted">
          {due > 0
            ? `${due} card${due === 1 ? "" : "s"} due tomorrow. A miss always returns to box 1.`
            : "Nothing due tomorrow. Missed cards wait one day, then 3 days, a week, 2 weeks and a month."}
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {boxCounts.map((n, i) => (
            <div key={i} className="rounded-lg bg-surface px-2 py-3 text-center shadow-[var(--shadow-border)]">
              <p className="text-xs text-muted">Box {i + 1}</p>
              <p className="mt-1 font-display text-xl tabular-nums">{n}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Last seven days</h2>
        <div className="mt-4 h-48 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "color-mix(in oklab, var(--color-fg) 4%, transparent)" }}
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-fg)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="xp" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Subject halls</h2>
        <ul className="mt-4 space-y-3">
          {SUBJECTS.map((subject) => {
            const m = subjectMastery(subject.id, answers);
            return (
              <li key={subject.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{subject.name}</span>
                  <span className="tabular-nums text-muted">{Math.round(m.ratio * 100)}%</span>
                </div>
                <Progress value={m.ratio * 100} />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Badges</h2>
        <p className="mt-1 text-sm text-muted">
          {badges.length} of {BADGES.length} earned
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {BADGES.map((badge) => {
            const got = badges.includes(badge.id);
            return (
              <li
                key={badge.id}
                className={cn(
                  "rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]",
                  !got && "opacity-45",
                )}
              >
                <p className="text-sm font-medium">{badge.name}</p>
                <p className="mt-1 text-xs text-muted">{badge.blurb}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
