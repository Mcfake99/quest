import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { QuizSession } from "@/components/game/QuizSession";
import { todayKey } from "@/lib/game/date";
import { pickQuestions, questionById, reviewIds } from "@/lib/game/questions";
import { useGameStore } from "@/lib/game/store";
import { isSubjectId, SUBJECTS, type PlayKind } from "@/lib/game/types";

type Search = {
  kind: PlayKind;
  quest: string;
  subject: string;
};

const KINDS: PlayKind[] = ["mix", "spotlight", "sprint", "target", "subject", "review", "figures"];

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const kindRaw = String(search.kind ?? "mix");
    const kind: PlayKind = KINDS.includes(kindRaw as PlayKind) ? (kindRaw as PlayKind) : "mix";
    return {
      kind,
      quest: String(search.quest ?? ""),
      subject: String(search.subject ?? ""),
    };
  },
  component: Play,
});

function Play() {
  const { kind, quest, subject } = Route.useSearch();
  const answers = useGameStore((s) => s.answers);
  const boardQuest = useGameStore((s) => s.daily?.quests.find((q) => q.id === quest && q.kind === kind));
  const date = todayKey();
  const subjectId = isSubjectId(subject) ? subject : undefined;
  const subjectName = SUBJECTS.find((s) => s.id === subjectId)?.name;
  const preferIds = kind === "review" ? reviewIds(answers) : undefined;

  let title = "Daily mix";
  let timed = false;
  let seconds = 0;
  let count = 18;
  const questId = quest || null;

  if (boardQuest) {
    title = boardQuest.title;
    timed = boardQuest.timed;
    seconds = boardQuest.seconds;
    count = boardQuest.count;
  } else if (kind === "sprint") {
    title = subjectName ? `${subjectName} sprint` : "Speed sprint";
    timed = true;
    seconds = 45;
    count = 12;
  } else if (kind === "spotlight") {
    title = subjectName ? `${subjectName} spotlight` : "Spotlight";
    count = 10;
  } else if (kind === "target") {
    title = subjectName ? `${subjectName} recovery` : "Recovery";
    count = 10;
  } else if (kind === "subject") {
    title = subjectName ?? "Subject hall";
    count = 8;
  } else if (kind === "review") {
    title = "Review pile";
    count = Math.min(8, preferIds?.length || 8);
  } else if (kind === "figures") {
    title = subjectName ? `${subjectName} picture paper` : "Picture paper";
    count = 8;
  }

  const questions = useMemo(() => {
    if (kind === "review") {
      const ids = preferIds ?? [];
      const picked = ids
        .map((id) => questionById(id))
        .filter((q): q is NonNullable<typeof q> => Boolean(q))
        .slice(0, count);
      if (picked.length > 0) return picked;
    }
    return pickQuestions({
      count,
      seed: `${date}-${kind}-${subject}-${quest}`,
      subjectId,
      preferIds,
      withFigure: kind === "figures",
    });
    // Seeded once per session params — do not rebuild on answer writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, quest, subject, date, count, subjectId]);

  return (
    <QuizSession
      config={{
        title,
        questions,
        timed,
        seconds,
        questId,
        kind,
      }}
    />
  );
}
