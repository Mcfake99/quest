export type SchemePoint = {
  id: string;
  label: string;
  patterns: string[];
  /** Used to see whether a long answer covers both sides or several groups. */
  group?: string;
};

export type BarSeries = {
  title: string;
  xLabel: string;
  yLabel: string;
  yMax: number;
  bars: { label: string; value: number }[];
};

export type GridTable = {
  columns: string[];
  rows: { label: string; cells: string[]; strong?: boolean }[];
};

type PartBase = {
  id: string;
  prompt: string;
  marks: number;
  /** Extra case material shown immediately before this part. */
  lead?: string;
  charts?: BarSeries[];
  table?: GridTable;
  model: string;
};

export type TickPart = PartBase & {
  kind: "tick";
  choose: number;
  options: { id: string; text: string; correct: boolean }[];
};

export type MatchPart = PartBase & {
  kind: "match";
  bank: { id: string; text: string }[];
  items: { id: string; text: string; answerId: string }[];
};

export type LinesPart = PartBase & {
  kind: "lines";
  lines: number;
  accept: SchemePoint[];
  rejectNote?: { patterns: string[]; note: string };
};

export type NumberBlank = {
  id: string;
  label: string;
  marks: number;
  /** Accepted values. The last number in the box is the one that is marked. */
  answers: number[];
  tolerance: number;
  methodMarks?: number;
  methodPatterns?: string[];
  /** Equivalent written forms, such as 2/3 or 6x10^-3. */
  forms?: string[];
  /** Every form in one set must appear. Order does not matter. */
  formSets?: string[][];
  /** Forms may sit inside a longer line of working. */
  looseForms?: boolean;
  /** Look for the figure in the working as well as the answer box. */
  figureInWorking?: boolean;
  /** Last two numbers in the box are this coordinate or vector. */
  coords?: { x: number; y: number };
  /** Any equivalent fraction of this value. */
  fraction?: { n: number; d: number };
  /** Standard form a × 10^k. 6.0 × 10^-3 counts as 6 × 10^-3. */
  standard?: { a: number; k: number };
  /** Full marks for a rounded box when `seen` is in the working. */
  seenFull?: { box: number[]; seen: string }[];
  /** Partial credit when at least `count` of these forms appear. */
  countForms?: { count: number; marks: number; forms: string[] }[];
  /** Used when the figure is right but the working does not earn full marks. */
  bareMarks?: number;
  /** A correct figure adds one accuracy mark only after this many method marks. */
  gradedAnswer?: boolean;
  accuracyFrom?: number;
  /** Full marks need the figure and one pattern from every group. */
  workingGroups?: string[][];
  /** One of these must appear in the working before a correct figure scores full marks. */
  workingAny?: string[];
  /** Special-case responses worth fewer than full marks. */
  alts?: { forms: string[]; marks: number }[];
  /** Method credit when the final answer is wrong. The best tier is used. */
  methodTiers?: { marks: number; patterns: string[] }[];
  /** If the absolute value is right but the sign is wrong, explain that. */
  signMatters?: boolean;
  signNote?: string;
};

export type MarkBundle = {
  ids: string[];
  /** Marks when every id is correct. */
  marks: number;
  /** Marks when at least one id is correct, but not all. */
  partial?: number;
  /** Follow-through: each result equals total − subtract. */
  ftDifference?: { total: string; subtract: string; result: string }[];
  /** Follow-through: doubled is twice source, and rest is 1 − doubled, if source < 1/2. */
  ftDouble?: { source: string; doubled: string; rest: string };
};

export type NumberPart = PartBase & {
  kind: "number";
  working: boolean;
  blanks: NumberBlank[];
  /** When set, these groups carry the marks. Blank marks should be 0. */
  bundles?: MarkBundle[];
};

export type WrittenCommand =
  | "outline"
  | "explain"
  | "describe"
  | "suggest"
  | "analyse"
  | "consider"
  | "evaluate"
  | "discuss"
  | "assess"
  | "advise";

export type WrittenPart = PartBase & {
  kind: "written";
  command: WrittenCommand;
  points: SchemePoint[];
  figureHints?: string[];
  /** Each idea is 1 mark, up to the total. A long sentence does not upgrade a single idea. */
  exactIdeas?: boolean;
  /** Best set whose patterns all appear. Used for describe-fully answers. */
  phraseSets?: { marks: number; all: string[] }[];
};

export type ExamPart = TickPart | MatchPart | LinesPart | NumberPart | WrittenPart;

export type ExamQuestion = {
  number: number;
  marks: number;
  /** Suggested minutes for this question, including time to read the case. */
  minutes?: number;
  stimulus?: string[];
  parts: ExamPart[];
};

export type ExamPaper = {
  id: string;
  subject: string;
  /** Hall route id, for the results link. */
  subjectId?: string;
  unit: string;
  minutes: number;
  totalMarks: number;
  calculator: boolean;
  blurb: string;
  rules: string[];
  questions: ExamQuestion[];
};

export type TickAnswer = { kind: "tick"; selected: string[] };
export type MatchAnswer = { kind: "match"; picks: Record<string, string> };
export type LinesAnswer = { kind: "lines"; lines: string[] };
export type NumberAnswer = { kind: "number"; values: Record<string, string>; working: string };
export type WrittenAnswer = { kind: "written"; text: string };
export type PartAnswer = TickAnswer | MatchAnswer | LinesAnswer | NumberAnswer | WrittenAnswer;

export type PartResult = {
  id: string;
  awarded: number;
  max: number;
  credited: string[];
  notes: string[];
  model: string;
};

export type QuestionResult = {
  number: number;
  awarded: number;
  max: number;
  parts: PartResult[];
};

export type PaperResult = {
  awarded: number;
  max: number;
  questions: QuestionResult[];
};

export type Sitting = {
  startedAt: number;
  index: number;
  answers: Record<string, PartAnswer>;
  result: PaperResult | null;
  /** Marks/XP actually added to the hall for this sitting (0 if it did not beat the best). */
  xpAwarded: number | null;
  endedBy: "time" | "candidate" | null;
};

export type PaperRecord = {
  best: number;
  sitting: Sitting | null;
};
