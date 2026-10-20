import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PdfLinks } from "@/components/game/RealPartView";
import { Button } from "@/components/ui/button";
import { REAL_PAPERS } from "@/lib/game/exam/real";
import { cardsFor } from "@/lib/game/flashcards";
import { usePapersStore } from "@/lib/game/papers-store";
import { SUBJECTS } from "@/lib/game/types";

export const Route = createFileRoute("/papers")({
  component: PapersHub,
});

function PapersHub() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const attempts = usePapersStore((s) => s.attempts);
  const mistakes = usePapersStore((s) => s.mistakes);
  const subjects = SUBJECTS.filter((s) => REAL_PAPERS.some((p) => p.subjectId === s.id));
  const mistakeCount = mounted ? Object.keys(mistakes).length : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-widest text-muted">June 2025 · official papers</p>
      <h1 className="mt-2 font-display text-3xl md:text-4xl">Past papers</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Sit the real papers against the clock, then mark them with the official schemes. Flashcards and quick quizzes are
        built from the same papers.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link to="/mistakes">Mistakes to review{mistakeCount ? ` · ${mistakeCount}` : ""}</Link>
        </Button>
      </div>

      {subjects.map((subject) => (
        <section key={subject.id} className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl">{subject.name}</h2>
            <div className="flex gap-3 text-sm">
              <Link to="/flashcards/$subject" params={{ subject: subject.id }} className="text-muted hover:text-fg">
                Flashcards ({cardsFor(subject.id).length})
              </Link>
              <Link to="/quiz/$subject" params={{ subject: subject.id }} search={{ topic: "" }} className="text-muted hover:text-fg">
                Topic quiz
              </Link>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {REAL_PAPERS.filter((p) => p.subjectId === subject.id).map((paper) => {
              const tries = mounted ? (attempts[paper.id] ?? []) : [];
              const best = tries.length ? Math.max(...tries.map((a) => a.pct)) : null;
              return (
                <li key={paper.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm">{paper.title}</p>
                    <p className="text-xs text-muted">
                      {paper.board} {paper.spec} · {paper.minutes} min · {paper.coverMarks} marks
                      {best !== null ? ` · best ${best}%` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link to="/mock/$paperId" params={{ paperId: paper.id }}>
                        Sit mock
                      </Link>
                    </Button>
                    <PdfLinks qp={paper.qp} ms={paper.ms} ins={paper.insert} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
