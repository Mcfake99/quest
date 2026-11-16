/**
 * Client-side study-session log. Entries are queued in localStorage and flushed
 * to the server (`recordStudy`) by <PapersSync/>; an entry with the same id is
 * replaced, so a session can be logged progressively and finalised later.
 * Only signed-in users are logged (PapersSync sets the owner).
 */
import type { StudyEntry, StudyItem, StudyKind } from "./study-log-core";

const KEY = "questforge-studylog-v1";
const MAX_PENDING = 200;
const GAP_MS = 30 * 60_000;

type Pending = Record<string, StudyEntry & { uid: string; v: number }>;

let owner: string | null = null;
let flusher: ((entries: StudyEntry[]) => Promise<unknown>) | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let flushing = false;
let version = 0;

function read(): Pending {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Pending) : {};
  } catch {
    return {};
  }
}

function write(p: Pending) {
  if (typeof window === "undefined") return;
  try {
    const entries = Object.entries(p);
    const trimmed = entries.length > MAX_PENDING ? Object.fromEntries(entries.sort((a, b) => b[1].v - a[1].v).slice(0, MAX_PENDING)) : p;
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* storage full / blocked — logging is best-effort */
  }
}

/** Called by PapersSync: who is signed in, and how to send entries. */
export function setStudyLogOwner(uid: string | null, send: ((entries: StudyEntry[]) => Promise<unknown>) | null) {
  owner = uid;
  flusher = send;
  if (!uid) return;
  // Entries logged before the session resolved belong to whoever is signed in now.
  const p = read();
  let changed = false;
  for (const e of Object.values(p))
    if (!e.uid) {
      e.uid = uid;
      changed = true;
    }
  if (changed) write(p);
  scheduleFlush(500);
}

export function logStudy(entry: StudyEntry) {
  if (typeof window === "undefined") return;
  const p = read();
  p[entry.id] = { ...entry, uid: owner ?? p[entry.id]?.uid ?? "", v: ++version + Date.now() };
  write(p);
  scheduleFlush(3000);
}

export function scheduleFlush(ms = 3000) {
  if (typeof window === "undefined") return;
  clearTimeout(timer);
  timer = setTimeout(() => void flushStudyLog(), ms);
}

export async function flushStudyLog() {
  if (!owner || !flusher || flushing) return;
  const uid = owner;
  const p = read();
  const mine = Object.values(p).filter((e) => e.uid === uid).slice(0, 50);
  if (!mine.length) return;
  flushing = true;
  try {
    await flusher(mine.map(({ uid: _u, v: _v, ...e }) => e));
    const now = read();
    for (const e of mine) if (now[e.id]?.v === e.v) delete now[e.id];
    write(now);
    if (Object.values(now).some((e) => e.uid === uid)) scheduleFlush(1000);
  } catch {
    scheduleFlush(60_000);
  } finally {
    flushing = false;
  }
}

/** Mint a session id. */
export function studyId(kind: StudyKind, ...parts: (string | number | null | undefined)[]) {
  return [kind, ...parts.filter((x) => x != null && x !== ""), Math.random().toString(36).slice(2, 8)].join(":");
}

type Rolling = { entry: StudyEntry; lastAt: number };
const rolling = new Map<string, Rolling>();

/**
 * Practice without a clear start/end (flashcards, paper quick-quiz, mistakes,
 * revision): items accumulate into one session per kind+subject until a 30 min gap.
 */
export function trackPractice(kind: StudyKind, subjectId: string | null, item: StudyItem, extra?: Partial<StudyEntry>) {
  const key = `${kind}|${subjectId ?? ""}|${extra?.mode ?? ""}`;
  const now = Date.now();
  let r = rolling.get(key);
  if (!r || now - r.lastAt > GAP_MS) {
    r = {
      entry: { id: studyId(kind, subjectId, now), kind, subjectId, status: "completed", startedAt: now, items: [], ...extra },
      lastAt: now,
    };
    rolling.set(key, r);
  }
  r.lastAt = now;
  const items = [...r.entry.items, item];
  r.entry = {
    ...r.entry,
    items,
    endedAt: now,
    score: items.reduce((n, i) => n + i[1], 0),
    max: items.reduce((n, i) => n + i[2], 0),
  };
  logStudy(r.entry);
}
