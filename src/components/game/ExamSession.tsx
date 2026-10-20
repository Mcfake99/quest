import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { markPaper, practiceReading } from "@/lib/game/exam/mark";
import { freshSitting, loadPaperRecord, savePaperRecord } from "@/lib/game/exam/session";
import type {
  BarSeries,
  ExamPaper,
  ExamPart,
  GridTable,
  LinesPart,
  MatchPart,
  NumberPart,
  PaperRecord,
  PartAnswer,
  Sitting,
  TickPart,
  WrittenPart,
} from "@/lib/game/exam/types";
import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function ExamSession({ paper }: { paper: ExamPaper }) {
  const grant = useGameStore((s) => s.grant);
  const name = useGameStore((s) => s.name);
  const [record, setRecord] = useState<PaperRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const handing = useRef(false);

  useEffect(() => {
    handing.current = false;
    setRecord(loadPaperRecord(paper.id));
    setReady(true);
  }, [paper.id]);

  useEffect(() => {
    if (!ready || !record) return;
    const id = window.setTimeout(() => savePaperRecord(paper.id, record), 180);
    return () => window.clearTimeout(id);
  }, [paper.id, ready, record]);

  const sitting = record?.sitting ?? null;
  const live = Boolean(sitting && !sitting.result);
  const endsAt = sitting ? sitting.startedAt + paper.minutes * 60_000 : 0;

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [live]);

  function handIn(endedBy: "time" | "candidate") {
    if (handing.current) return;
    const current = record;
    if (!current?.sitting || current.sitting.result) return;
    handing.current = true;
    const result = markPaper(paper, current.sitting.answers ?? {});
    const delta = Math.max(0, result.awarded - current.best);
    if (delta > 0) grant(delta, delta);
    setConfirm(false);
    setRecord({
      best: Math.max(current.best, result.awarded),
      sitting: { ...current.sitting, result, xpAwarded: delta, endedBy },
    });
  }

  useEffect(() => {
    if (!live || !sitting) return;
    if (now >= endsAt) handIn("time");
    // handIn closes over the latest record via this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, live, endsAt]);

  function patch(partId: string, answer: PartAnswer) {
    setRecord((current) => {
      if (!current?.sitting || current.sitting.result) return current;
      return {
        ...current,
        sitting: {
          ...current.sitting,
          answers: { ...current.sitting.answers, [partId]: answer },
        },
      };
    });
  }

  function go(index: number) {
    setRecord((current) => {
      if (!current?.sitting || current.sitting.result) return current;
      return { ...current, sitting: { ...current.sitting, index } };
    });
  }

  if (!ready || !record) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-muted">Opening the paper…</p>
      </main>
    );
  }

  if (!sitting) {
    return (
      <Cover
        paper={paper}
        name={name}
        best={record.best}
        onBegin={() => setRecord({ best: record.best, sitting: freshSitting() })}
      />
    );
  }

  if (sitting.result) {
    return (
      <Marked
        paper={paper}
        sitting={sitting}
        best={record.best}
        onAgain={() => {
          handing.current = false;
          setRecord({ best: record.best, sitting: freshSitting() });
        }}
      />
    );
  }

  const answers = sitting.answers ?? {};
  const question = paper.questions[sitting.index] ?? paper.questions[0]!;
  const left = endsAt - now;
  const blank = countBlank(paper, answers);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-28 pt-4 md:px-6">
      <header className="sticky top-0 z-20 -mx-4 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted">
              Question {question.number} of {paper.questions.length}
            </p>
            <p className="truncate text-sm text-muted">{paper.unit}</p>
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
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {paper.questions.map((item, index) => {
            const on = index === sitting.index;
            const started = item.parts.some((part) => filled(part, answers[part.id]));
            return (
              <button
                key={item.number}
                type="button"
                onClick={() => go(index)}
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-md text-sm tabular-nums",
                  on ? "bg-accent text-accent-fg" : "bg-raised text-fg shadow-[var(--shadow-border)]",
                )}
                aria-current={on ? "step" : undefined}
              >
                <span className="relative">
                  {item.number}
                  {started && !on ? (
                    <span className="absolute -right-2 -top-2 size-1.5 rounded-full bg-ok" aria-hidden />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <article className="flex-1 py-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-3xl">Question {question.number}</h1>
          <p className="text-sm tabular-nums text-muted">[{question.marks}]</p>
        </div>
        <p className="mt-1 text-sm text-muted">
          About {question.minutes ?? Math.max(2, Math.round(question.marks * 1.2))} minutes for this question.
        </p>
        {question.stimulus?.map((paragraph) => (
          <p key={paragraph} className="mt-4 text-sm leading-6">
            {paragraph}
          </p>
        ))}
        <div className="mt-6 space-y-8">
          {question.parts.map((part, index) => (
            <section key={part.id}>
              {part.lead ? <p className="mb-4 text-sm leading-6">{part.lead}</p> : null}
              {part.charts ? (
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  {part.charts.map((series) => (
                    <Bars key={series.title} series={series} />
                  ))}
                </div>
              ) : null}
              {part.table ? (
                <div className="mb-4">
                  <Grid table={part.table} />
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm leading-6">
                  {question.parts.length > 1 ? <span className="mr-1">({letter(index)})</span> : null}
                  {part.prompt}
                </h2>
                <span className="shrink-0 text-sm tabular-nums text-muted">[{part.marks}]</span>
              </div>
              <div className="mt-3">
                <PartFields part={part} answer={answers[part.id]} onChange={(answer) => patch(part.id, answer)} />
              </div>
            </section>
          ))}
        </div>
      </article>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="secondary" disabled={sitting.index === 0} onClick={() => go(sitting.index - 1)}>
            <ArrowLeft className="size-4" />
            Previous
          </Button>
          <Link to="/subjects/$id" params={{ id: paper.subjectId ?? "business" }} className="text-sm text-muted">
            Save and leave
          </Link>
          {sitting.index < paper.questions.length - 1 ? (
            <Button type="button" onClick={() => go(sitting.index + 1)}>
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" onClick={() => setConfirm(true)}>
              Hand in
            </Button>
          )}
        </div>
      </footer>

      {confirm ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-bg/80 px-4" role="dialog" aria-modal="true" aria-labelledby="hand-in-title">
          <div className="w-full max-w-md rounded-xl bg-surface p-5 shadow-[var(--shadow-lift)]">
            <h2 id="hand-in-title" className="font-display text-2xl">
              Hand the paper in?
            </h2>
            <p className="mt-2 text-sm text-muted">
              {formatLeft(left)} left.
              {blank > 0
                ? ` ${blank} part${blank === 1 ? "" : "s"} still look empty. Empty parts score 0.`
                : " Every part has something written."}
            </p>
            <p className="mt-2 text-sm text-muted">You will not be able to change answers after this. Marking uses the practice mark scheme.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setConfirm(false)}>
                Keep writing
              </Button>
              <Button type="button" onClick={() => handIn("candidate")}>
                Hand in now
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Cover({
  paper,
  name,
  best,
  onBegin,
}: {
  paper: ExamPaper;
  name: string;
  best: number;
  onBegin: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <p className="text-xs uppercase tracking-widest text-muted">Practice paper</p>
      <h1 className="mt-2 font-display text-4xl">{paper.subject}</h1>
      <p className="mt-1 font-display text-2xl text-muted">{paper.unit}</p>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted">{paper.blurb}</p>
      {name ? <p className="mt-4 text-sm">Candidate: {name}</p> : null}
      {best > 0 ? (
        <p className="mt-1 text-sm tabular-nums text-muted">
          Best sitting so far: {best}/{paper.totalMarks}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Question</th>
              <th className="px-4 py-2 text-right font-medium">Marks</th>
            </tr>
          </thead>
          <tbody>
            {paper.questions.map((question) => (
              <tr key={question.number} className="border-b border-border last:border-0">
                <td className="px-4 py-2 tabular-nums">{question.number}</td>
                <td className="px-4 py-2 text-right tabular-nums">{question.marks}</td>
              </tr>
            ))}
            <tr>
              <td className="px-4 py-2 font-medium">Total</td>
              <td className="px-4 py-2 text-right font-medium tabular-nums">{paper.totalMarks}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul className="mt-6 space-y-2 text-sm leading-6">
        {paper.rules.map((rule) => (
          <li key={rule} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted" aria-hidden />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        {paper.calculator ? "Additional material: a calculator." : "No calculator."} Time allowed: {formatAllowed(paper.minutes)}.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={onBegin}>
          Begin the paper
        </Button>
        <Button asChild variant="secondary">
          <Link to="/subjects/$id" params={{ id: paper.subjectId ?? "business" }}>
            Back to {paper.subject}
          </Link>
        </Button>
      </div>
    </main>
  );
}

function Marked({
  paper,
  sitting,
  best,
  onAgain,
}: {
  paper: ExamPaper;
  sitting: Sitting;
  best: number;
  onAgain: () => void;
}) {
  const result = sitting.result!;
  const [openQs, setOpenQs] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(result.questions.map((question) => [question.number, question.awarded < question.max])),
  );
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <p className="text-xs uppercase tracking-widest text-muted">Marked paper</p>
      <h1 className="mt-2 font-display text-4xl tabular-nums">
        {result.awarded}
        <span className="text-muted">/{result.max}</span>
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">{practiceReading(result.awarded, result.max)}</p>
      <p className="mt-1 text-xs text-subtle">Practice reading only — not an official grade boundary.</p>
      {sitting.endedBy === "time" ? <p className="mt-3 text-sm text-warn">Time ran out. The paper was handed in as it stood.</p> : null}
      <p className="mt-3 text-sm text-muted">
        {sitting.xpAwarded && sitting.xpAwarded > 0
          ? `Added ${sitting.xpAwarded} marks and ${sitting.xpAwarded} XP to your hall.`
          : `No extra marks — this sitting did not beat your best of ${best}/${paper.totalMarks}.`}
      </p>

      <div className="mt-8 space-y-3">
        {paper.questions.map((question, index) => {
          const marked = result.questions[index];
          if (!marked) return null;
          return (
            <details
              key={question.number}
              className="rounded-xl bg-surface shadow-[var(--shadow-border)]"
              open={Boolean(openQs[question.number])}
              onToggle={(event) => {
                const next = event.currentTarget.open;
                setOpenQs((current) => (current[question.number] === next ? current : { ...current, [question.number]: next }));
              }}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                <span className="font-display text-lg">Question {question.number}</span>
                <span className={cn("tabular-nums text-sm", marked.awarded === marked.max ? "text-ok" : "text-muted")}>
                  {marked.awarded}/{marked.max}
                </span>
              </summary>
              <div className="space-y-5 border-t border-border px-4 py-4">
                {question.parts.map((part, partIndex) => {
                  const piece = marked.parts[partIndex];
                  if (!piece) return null;
                  return (
                    <div key={part.id}>
                      <p className="text-sm">
                        {question.parts.length > 1 ? `(${letter(partIndex)}) ` : null}
                        {part.prompt}
                      </p>
                      <p className="mt-2 text-sm tabular-nums">
                        {piece.awarded}/{piece.max}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{showAnswer(part, sitting.answers[part.id])}</p>
                      {piece.credited.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {piece.credited.map((line) => (
                            <li key={line} className="flex gap-2 text-ok">
                              <Check className="mt-0.5 size-4 shrink-0" />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {piece.notes.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-muted">
                          {piece.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      ) : null}
                      <p className="mt-3 text-sm leading-6">
                        <span className="text-muted">Model: </span>
                        {piece.model}
                      </p>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={onAgain}>
          Sit the paper again
        </Button>
        <Button asChild variant="secondary">
          <Link to="/subjects/$id" params={{ id: paper.subjectId ?? "business" }}>
            Back to {paper.subject}
          </Link>
        </Button>
      </div>
    </main>
  );
}

function PartFields({
  part,
  answer,
  onChange,
}: {
  part: ExamPart;
  answer: PartAnswer | undefined;
  onChange: (answer: PartAnswer) => void;
}) {
  if (part.kind === "tick") return <TickFields part={part} answer={answer} onChange={onChange} />;
  if (part.kind === "match") return <MatchFields part={part} answer={answer} onChange={onChange} />;
  if (part.kind === "lines") return <LinesFields part={part} answer={answer} onChange={onChange} />;
  if (part.kind === "number") return <NumberFields part={part} answer={answer} onChange={onChange} />;
  return <WrittenFields part={part} answer={answer} onChange={onChange} />;
}

function TickFields({
  part,
  answer,
  onChange,
}: {
  part: TickPart;
  answer: PartAnswer | undefined;
  onChange: (answer: PartAnswer) => void;
}) {
  const selected = answer?.kind === "tick" ? answer.selected : [];
  return (
    <div>
      <p className={cn("mb-2 text-xs", selected.length > part.choose ? "text-danger" : "text-muted")}>
        Tick {part.choose} boxes only.
        {selected.length > part.choose ? " Extra ticks score 0." : ` ${selected.length} of ${part.choose} selected.`}
      </p>
      <div className="grid gap-2">
        {part.options.map((option) => {
          const on = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => {
                const next = on ? selected.filter((id) => id !== option.id) : [...selected, option.id];
                onChange({ kind: "tick", selected: next });
              }}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-left text-sm",
                on ? "bg-accent text-accent-fg" : "bg-raised text-fg shadow-[var(--shadow-border)]",
              )}
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-sm border border-current" aria-hidden>
                {on ? <Check className="size-3.5" /> : null}
              </span>
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchFields({
  part,
  answer,
  onChange,
}: {
  part: MatchPart;
  answer: PartAnswer | undefined;
  onChange: (answer: PartAnswer) => void;
}) {
  const picks = answer?.kind === "match" ? answer.picks : {};
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {part.bank.map((term) => (
          <span key={term.id} className="rounded-md bg-raised px-3 py-2 text-sm shadow-[var(--shadow-border)]">
            {term.text}
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {part.items.map((item) => (
          <label key={item.id} className="block text-sm">
            <span>
              ({item.id}) {item.text}
            </span>
            <select
              className="mt-2 h-11 w-full rounded-md bg-raised px-3 text-base text-fg shadow-[var(--shadow-border)]"
              value={picks[item.id] ?? ""}
              onChange={(event) => onChange({ kind: "match", picks: { ...picks, [item.id]: event.target.value } })}
            >
              <option value="">Choose a term</option>
              {part.bank.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.text}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}

function LinesFields({
  part,
  answer,
  onChange,
}: {
  part: LinesPart;
  answer: PartAnswer | undefined;
  onChange: (answer: PartAnswer) => void;
}) {
  const stored = answer?.kind === "lines" ? answer.lines : [];
  const lines = Array.from({ length: part.lines }, (_, index) => stored[index] ?? "");
  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <label key={index} className="block text-sm">
          <span className="text-muted">{index + 1}.</span>
          <input
            value={line}
            onChange={(event) => {
              const next = [...lines];
              next[index] = event.target.value;
              onChange({ kind: "lines", lines: next });
            }}
            className="mt-1 h-11 w-full rounded-md bg-raised px-3 text-base text-fg shadow-[var(--shadow-border)] outline-none"
          />
        </label>
      ))}
    </div>
  );
}

function NumberFields({
  part,
  answer,
  onChange,
}: {
  part: NumberPart;
  answer: PartAnswer | undefined;
  onChange: (answer: PartAnswer) => void;
}) {
  const values = answer?.kind === "number" ? answer.values : {};
  const working = answer?.kind === "number" ? answer.working : "";
  return (
    <div className="space-y-3">
      {part.blanks.map((blank) => (
        <label key={blank.id} className="block text-sm">
          {blank.label}
          <input
            inputMode="text"
            value={values[blank.id] ?? ""}
            onChange={(event) =>
              onChange({ kind: "number", working, values: { ...values, [blank.id]: event.target.value } })
            }
            className="mt-1 h-11 w-full rounded-md bg-raised px-3 text-base tabular-nums text-fg shadow-[var(--shadow-border)] outline-none"
          />
        </label>
      ))}
      {part.working ? (
        <label className="block text-sm">
          <span className="text-muted">
            {part.blanks.some((blank) => blank.gradedAnswer || blank.workingGroups || blank.figureInWorking)
              ? "Working — this part needs the method, not only the final value."
              : "Working (marked only if the final figure is wrong)"}
          </span>
          <textarea
            value={working}
            onChange={(event) => onChange({ kind: "number", values, working: event.target.value })}
            className="mt-1 min-h-24 w-full rounded-md bg-raised px-3 py-2 text-base text-fg shadow-[var(--shadow-border)] outline-none"
          />
        </label>
      ) : null}
    </div>
  );
}

function WrittenFields({
  part,
  answer,
  onChange,
}: {
  part: WrittenPart;
  answer: PartAnswer | undefined;
  onChange: (answer: PartAnswer) => void;
}) {
  const text = answer?.kind === "written" ? answer.text : "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tall = part.marks >= 8 ? "min-h-64" : part.marks >= 4 ? "min-h-40" : "min-h-24";
  return (
    <label className="block">
      <textarea
        value={text}
        onChange={(event) => onChange({ kind: "written", text: event.target.value })}
        className={cn("w-full rounded-md bg-raised px-3 py-2 text-base leading-6 text-fg shadow-[var(--shadow-border)] outline-none", tall)}
      />
      <span className="mt-1 block text-xs tabular-nums text-muted">{words} words</span>
    </label>
  );
}

function Bars({ series }: { series: BarSeries }) {
  return (
    <figure className="rounded-lg bg-surface p-3 shadow-[var(--shadow-border)]">
      <figcaption className="text-sm">{series.title}</figcaption>
      <div className="mt-3 flex h-28 items-end gap-1">
        {series.bars.map((bar) => (
          <div key={bar.label} className="flex h-full min-w-0 flex-1 items-end">
            <div
              className="w-full rounded-sm bg-accent"
              style={{ height: `${Math.max(6, (bar.value / series.yMax) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {series.bars.map((bar) => (
          <span key={bar.label} className="min-w-0 flex-1 text-center text-xs leading-4 text-muted">
            <span className="block tabular-nums text-fg">{bar.value}</span>
            {bar.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

function Grid({ table }: { table: GridTable }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-surface shadow-[var(--shadow-border)]">
      <table className="w-max min-w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="sticky left-0 bg-surface px-2 py-2 font-medium">£</th>
            {table.columns.map((column) => (
              <th key={column} className="px-2 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.label} className="border-b border-border last:border-0">
              <th className={cn("sticky left-0 bg-surface px-2 py-1.5 font-medium", row.strong && "text-fg")}>{row.label}</th>
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.label}-${index}`}
                  className={cn("px-2 py-1.5 tabular-nums", cell === "?" ? "font-medium text-warn" : "text-muted", row.strong && cell !== "?" && "text-fg")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function showAnswer(part: ExamPart, answer: PartAnswer | undefined): string {
  if (!answer) return "No answer.";
  if (part.kind === "tick" && answer.kind === "tick") {
    if (answer.selected.length === 0) return "No boxes ticked.";
    return answer.selected.map((id) => part.options.find((option) => option.id === id)?.text ?? id).join("\n");
  }
  if (part.kind === "match" && answer.kind === "match") {
    return part.items
      .map((item) => {
        const term = part.bank.find((entry) => entry.id === answer.picks[item.id])?.text ?? "—";
        return `(${item.id}) ${term}`;
      })
      .join("\n");
  }
  if (part.kind === "lines" && answer.kind === "lines") {
    const lines = answer.lines.map((line) => line.trim()).filter(Boolean);
    return lines.length ? lines.map((line, index) => `${index + 1}. ${line}`).join("\n") : "No answer.";
  }
  if (part.kind === "number" && answer.kind === "number") {
    const figures = part.blanks.map((blank) => `${blank.label}: ${answer.values[blank.id]?.trim() || "—"}`);
    if (answer.working.trim()) figures.push(`Working: ${answer.working.trim()}`);
    return figures.join("\n");
  }
  if (part.kind === "written" && answer.kind === "written") return answer.text.trim() || "No answer.";
  return "No answer.";
}

function filled(part: ExamPart, answer: PartAnswer | undefined): boolean {
  if (!answer) return false;
  if (part.kind === "tick" && answer.kind === "tick") return answer.selected.length > 0;
  if (part.kind === "match" && answer.kind === "match") return Object.values(answer.picks).some(Boolean);
  if (part.kind === "lines" && answer.kind === "lines") return answer.lines.some((line) => line.trim());
  if (part.kind === "number" && answer.kind === "number") {
    return Object.values(answer.values).some((value) => value.trim()) || answer.working.trim().length > 0;
  }
  if (part.kind === "written" && answer.kind === "written") return answer.text.trim().length > 0;
  return false;
}

function countBlank(paper: ExamPaper, answers: Record<string, PartAnswer>): number {
  let count = 0;
  for (const question of paper.questions) {
    for (const part of question.parts) {
      if (!filled(part, answers[part.id])) count += 1;
    }
  }
  return count;
}

function letter(index: number): string {
  return String.fromCharCode(97 + index);
}

function formatAllowed(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours} hour${hours === 1 ? "" : "s"} ${mins} minutes`;
  if (hours) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${mins} minutes`;
}

function formatLeft(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
