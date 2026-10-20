import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, Flag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PaperLinks, RealPartInput, RealPartReview } from "@/components/game/RealPartView";
import { Button } from "@/components/ui/button";
import { autoMark, hasAnswer, paperScore, partsOf } from "@/lib/game/exam/real/mark";
import type { RealPaper } from "@/lib/game/exam/real/types";
import { usePapersStore, type MockAttempt } from "@/lib/game/papers-store";
import { cn } from "@/lib/utils";

function formatLeft(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function MockSession({ paper }: { paper: RealPaper }) {
  const mounted = useMounted();
  const sitting = usePapersStore((s) => s.sittings[paper.id]);
  const attempts = usePapersStore((s) => s.attempts[paper.id]);
  const store = usePapersStore();
  const [now, setNow] = useState(() => Date.now());
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<MockAttempt | null>(null);
  const parts = useMemo(() => partsOf(paper), [paper]);
  const live = Boolean(sitting && !sitting.submittedAt);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [live]);

  function handIn(endedBy: "time" | "candidate") {
    const s = usePapersStore.getState().sittings[paper.id];
    if (!s || s.submittedAt) return;
    const auto: Record<string, number> = {};
    for (const part of parts) {
      const mark = autoMark(part, s.answers[part.id]);
      if (mark !== null) auto[part.id] = mark;
      else if (!hasAnswer(s.answers[part.id])) auto[part.id] = 0;
    }
    store.submit(paper.id, endedBy, auto);
    setConfirm(false);
  }

  useEffect(() => {
    if (live && sitting && now >= sitting.endsAt) handIn("time");
    // handIn reads the latest sitting from the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, live]);

  if (!mounted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-muted">Opening the paper…</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-xs uppercase tracking-widest text-muted">{paper.series} · saved to your ledger</p>
        <h1 className="mt-2 font-display text-4xl tabular-nums">
          {done.score}/{done.max} · {done.pct}%
        </h1>
        <p className="mt-2 text-sm text-muted">
          +{done.xp} XP. Parts you dropped marks on are in your mistakes list.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/mistakes">Review mistakes</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/subjects/$id" params={{ id: String(paper.subjectId) }}>
              Back to the hall
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => setDone(null)}>
            Sit again
          </Button>
        </div>
      </main>
    );
  }

  if (!sitting) {
    const best = attempts?.length ? Math.max(...attempts.map((a) => a.pct)) : null;
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <Link to="/papers" className="text-sm text-muted">
          ← All papers
        </Link>
        <p className="mt-6 text-xs uppercase tracking-widest text-muted">
          {paper.board} {paper.spec} · {paper.series} · real mock
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">{paper.title}</h1>
        <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <Stat label="Time" value={`${paper.minutes} min`} />
          <Stat label="Marks" value={String(paper.coverMarks)} />
          <Stat label="Questions" value={String(paper.questions.length)} />
        </dl>
        <ul className="mt-6 list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li>The actual {paper.series} paper, timed at the official {paper.minutes} minutes. The clock keeps running if you leave.</li>
          <li>Flag questions to come back to. The paper is handed in automatically when time runs out.</li>
          <li>Tick-box and number answers are marked for you. Everything else you mark yourself against the official scheme.</li>
          {paper.choice ? (
            <li>This paper has choices (Either/Or or one text). Answer only the questions you would sit; your score is out of {paper.coverMarks}.</li>
          ) : null}
          <li>Diagrams and sources are not redrawn — use the links to the original PDF page and the insert.</li>
        </ul>
        {best !== null ? <p className="mt-4 text-sm text-muted">Best so far: {best}%. Sittings: {attempts!.length}.</p> : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => store.start(paper.id, paper.minutes)}>
            Start the clock
          </Button>
          <PaperLinks paper={paper} />
        </div>
      </main>
    );
  }

  const question = paper.questions[Math.min(sitting.index, paper.questions.length - 1)] ?? paper.questions[0]!;
  const qIndex = paper.questions.indexOf(question);

  if (sitting.submittedAt) {
    const { score, max, pct } = paperScore(paper, sitting.awarded);
    const unmarked = parts.filter((p) => sitting.awarded[p.id] === undefined).length;
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-28 pt-4 md:px-6">
        <header className="sticky top-0 z-20 -mx-4 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted">
                Marking · {sitting.endedBy === "time" ? "time ran out" : "handed in"}
              </p>
              <p className="font-display text-2xl tabular-nums">
                {score}/{max} · {pct}%
              </p>
            </div>
            <Button
              onClick={() => {
                const attempt = store.finish(
                  paper.id,
                  score,
                  max,
                  parts.map((p) => ({ id: p.id, marks: p.marks + (p.spag ?? 0) })),
                );
                if (attempt) setDone(attempt);
              }}
            >
              {unmarked ? `Save (${unmarked} unmarked)` : "Save score"}
            </Button>
          </div>
          <QuestionTabs paper={paper} index={qIndex} onGo={(i) => store.go(paper.id, i)} dot={(i) =>
            paper.questions[i]!.parts.every((p) => sitting.awarded[p.id] !== undefined) ? "ok" : null
          } />
        </header>
        <article className="flex-1 space-y-4 py-6">
          <h1 className="font-display text-3xl">Question {question.number}</h1>
          {question.parts.map((part) => (
            <RealPartReview
              key={part.id}
              paper={paper}
              part={part}
              value={sitting.answers[part.id]}
              awarded={sitting.awarded[part.id]}
              onAward={(n) => store.award(paper.id, part.id, n)}
            />
          ))}
        </article>
        <Pager qIndex={qIndex} count={paper.questions.length} onGo={(i) => store.go(paper.id, i)} />
      </main>
    );
  }

  const left = sitting.endsAt - now;
  const flagged = new Set(sitting.flagged);
  const blank = parts.filter((p) => !hasAnswer(sitting.answers[p.id])).length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-28 pt-4 md:px-6">
      <header className="sticky top-0 z-20 -mx-4 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted">
              Question {question.number} of {paper.questions.length}
            </p>
            <p className="truncate text-sm text-muted">{paper.title}</p>
          </div>
          <p
            className={cn(
              "inline-flex items-center gap-1.5 font-display text-xl tabular-nums",
              left < 5 * 60_000 ? "text-danger" : left < 10 * 60_000 ? "text-warn" : "text-fg",
            )}
            aria-live="polite"
          >
            <Clock className="size-4" />
            {formatLeft(left)}
          </p>
          <Button type="button" variant="secondary" onClick={() => setConfirm(true)}>
            Hand in
          </Button>
        </div>
        <QuestionTabs
          paper={paper}
          index={qIndex}
          onGo={(i) => store.go(paper.id, i)}
          dot={(i) => {
            const ps = paper.questions[i]!.parts;
            if (ps.some((p) => flagged.has(p.id))) return "flag";
            return ps.some((p) => hasAnswer(sitting.answers[p.id])) ? "ok" : null;
          }}
        />
        <div className="mt-2">
          <PaperLinks paper={paper} />
        </div>
      </header>

      {confirm ? (
        <div className="mt-4 rounded-xl bg-raised p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm">
            Hand in now? {blank} part{blank === 1 ? "" : "s"} blank, {flagged.size} flagged.
          </p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => handIn("candidate")}>Hand in</Button>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Keep going
            </Button>
          </div>
        </div>
      ) : null}

      <article className="flex-1 space-y-4 py-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-3xl">Question {question.number}</h1>
          <p className="text-sm tabular-nums text-muted">[{question.marks}]</p>
        </div>
        {question.parts.map((part) => (
          <RealPartInput
            key={part.id}
            paper={paper}
            part={part}
            value={sitting.answers[part.id]}
            onChange={(v) => store.answer(paper.id, part.id, v)}
            flagged={flagged.has(part.id)}
            onFlag={() => store.toggleFlag(paper.id, part.id)}
          />
        ))}
      </article>
      <Pager qIndex={qIndex} count={paper.questions.length} onGo={(i) => store.go(paper.id, i)} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-3 shadow-[var(--shadow-border)]">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-xl tabular-nums">{value}</dd>
    </div>
  );
}

