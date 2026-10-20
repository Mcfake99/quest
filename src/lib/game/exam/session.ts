import type { PaperRecord, Sitting } from "./types";

const KEY = "questforge-exam-v1";

type Disk = {
  version: 1;
  papers: Record<string, PaperRecord>;
};

function empty(): Disk {
  return { version: 1, papers: {} };
}

function readDisk(): Disk {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Disk;
    if (!parsed || parsed.version !== 1 || !parsed.papers) return empty();
    return parsed;
  } catch {
    return empty();
  }
}

function writeDisk(disk: Disk) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(disk));
  } catch {
    /* A full storage quota should not wipe the sitting from memory. */
  }
}

export function loadPaperRecord(paperId: string): PaperRecord {
  const disk = readDisk();
  const record = disk.papers[paperId];
  if (!record || typeof record.best !== "number") return { best: 0, sitting: null };
  return { best: record.best, sitting: record.sitting ?? null };
}

export function savePaperRecord(paperId: string, record: PaperRecord) {
  const disk = readDisk();
  disk.papers[paperId] = record;
  writeDisk(disk);
}

export function freshSitting(): Sitting {
  return { startedAt: Date.now(), index: 0, answers: {}, result: null, xpAwarded: null, endedBy: null };
}
