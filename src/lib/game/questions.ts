import { mulberry32, seedFromString, shuffle } from "./date";
import { CS_LAB_QUESTIONS } from "./questions-cs-lab";
import { CORE_QUESTIONS } from "./questions-core";
import { HISTORY_FOCUS } from "./questions-history";
import { HUMAN_QUESTIONS } from "./questions-human";
import { PAPER_QUESTIONS } from "./questions-papers";
import { PICTURED_QUESTIONS } from "./questions-pictured";
import { SCIENCE_QUESTIONS } from "./questions-science";
import type { Question, SubjectId } from "./types";
import { SUBJECTS } from "./types";

export const ALL_QUESTIONS: Question[] = [
  ...CORE_QUESTIONS,
  ...HUMAN_QUESTIONS,
  ...HISTORY_FOCUS,
  ...SCIENCE_QUESTIONS,
  ...PICTURED_QUESTIONS,
  ...PAPER_QUESTIONS,
  ...CS_LAB_QUESTIONS,
];

export const QUESTIONS_BY_SUBJECT: Record<SubjectId, Question[]> = SUBJECTS.reduce(
  (acc, subject) => {
    acc[subject.id] = ALL_QUESTIONS.filter((q) => q.subject === subject.id);
    return acc;
  },
  {} as Record<SubjectId, Question[]>,
);

export function questionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

/**
 * Deterministically reorder an MCQ's options for one attempt, so the correct
 * answer's position (and the bank's authoring order) gives nothing away.
 * Seeded by attempt seed + question id, so SSR and hydration agree.
 */
export function withShuffledOptions(q: Question, seed: string): Question {
  if (q.type !== "mcq" || !q.options || q.options.length < 3) return q;
  const rng = mulberry32(seedFromString(`opts:${seed}:${q.id}`));
  return { ...q, options: shuffle(q.options, rng) };
}

export function pickQuestions(opts: {
  count: number;
  seed: string;
  subjectId?: SubjectId;
  minDifficulty?: 1 | 2 | 3;
  preferIds?: string[];
  excludeIds?: string[];
  withFigure?: boolean;
}): Question[] {
  const rng = mulberry32(seedFromString(opts.seed));
  let pool = ALL_QUESTIONS.filter((q) => {
    if (opts.subjectId && q.subject !== opts.subjectId) return false;
    if (opts.minDifficulty && q.difficulty < opts.minDifficulty) return false;
    if (opts.excludeIds?.includes(q.id)) return false;
    if (opts.withFigure && !q.figure) return false;
    return true;
  });
  if (pool.length === 0 && opts.withFigure) {
    pool = ALL_QUESTIONS.filter((q) => {
      if (opts.subjectId && q.subject !== opts.subjectId) return false;
      return Boolean(q.figure);
    });
  }
  if (pool.length === 0) pool = [...ALL_QUESTIONS];

  const prefer = new Set(opts.preferIds ?? []);
  const unseen = shuffle(
    pool.filter((q) => prefer.has(q.id)),
    rng,
  );
  const rest = shuffle(
    pool.filter((q) => !prefer.has(q.id)),
    rng,
  );
  const ordered = unseen.length ? [...unseen, ...rest] : rest;

  const picked: Question[] = [];
  const used = new Set<string>();
  for (const q of ordered) {
    if (picked.length >= opts.count) break;
    if (used.has(q.id)) continue;
    used.add(q.id);
    picked.push(q);
  }
  while (picked.length < opts.count) {
    const q = pool[Math.floor(rng() * pool.length)];
    if (q) picked.push(q);
    else break;
  }
  return picked.slice(0, opts.count).map((q) => withShuffledOptions(q, opts.seed));
}

export function weakestSubject(
  answers: Record<string, { c: number; w: number }> | null | undefined,
): SubjectId {
  let worst: SubjectId = "maths";
  let worstRate = 2;
  const recs = answers ?? {};
  for (const subject of SUBJECTS) {
    const qs = QUESTIONS_BY_SUBJECT[subject.id] ?? [];
    let c = 0;
    let n = 0;
    for (const q of qs) {
      const rec = recs[q.id];
      if (!rec) continue;
      c += rec.c;
      n += rec.c + rec.w;
    }
    if (n < 3) {
      return subject.id;
    }
    const rate = c / n;
    if (rate < worstRate) {
      worstRate = rate;
      worst = subject.id;
    }
  }
  return worst;
}

export function subjectMastery(
  subjectId: SubjectId,
  answers: Record<string, { c: number; w: number }> | null | undefined,
): { seen: number; mastered: number; total: number; ratio: number } {
  const qs = QUESTIONS_BY_SUBJECT[subjectId] ?? [];
  const recs = answers ?? {};
  const total = qs.length;
  let seen = 0;
  let mastered = 0;
  for (const q of qs) {
    const rec = recs[q.id];
    if (!rec) continue;
    seen += 1;
    if (rec.c > rec.w) mastered += 1;
  }
  return { seen, mastered, total, ratio: total ? mastered / total : 0 };
}

export function reviewIds(answers: Record<string, { c: number; w: number }> | null | undefined): string[] {
  if (!answers || typeof answers !== "object") return [];
  return Object.entries(answers)
    .filter(([, rec]) => rec && rec.w > rec.c)
    .map(([id]) => id);
}
