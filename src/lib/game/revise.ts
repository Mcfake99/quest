import { mulberry32, seedFromString } from "./date";
import { ALL_QUESTIONS } from "./questions";
import type { CardProgress, Question, RevisionState, SubjectId } from "./types";

/** Thirty minutes of questions, then a five-minute Pomodoro break. */
export const FOCUS_MS = 30 * 60 * 1000;
export const BREAK_MS = 5 * 60 * 1000;

/** Leitner boxes. A miss returns to box 1 (tomorrow). A hit moves up. */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30] as const;

export type FeynmanPrompt = {
  id: string;
  subject: SubjectId;
  title: string;
  prompt: string;
  keywords: string[];
  model: string;
};

export type MindMap = {
  id: string;
  title: string;
  nodes: [string, string, string];
  left: string;
  right: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export const FEYNMAN: FeynmanPrompt[] = [
  {
    id: "f-ram",
    subject: "computer-science",
    title: "RAM",
    prompt: "Explain RAM to a Year 7 who has never opened a PC. What is it for, and what happens when the power goes off?",
    keywords: ["memory", "running", "program", "volatile", "power", "temporary", "lost", "fast"],
    model: "RAM is the computer’s short-term memory. Programs that are open live there so the CPU can reach them quickly. It is volatile: switch the power off and that memory is wiped. Files you want to keep go on the SSD or hard disk.",
  },
  {
    id: "f-https",
    subject: "computer-science",
    title: "HTTPS",
    prompt: "Explain why a site uses HTTPS, as if you were warning a friend on public Wi-Fi.",
    keywords: ["encrypt", "lock", "secure", "password", "private", "spy", "tls", "https"],
    model: "HTTPS encrypts the traffic between the browser and the website. On café Wi-Fi, someone else on the network cannot easily read your password or the pages. The padlock means that encryption is on.",
  },
  {
    id: "f-enzyme",
    subject: "biology",
    title: "Enzymes",
    prompt: "Explain what an enzyme does, in simple words. What happens if you heat it too much?",
    keywords: ["speed", "reaction", "catalyst", "shape", "denature", "active site", "lock", "specific"],
    model: "An enzyme speeds up a reaction without being used up. Its shape fits one job, like a lock. Too much heat changes that shape, so it stops working. That is denaturing.",
  },
  {
    id: "f-margin",
    subject: "business",
    title: "Profit margin",
    prompt: "Explain the difference between revenue and profit as if you were talking to someone who has never run a stall.",
    keywords: ["revenue", "sales", "cost", "profit", "left", "expenses", "money in"],
    model: "Revenue is all the money customers pay you. Profit is what is left after you pay for stock, wages and the other costs. A busy stall can have high revenue and still make little profit if costs are high.",
  },
  {
    id: "f-mean",
    subject: "maths",
    title: "Mean",
    prompt: "Explain the mean of a list of numbers, and why one very high number can mislead you.",
    keywords: ["add", "divide", "average", "total", "how many", "outlier", "typical"],
    model: "Add the numbers, then divide by how many there are. That is the mean. One huge score pulls the mean up, so it may not describe a typical value. The median is sometimes fairer.",
  },
  {
    id: "f-current",
    subject: "physics",
    title: "Current",
    prompt: "Explain electric current as if you were teaching a younger student. What actually moves?",
    keywords: ["charge", "electron", "amp", "flow", "circuit", "rate"],
    model: "Current is a flow of charge around a circuit, carried by electrons in a metal wire. It is measured in amps. No complete loop, no current.",
  },
];

export const MAPS: MindMap[] = [
  {
    id: "m-memory",
    title: "Where data lives",
    nodes: ["CPU", "RAM", "SSD"],
    left: "fetches the next instruction",
    right: "keeps the file when power is off",
    prompt: "Which link is right?",
    options: [
      "The CPU fetches what it needs from RAM. The SSD keeps files after shutdown.",
      "The SSD is wiped when you shut down. RAM keeps files for years.",
      "The CPU stores every photo. RAM is only the power cable.",
      "RAM and the SSD are the same chip.",
    ],
    answer: "The CPU fetches what it needs from RAM. The SSD keeps files after shutdown.",
    explanation: "Open programs sit in RAM so the CPU can reach them quickly. RAM forgets when the power is off. The SSD is storage, so the file is still there tomorrow.",
  },
  {
    id: "m-net",
    title: "Opening a website",
    nodes: ["Browser", "DNS", "Web server"],
    left: "asks for the IP address",
    right: "sends the page",
    prompt: "Which journey is right?",
    options: [
      "The browser asks DNS for the IP, then the web server sends the page.",
      "DNS stores the photos. The server only remembers your password.",
      "The web server asks the browser for an IP address.",
      "DNS replaces the need for a router and a screen.",
    ],
    answer: "The browser asks DNS for the IP, then the web server sends the page.",
    explanation: "A name like a school website is not an address the network can route. DNS turns it into an IP. The browser then requests the page from that server.",
  },
  {
    id: "m-profit",
    title: "A stall’s money",
    nodes: ["Revenue", "Costs", "Profit"],
    left: "minus",
    right: "what is left",
    prompt: "Which statement matches the map?",
    options: [
      "Profit is revenue minus costs.",
      "Profit is revenue plus costs.",
      "Costs are what customers pay you.",
      "Revenue is always the same as profit.",
    ],
    answer: "Profit is revenue minus costs.",
    explanation: "Revenue is money in. Take away stock, wages and the other costs. What remains is profit. If costs are bigger than revenue, the stall makes a loss.",
  },
  {
    id: "m-force",
    title: "A falling object",
    nodes: ["Weight", "Air resistance", "Resultant"],
    left: "down",
    right: "up, so they subtract",
    prompt: "The object is still speeding up downwards. Which is true?",
    options: [
      "Weight down is bigger than air resistance up, so the resultant is down.",
      "Air resistance is bigger, so it accelerates upwards.",
      "The forces are equal, so it accelerates downwards.",
      "Weight and air resistance are the same force.",
    ],
    answer: "Weight down is bigger than air resistance up, so the resultant is down.",
    explanation: "Resultant force is what is left after opposite forces cancel. If it is still accelerating down, weight is the larger force.",
  },
];

export function advanceCard(prev: CardProgress | undefined, correct: boolean, today: string): CardProgress {
  if (!correct) return { box: 1, due: addDays(today, 1) };
  const box = Math.min(5, (prev?.box ?? 1) + 1) as CardProgress["box"];
  return { box, due: addDays(today, BOX_DAYS[box]) };
}

export function isDue(card: CardProgress | undefined, today: string): boolean {
  return Boolean(card && card.due <= today);
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y || 1970, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const RUN_POOL = ALL_QUESTIONS.filter((q) => q.type === "mcq" || q.type === "tf");

export function pickRunQuestion(reviews: Record<string, CardProgress>, used: readonly string[], today: string, seed: string): Question | null {
  const unused = RUN_POOL.filter((q) => !used.includes(q.id));
  const due = unused.filter((q) => isDue(reviews[q.id], today));
  const fresh = unused.filter((q) => !reviews[q.id]);
  const pool = due.length > 0 ? due : fresh.length > 0 ? fresh : unused;
  if (pool.length === 0) return null;
  const rng = mulberry32(seedFromString(`${seed}:${used.length}:${today}`));
  const index = Math.floor(rng() * pool.length);
  return pool[index] ?? null;
}

export function feynmanFor(seed: string, doneIds: readonly string[]): FeynmanPrompt {
  const open = FEYNMAN.filter((item) => !doneIds.includes(`feynman:${item.id}`));
  const pool = open.length > 0 ? open : FEYNMAN;
  const rng = mulberry32(seedFromString(`feynman:${seed}`));
  return pool[Math.floor(rng() * pool.length)] ?? FEYNMAN[0]!;
}

export function mapFor(seed: string, doneIds: readonly string[]): MindMap {
  const open = MAPS.filter((item) => !doneIds.includes(`map:${item.id}`));
  const pool = open.length > 0 ? open : MAPS;
  const rng = mulberry32(seedFromString(`map:${seed}`));
  return pool[Math.floor(rng() * pool.length)] ?? MAPS[0]!;
}

export function gradeFeynman(text: string, prompt: FeynmanPrompt): { ok: boolean; hits: string[] } {
  const hay = text.toLowerCase();
  const hits = prompt.keywords.filter((word) => hay.includes(word.toLowerCase()));
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return { ok: hits.length >= 2 || (hits.length >= 1 && words >= 18), hits };
}

export function runMode(answered: number, feynmanDone: boolean, mapDone: boolean): "feynman" | "map" | "card" | "recall" {
  if (!feynmanDone && answered > 0 && answered % 7 === 6) return "feynman";
  if (!mapDone && answered > 0 && answered % 5 === 4) return "map";
  if (answered % 4 === 3) return "card";
  return "recall";
}

export function emptyRevision(date: string, now: number): RevisionState {
  return {
    date,
    phase: "focus",
    focusEndsAt: now + FOCUS_MS,
    breakEndsAt: null,
    answered: 0,
    correct: 0,
    xp: 0,
    usedIds: [],
    feynmanDone: false,
    mapDone: false,
  };
}

export function reconcileRevision(rev: RevisionState, now: number): RevisionState {
  if (rev.phase === "focus" && rev.focusEndsAt && now >= rev.focusEndsAt) {
    const breakEndsAt = rev.focusEndsAt + BREAK_MS;
    if (now >= breakEndsAt) return { ...rev, phase: "done", breakEndsAt };
    return { ...rev, phase: "break", breakEndsAt };
  }
  if (rev.phase === "break" && rev.breakEndsAt && now >= rev.breakEndsAt) {
    return { ...rev, phase: "done" };
  }
  return rev;
}

export function freshDay(rev: RevisionState | null, today: string, now: number): RevisionState | null {
  if (!rev || rev.date !== today) return null;
  return reconcileRevision(rev, now);
}

export function duePhrase(box: CardProgress["box"]): string {
  if (box <= 1) return "tomorrow";
  if (box === 2) return "in 3 days";
  if (box === 3) return "in a week";
  if (box === 4) return "in 2 weeks";
  return "in a month";
}

export function dueTomorrow(reviews: Record<string, CardProgress>, today: string): number {
  const tomorrow = addDays(today, 1);
  return Object.values(reviews).filter((card) => card.due === tomorrow).length;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
