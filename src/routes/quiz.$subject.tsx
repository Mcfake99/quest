import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RealPartInput, RealPartReview } from "@/components/game/RealPartView";
import { Button } from "@/components/ui/button";
import { autoMark, type RealAnswer } from "@/lib/game/exam/real/mark";
import { partsForTopic, topicsFor } from "@/lib/game/exam/real/lookup";
import { usePapersStore } from "@/lib/game/papers-store";
import { isSubjectId, SUBJECTS } from "@/lib/game/types";
import { cn } from "@/lib/utils";

type Search = { topic: string };

export const Route = createFileRoute("/quiz/$subject")({
  validateSearch: (search: Record<string, unknown>): Search => ({ topic: String(search.topic ?? "") }),
  component: TopicQuiz,
});

const SIZE = 6;

function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function TopicQuiz() {
  const { subject } = Route.useParams();
  const { topic } = Route.useSearch();
  const logResult = usePapersStore((s) => s.logResult);
  // Seed is fixed for the server render and shuffled once the page is on the client.
  const [seed, setSeed] = useState(1);
  useEffect(() => setSeed(Math.floor(Math.random() * 100000) + 2), []);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<RealAnswer | undefined>(undefined);
  const [checked, setChecked] = useState(false);
  const [awarded, setAwarded] = useState<number | undefined>(undefined);
  const [score, setScore] = useState({ got: 0, of: 0 });
  const topics = useMemo(() => topicsFor(subject), [subject]);
  // Short parts make the best quick-fire questions; long essays stay in the full mocks.
  const items = useMemo(
    () => shuffle(partsForTopic(subject, topic).filter(({ part }) => part.marks <= 6), seed).slice(0, SIZE),
    [subject, topic, seed],
  );

  if (!isSubjectId(subject)) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl">Unknown subject</h1>
      </div>
    );
  }
  const name = SUBJECTS.find((s) => s.id === subject)!.name;
  const current = items[index];

  function check() {
    if (!current) return;
    const mark = autoMark(current.part, answer);
    setAwarded(mark ?? undefined);
    setChecked(true);
  }

  function next() {
    if (!current || awarded === undefined) return;
    logResult(current.paper.id, current.part.id, awarded, current.part.marks);
    setScore((s) => ({ got: s.got + awarded, of: s.of + current.part.marks }));
    setIndex((i) => i + 1);
    setAnswer(undefined);
    setChecked(false);
    setAwarded(undefined);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/subjects/$id" params={{ id: subject }} className="text-sm text-muted">
        ← {name}
      </Link>
      <h1 className="mt-4 font-display text-3xl md:text-4xl">{topic || "Mixed"} quick quiz</h1>
      <p className="mt-2 text-sm text-muted">
        {SIZE} real questions from the June 2025 papers. Auto-marked where possible; otherwise mark yourself against the
        scheme. Wrong answers go to your mistakes list.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[{ topic: "", count: 0 }, ...topics].map((t) => (
          <Link
            key={t.topic || "mixed"}
            to="/quiz/$subject"
            params={{ subject }}
            search={{ topic: t.topic }}
            onClick={() => {
              setIndex(0);
              setScore({ got: 0, of: 0 });
              setChecked(false);
              setAnswer(undefined);
            }}
            className={cn(
              "inline-flex min-h-9 items-center rounded-full px-3 text-xs",
              topic === t.topic ? "bg-accent text-accent-fg" : "bg-raised text-muted shadow-[var(--shadow-border)]",
            )}
          >
            {t.topic || "Mixed"}
            {t.count ? ` · ${t.count}` : ""}
          </Link>
        ))}
      </div>

      {current ? (
        <div className="mt-6 space-y-4">
          <p className="text-xs uppercase tracking-widest text-muted">
            {index + 1} of {items.length} · {current.paper.title} · Q{current.part.label}
          </p>
          {checked ? (
            <RealPartReview
              paper={current.paper}
              part={current.part}
              value={answer}
              awarded={awarded}
              onAward={setAwarded}
            />
          ) : (
            <RealPartInput paper={current.paper} part={current.part} value={answer} onChange={setAnswer} />
          )}
          <div className="flex gap-3">
            {checked ? (
              <Button onClick={next} disabled={awarded === undefined}>
                {awarded === undefined ? "Pick your mark" : "Next"}
              </Button>
            ) : (
              <Button onClick={check}>Check against the scheme</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
          <p className="font-display text-2xl tabular-nums">
            {items.length ? `${score.got}/${score.of} marks` : "No questions for this topic yet."}
          </p>
          {items.length ? <p className="mt-1 text-sm text-muted">XP added to your hall for every mark.</p> : null}
          <div className="mt-4 flex gap-3">
            <Button
              onClick={() => {
                setSeed((s) => s + 1);
                setIndex(0);
                setScore({ got: 0, of: 0 });
              }}
            >
              Another set
            </Button>
            <Button asChild variant="secondary">
              <Link to="/mistakes">Mistakes</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
