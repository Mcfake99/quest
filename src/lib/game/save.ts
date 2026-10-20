import type { CardProgress, RevisionState, SaveState } from "./types";

export const defaultSave = (): SaveState => ({
  version: 1,
  name: "",
  onboarded: false,
  xp: 0,
  marks: 0,
  streak: 0,
  longestStreak: 0,
  lastCheckIn: null,
  freezes: 0,
  xpBoostUntil: 0,
  titles: [],
  equippedTitle: null,
  badges: [],
  answers: {},
  reviews: {},
  revision: null,
  daily: null,
  days: {},
  sound: true,
  crates: 0,
  cratesOpened: 0,
  theme: "hall",
  themes: ["hall"],
  apparel: ["default"],
  equippedApparel: "default",
});

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function snapshotSave(state: SaveState): SaveState {
  const d = defaultSave();
  return {
    version: 1,
    name: typeof state.name === "string" ? state.name : d.name,
    onboarded: Boolean(state.onboarded),
    xp: typeof state.xp === "number" && Number.isFinite(state.xp) ? state.xp : d.xp,
    marks: typeof state.marks === "number" && Number.isFinite(state.marks) ? state.marks : d.marks,
    streak: typeof state.streak === "number" && Number.isFinite(state.streak) ? state.streak : d.streak,
    longestStreak:
      typeof state.longestStreak === "number" && Number.isFinite(state.longestStreak)
        ? state.longestStreak
        : d.longestStreak,
    lastCheckIn: typeof state.lastCheckIn === "string" || state.lastCheckIn === null ? state.lastCheckIn : d.lastCheckIn,
    freezes: typeof state.freezes === "number" && Number.isFinite(state.freezes) ? state.freezes : d.freezes,
    xpBoostUntil:
      typeof state.xpBoostUntil === "number" && Number.isFinite(state.xpBoostUntil) ? state.xpBoostUntil : d.xpBoostUntil,
    titles: Array.isArray(state.titles) ? state.titles.filter((t): t is string => typeof t === "string") : d.titles,
    equippedTitle:
      typeof state.equippedTitle === "string" || state.equippedTitle === null ? state.equippedTitle : d.equippedTitle,
    badges: Array.isArray(state.badges) ? state.badges.filter((t): t is string => typeof t === "string") : d.badges,
    answers: isRecord(state.answers) ? (state.answers as SaveState["answers"]) : d.answers,
    reviews: sanitizeReviews(state.reviews),
    revision: sanitizeRevision(state.revision),
    daily: state.daily === null || isRecord(state.daily) ? (state.daily as SaveState["daily"]) : d.daily,
    days: isRecord(state.days) ? (state.days as SaveState["days"]) : d.days,
    sound: typeof state.sound === "boolean" ? state.sound : d.sound,
    crates: typeof state.crates === "number" && Number.isFinite(state.crates) ? state.crates : d.crates,
    cratesOpened:
      typeof state.cratesOpened === "number" && Number.isFinite(state.cratesOpened)
        ? state.cratesOpened
        : d.cratesOpened,
    theme: typeof state.theme === "string" && state.theme ? state.theme : d.theme,
    themes: Array.isArray(state.themes) ? state.themes.filter((t): t is string => typeof t === "string") : d.themes,
    apparel: Array.isArray(state.apparel)
      ? state.apparel.filter((t): t is string => typeof t === "string")
      : d.apparel,
    equippedApparel:
      typeof state.equippedApparel === "string" && state.equippedApparel
        ? state.equippedApparel
        : d.equippedApparel,
  };
}

