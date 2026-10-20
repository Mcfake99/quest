import { DROPPABLE_APPAREL } from "./apparel";

export type ShopItem = {
  id: string;
  kind: "consumable" | "title" | "crate" | "theme" | "apparel";
  name: string;
  blurb: string;
  cost: number;
  title?: string;
  theme?: string;
  apparel?: string;
  crates?: number;
  section: "boosts" | "crates" | "titles" | "themes" | "kits";
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "freeze",
    kind: "consumable",
    section: "boosts",
    name: "Streak freeze",
    blurb: "Miss a day and this is spent instead of the streak. Buy a spare for weekends.",
    cost: 40,
  },
  {
    id: "boost",
    kind: "consumable",
    section: "boosts",
    name: "2× XP hour",
    blurb: "Heater. Everything you answer in the next 60 minutes is worth double XP.",
    cost: 65,
  },
  {
    id: "crate",
    kind: "crate",
    section: "crates",
    name: "Loot crate",
    blurb: "Mystery drop. Marks, freezes, titles — or a kit that actually goes on your character.",
    cost: 70,
    crates: 1,
  },
  {
    id: "crate-mega",
    kind: "crate",
    section: "crates",
    name: "Mega crate",
    blurb: "Two crates at once. Better chance of walking out with something loud.",
    cost: 120,
    crates: 2,
  },
  {
    id: "title-fire",
    kind: "title",
    section: "titles",
    name: "On Fire",
    blurb: "Wear it when the combo is rolling.",
    cost: 55,
    title: "On Fire",
  },
  {
    id: "title-clutch",
    kind: "title",
    section: "titles",
    name: "Clutch",
    blurb: "For coming back after a miss.",
    cost: 80,
    title: "Clutch",
  },
  {
    id: "title-ace",
    kind: "title",
    section: "titles",
    name: "Ace",
    blurb: "Clean set energy.",
    cost: 100,
    title: "Ace",
  },
  {
    id: "title-mc",
    kind: "title",
    section: "titles",
    name: "Main Character",
    blurb: "Obviously.",
    cost: 150,
    title: "Main Character",
  },
  {
    id: "title-unstoppable",
    kind: "title",
    section: "titles",
    name: "Unstoppable",
    blurb: "For the long combo.",
    cost: 170,
    title: "Unstoppable",
  },
  {
    id: "title-demon",
    kind: "title",
    section: "titles",
    name: "GCSE Demon",
    blurb: "The one his mates will actually notice.",
    cost: 210,
    title: "GCSE Demon",
  },
  {
    id: "title-boss",
    kind: "title",
    section: "titles",
    name: "Final Boss",
    blurb: "Endgame. Costs a serious pile.",
    cost: 280,
    title: "Final Boss",
  },
  {
    id: "theme-ember",
    kind: "theme",
    section: "themes",
    name: "Ember",
    blurb: "Warm firelight hall. Looks like a heater.",
    cost: 110,
    theme: "ember",
  },
  {
    id: "theme-pitch",
    kind: "theme",
    section: "themes",
    name: "Pitch",
    blurb: "Match-day green. Saturday energy.",
    cost: 110,
    theme: "pitch",
  },
  {
    id: "theme-midnight",
    kind: "theme",
    section: "themes",
    name: "Midnight",
    blurb: "Late-night revision blue.",
    cost: 110,
    theme: "midnight",
  },
  {
    id: "theme-neon",
    kind: "theme",
    section: "themes",
    name: "Neon",
    blurb: "Arcade teal. Loudest hall on the board.",
    cost: 140,
    theme: "neon",
  },
  ...DROPPABLE_APPAREL.map(
    (kit): ShopItem => ({
      id: `kit-${kit.id}`,
      kind: "apparel",
      section: "kits",
      name: kit.name,
      blurb: kit.blurb,
      cost: kit.cost,
      apparel: kit.id,
    }),
  ),
];

export const SHOP_SECTIONS: { id: ShopItem["section"]; title: string; blurb: string }[] = [
  { id: "crates", title: "Loot crates", blurb: "The fun bit. Buy one, or earn them from perfect sets, levels and weekly streaks." },
  { id: "kits", title: "Kits", blurb: "Clothes for the character. Crate drops put these on him. Tap one you own to wear it." },
  { id: "boosts", title: "Boosts", blurb: "Keep the streak alive and stack XP." },
  { id: "titles", title: "Titles", blurb: "Wear it next to your name. Buying a title also unlocks the matching kit." },
  { id: "themes", title: "Hall skins", blurb: "Change the whole look. Matching kits come with them." },
];
