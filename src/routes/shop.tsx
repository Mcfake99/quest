import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CrateReveal } from "@/components/game/CrateReveal";
import { CharacterPortrait, WardrobeGrid } from "@/components/game/CharacterPortrait";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { playCrate } from "@/lib/game/audio";
import type { LootDrop } from "@/lib/game/loot";
import { SHOP_ITEMS, SHOP_SECTIONS } from "@/lib/game/shop";
import { isBoosted, useGameStore } from "@/lib/game/store";

export const Route = createFileRoute("/shop")({ component: Shop });

function Shop() {
  const marks = useGameStore((s) => s.marks);
  const titles = useGameStore((s) => s.titles);
  const equipped = useGameStore((s) => s.equippedTitle);
  const freezes = useGameStore((s) => s.freezes);
  const boostUntil = useGameStore((s) => s.xpBoostUntil);
  const crates = useGameStore((s) => s.crates);
  const theme = useGameStore((s) => s.theme);
  const themes = useGameStore((s) => s.themes);
  const sound = useGameStore((s) => s.sound);
  const buy = useGameStore((s) => s.buy);
  const openCrate = useGameStore((s) => s.openCrate);
  const equipTitle = useGameStore((s) => s.equipTitle);
  const equipTheme = useGameStore((s) => s.equipTheme);
  const [message, setMessage] = useState<string | null>(null);
  const [drop, setDrop] = useState<LootDrop | null>(null);
  const boosted = isBoosted(boostUntil);

  function purchase(id: string) {
    const err = buy(id);
    setMessage(err ?? "Bought.");
  }

  function crack() {
    const result = openCrate();
    if (!result) {
      setMessage("No crates left. Buy one, or earn them from perfect sets.");
      return;
    }
    setDrop(result);
    if (sound) playCrate();
  }

  return (
    <div className="mx-auto max-w-2xl">
      {drop ? <CrateReveal drop={drop} onClose={() => setDrop(null)} /> : null}
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-muted">Exchange</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Spend marks</h1>
          <p className="mt-2 text-sm text-muted">
            <span className="tabular-nums text-fg">{marks}</span> marks · {freezes} freeze
            {freezes === 1 ? "" : "s"} · {crates} crate{crates === 1 ? "" : "s"}
            {boosted ? " · 2× XP is running." : "."}
          </p>
        </div>
        <CharacterPortrait className="hidden h-36 w-24 rounded-xl sm:block" />
      </div>
      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}

      <div className="mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl">Loot crates</p>
            <p className="mt-1 text-sm text-muted">
              {crates > 0
                ? `${crates} waiting. Crack one — could be marks, a freeze, a title or a hall skin.`
                : "Earn crates from perfect 8s, level-ups and 7-day streaks. Or buy one below."}
            </p>
          </div>
          <Button size="lg" disabled={crates < 1} onClick={crack}>
            Open
          </Button>
        </div>
      </div>

      {SHOP_SECTIONS.map((section) => (
        <section key={section.id} className="mt-10">
          <h2 className="font-display text-2xl">{section.title}</h2>
          <p className="mt-1 text-sm text-muted">{section.blurb}</p>
          {section.id === "kits" ? (
            <div className="mt-4">
              <WardrobeGrid />
            </div>
          ) : (
          <div className="mt-4 grid gap-3">
            {SHOP_ITEMS.filter((item) => item.section === section.id).map((item) => {
              const ownedTitle = item.kind === "title" && item.title ? titles.includes(item.title) : false;
              const ownedTheme = item.kind === "theme" && item.theme ? (themes ?? []).includes(item.theme) : false;
              const wearingTheme = item.theme && theme === item.theme;
              return (
                <Card key={item.id} className="flex items-center justify-between gap-4">
                  <CardHeader className="mb-0 min-w-0">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>{item.blurb}</CardDescription>
                  </CardHeader>
                  {ownedTitle ? (
                    <Button
                      variant={equipped === item.title ? "default" : "secondary"}
                      onClick={() => equipTitle(equipped === item.title ? null : item.title!)}
                    >
                      {equipped === item.title ? "Wearing" : "Wear"}
                    </Button>
                  ) : ownedTheme ? (
                    <Button
                      variant={wearingTheme ? "default" : "secondary"}
                      onClick={() => equipTheme(wearingTheme ? "hall" : item.theme!)}
                    >
                      {wearingTheme ? "On" : "Use"}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled={marks < item.cost}
                      onClick={() => purchase(item.id)}
                    >
                      {item.cost} mk
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
          )}
        </section>
      ))}

      <section className="mt-10">
        <h2 className="font-display text-2xl">Classic hall</h2>
        <p className="mt-1 text-sm text-muted">The original cream-and-ink look. Always free.</p>
        <Card className="mt-4 flex items-center justify-between gap-4">
          <CardHeader className="mb-0">
            <CardTitle className="text-lg">Hall</CardTitle>
            <CardDescription>Default. Switch back any time.</CardDescription>
          </CardHeader>
          <Button variant={theme === "hall" || !theme ? "default" : "secondary"} onClick={() => equipTheme("hall")}>
            {theme === "hall" || !theme ? "On" : "Use"}
          </Button>
        </Card>
      </section>
    </div>
  );
}
