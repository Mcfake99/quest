import { seedFromString } from "./date";
import { weakestSubject } from "./questions";
import { SUBJECTS, type DailyBoard, type DailyQuest, type SaveState, type SubjectId } from "./types";

function spotlightSubject(date: string): SubjectId {
  const idx = seedFromString(`spot-${date}`) % SUBJECTS.length;
  return SUBJECTS[idx]!.id;
}

export function buildDailyQuests(date: string, save: SaveState): DailyQuest[] {
  const spot = spotlightSubject(date);
  const target = weakestSubject(save.answers);
  const spotName = SUBJECTS.find((s) => s.id === spot)?.name ?? "Spotlight";
  const targetName = SUBJECTS.find((s) => s.id === target)?.name ?? "Recovery";

  return [
    {
      id: "mix",
      title: "Daily mix",
      blurb: "Eighteen questions from the whole hall. About 18 minutes.",
      kind: "mix",
      count: 18,
      timed: false,
      seconds: 0,
      completed: false,
      xpEarned: 0,
      correct: 0,
    },
    {
      id: "spotlight",
      title: `${spotName} spotlight`,
      blurb: `Ten ${spotName} questions in today’s focus hall. About 10 minutes.`,
      kind: "spotlight",
      subjectId: spot,
      count: 10,
      timed: false,
      seconds: 0,
      completed: false,
      xpEarned: 0,
      correct: 0,
    },
    {
      id: "sprint",
      title: "Speed sprint",
      blurb: "Twelve questions, 45 seconds each. About 10 minutes with the timer.",
      kind: "sprint",
      count: 12,
      timed: true,
      seconds: 45,
      completed: false,
      xpEarned: 0,
      correct: 0,
    },
    {
      id: "target",
      title: `${targetName} recovery`,
      blurb: `Ten questions aimed at a weaker hall. About 10 minutes.`,
      kind: "target",
      subjectId: target,
      count: 10,
      timed: false,
      seconds: 0,
      completed: false,
      xpEarned: 0,
      correct: 0,
    },
  ];
}

export function mergeDaily(date: string, save: SaveState): DailyBoard {
  const fresh = buildDailyQuests(date, save);
  if (!save.daily || save.daily.date !== date) {
    return { date, quests: fresh, claimed: false };
  }
  const prevQuests = Array.isArray(save.daily.quests) ? save.daily.quests : [];
  const prevById = new Map(prevQuests.map((q) => [q.id, q]));
  const quests = fresh.map((q) => {
    const prev = prevById.get(q.id);
    if (!prev) return q;
    return {
      ...q,
      completed: prev.completed,
      xpEarned: prev.xpEarned,
      correct: prev.correct,
    };
  });
  return { date, quests, claimed: Boolean(save.daily.claimed) };
}
