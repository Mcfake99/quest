import type { Question } from "./types";

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.round(70 * Math.pow(i, 1.28));
  }
  return total;
}

export function levelFromXp(xp: number): number {
  const n = Number.isFinite(xp) ? xp : 0;
  let level = 1;
  while (n >= xpForLevel(level + 1) && level < 40) {
    level += 1;
  }
  return level;
}

export function xpIntoLevel(xp: number): { level: number; current: number; needed: number; ratio: number } {
  const n = Number.isFinite(xp) ? xp : 0;
  const level = levelFromXp(n);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const current = n - floor;
  const needed = Math.max(1, next - floor);
  return { level, current, needed, ratio: Math.min(1, current / needed) };
}

export function comboMultiplier(combo: number): number {
  if (combo >= 10) return 3;
  if (combo >= 6) return 2;
  if (combo >= 3) return 1.5;
  return 1;
}

export function scoreAnswer(opts: {
  question: Question;
  correct: boolean;
  combo: number;
  remainingMs: number | null;
  durationMs: number | null;
  boosted: boolean;
  hinted?: boolean;
}): { xp: number; marks: number } {
  if (!opts.correct) return { xp: 0, marks: 0 };
  const base = 12 + opts.question.difficulty * 6;
  const combo = opts.hinted ? 1 : comboMultiplier(opts.combo);
  let speed = 0;
  if (!opts.hinted && opts.remainingMs != null && opts.durationMs && opts.durationMs > 0) {
    speed = Math.round((opts.remainingMs / opts.durationMs) * 8);
  }
  let xp = Math.round((base + speed) * combo);
  if (opts.boosted) xp = Math.round(xp * 1.5);
  let marks = 4 + opts.question.difficulty * 2 + (!opts.hinted && opts.combo >= 5 ? 2 : 0);
  if (opts.hinted) {
    xp = Math.max(4, Math.round(xp * 0.5));
    marks = Math.max(2, Math.round(marks * 0.5));
  }
  return { xp, marks };
}

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[£$€,%°]/g, "")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ");
}

export function answersMatch(given: string, expected: string, accept: readonly string[] = []): boolean {
  const pool = [expected, ...accept].map(normalizeAnswer);
  const g = normalizeAnswer(given);
  if (pool.includes(g)) return true;
  if (g === "t" && pool.includes("true")) return true;
  if (g === "f" && pool.includes("false")) return true;
  if (g === "yes" && pool.includes("true")) return true;
  if (g === "no" && pool.includes("false")) return true;
  const gn = Number(g.replace(/x/g, ""));
  if (g !== "" && Number.isFinite(gn)) {
    return pool.some((p) => {
      const pn = Number(p.replace(/x/g, ""));
      return Number.isFinite(pn) && gn === pn;
    });
  }
  return false;
}

export const RANKS: { level: number; title: string }[] = [
  { level: 1, title: "Rookie" },
  { level: 3, title: "Cadet" },
  { level: 5, title: "Scholar" },
  { level: 8, title: "Ace" },
  { level: 12, title: "Captain" },
  { level: 16, title: "Unstoppable" },
  { level: 20, title: "Main Character" },
  { level: 25, title: "Final Boss" },
  { level: 30, title: "Legend" },
];

export function rankForLevel(level: number): string {
  let title = RANKS[0]!.title;
  for (const rank of RANKS) {
    if (level >= rank.level) title = rank.title;
  }
  return title;
}

export function checkInReward(streak: number): { xp: number; marks: number } {
  let marks = 15 + streak * 4;
  let xp = 10 + streak * 3;
  if (streak > 0 && streak % 7 === 0) {
    marks += 50;
    xp += 40;
  }
  if (streak === 30) {
    marks += 100;
    xp += 80;
  }
  return { xp, marks };
}
