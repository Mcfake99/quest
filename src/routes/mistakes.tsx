import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RealPartInput, RealPartReview } from "@/components/game/RealPartView";
import { Button } from "@/components/ui/button";
import { autoMark, type RealAnswer } from "@/lib/game/exam/real/mark";
import { realPart } from "@/lib/game/exam/real/lookup";
import { usePapersStore } from "@/lib/game/papers-store";

export const Route = createFileRoute("/mistakes")({
  component: Mistakes,
});

function Mistakes() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const mistakes = usePapersStore((s) => s.mistakes);
  const logResult = usePapersStore((s) => s.logResult);
  const clearMistake = usePapersStore((s) => s.clearMistake);
  const [open, setOpen] = useState<string | null>(null);
  const [answer, setAnswer] = useState<RealAnswer | undefined>(undefined);
  const [checked, setChecked] = useState(false);
  const [awarded, setAwarded] = useState<number | undefined>(undefined);

  const list = mounted
    ? Object.values(mistakes)
        .sort((a, b) => b.at - a.at)
        .map((m) => ({ m, found: realPart(m.partId) }))
        .filter((x) => x.found)
    : [];

  function reset(id: string | null) {
    setOpen(id);
    setAnswer(undefined);
    setChecked(false);
    setAwarded(undefined);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/papers" className="text-sm text-muted">
        ← Past papers
      </Link>
      <h1 className="mt-4 font-display text-3xl md:text-4xl">Mistakes to review</h1>
      <p className="mt-2 text-sm text-muted">
        Every part where you dropped marks in a mock or quick quiz. Score full marks to clear it.
      </p>
      {mounted && !list.length ? (
        <div className="mt-8 rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
          <p className="font-display text-xl">Nothing to review.</p>
          <Button asChild className="mt-4">
            <Link to="/papers">Sit a paper</Link>
          </Button>
        </div>
      ) : null}
      <ul className="mt-6 space-y-3">
        {list.map(({ m, found }) => {
          const { paper, part } = found!;
          const isOpen = open === part.id;
          return (
            <li key={part.id} className="rounded-xl bg-surface shadow-[var(--shadow-border)]">
              <button
                type="button"
                onClick={() => reset(isOpen ? null : part.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {paper.title} · Q{part.label}
                  </span>
                  <span className="block truncate text-xs text-muted">{part.prompt.slice(0, 90)}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted">
                  {m.got}/{m.of}
                </span>
              </button>
              {isOpen ? (
                <div className="space-y-3 px-4 pb-4">
                  {checked ? (
                    <RealPartReview paper={paper} part={part} value={answer} awarded={awarded} onAward={setAwarded} />
                  ) : (
                    <RealPartInput paper={paper} part={part} value={answer} onChange={setAnswer} />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {checked ? (
                      <Button
                        disabled={awarded === undefined}
                        onClick={() => {
                          logResult(paper.id, part.id, awarded ?? 0, part.marks + (part.spag ?? 0));
                          reset(null);
                        }}
                      >
                        Save mark
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setAwarded(autoMark(part, answer) ?? undefined);
                          setChecked(true);
                        }}
                      >
                        Check against the scheme
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => clearMistake(part.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
