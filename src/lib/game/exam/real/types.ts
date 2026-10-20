import type { SubjectId } from "@/lib/game/types";

/** How a part is checked: auto-marked options, auto-checked number, or self-marked against the scheme. */
export type RealPartKind = "mcq" | "numeric" | "self";

export type RealPart = {
  /** `<paper-id>:<label>` — stable across extractions. */
  id: string;
  /** Question label as printed, e.g. 01.2 or 3(b)(ii). */
  label: string;
  marks: number;
  /** Extra SPaG / AO4 marks shown on the paper. */
  spag?: number;
  /** Context printed before this part (case study, extract, figure caption). */
  lead?: string;
  prompt: string;
  /** PDF page (1-based) where the part starts. */
  page: number;
  kind: RealPartKind;
  options?: string[];
  /** Correct option(s) for mcq parts. */
  answer?: string[];
  numeric?: number;
  /** Mark scheme text for this part, as extracted from the official MS. */
  scheme: string;
  topic: string;
  /** The part relies on a figure, table, source or diagram — open the PDF page. */
  seePaper?: boolean;
};

export type RealQuestion = { number: number; marks: number; parts: RealPart[] };

export type RealPaper = {
  id: string;
  subjectId: SubjectId | string;
  board: string;
  spec: string;
  series: string;
  title: string;
  minutes: number;
  /** Sum of every printed question (higher than coverMarks when the paper has choices). */
  totalMarks: number;
  /** Maximum mark from the front cover. */
  coverMarks: number;
  /** Candidates answer a selection of questions (Either/Or, one text, one task). */
  choice?: boolean;
  qp: string;
  ms: string | null;
  insert: string | null;
  questions: RealQuestion[];
};
