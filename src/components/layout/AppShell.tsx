import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, BookOpen, FileText, Flame, Gift, LayoutGrid, Store, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";
import { AuthSlot } from "@/components/layout/AuthSlot";
import { Button } from "@/components/ui/button";
import { CharacterPortrait } from "@/components/game/CharacterPortrait";
import { Progress } from "@/components/ui/progress";
import { displayTitle, isBoosted, useGameStore } from "@/lib/game/store";
import { xpIntoLevel } from "@/lib/game/scoring";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Hall", icon: LayoutGrid },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/papers", label: "Papers", icon: FileText },
  { to: "/progress", label: "Ledger", icon: BarChart3 },
  { to: "/shop", label: "Exchange", icon: Store },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const play = pathname.startsWith("/play") || pathname.startsWith("/exam") || pathname.startsWith("/mock") || pathname.startsWith("/revise");
  const login = pathname === "/login";
  const name = useGameStore((s) => s.name);
  const xp = useGameStore((s) => s.xp);
  const marks = useGameStore((s) => s.marks);
  const streak = useGameStore((s) => s.streak);
  const crates = useGameStore((s) => s.crates);
  const equippedTitle = useGameStore((s) => s.equippedTitle);
  const boostUntil = useGameStore((s) => s.xpBoostUntil);
  const sound = useGameStore((s) => s.sound);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const onboarded = useGameStore((s) => s.onboarded);
  const { level, ratio, current, needed } = xpIntoLevel(xp);
  const title = displayTitle({ equippedTitle, xp });
  const boosted = isBoosted(boostUntil);

  if (play || login || !onboarded) {
    return <div className="min-h-dvh bg-bg text-fg">{children}</div>;
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
          <Link to="/" className="px-2">
            <p className="font-display text-2xl tracking-tight">QuestForge</p>
            <p className="mt-1 text-xs text-muted">Daily GCSE hall</p>
          </Link>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                    active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-lg bg-raised p-3 shadow-[var(--shadow-border)]">
            <Link to="/shop" className="mb-3 block">
              <CharacterPortrait className="h-40 w-full rounded-md" />
            </Link>
            <p className="text-xs text-muted">{title}</p>
            <p className="font-display text-lg leading-tight">{name || "Cadet"}</p>
            <p className="mt-2 text-xs tabular-nums text-muted">
              Lv {level} · {current}/{needed} XP
            </p>
            <Progress value={ratio * 100} className="mt-2" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm md:px-8">
            <div className="min-w-0 md:hidden">
              <p className="font-display text-lg leading-none tracking-tight">QuestForge</p>
              <p className="truncate text-xs text-muted">
                {title} · {name}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {boosted ? (
                <span className="hidden rounded-full bg-raised px-2.5 py-1 text-xs text-accent sm:inline">
                  2× XP
                </span>
              ) : null}
              {crates > 0 ? (
                <Link
                  to="/shop"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-raised px-3 text-xs tabular-nums text-accent shadow-[var(--shadow-border)]"
                >
                  <Gift className="size-3.5" />
                  {crates}
                </Link>
              ) : null}
              <StatChip icon={<Flame className="size-3.5" />} label={`${streak}d`} />
              <StatChip label={`${marks} mk`} />
              <Button
                variant="ghost"
                size="icon"
                className="size-10 min-h-10"
                onClick={toggleSound}
                aria-label={sound ? "Mute sounds" : "Unmute sounds"}
              >
                {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </Button>
              <AuthSlot compact />
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur-sm md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs",
                  active ? "text-fg" : "text-muted",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function StatChip({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-raised px-3 text-xs tabular-nums text-fg shadow-[var(--shadow-border)]">
      {icon}
      {label}
    </span>
  );
}
