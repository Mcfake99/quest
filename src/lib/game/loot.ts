import { DROPPABLE_APPAREL, apparelForTheme, apparelForTitle } from "./apparel";

export type Rarity = "common" | "rare" | "epic" | "legend";

export type LootDrop = {
  rarity: Rarity;
  name: string;
  blurb: string;
  marks?: number;
  xp?: number;
  freeze?: number;
  boostMs?: number;
  title?: string;
  theme?: string;
  apparel?: string;
};

export const LOOT_TITLES = [
  "On Fire",
  "Clutch",
  "Ace",
  "Main Character",
  "Unstoppable",
  "GCSE Demon",
  "Final Boss",
] as const;

export const LOOT_THEMES = ["ember", "pitch", "neon", "midnight"] as const;

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legend: "Legendary",
};

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function missingApparel(owned: string[]) {
  return DROPPABLE_APPAREL.filter((a) => !owned.includes(a.id));
}

function apparelDrop(item: (typeof DROPPABLE_APPAREL)[number], rarity: Rarity): LootDrop {
  return {
    rarity,
    apparel: item.id,
    title: item.title,
    theme: item.theme,
    name: item.name,
    blurb: `${RARITY_LABEL[rarity]} drop — ${item.blurb} It goes on your character.`,
  };
}

export function rollCrate(owned: { titles: string[]; themes: string[]; apparel: string[] }): LootDrop {
  const roll = Math.random();
  const rarity: Rarity = roll < 0.05 ? "legend" : roll < 0.2 ? "epic" : roll < 0.52 ? "rare" : "common";
  const missing = missingApparel(owned.apparel ?? []);
  const atRarity = missing.filter((a) => a.rarity === rarity);
  const atOrBelow = missing.filter((a) =>
    rarity === "legend"
      ? true
      : rarity === "epic"
        ? a.rarity !== "legend"
        : rarity === "rare"
          ? a.rarity === "rare" || a.rarity === "common"
          : a.rarity === "common" || a.rarity === "rare",
  );

  if (rarity === "legend") {
    const legendGear = missing.filter((a) => a.rarity === "legend");
    if (legendGear.length) return apparelDrop(pick(legendGear), "legend");
    if (atOrBelow.length && Math.random() < 0.6) return apparelDrop(pick(atOrBelow), "legend");
    const missingThemes = LOOT_THEMES.filter((t) => !owned.themes.includes(t));
    if (missingThemes.length) {
      const theme = pick(missingThemes);
      const kit = apparelForTheme(theme);
      return {
        rarity,
        theme,
        apparel: kit && !owned.apparel.includes(kit.id) ? kit.id : undefined,
        name: kit ? kit.name : `${theme[0]!.toUpperCase()}${theme.slice(1)} hall`,
        blurb: "Legendary drop — hall skin and the matching kit on your character.",
      };
    }
    if (!owned.titles.includes("Final Boss")) {
      const kit = apparelForTitle("Final Boss");
      return {
        rarity,
        title: "Final Boss",
        apparel: kit?.id,
        name: kit?.name ?? "Final Boss",
        blurb: "Legendary drop — Final Boss title and the coat.",
      };
    }
    return { rarity, marks: 250, name: "+250 marks", blurb: "Legendary drop — a serious pile of marks." };
  }

  if (rarity === "epic") {
    if (atRarity.length && Math.random() < 0.75) return apparelDrop(pick(atRarity), "epic");
    const missingTitles = LOOT_TITLES.filter((t) => !owned.titles.includes(t));
    if (missingTitles.length) {
      const title = pick(missingTitles);
      const kit = apparelForTitle(title);
      return {
        rarity,
        title,
        apparel: kit && !owned.apparel.includes(kit.id) ? kit.id : undefined,
        name: kit?.name ?? title,
        blurb: kit
          ? `Epic drop — ${title} and the matching kit on your character.`
          : "Epic drop — a title you can wear on the board.",
      };
    }
    if (missing.length) return apparelDrop(pick(missing), "epic");
    return {
      rarity,
      marks: 120,
      freeze: 1,
      name: "+120 marks and a freeze",
      blurb: "Epic drop — marks plus a streak freeze.",
    };
  }

  if (rarity === "rare") {
    if (atRarity.length && Math.random() < 0.55) return apparelDrop(pick(atRarity), "rare");
    const kind = Math.random();
    if (kind < 0.34) {
      return { rarity, freeze: 1, name: "Streak freeze", blurb: "Rare drop — miss a day and the freeze is spent instead." };
    }
    if (kind < 0.67) {
      return { rarity, boostMs: 30 * 60 * 1000, name: "30-min 2× XP", blurb: "Rare drop — heater for the next half hour." };
    }
    return { rarity, marks: 80, name: "+80 marks", blurb: "Rare drop — extra marks in the ledger." };
  }

  if (missing.length && Math.random() < 0.35) {
    return apparelDrop(pick(atOrBelow.length ? atOrBelow : missing), "common");
  }
  if (Math.random() < 0.5) {
    const marks = 20 + Math.floor(Math.random() * 26);
    return { rarity, marks, name: `+${marks} marks`, blurb: "Common drop — a handful of marks." };
  }
  const xp = 25 + Math.floor(Math.random() * 26);
  return { rarity, xp, name: `+${xp} XP`, blurb: "Common drop — extra XP toward the next level." };
}
