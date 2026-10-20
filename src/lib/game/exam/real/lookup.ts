import { REAL_PAPERS } from "./index";
import type { RealPaper, RealPart } from "./types";

const BY_ID = new Map(REAL_PAPERS.map((p) => [p.id, p]));
const PART_INDEX = new Map<string, { paper: RealPaper; part: RealPart }>();
for (const paper of REAL_PAPERS) for (const q of paper.questions) for (const part of q.parts) PART_INDEX.set(part.id, { paper, part });

export function realPaper(id: string): RealPaper | undefined {
  return BY_ID.get(id);
}

export function realPart(id: string) {
  return PART_INDEX.get(id);
}

export function realPapersFor(subjectId: string): RealPaper[] {
  return REAL_PAPERS.filter((p) => p.subjectId === subjectId);
}

/** Topics with at least one part, for the quick quiz picker. */
export function topicsFor(subjectId: string): { topic: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const paper of realPapersFor(subjectId))
    for (const q of paper.questions) for (const p of q.parts) counts.set(p.topic, (counts.get(p.topic) ?? 0) + 1);
  return [...counts.entries()].map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count);
}

export function partsForTopic(subjectId: string, topic: string): { paper: RealPaper; part: RealPart }[] {
  return realPapersFor(subjectId).flatMap((paper) =>
    paper.questions.flatMap((q) =>
      q.parts.filter((p) => !topic || p.topic === topic).map((part) => ({ paper, part })),
    ),
  );
}
