import type { RealPaper, RealPart } from "./types";

export type RealAnswer = string | string[];

/** Parses typed numbers such as "1,512", "£630", "630 km/h" or "2.5e3". The last number in the box counts. */
export function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/,(?=\d{3}\b)/g, "").replace(/\s*[×x]\s*10\^?\s*(-?\d+)/gi, "e$1");
  const found = cleaned.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/gi);
  if (!found) return null;
  const value = Number(found[found.length - 1]);
  return Number.isFinite(value) ? value : null;
}

export function numericCorrect(raw: string, target: number): boolean {
  const value = parseNumber(raw);
  if (value === null) return false;
  const tolerance = Math.max(Math.abs(target) * 0.01, 1e-9);
  return Math.abs(value - target) <= tolerance;
}

export function mcqCorrect(selected: readonly string[], answer: readonly string[]): boolean {
  if (selected.length !== answer.length) return false;
  return answer.every((a) => selected.includes(a));
}

/** Auto mark for mcq and numeric parts; null means the student marks it against the scheme. */
export function autoMark(part: RealPart, answer: RealAnswer | undefined): number | null {
  if (part.kind === "mcq" && part.answer) {
    const picks = Array.isArray(answer) ? answer : answer ? [answer] : [];
    if (part.answer.length > 1) {
      // Select-two items earn a mark per correct pick, as on the Pearson scheme.
      const right = picks.filter((p) => part.answer!.includes(p)).length;
      const wrong = picks.length - right;
      return Math.max(0, Math.min(part.marks, right - Math.max(0, wrong - (part.answer.length - right))));
    }
    return mcqCorrect(picks, part.answer) ? part.marks : 0;
  }
  if (part.kind === "numeric" && typeof part.numeric === "number") {
    const text = typeof answer === "string" ? answer : "";
    return numericCorrect(text, part.numeric) ? part.marks : null;
  }
  return null;
}

export function partsOf(paper: RealPaper): RealPart[] {
  return paper.questions.flatMap((q) => q.parts);
}

/** Score out of the front-cover maximum. Papers with choices are capped at that maximum. */
export function paperScore(paper: RealPaper, awarded: Record<string, number>): { score: number; max: number; pct: number } {
  const raw = partsOf(paper).reduce((sum, part) => sum + Math.min(part.marks + (part.spag ?? 0), Math.max(0, awarded[part.id] ?? 0)), 0);
  const max = paper.coverMarks || paper.totalMarks;
  const score = Math.min(raw, max);
  return { score, max, pct: max ? Math.round((score / max) * 100) : 0 };
}

export function pdfPage(url: string, page: number): string {
  return `${url}#page=${Math.max(1, page)}`;
}

export function hasAnswer(answer: RealAnswer | undefined): boolean {
  if (Array.isArray(answer)) return answer.length > 0;
  return Boolean(answer && answer.trim());
}
