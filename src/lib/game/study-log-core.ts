/**
 * Pure shape + sanitiser for study-session log entries (client queue -> server).
 * No imports — runs on the server and in node tests.
 */
export const STUDY_KINDS = ["mock", "quiz", "paper-quiz", "mistakes", "flashcards", "revision"] as const;
export type StudyKind = (typeof STUDY_KINDS)[number];
export const STUDY_STATUSES = ["in_progress", "marking", "completed", "abandoned"] as const;
export type StudyStatus = (typeof STUDY_STATUSES)[number];

/** [itemId, got, of] — a question / paper part / flashcard and its marks. */
export type StudyItem = [string, number, number];

export type StudyEntry = {
  id: string;
  kind: StudyKind;
  mode?: string | null;
  subjectId?: string | null;
  ref?: string | null;
  title?: string | null;
  status: StudyStatus;
  endedBy?: string | null;
  startedAt: number;
  endedAt?: number | null;
  score?: number | null;
  max?: number | null;
  items: StudyItem[];
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown, max = 200) => (typeof v === "string" && v ? v.slice(0, max) : null);
const MIN_TS = Date.UTC(2024, 0, 1);

export function sanitizeStudyEntry(raw: unknown, now = Date.now()): StudyEntry | null {
  if (!isObj(raw)) return null;
  const id = str(raw.id, 200);
  const kind = STUDY_KINDS.find((k) => k === raw.kind);
  const status = STUDY_STATUSES.find((s) => s === raw.status);
  const startedAt = num(raw.startedAt);
  if (!id || !kind || !status || startedAt == null || startedAt < MIN_TS || startedAt > now + 86_400_000) return null;
  let endedAt = num(raw.endedAt);
  if (endedAt != null && (endedAt < startedAt || endedAt > now + 86_400_000)) endedAt = null;
  const items: StudyItem[] = [];
  if (Array.isArray(raw.items))
    for (const it of raw.items.slice(0, 400)) {
      if (!Array.isArray(it)) continue;
      const iid = str(it[0], 300), got = num(it[1]), of = num(it[2]);
      if (!iid || got == null || of == null || of < 0 || of > 1000) continue;
      items.push([iid, Math.max(0, Math.min(got, of)), of]);
    }
  return {
    id,
    kind,
    mode: str(raw.mode, 40),
    subjectId: str(raw.subjectId, 60),
    ref: str(raw.ref, 200),
    title: str(raw.title, 200),
    status,
    endedBy: str(raw.endedBy, 20),
    startedAt,
    endedAt,
    score: num(raw.score),
    max: num(raw.max),
    items,
  };
}

export function sanitizeStudyBatch(raw: unknown): StudyEntry[] {
  const list = Array.isArray(raw) ? raw : isObj(raw) && Array.isArray(raw.entries) ? raw.entries : [];
  return list.slice(0, 50).flatMap((e) => {
    const s = sanitizeStudyEntry(e);
    return s ? [s] : [];
  });
}
