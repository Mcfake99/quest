import type { Rarity } from "./loot";

export type ApparelItem = {
  id: string;
  name: string;
  blurb: string;
  rarity: Rarity;
  src: string;
  cost: number;
  title?: string;
  theme?: string;
};

export const APPAREL: ApparelItem[] = [
  {
    id: "default",
    name: "Hall kit",
    blurb: "Black tee and jeans. Always owned.",
    rarity: "common",
    src: "/character/default.jpg",
    cost: 0,
  },
  {
    id: "fire",
    name: "Ember hoodie",
    blurb: "Burnt-orange oversized hoodie. On Fire energy.",
    rarity: "rare",
    src: "/character/fire.jpg",
    cost: 90,
    title: "On Fire",
    theme: "ember",
  },
  {
    id: "clutch",
    name: "Match kit",
    blurb: "Green and white shirt, black shorts, boots.",
    rarity: "rare",
    src: "/character/clutch.jpg",
    cost: 95,
    title: "Clutch",
    theme: "pitch",
  },
  {
    id: "ace",
    name: "Varsity jacket",
    blurb: "Navy and cream letterman. Clean set energy.",
    rarity: "rare",
    src: "/character/ace.jpg",
    cost: 110,
    title: "Ace",
  },
  {
    id: "midnight",
    name: "Midnight coat",
    blurb: "Navy coat, headphones on. Late-night revision.",
    rarity: "epic",
    src: "/character/midnight.jpg",
    cost: 130,
    theme: "midnight",
  },
  {
    id: "neon",
    name: "Neon bomber",
    blurb: "Teal jacket, headphones around the neck.",
    rarity: "epic",
    src: "/character/neon.jpg",
    cost: 140,
    theme: "neon",
  },
  {
    id: "mc",
    name: "Gold bomber",
    blurb: "Black jacket, gold trim, chain. Main Character.",
    rarity: "epic",
    src: "/character/mc.jpg",
    cost: 160,
    title: "Main Character",
  },
  {
    id: "unstoppable",
    name: "Stripe tracksuit",
    blurb: "Black tracksuit, white stripes. Keep the combo.",
    rarity: "epic",
    src: "/character/unstoppable.jpg",
    cost: 150,
    title: "Unstoppable",
  },
  {
    id: "demon",
    name: "Demon hoodie",
    blurb: "Black oversized hoodie, dark-red hood. GCSE Demon.",
    rarity: "epic",
    src: "/character/demon.jpg",
    cost: 180,
    title: "GCSE Demon",
  },
  {
    id: "boss",
    name: "Boss coat",
    blurb: "Long black coat, turtleneck, gold pin.",
    rarity: "legend",
    src: "/character/boss.jpg",
    cost: 240,
    title: "Final Boss",
  },
  {
    id: "legend",
    name: "Legend chain",
    blurb: "Black cap, heavy gold chain. Endgame streetwear.",
    rarity: "legend",
    src: "/character/legend.jpg",
    cost: 260,
  },
];

export function apparelById(id: string | null | undefined): ApparelItem {
  return APPAREL.find((a) => a.id === id) ?? APPAREL[0]!;
}

export function apparelForTitle(title: string): ApparelItem | undefined {
  return APPAREL.find((a) => a.title === title);
}

export function apparelForTheme(theme: string): ApparelItem | undefined {
  return APPAREL.find((a) => a.theme === theme);
}

export const DROPPABLE_APPAREL = APPAREL.filter((a) => a.id !== "default");