function QuestionTabs({
  paper,
  index,
  onGo,
  dot,
}: {
  paper: RealPaper;
  index: number;
  onGo: (i: number) => void;
  dot: (i: number) => "ok" | "flag" | null;
}) {
  return (
    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
      {paper.questions.map((item, i) => {
        const on = i === index;
        const mark = dot(i);
        return (
          <button
            key={item.number}
            type="button"
            onClick={() => onGo(i)}
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-md text-sm tabular-nums",
              on ? "bg-accent text-accent-fg" : "bg-raised text-fg shadow-[var(--shadow-border)]",
            )}
            aria-current={on ? "step" : undefined}
            aria-label={`Question ${item.number}${mark === "flag" ? ", flagged" : ""}`}
          >
            <span className="relative">
              {item.number}
              {mark === "flag" ? (
                <Flag className="absolute -right-3 -top-2 size-2.5 text-warn" aria-hidden />
              ) : mark === "ok" && !on ? (
                <span className="absolute -right-2 -top-2 size-1.5 rounded-full bg-ok" aria-hidden />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Pager({ qIndex, count, onGo }: { qIndex: number; count: number; onGo: (i: number) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="secondary" disabled={qIndex === 0} onClick={() => onGo(qIndex - 1)}>
          <ArrowLeft className="size-4" /> Previous
        </Button>
        <Button variant="secondary" disabled={qIndex >= count - 1} onClick={() => onGo(qIndex + 1)}>
          Next <ArrowRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
