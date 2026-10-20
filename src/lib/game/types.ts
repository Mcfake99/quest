export const SUBJECTS = [
  { id: "maths", name: "Maths", short: "Ma", group: "Core" },
  { id: "computer-science", name: "Computer Science", short: "CS", group: "Core" },
  { id: "business", name: "Business", short: "Bs", group: "Core" },
  { id: "history", name: "History", short: "Hi", group: "Core" },
  { id: "spanish", name: "Spanish", short: "Sp", group: "Core" },
  { id: "english", name: "English", short: "En", group: "Core" },
  { id: "biology", name: "Biology", short: "Bi", group: "Triple science" },
  { id: "chemistry", name: "Chemistry", short: "Ch", group: "Triple science" },
  { id: "physics", name: "Physics", short: "Ph", group: "Triple science" },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"];

export type QuestionType = "mcq" | "tf" | "type";

export type Question = {
  id: string;
  subject: SubjectId;
  topic: string;
  difficulty: 1 | 2 | 3;
  type: QuestionType;
  prompt: string;
  options?: readonly string[];
  answer: string;
  accept?: readonly string[];
  explanation: string;
  figure?: string;
  figureAlt?: string;
  clue?: string;
};

export type DailyQuestKind = "mix" | "spotlight" | "sprint" | "target";

export type DailyQuest = {
  id: string;
  title: string;
  blurb: string;
  kind: DailyQuestKind;
  subjectId?: SubjectId;
  count: number;
  timed: boolean;
  seconds: number;
  completed: boolean;
  xpEarned: number;
  correct: number;
};

export type DailyBoard = {
  date: string;
  quests: DailyQuest[];
  claimed: boolean;
};

export type PlayKind = DailyQuestKind | "subject" | "review" | "figures";

export type AnswerRecord = { c: number; w: number };

export type DayStats = { xp: number; correct: number; attempted: number };

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export type CardProgress = {
  box: LeitnerBox;
  due: string;
};

export type RevisionPhase = "idle" | "focus" | "break" | "done";

export type RevisionState = {
  date: string;
  phase: RevisionPhase;
  focusEndsAt: number | null;
  breakEndsAt: number | null;
  answered: number;
  correct: number;
  xp: number;
  usedIds: string[];
  feynmanDone: boolean;
  mapDone: boolean;
};

export type SaveState = {
  version: number;
  name: string;
  onboarded: boolean;
  xp: number;
  marks: number;
  streak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  freezes: number;
  xpBoostUntil: number;
  titles: string[];
  equippedTitle: string | null;
  badges: string[];
  answers: Record<string, AnswerRecord>;
  /** Leitner box and next due date for spaced repetition. */
  reviews: Record<string, CardProgress>;
  /** The daily 30-minute revision run. Null until today’s run is started. */
  revision: RevisionState | null;
  daily: DailyBoard | null;
  days: Record<string, DayStats>;
  sound: boolean;
  crates: number;
  cratesOpened: number;
  theme: string;
  themes: string[];
  apparel: string[];
  equippedApparel: string;
};

export type QuizResult = {
  questionIds: string[];
  correctIds: string[];
  comboMax: number;
  xp: number;
  marks: number;
  timedOut: number;
};

export function isSubjectId(value: string): value is SubjectId {
  return SUBJECTS.some((s) => s.id === value);
}

export function getSubject(id: SubjectId) {
  return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0]!;
}
