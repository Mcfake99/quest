import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apparelById, apparelForTheme, apparelForTitle } from "./apparel";
import { evaluateBadges } from "./badges";
import { mergeDaily } from "./daily";
import { advanceCard, BREAK_MS, emptyRevision, freshDay } from "./revise";
import { todayKey, yesterdayKey } from "./date";
import { rollCrate, type LootDrop } from "./loot";
import { defaultSave, mergeSave, sanitizeSave, snapshotSave } from "./save";
import { checkInReward, levelFromXp, rankForLevel } from "./scoring";
import { SHOP_ITEMS } from "./shop";
import type { DailyBoard, QuizResult, SaveState } from "./types";

export { defaultSave, sanitizeSave, snapshotSave } from "./save";

type GameStore = SaveState & {
  hydrateDay: () => void;
  onboard: (name: string) => void;
  rename: (name: string) => void;
  claimCheckIn: () => { xp: number; marks: number; streak: number; freezeUsed: boolean; crates: number } | null;
  recordAnswer: (questionId: string, correct: boolean) => void;
  grant: (xp: number, marks: number) => void;
  grantCrates: (n: number) => void;
  finishQuest: (
    questId: string | null,
    result: QuizResult,
  ) => { badges: string[]; crates: number; jackpotMarks: number };
  buy: (itemId: string) => string | null;
  openCrate: () => LootDrop | null;
  equipTitle: (title: string | null) => void;
  equipTheme: (theme: string) => void;
  equipApparel: (id: string) => void;
  toggleSound: () => void;
  startRevision: () => void;
  enterBreak: () => void;
  finishBreak: () => void;
  recordRevision: (
    questionId: string,
    correct: boolean,
    xp: number,
    marks: number,
    flags?: { feynman?: boolean; map?: boolean },
  ) => void;
};

function bumpDay(days: SaveState["days"], date: string, patch: Partial<SaveState["days"][string]>) {
  const prev = days[date] ?? { xp: 0, correct: 0, attempted: 0 };
  return {
    ...days,
    [date]: {
      xp: prev.xp + (patch.xp ?? 0),
      correct: prev.correct + (patch.correct ?? 0),
      attempted: prev.attempted + (patch.attempted ?? 0),
    },
  };
}

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (name: string) => map.get(name) ?? null,
    setItem: (name: string, value: string) => {
      map.set(name, value);
    },
    removeItem: (name: string) => {
      map.delete(name);
    },
  };
}

