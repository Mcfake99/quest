import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { CheckIn } from "@/components/game/CheckIn";
import { CharacterPortrait } from "@/components/game/CharacterPortrait";
import { Onboarding } from "@/components/game/Onboarding";
import { RevisionHallCard } from "@/components/game/RevisionRun";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { formatLongDate } from "@/lib/game/date";
import { SUBJECT_ICONS } from "@/lib/game/icons";
import { useCloudStatus } from "@/lib/game/cloud-status";
import { reviewIds, subjectMastery } from "@/lib/game/questions";
import { xpIntoLevel } from "@/lib/game/scoring";
import { displayTitle, useGameStore } from "@/lib/game/store";
import { SUBJECTS } from "@/lib/game/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const onboarded = useGameStore((s) => s.onboarded);
  const name = useGameStore((s) => s.name);
  const xp = useGameStore((s) => s.xp);
  const equippedTitle = useGameStore((s) => s.equippedTitle);
  const answers = useGameStore((s) => s.answers);
  const daily = useGameStore((s) => s.daily);
  const streak = useGameStore((s) => s.streak);
  const crates = useGameStore((s) => s.crates);
  const { level, ratio, current, needed } = xpIntoLevel(xp);
  const title = displayTitle({ equippedTitle, xp });
  const [today, setToday] = useState("");
  const review = reviewIds(answers).length;
  const done = daily?.quests.filter((q) => q.completed).length ?? 0;
  const total = daily?.quests.length ?? 0;

  useEffect(() => {
    setToday(formatLongDate());
  }, []);

  if (!onboarded) return <Onboarding />;

  return (
    <div className="stagger-in mx-auto max-w-3xl">
      <CheckIn />
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-muted">{today || "Today"}</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Ready, {name}?</h1>
          <p className="mt-2 text-sm text-muted">
            {title} · level {level} · {streak}-day streak
          </p>
        </div>
        <Link to="/shop" className="shrink-0 md:hidden">
          <CharacterPortrait className="h-36 w-24 rounded-xl shadow-[var(--shadow-border)]" />
        </Link>
      </div>

      {crates > 0 ? (
        <Link
          to="/shop"
          className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]"
        >
          <span>
            <span className="text-fg">{crates} loot crate{crates === 1 ? "" : "s"} waiting.</span>
            <span className="mt-0.5 block text-muted">Crack one — kits, titles, skins or marks.</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted" />
        </Link>
      ) : null}

      <SaveBanner />

      <div className="mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">XP to next level</span>
          <span className="tabular-nums">
            {current}/{needed}
          </span>
        </div>
        <Progress value={ratio * 100} className="mt-3" />
      </div>

      <RevisionHallCard />

      <section className="mt-10">
        <h2 className="font-display text-2xl">Past papers</h2>
        <p className="mt-1 text-sm text-muted">
          Timed sittings, marked when you hand them in. Do these outside the daily 30 minutes.
        </p>
      </section>

      <Link
        to="/exam/$paperId"
        params={{ paperId: "business-u1" }}
        className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
      >
        <span>
          <span className="font-display text-xl">Business Unit 1 exam</span>
          <span className="mt-1 block text-sm text-muted">
            2 hours · 100 marks · questions 1 to 9, one at a time · marked when you hand it in
          </span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted" />
      </Link>

      <Link
        to="/exam/$paperId"
        params={{ paperId: "business-u2" }}
        className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
      >
        <span>
          <span className="font-display text-xl">Business Unit 2 exam</span>
          <span className="mt-1 block text-sm text-muted">
            1 hour 30 minutes · 60 marks · two case studies, one at a time · marked when you hand it in
          </span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted" />
      </Link>

      <Link
        to="/exam/$paperId"
        params={{ paperId: "maths-h1" }}
        className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
      >
        <span>
          <span className="font-display text-xl">Maths Higher Paper 1</span>
          <span className="mt-1 block text-sm text-muted">
            1 hour 30 minutes · 80 marks · non-calculator · June 2025 · marked from the scheme
          </span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted" />
      </Link>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Today’s board</h2>
            <p className="mt-1 text-sm text-muted">
              {done}/{total} quests complete · extra practice after the 30 minutes
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {(daily?.quests ?? []).map((quest) => (
            <Card key={quest.id} className="p-0">
              <div className="flex items-stretch gap-0">
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{quest.title}</CardTitle>
                    {quest.completed ? (
                      <Check className="size-4 text-ok" aria-label="Complete" />
                    ) : null}
                  </div>
                  <CardDescription className="mt-1">{quest.blurb}</CardDescription>
                  {quest.completed ? (
                    <p className="mt-2 text-xs tabular-nums text-muted">
                      {quest.correct}/{quest.count} · +{quest.xpEarned} XP
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center p-3">
                  {quest.completed ? (
                    <Button variant="ghost" disabled>
                      Done
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link
                        to="/play"
                        search={{
                          kind: quest.kind,
                          quest: quest.id,
                          subject: quest.subjectId ?? "",
                        }}
                      >
                        Start
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {review > 0 ? (
        <section className="mt-8">
          <Card className="flex items-center justify-between gap-3">
            <div>
              <CardHeader className="mb-0">
                <CardTitle className="text-lg">Review pile</CardTitle>
                <CardDescription>{review} questions that still need another pass.</CardDescription>
              </CardHeader>
            </div>
            <Button asChild variant="secondary">
              <Link to="/play" search={{ kind: "review", quest: "", subject: "" }}>
                Review
              </Link>
            </Button>
          </Card>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl">Subject halls</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SUBJECTS.map((subject) => {
            const Icon = SUBJECT_ICONS[subject.id];
            const mastery = subjectMastery(subject.id, answers);
            return (
              <Link
                key={subject.id}
                to="/subjects/$id"
                params={{ id: subject.id }}
                className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
              >
                <Icon className="size-4 text-muted" strokeWidth={1.75} />
                <p className="mt-3 font-display text-lg leading-tight">{subject.name}</p>
                <p className="mt-1 text-xs text-muted">{subject.group}</p>
                <Progress value={mastery.ratio * 100} className="mt-3" />
                <p className="mt-2 text-xs tabular-nums text-muted">
                  {Math.round(mastery.ratio * 100)}% hall
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SaveBanner() {
  const status = useCloudStatus((s) => s.status);
  return (
    <>
      <SignedOut>
        <Link
          to="/login"
          className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]"
        >
          <span>
            <span className="text-fg">Sign in to keep this hall.</span>
            <span className="mt-0.5 block text-muted">
              Marks, streaks and mastery restore when you come back on another device.
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted" />
        </Link>
      </SignedOut>
      <SignedIn>
        <p className="mt-5 text-xs text-muted">
          {status === "saving"
            ? "Saving your hall…"
            : status === "error"
              ? "Could not save just now — progress is still on this device."
              : status === "loading"
                ? "Restoring your hall…"
                : "Progress is saved to your account."}
        </p>
      </SignedIn>
    </>
  );
}