export function mergeSave(persisted: unknown, current: SaveState): SaveState {
  const p = isRecord(persisted) ? persisted : {};
  const defaults = defaultSave();
  return snapshotSave({
    ...defaults,
    ...current,
    ...p,
    name: typeof p.name === "string" ? p.name : (current.name ?? defaults.name),
    onboarded: typeof p.onboarded === "boolean" ? p.onboarded : (current.onboarded ?? defaults.onboarded),
    xp: typeof p.xp === "number" && Number.isFinite(p.xp) ? p.xp : (current.xp ?? defaults.xp),
    marks: typeof p.marks === "number" && Number.isFinite(p.marks) ? p.marks : (current.marks ?? defaults.marks),
    streak: typeof p.streak === "number" && Number.isFinite(p.streak) ? p.streak : (current.streak ?? defaults.streak),
    longestStreak:
      typeof p.longestStreak === "number" && Number.isFinite(p.longestStreak)
        ? p.longestStreak
        : (current.longestStreak ?? defaults.longestStreak),
    lastCheckIn: typeof p.lastCheckIn === "string" || p.lastCheckIn === null ? p.lastCheckIn : current.lastCheckIn,
    freezes: typeof p.freezes === "number" && Number.isFinite(p.freezes) ? p.freezes : current.freezes,
    xpBoostUntil:
      typeof p.xpBoostUntil === "number" && Number.isFinite(p.xpBoostUntil) ? p.xpBoostUntil : current.xpBoostUntil,
    titles: Array.isArray(p.titles) ? p.titles.filter((t): t is string => typeof t === "string") : current.titles,
    equippedTitle: typeof p.equippedTitle === "string" || p.equippedTitle === null ? p.equippedTitle : current.equippedTitle,
    badges: Array.isArray(p.badges) ? p.badges.filter((t): t is string => typeof t === "string") : current.badges,
    answers: isRecord(p.answers) ? (p.answers as SaveState["answers"]) : (current.answers ?? defaults.answers),
    reviews: sanitizeReviews(isRecord(p.reviews) ? p.reviews : current.reviews),
    revision: sanitizeRevision(p.revision === undefined ? current.revision : p.revision),
    daily: p.daily === null || isRecord(p.daily) ? (p.daily as SaveState["daily"]) : current.daily,
    days: isRecord(p.days) ? (p.days as SaveState["days"]) : (current.days ?? defaults.days),
    sound: typeof p.sound === "boolean" ? p.sound : current.sound,
    crates: typeof p.crates === "number" && Number.isFinite(p.crates) ? p.crates : (current.crates ?? 0),
    cratesOpened:
      typeof p.cratesOpened === "number" && Number.isFinite(p.cratesOpened)
        ? p.cratesOpened
        : (current.cratesOpened ?? 0),
    theme: typeof p.theme === "string" && p.theme ? p.theme : (current.theme ?? "hall"),
    themes: Array.isArray(p.themes)
      ? p.themes.filter((t): t is string => typeof t === "string")
      : (current.themes ?? ["hall"]),
    apparel: Array.isArray(p.apparel)
      ? p.apparel.filter((t): t is string => typeof t === "string")
      : (current.apparel ?? ["default"]),
    equippedApparel:
      typeof p.equippedApparel === "string" && p.equippedApparel
        ? p.equippedApparel
        : (current.equippedApparel ?? "default"),
  });
}

function sanitizeReviews(value: unknown): Record<string, CardProgress> {
  if (!isRecord(value)) return {};
  const out: Record<string, CardProgress> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!isRecord(raw)) continue;
    const box = raw.box;
    const due = raw.due;
    if (box !== 1 && box !== 2 && box !== 3 && box !== 4 && box !== 5) continue;
    if (typeof due !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(due)) continue;
    out[id] = { box, due };
  }
  return out;
}

function sanitizeRevision(value: unknown): RevisionState | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return null;
  const phase = value.phase;
  if (phase !== "idle" && phase !== "focus" && phase !== "break" && phase !== "done") return null;
  if (typeof value.date !== "string") return null;
  const ends = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : null);
  return {
    date: value.date,
    phase,
    focusEndsAt: ends(value.focusEndsAt),
    breakEndsAt: ends(value.breakEndsAt),
    answered: typeof value.answered === "number" ? value.answered : 0,
    correct: typeof value.correct === "number" ? value.correct : 0,
    xp: typeof value.xp === "number" ? value.xp : 0,
    usedIds: Array.isArray(value.usedIds) ? value.usedIds.filter((id): id is string => typeof id === "string") : [],
    feynmanDone: Boolean(value.feynmanDone),
    mapDone: Boolean(value.mapDone),
  };
}

export function sanitizeSave(raw: unknown): SaveState {
  return mergeSave(raw, defaultSave());
}