function safeStorage() {
  if (typeof window === "undefined") return memoryStorage();
  try {
    const root = window.localStorage;
    return {
      getItem: (name: string) => {
        try {
          return root.getItem(name);
        } catch {
          return null;
        }
      },
      setItem: (name: string, value: string) => {
        try {
          root.setItem(name, value);
        } catch {
          /* Quota / blocked iframe storage must not crash after sign-in. */
        }
      },
      removeItem: (name: string) => {
        try {
          root.removeItem(name);
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    return memoryStorage();
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...defaultSave(),

      hydrateDay: () => {
        const date = todayKey();
        const save = get();
        const daily = mergeDaily(date, save);
        const prev = save.daily;
        const shape = (board: { quests: { id: string; count: number; seconds: number; title: string }[] } | null) =>
          board?.quests.map((q) => `${q.id}:${q.count}:${q.seconds}:${q.title}`).join("|") ?? "";
        const revision = freshDay(save.revision, date, Date.now());
        const patch: Partial<SaveState> = {};
        if (
          !prev ||
          daily.date !== prev.date ||
          daily.claimed !== prev.claimed ||
          shape(daily) !== shape(prev)
        ) {
          patch.daily = daily;
        }
        if (revision !== save.revision) patch.revision = revision;
        if (Object.keys(patch).length > 0) set(patch);
      },

      onboard: (name) => {
        const trimmed = name.trim().slice(0, 24) || "Cadet";
        set({ name: trimmed, onboarded: true, crates: Math.max(get().crates ?? 0, 1) });
        get().hydrateDay();
      },

      rename: (name) => set({ name: name.trim().slice(0, 24) || get().name }),

      claimCheckIn: () => {
        const date = todayKey();
        const save = get();
        if (save.daily?.date === date && save.daily.claimed) return null;

        let streak = 1;
        let freezeUsed = false;
        if (save.lastCheckIn === yesterdayKey()) {
          streak = save.streak + 1;
        } else if (save.lastCheckIn && save.lastCheckIn !== date) {
          if (save.freezes > 0) {
            freezeUsed = true;
            streak = save.streak + 1;
          } else {
            streak = 1;
          }
        } else if (save.lastCheckIn === date) {
          streak = Math.max(1, save.streak);
        }

        const reward = checkInReward(streak);
        const weeklyCrate = streak > 0 && streak % 7 === 0 ? 1 : 0;
        const monthCrate = streak === 30 ? 1 : 0;
        const cratesGained = weeklyCrate + monthCrate;
        const board: DailyBoard = { ...mergeDaily(date, save), claimed: true };
        set({
          streak,
          longestStreak: Math.max(save.longestStreak, streak),
          lastCheckIn: date,
          freezes: freezeUsed ? Math.max(0, save.freezes - 1) : save.freezes,
          xp: save.xp + reward.xp,
          marks: save.marks + reward.marks,
          crates: (save.crates ?? 0) + cratesGained,
          daily: board,
          days: bumpDay(save.days ?? {}, date, { xp: reward.xp }),
        });
        const next = get();
        set({ badges: evaluateBadges(next) });
        return { ...reward, streak, freezeUsed, crates: cratesGained };
      },

      recordAnswer: (questionId, correct) => {
        const save = get();
        const rec = save.answers?.[questionId] ?? { c: 0, w: 0 };
        const answers = {
          ...save.answers,
          [questionId]: {
            c: rec.c + (correct ? 1 : 0),
            w: rec.w + (correct ? 0 : 1),
          },
        };
        set({
          answers,
          days: bumpDay(save.days ?? {}, todayKey(), {
            attempted: 1,
            correct: correct ? 1 : 0,
          }),
        });
      },

      grant: (xp, marks) => {
        const save = get();
        set({
          xp: save.xp + xp,
          marks: save.marks + marks,
          days: bumpDay(save.days ?? {}, todayKey(), { xp }),
        });
      },

      grantCrates: (n) => {
        if (n <= 0) return;
        set({ crates: (get().crates ?? 0) + n });
      },

      finishQuest: (questId, result) => {
        const save = get();
        const date = todayKey();
        const merged = mergeDaily(date, save);
        const daily: DailyBoard = questId
          ? {
              date: merged.date,
              claimed: merged.claimed,
              quests: merged.quests.map((q) =>
                q.id === questId
                  ? {
                      ...q,
                      completed: true,
                      xpEarned: result.xp,
                      correct: result.correctIds.length,
                    }
                  : q,
              ),
            }
          : merged;
        const perfect =
          result.correctIds.length === result.questionIds.length && result.questionIds.length > 0;
        const weekend = [0, 6].includes(new Date().getDay());
        let crates = 0;
        let jackpotMarks = 0;
        if (perfect && result.questionIds.length >= 8) {
          crates += 1;
          jackpotMarks += 40;
        }
        if (result.comboMax >= 10) jackpotMarks += 25;
        const allDaily = daily.quests.every((q) => q.completed);
        const wasAllDaily = merged.quests.every((q) => q.completed);
        if (allDaily && !wasAllDaily) crates += 1;

        const before = new Set(save.badges);
        const next: SaveState = {
          ...save,
          daily,
          marks: save.marks + jackpotMarks,
          crates: (save.crates ?? 0) + crates,
        };
        const badges = evaluateBadges(next, {
          comboMax: result.comboMax,
          perfect,
          size: result.questionIds.length,
          sprint: questId === "sprint",
          weekend,
        });
        set({
          daily,
          badges,
          marks: save.marks + jackpotMarks,
          crates: (save.crates ?? 0) + crates,
        });
        return { badges: badges.filter((id) => !before.has(id)), crates, jackpotMarks };
      },

      buy: (itemId) => {
        const item = SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item) return "That item is not on the board.";
        const save = get();
        if (save.marks < item.cost) return "Not enough marks.";
        if (item.kind === "title" && item.title && save.titles.includes(item.title)) {
          return "You already own that title.";
        }
        if (item.kind === "theme" && item.theme && (save.themes ?? []).includes(item.theme)) {
          return "You already own that hall.";
        }
        if (item.kind === "apparel" && item.apparel && (save.apparel ?? []).includes(item.apparel)) {
          return "You already own that kit.";
        }
        if (item.id === "boost") {
          const base = Math.max(Date.now(), save.xpBoostUntil);
          set({
            marks: save.marks - item.cost,
            xpBoostUntil: base + 60 * 60 * 1000,
          });
          return null;
        }
        if (item.id === "freeze") {
          set({ marks: save.marks - item.cost, freezes: save.freezes + 1 });
          return null;
        }
        if (item.kind === "crate") {
          set({
            marks: save.marks - item.cost,
            crates: (save.crates ?? 0) + (item.crates ?? 1),
          });
          return null;
        }
        if (item.kind === "title" && item.title) {
          const kit = apparelForTitle(item.title);
          const apparel = save.apparel ?? ["default"];
          const nextApparel =
            kit && !apparel.includes(kit.id) ? [...apparel, kit.id] : apparel;
          set({
            marks: save.marks - item.cost,
            titles: [...save.titles, item.title],
            equippedTitle: item.title,
            apparel: nextApparel,
            equippedApparel: kit?.id ?? save.equippedApparel,
          });
          return null;
        }
        if (item.kind === "theme" && item.theme) {
          const themes = save.themes?.includes(item.theme)
            ? save.themes
            : [...(save.themes ?? ["hall"]), item.theme];
          const kit = apparelForTheme(item.theme);
          const apparel = save.apparel ?? ["default"];
          const nextApparel =
            kit && !apparel.includes(kit.id) ? [...apparel, kit.id] : apparel;
          set({
            marks: save.marks - item.cost,
            themes,
            theme: item.theme,
            apparel: nextApparel,
            equippedApparel: kit?.id ?? save.equippedApparel,
          });
          return null;
        }
        if (item.kind === "apparel" && item.apparel) {
          if ((save.apparel ?? []).includes(item.apparel)) return "You already own that kit.";
          const kit = apparelById(item.apparel);
          const titles = kit.title && !save.titles.includes(kit.title) ? [...save.titles, kit.title] : save.titles;
          const themes =
            kit.theme && !(save.themes ?? []).includes(kit.theme)
              ? [...(save.themes ?? ["hall"]), kit.theme]
              : save.themes;
          set({
            marks: save.marks - item.cost,
            apparel: [...(save.apparel ?? ["default"]), item.apparel],
            equippedApparel: item.apparel,
            titles,
            equippedTitle: kit.title ?? save.equippedTitle,
            themes,
            theme: kit.theme ?? save.theme,
          });
          return null;
        }
        return "Could not buy that.";
      },

      openCrate: () => {
        const save = get();
        if ((save.crates ?? 0) < 1) return null;
        const drop = rollCrate({
          titles: save.titles ?? [],
          themes: save.themes ?? ["hall"],
          apparel: save.apparel ?? ["default"],
        });
        const patch: Partial<SaveState> = {
          crates: save.crates - 1,
          cratesOpened: (save.cratesOpened ?? 0) + 1,
        };
        if (drop.marks) patch.marks = save.marks + drop.marks;
        if (drop.xp) {
          patch.xp = save.xp + drop.xp;
          patch.days = bumpDay(save.days ?? {}, todayKey(), { xp: drop.xp });
        }
        if (drop.freeze) patch.freezes = save.freezes + drop.freeze;
        if (drop.boostMs) patch.xpBoostUntil = Math.max(Date.now(), save.xpBoostUntil) + drop.boostMs;
        let titles = save.titles ?? [];
        let themes = save.themes ?? ["hall"];
        let apparel = save.apparel ?? ["default"];
        if (drop.title && !titles.includes(drop.title)) {
          titles = [...titles, drop.title];
          patch.titles = titles;
          patch.equippedTitle = drop.title;
        }
        if (drop.theme && !themes.includes(drop.theme)) {
          themes = [...themes, drop.theme];
          patch.themes = themes;
          patch.theme = drop.theme;
        }
        if (drop.apparel && !apparel.includes(drop.apparel)) {
          apparel = [...apparel, drop.apparel];
          patch.apparel = apparel;
          patch.equippedApparel = drop.apparel;
        } else if (drop.apparel) {
          patch.equippedApparel = drop.apparel;
        }
        set(patch);
        set({ badges: evaluateBadges(get()) });
        return drop;
      },

      equipTitle: (title) => set({ equippedTitle: title }),

      equipTheme: (theme) => {
        const owned = get().themes ?? ["hall"];
        if (theme !== "hall" && !owned.includes(theme)) return;
        set({ theme });
      },

      equipApparel: (id) => {
        const owned = get().apparel ?? ["default"];
        if (id !== "default" && !owned.includes(id)) return;
        const kit = apparelById(id);
        set({
          equippedApparel: id,
          equippedTitle: kit.title ?? get().equippedTitle,
        });
      },

      toggleSound: () => set({ sound: !get().sound }),

      startRevision: () => {
        const date = todayKey();
        const now = Date.now();
        const current = freshDay(get().revision, date, now);
        if (current && current.phase !== "idle") return;
        set({ revision: emptyRevision(date, now) });
      },

      enterBreak: () => {
        const rev = get().revision;
        if (!rev || rev.phase !== "focus") return;
        set({
          revision: {
            ...rev,
            phase: "break",
            breakEndsAt: Date.now() + BREAK_MS,
          },
        });
      },

      finishBreak: () => {
        const rev = get().revision;
        if (!rev || rev.phase !== "break") return;
        set({ revision: { ...rev, phase: "done" } });
      },

      recordRevision: (questionId, correct, xp, marks, flags) => {
        const save = get();
        const date = todayKey();
        const rev = save.revision;
        if (!rev || rev.date !== date || rev.phase !== "focus") return;
        const rec = save.answers?.[questionId] ?? { c: 0, w: 0 };
        const gainedXp = correct ? xp : 0;
        const gainedMarks = correct ? marks : 0;
        set({
          reviews: {
            ...save.reviews,
            [questionId]: advanceCard(save.reviews?.[questionId], correct, date),
          },
          revision: {
            ...rev,
            answered: rev.answered + 1,
            correct: rev.correct + (correct ? 1 : 0),
            xp: rev.xp + gainedXp,
            usedIds: rev.usedIds.includes(questionId) ? rev.usedIds : [...rev.usedIds, questionId],
            feynmanDone: rev.feynmanDone || Boolean(flags?.feynman),
            mapDone: rev.mapDone || Boolean(flags?.map),
          },
          answers: {
            ...save.answers,
            [questionId]: {
              c: rec.c + (correct ? 1 : 0),
              w: rec.w + (correct ? 0 : 1),
            },
          },
          xp: save.xp + gainedXp,
          marks: save.marks + gainedMarks,
          days: bumpDay(save.days ?? {}, date, {
            xp: gainedXp,
            attempted: 1,
            correct: correct ? 1 : 0,
          }),
        });
      },
    }),
    {
      name: "questforge-v1",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => safeStorage()),
      merge: (persisted, current) => ({ ...current, ...mergeSave(persisted, current) }),
      partialize: (state) => snapshotSave(state),
    },
  ),
);

export function isBoosted(until: number): boolean {
  return Date.now() < until;
}

export function displayTitle(save: Pick<SaveState, "equippedTitle" | "xp">): string {
  return save.equippedTitle ?? rankForLevel(levelFromXp(save.xp ?? 0));
}

export function currentSnapshot(): SaveState {
  return snapshotSave(useGameStore.getState());
}

export function replaceSave(raw: unknown) {
  const next = sanitizeSave(raw);
  useGameStore.setState(next);
  try {
    useGameStore.getState().hydrateDay();
  } catch {
    /* A bad save must not take down the hall. */
  }
}
