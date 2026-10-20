import { QUESTIONS_BY_SUBJECT } from "./questions";
import { levelFromXp } from "./scoring";
import { SUBJECTS, type SaveState } from "./types";

export type BadgeDef = {
  id: string;
  name: string;
  blurb: string;
};

export const BADGES: BadgeDef[] = [
  { id: "first-mark", name: "First blood", blurb: "Score your first correct answer." },
  { id: "streak-3", name: "Getting started", blurb: "Hold a 3-day streak." },
  { id: "streak-7", name: "On a heater", blurb: "Hold a 7-day streak." },
  { id: "streak-14", name: "Locked in", blurb: "Hold a 14-day streak." },
  { id: "streak-30", name: "Unbreakable", blurb: "Hold a 30-day streak." },
  { id: "perfect-eight", name: "Clean sweep", blurb: "Take a quiz of 8+ and get every question." },
  { id: "combo-5", name: "Hot hand", blurb: "A combo of 5 in one sitting." },
  { id: "combo-10", name: "Untouchable", blurb: "A combo of 10 in one sitting." },
  { id: "combo-15", name: "God mode", blurb: "A combo of 15 in one sitting." },
  { id: "sprinter", name: "Sprinter", blurb: "Finish a speed sprint." },
  { id: "full-board", name: "Full board", blurb: "Complete every daily quest in a day." },
  { id: "polymath", name: "Polymath", blurb: "A correct answer in every subject." },
  { id: "marks-200", name: "Loaded", blurb: "Hold 200 marks at once." },
  { id: "level-5", name: "Level 5", blurb: "Reach level 5." },
  { id: "level-10", name: "Level 10", blurb: "Reach level 10." },
  { id: "science-triple", name: "Triple threat", blurb: "Get 8 unique correct in each science." },
  { id: "century", name: "Century", blurb: "100 unique questions correct." },
  { id: "picture-ace", name: "Picture-paper ace", blurb: "Get 8 unique pictured questions correct." },
  { id: "crate-5", name: "Loot goblin", blurb: "Open 5 crates." },
  { id: "crate-15", name: "High roller", blurb: "Open 15 crates." },
  { id: "weekend", name: "Weekend warrior", blurb: "Finish a quest on Saturday or Sunday." },
];

for (const subject of SUBJECTS) {
  BADGES.push({
    id: `hall-${subject.id}`,
    name: `${subject.name} hall`,
    blurb: `Master 10 questions in ${subject.name}.`,
  });
}

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

export function evaluateBadges(
  save: SaveState,
  event?: { comboMax?: number; perfect?: boolean; size?: number; sprint?: boolean; weekend?: boolean },
): string[] {
  const earned = new Set(save.badges);
  const add = (id: string) => {
    if (!earned.has(id)) earned.add(id);
  };

  const answers = save.answers ?? {};
  const uniqueCorrect = Object.values(answers).filter((r) => (r?.c ?? 0) > 0).length;
  const totalCorrect = Object.values(answers).reduce((n, r) => n + (r?.c ?? 0), 0);
  if (totalCorrect >= 1) add("first-mark");
  if (save.streak >= 3) add("streak-3");
  if (save.streak >= 7) add("streak-7");
  if (save.streak >= 14) add("streak-14");
  if (save.streak >= 30) add("streak-30");
  if (event?.perfect && (event.size ?? 0) >= 8) add("perfect-eight");
  if ((event?.comboMax ?? 0) >= 5) add("combo-5");
  if ((event?.comboMax ?? 0) >= 10) add("combo-10");
  if ((event?.comboMax ?? 0) >= 15) add("combo-15");
  if (event?.sprint) add("sprinter");
  if (save.daily && save.daily.quests?.every((q) => q.completed)) add("full-board");
  if (save.marks >= 200) add("marks-200");
  if (uniqueCorrect >= 100) add("century");
  if ((save.cratesOpened ?? 0) >= 5) add("crate-5");
  if ((save.cratesOpened ?? 0) >= 15) add("crate-15");
  if (event?.weekend) add("weekend");

  const level = levelFromXp(save.xp);
  if (level >= 5) add("level-5");
  if (level >= 10) add("level-10");

  const subjectHits = SUBJECTS.map((s) => {
    const qs = QUESTIONS_BY_SUBJECT[s.id] ?? [];
    return qs.filter((q) => (answers[q.id]?.c ?? 0) > 0).length;
  });
  if (subjectHits.every((n) => n >= 1)) add("polymath");
  SUBJECTS.forEach((s, i) => {
    if ((subjectHits[i] ?? 0) >= 10) add(`hall-${s.id}`);
  });
  const bio = subjectHits[SUBJECTS.findIndex((s) => s.id === "biology")] ?? 0;
  const chem = subjectHits[SUBJECTS.findIndex((s) => s.id === "chemistry")] ?? 0;
  const phys = subjectHits[SUBJECTS.findIndex((s) => s.id === "physics")] ?? 0;
  if (bio >= 8 && chem >= 8 && phys >= 8) add("science-triple");

  const picturedCorrect = Object.entries(answers).filter(([id, r]) => id.includes("-p") && (r?.c ?? 0) > 0).length;
  if (picturedCorrect >= 8) add("picture-ace");

  return [...earned];
}
