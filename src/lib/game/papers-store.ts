import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RealAnswer } from "@/lib/game/exam/real/mark";
import { todayKey } from "@/lib/game/date";
import { advanceCard } from "@/lib/game/revise";
import { useGameStore } from "@/lib/game/store";
import type { CardProgress } from "@/lib/game/types";

export type MockSitting = {
  startedAt: number;
  endsAt: number;
  index: number;
  answers: Record<string, RealAnswer>;
  flagged: string[];
  /** Set when the paper is handed in (or the clock runs out). */
  submittedAt: number | null;
  endedBy: "time" | "candidate" | null;
  /** Marks per part — auto marks pre-filled, the rest self-marked against the scheme. */
  awarded: Record<string, number>;
};

export type MockAttempt = { at: number; score: number; max: number; pct: number; xp: number };

export type Mistake = { paperId: string; partId: string; at: number; got: number; of: number };

type PapersState = {
  sittings: Record<string, MockSitting>;
  attempts: Record<string, MockAttempt[]>;
  flash: Record<string, CardProgress>;
  mistakes: Record<string, Mistake>;
  /** partId -> when cleared (for cross-device merge). */
  cleared: Record<string, number>;
  /** Replace progress with a merged copy from the server. */
  applyProgress: (p: { attempts: Record<string, MockAttempt[]>; flash: Record<string, CardProgress>; mistakes: Record<string, Mistake>; cleared: Record<string, number> }) => void;
  start: (paperId: string, minutes: number) => void;
  answer: (paperId: string, partId: string, value: RealAnswer) => void;
  go: (paperId: string, index: number) => void;
  toggleFlag: (paperId: string, partId: string) => void;
  submit: (paperId: string, endedBy: "time" | "candidate", auto: Record<string, number>) => void;
  award: (paperId: string, partId: string, marks: number) => void;
  finish: (paperId: string, score: number, max: number, parts: { id: string; marks: number }[]) => MockAttempt | null;
  discard: (paperId: string) => void;
  rateCard: (cardId: string, known: boolean) => void;
  logResult: (paperId: string, partId: string, got: number, of: number) => void;
  clearMistake: (partId: string) => void;
};

export const usePapersStore = create<PapersState>()(
  persist(
    (set, get) => ({
      sittings: {},
      attempts: {},
      flash: {},
      mistakes: {},
      cleared: {},

      applyProgress: (p) => set({ attempts: p.attempts, flash: p.flash, mistakes: p.mistakes, cleared: p.cleared }),

      start: (paperId, minutes) => {
        const now = Date.now();
        set({
          sittings: {
            ...get().sittings,
            [paperId]: {
              startedAt: now,
              endsAt: now + minutes * 60_000,
              index: 0,
              answers: {},
              flagged: [],
              submittedAt: null,
              endedBy: null,
              awarded: {},
            },
          },
        });
      },

      answer: (paperId, partId, value) => {
        const s = get().sittings[paperId];
        if (!s || s.submittedAt) return;
        set({ sittings: { ...get().sittings, [paperId]: { ...s, answers: { ...s.answers, [partId]: value } } } });
      },

      go: (paperId, index) => {
        const s = get().sittings[paperId];
        if (!s) return;
        set({ sittings: { ...get().sittings, [paperId]: { ...s, index } } });
      },

      toggleFlag: (paperId, partId) => {
        const s = get().sittings[paperId];
        if (!s || s.submittedAt) return;
        const flagged = s.flagged.includes(partId) ? s.flagged.filter((id) => id !== partId) : [...s.flagged, partId];
        set({ sittings: { ...get().sittings, [paperId]: { ...s, flagged } } });
      },

      submit: (paperId, endedBy, auto) => {
        const s = get().sittings[paperId];
        if (!s || s.submittedAt) return;
        set({
          sittings: {
            ...get().sittings,
            [paperId]: { ...s, submittedAt: Date.now(), endedBy, index: 0, awarded: { ...auto } },
          },
        });
      },

      award: (paperId, partId, marks) => {
        const s = get().sittings[paperId];
        if (!s || !s.submittedAt) return;
        set({ sittings: { ...get().sittings, [paperId]: { ...s, awarded: { ...s.awarded, [partId]: marks } } } });
      },

      finish: (paperId, score, max, parts) => {
        const s = get().sittings[paperId];
        if (!s || !s.submittedAt) return null;
        const pct = max ? Math.round((score / max) * 100) : 0;
        const prevBest = Math.max(0, ...(get().attempts[paperId] ?? []).map((a) => a.score));
        // Every sitting earns a base reward; beating your best adds the difference.
        const xp = 20 + Math.round(score / 2) + Math.max(0, score - prevBest);
        const attempt: MockAttempt = { at: Date.now(), score, max, pct, xp };
        const mistakes = { ...get().mistakes };
        const cleared = { ...get().cleared };
        for (const part of parts) {
          const got = s.awarded[part.id] ?? 0;
          if (got < part.marks) mistakes[part.id] = { paperId, partId: part.id, at: Date.now(), got, of: part.marks };
          else if (mistakes[part.id]) {
            delete mistakes[part.id];
            cleared[part.id] = Date.now();
          }
        }
        const sittings = { ...get().sittings };
        delete sittings[paperId];
        set({ attempts: { ...get().attempts, [paperId]: [...(get().attempts[paperId] ?? []), attempt] }, mistakes, cleared, sittings });
        useGameStore.getState().grant(xp, Math.max(1, Math.round(pct / 10)));
        return attempt;
      },

      discard: (paperId) => {
        const sittings = { ...get().sittings };
        delete sittings[paperId];
        set({ sittings });
      },

      rateCard: (cardId, known) => {
        const today = todayKey();
        const prev = get().flash[cardId];
        set({ flash: { ...get().flash, [cardId]: advanceCard(prev, known, today) } });
        if (known) useGameStore.getState().grant(2, 0);
      },

      logResult: (paperId, partId, got, of) => {
        const mistakes = { ...get().mistakes };
        const cleared = { ...get().cleared };
        if (got < of) mistakes[partId] = { paperId, partId, at: Date.now(), got, of };
        else if (mistakes[partId]) {
          delete mistakes[partId];
          cleared[partId] = Date.now();
        }
        set({ mistakes, cleared });
        if (got > 0) useGameStore.getState().grant(3 * got, got >= of ? 1 : 0);
      },

      clearMistake: (partId) => {
        const mistakes = { ...get().mistakes };
        delete mistakes[partId];
        set({ mistakes, cleared: { ...get().cleared, [partId]: Date.now() } });
      },
    }),
    {
      name: "questforge-papers-v1",
      version: 1,
      storage: createJSONStorage(() => (typeof window === "undefined" ? memory : window.localStorage)),
      partialize: (s) => ({ sittings: s.sittings, attempts: s.attempts, flash: s.flash, mistakes: s.mistakes, cleared: s.cleared }),
    },
  ),
);

const mem = new Map<string, string>();
const memory = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};

export function dueCards<T extends { id: string }>(cards: T[], progress: Record<string, CardProgress>, today = todayKey()): T[] {
  // New cards and cards whose due date has arrived, weakest boxes first.
  return cards
    .filter((c) => !progress[c.id] || progress[c.id]!.due <= today)
    .sort((a, b) => (progress[a.id]?.box ?? 0) - (progress[b.id]?.box ?? 0));
}
