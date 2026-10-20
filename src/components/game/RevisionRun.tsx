import { QuestionFigure } from "@/components/game/Figure";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { playCorrect, playWrong, unlockAudio } from "@/lib/game/audio";
import {
  BOX_DAYS,
  duePhrase,
  dueTomorrow,
  feynmanFor,
  FOCUS_MS,
  formatClock,
  gradeFeynman,
  mapFor,
  pickRunQuestion,
  reconcileRevision,
  runMode,
  type FeynmanPrompt,
  type MindMap,
} from "@/lib/game/revise";
import { answersMatch } from "@/lib/game/scoring";
import { useGameStore } from "@/lib/game/store";
import { getSubject, type CardProgress, type Question, type RevisionState } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const REWARD = { xp: 12, marks: 4 };

export function RevisionHallCard() {
  const revision = useGameStore((s) => s.revision);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    if (!revision || (revision.phase !== "focus" && revision.phase !== "break")) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [revision]);

  let kicker = "Daily run";
  let title = "Today’s revision";
  let body =
    "Thirty minutes of questions, then five minutes away from the screen. Think first. Missed cards come back tomorrow.";
  let action = "Start the timer";
  let clock: string | null = null;

  if (revision?.phase === "focus" && revision.focusEndsAt) {
    const left = now == null ? revision.focusEndsAt - Date.now() : revision.focusEndsAt - now;
    title = left <= 0 ? "Time’s up" : "Revision in progress";
    body = left <= 0 ? "The questions stop. Take the five-minute break." : "The clock kept running. Jump back in.";
    action = left <= 0 ? "Open the break" : "Continue";
    clock = formatClock(Math.max(0, left));
  } else if (revision?.phase === "break") {
    const left =
      revision.breakEndsAt == null || now == null ? 5 * 60 * 1000 : revision.breakEndsAt - now;
    title = "Five-minute break";
    body = "Look away from the screen. Stretch, water, then you’re done for the day.";
    action = "Open the break";
    clock = formatClock(Math.max(0, left));
  } else if (revision?.phase === "done") {
    kicker = "Done for today";
    title = "The 30 minutes are in";
    body = `${revision.correct} of ${revision.answered} recalled · +${revision.xp} XP. Extra quests are below. A past paper is a separate sitting.`;
    action = "See today’s run";
  }

  return (
    <Link
      to="/revise"
      className="mt-6 block rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)] md:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
            <Timer className="size-3.5" strokeWidth={1.75} />
            {kicker}
          </p>
          <p className="mt-2 font-display text-2xl md:text-3xl">{title}</p>
          <p className="mt-2 max-w-xl text-sm text-muted">{body}</p>
        </div>
        {clock ? <p className="font-display text-3xl tabular-nums">{clock}</p> : null}
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-sm text-fg">
        {action}
        <ArrowRight className="size-4 text-muted" />
      </p>
    </Link>
  );
}

export function RevisionRun() {
  const revision = useGameStore((s) => s.revision);
  const startRevision = useGameStore((s) => s.startRevision);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    unlockAudio();
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const current = useGameStore.getState().revision;
      if (!current) return;
      const next = reconcileRevision(current, t);
      if (next !== current) useGameStore.setState({ revision: next });
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  if (!revision || revision.phase === "idle") return <Cover onStart={startRevision} />;
  if (revision.phase === "break") return <BreakScreen revision={revision} now={now} />;
  if (revision.phase === "done") return <DoneScreen revision={revision} />;
  return <FocusScreen revision={revision} now={now} />;
}

function Cover({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to the hall">
          <Link to="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <p className="text-xs uppercase tracking-widest text-muted">Daily revision</p>
      </div>
      <div className="mt-8">
        <p className="font-display text-5xl tabular-nums">30:00</p>
        <h1 className="mt-3 font-display text-3xl md:text-4xl">Questions, then a break.</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          One sitting a day. Thirty minutes of questions, then five minutes away from the screen. The clock keeps
          going if you leave — that is the point of the block.
        </p>
      </div>
      <ul className="mt-8 grid gap-3">
        {METHODS.map(([name, line]) => (
          <li key={name} className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
            <p className="text-sm">{name}</p>
            <p className="mt-1 text-sm text-muted">{line}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">
        A full past paper stays outside this half hour. Sit one under exam time at the weekend, or after today’s run.
      </p>
      <Button className="mt-6" size="lg" onClick={onStart}>
        Start the 30 minutes
      </Button>
    </div>
  );
}

const METHODS: [string, string][] = [
  ["Active recall", "The choices stay hidden until you have tried to remember."],
  ["Flashcards", "Every few questions: say the answer, then check yourself."],
  ["Spaced return", "A miss comes back tomorrow. A hit waits 3 days, a week, 2 weeks, then a month."],
  ["Teach it", "Once in the block, explain an idea as if to a younger student."],
  ["Mind map", "Once in the block, join three ideas and pick the true link."],
];

function ClockBar({
  label,
  ms,
  total,
  className,
}: {
  label: string;
  ms: number;
  total: number;
  className?: string;
}) {
  const low = ms < 60_000;
  const ratio = total > 0 ? Math.max(0, Math.min(1, ms / total)) : 0;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
        <p className={cn("font-display text-3xl tabular-nums", low && "text-danger")}>{formatClock(ms)}</p>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised">
        <div
          className={cn("h-full origin-left", low ? "bg-danger" : "bg-accent")}
          style={{ width: "100%", transform: `scaleX(${ratio})` }}
        />
      </div>
    </div>
  );
}

function FocusScreen({ revision, now }: { revision: RevisionState; now: number | null }) {
  const reviews = useGameStore((s) => s.reviews);
  const recordRevision = useGameStore((s) => s.recordRevision);
  const sound = useGameStore((s) => s.sound);
  const enterBreak = useGameStore((s) => s.enterBreak);
  const left = revision.focusEndsAt == null || now == null ? FOCUS_MS : Math.max(0, revision.focusEndsAt - now);

  const [pack, setPack] = useState(() => freezePiece(revision, reviews));
  const [stage, setStage] = useState<"think" | "answer" | "marked">(pack.mode === "map" ? "answer" : "think");
  const [choice, setChoice] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [ok, setOk] = useState(false);
  const [hits, setHits] = useState<string[]>([]);

  function finish(id: string, correct: boolean, flags?: { feynman?: boolean; map?: boolean }) {
    recordRevision(id, correct, REWARD.xp, REWARD.marks, flags);
    const card = useGameStore.getState().reviews[id];
    setOk(correct);
    setNote(
      correct
        ? `Box ${card?.box ?? 2}. It comes back ${card ? duePhrase(card.box) : "in 3 days"}.`
        : "Missed. Back to box 1 — you’ll see it tomorrow.",
    );
    setStage("marked");
    if (sound) {
      if (correct) playCorrect();
      else playWrong();
    }
  }

  function goNext() {
    const rev = useGameStore.getState().revision ?? revision;
    const next = freezePiece(rev, useGameStore.getState().reviews);
    setPack(next);
    setStage(next.mode === "map" ? "answer" : "think");
    setChoice(null);
    setText("");
    setNote("");
    setOk(false);
    setHits([]);
  }

  const mode = pack.mode;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Leave — the clock keeps running">
          <Link to="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <ClockBar className="flex-1" label="Questions" ms={left} total={FOCUS_MS} />
      </div>
      <p className="mt-3 text-xs tabular-nums text-muted">
        {revision.answered} answered · {revision.correct} recalled
        {mode === "recall" ? " · Active recall" : null}
        {mode === "card" ? " · Flashcard" : null}
        {mode === "feynman" ? " · Teach it" : null}
        {mode === "map" ? " · Mind map" : null}
      </p>

      {pack.mode === "feynman" ? (
        <FeynmanPane
          prompt={pack.prompt}
          stage={stage}
          text={text}
          ok={ok}
          hits={hits}
          note={note}
          onText={setText}
          onNext={goNext}
          onGrade={() => {
            const grade = gradeFeynman(text, pack.prompt);
            setHits(grade.hits);
            finish(`feynman:${pack.prompt.id}`, grade.ok, { feynman: true });
          }}
        />
      ) : pack.mode === "map" ? (
        <MapPane
          map={pack.map}
          stage={stage}
          choice={choice}
          ok={ok}
          note={note}
          onNext={goNext}
          onPick={(opt) => {
            if (stage === "marked") return;
            setChoice(opt);
            finish(`map:${pack.map.id}`, opt === pack.map.answer, { map: true });
          }}
        />
      ) : pack.question ? (
        <QuestionPane
          question={pack.question}
          asCard={pack.mode === "card"}
          stage={stage}
          choice={choice}
          ok={ok}
          note={note}
          onNext={goNext}
          onReveal={() => setStage("answer")}
          onPick={(opt) => {
            if (stage === "marked" || !pack.question) return;
            setChoice(opt);
            finish(pack.question.id, answersMatch(opt, pack.question.answer, pack.question.accept));
          }}
          onHonor={(knew) => {
            if (stage === "marked" || !pack.question) return;
            finish(pack.question.id, knew);
          }}
        />
      ) : (
        <div className="mt-10">
          <h1 className="font-display text-2xl">The question bank is clear for today.</h1>
          <p className="mt-2 text-sm text-muted">Take the five-minute break. Tomorrow’s due cards will be waiting.</p>
          <Button className="mt-6" onClick={enterBreak}>
            Take the break
          </Button>
        </div>
      )}
    </div>
  );
}

function freezePiece(rev: RevisionState, reviews: Record<string, CardProgress>) {
  const mode = runMode(rev.answered, rev.feynmanDone, rev.mapDone);
  if (mode === "feynman") return { mode, prompt: feynmanFor(rev.date, rev.usedIds) } as const;
  if (mode === "map") return { mode, map: mapFor(rev.date, rev.usedIds) } as const;
  return {
    mode,
    question: pickRunQuestion(reviews, rev.usedIds, rev.date, rev.date),
  } as const;
}

function QuestionPane({
  question,
  asCard,
  stage,
  choice,
  ok,
  note,
  onNext,
  onReveal,
  onPick,
  onHonor,
}: {
  question: Question;
  asCard: boolean;
  stage: "think" | "answer" | "marked";
  choice: string | null;
  ok: boolean;
  note: string;
  onNext: () => void;
  onReveal: () => void;
  onPick: (opt: string) => void;
  onHonor: (knew: boolean) => void;
}) {
  const subject = getSubject(question.subject);
  const options = question.options ?? [];
  return (
    <div className="mt-8 flex-1">
      <p className="text-xs uppercase tracking-widest text-muted">
        {subject.name} · {question.topic}
      </p>
      <h1 className="mt-3 font-display text-2xl leading-snug md:text-3xl">{question.prompt}</h1>
      <QuestionFigure figure={question.figure} alt={question.figureAlt} />

      {stage === "think" ? (
        <div className="mt-8">
          <p className="text-sm text-muted">
            {asCard
              ? "Cover the answer in your head. When you are ready, check it."
              : "Close the notes. Try to recall it before the choices appear."}
          </p>
          <Button className="mt-4" onClick={onReveal}>
            {asCard ? "I know it" : "Show the choices"}
          </Button>
        </div>
      ) : null}

      {stage !== "think" && asCard ? (
        <div className="mt-8 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-widest text-muted">Answer</p>
          <p className="mt-2 text-sm">{question.answer}</p>
          <p className="mt-3 text-sm text-muted">{question.explanation}</p>
          {stage === "answer" ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button onClick={() => onHonor(true)}>That was it</Button>
              <Button variant="secondary" onClick={() => onHonor(false)}>
                I missed it
              </Button>
            </div>
          ) : (
            <Marked note={note} ok={ok} onNext={onNext} />
          )}
        </div>
      ) : null}

      {stage !== "think" && !asCard ? (
        <div className="mt-8 grid gap-2">
          {options.map((opt, i) => {
            const selected = choice === opt;
            const isAnswer = answersMatch(opt, question.answer, question.accept);
            const show = stage === "marked";
            return (
              <button
                key={opt}
                type="button"
                disabled={show}
                onClick={() => onPick(opt)}
                className={cn(
                  "flex min-h-12 items-center justify-between rounded-lg px-4 py-3 text-left text-sm shadow-[var(--shadow-border)] transition-[background-color,box-shadow] duration-150",
                  "bg-raised text-fg hover:shadow-[var(--shadow-border-hover)] disabled:opacity-100",
                  show && isAnswer && "bg-ok text-ok-fg",
                  show && selected && !isAnswer && "bg-danger text-danger-fg",
                )}
              >
                <span>
                  <span className="mr-3 tabular-nums text-muted">{i + 1}</span>
                  {opt}
                </span>
                {show && isAnswer ? <Check className="size-4 shrink-0" /> : null}
              </button>
            );
          })}
          {stage === "marked" ? (
            <div className="mt-2">
              <p className="text-sm text-muted">{question.explanation}</p>
              <Marked note={note} ok={ok} onNext={onNext} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FeynmanPane({
  prompt,
  stage,
  text,
  ok,
  hits,
  note,
  onText,
  onNext,
  onGrade,
}: {
  prompt: FeynmanPrompt;
  stage: "think" | "answer" | "marked";
  text: string;
  ok: boolean;
  hits: string[];
  note: string;
  onText: (value: string) => void;
  onNext: () => void;
  onGrade: () => void;
}) {
  const subject = getSubject(prompt.subject);
  return (
    <div className="mt-8 flex-1">
      <p className="text-xs uppercase tracking-widest text-muted">{subject.name} · Teach it</p>
      <h1 className="mt-3 font-display text-2xl leading-snug md:text-3xl">{prompt.title}</h1>
      <p className="mt-3 text-sm text-muted">{prompt.prompt}</p>
      {stage !== "marked" ? (
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) onGrade();
          }}
        >
          <textarea
            value={text}
            onChange={(e) => onText(e.target.value)}
            rows={5}
            placeholder="Explain it in plain words. No notes."
            className="w-full resize-none rounded-md bg-raised px-3 py-3 text-base text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:shadow-[var(--shadow-border-hover)]"
          />
          <Button className="mt-3" type="submit" disabled={!text.trim()}>
            Check the explanation
          </Button>
        </form>
      ) : (
        <div className="mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm">{ok ? "That explanation holds." : "There is a gap. Read this version, then it comes back tomorrow."}</p>
          {hits.length > 0 ? (
            <p className="mt-2 text-xs text-muted">You used: {hits.join(", ")}.</p>
          ) : null}
          <p className="mt-3 text-sm text-muted">{prompt.model}</p>
          <Marked note={note} ok={ok} onNext={onNext} />
        </div>
      )}
    </div>
  );
}

function MapPane({
  map,
  stage,
  choice,
  ok,
  note,
  onNext,
  onPick,
}: {
  map: MindMap;
  stage: "think" | "answer" | "marked";
  choice: string | null;
  ok: boolean;
  note: string;
  onNext: () => void;
  onPick: (opt: string) => void;
}) {
  const show = stage === "marked";
  return (
    <div className="mt-8 flex-1">
      <p className="text-xs uppercase tracking-widest text-muted">Mind map · {map.title}</p>
      <ol className="mt-4 grid gap-2">
        {map.nodes.map((node, i) => (
          <li key={node}>
            <div className="rounded-lg bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]">{node}</div>
            {i === 0 ? <p className="px-4 py-2 text-xs text-muted">{map.left}</p> : null}
            {i === 1 ? <p className="px-4 py-2 text-xs text-muted">{map.right}</p> : null}
          </li>
        ))}
      </ol>
      <h1 className="mt-4 font-display text-2xl leading-snug">{map.prompt}</h1>
      <div className="mt-4 grid gap-2">
        {map.options.map((opt, i) => {
          const selected = choice === opt;
          const isAnswer = opt === map.answer;
          return (
            <button
              key={opt}
              type="button"
              disabled={show}
              onClick={() => onPick(opt)}
              className={cn(
                "flex min-h-12 items-center justify-between rounded-lg px-4 py-3 text-left text-sm shadow-[var(--shadow-border)] transition-[background-color,box-shadow] duration-150",
                "bg-raised text-fg hover:shadow-[var(--shadow-border-hover)] disabled:opacity-100",
                show && isAnswer && "bg-ok text-ok-fg",
                show && selected && !isAnswer && "bg-danger text-danger-fg",
              )}
            >
              <span>
                <span className="mr-3 tabular-nums text-muted">{i + 1}</span>
                {opt}
              </span>
              {show && isAnswer ? <Check className="size-4 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
      {show ? (
        <div className="mt-3">
          <p className="text-sm text-muted">{map.explanation}</p>
          <Marked note={note} ok={ok} onNext={onNext} />
        </div>
      ) : null}
    </div>
  );
}

function Marked({ note, ok, onNext }: { note: string; ok: boolean; onNext: () => void }) {
  return (
    <div className="mt-4">
      <p className={cn("text-sm", ok ? "text-ok" : "text-danger")}>{note}</p>
      <Button className="mt-4" onClick={onNext}>
        Next
      </Button>
    </div>
  );
}

function BreakScreen({ revision, now }: { revision: RevisionState; now: number | null }) {
  const finishBreak = useGameStore((s) => s.finishBreak);
  const left = revision.breakEndsAt == null || now == null ? 5 * 60 * 1000 : Math.max(0, revision.breakEndsAt - now);
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-4 md:px-6">
      <ClockBar className="w-full" label="Break" ms={left} total={5 * 60 * 1000} />
      <h1 className="mt-8 font-display text-3xl md:text-4xl">Five minutes off.</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Stand up, get a drink, look out of a window. This is the short break after the block, so the next sitting
        tomorrow is easier to start.
      </p>
      <p className="mt-6 text-sm tabular-nums text-muted">
        {revision.correct} of {revision.answered} recalled · +{revision.xp} XP
      </p>
      <Button variant="ghost" className="mt-10 self-start px-0" onClick={finishBreak}>
        Skip the break
      </Button>
    </div>
  );
}

function DoneScreen({ revision }: { revision: RevisionState }) {
  const reviews = useGameStore((s) => s.reviews);
  const due = dueTomorrow(reviews, revision.date);
  const counts = [1, 2, 3, 4, 5].map(
    (box) => Object.values(reviews).filter((card) => card.box === box).length,
  );
  const weekend = [0, 6].includes(new Date().getDay());
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-6 md:px-6">
      <p className="text-xs uppercase tracking-widest text-muted">Today’s run</p>
      <h1 className="mt-2 font-display text-3xl md:text-4xl">That’s the half hour.</h1>
      <p className="mt-3 text-sm text-muted">
        {revision.correct} of {revision.answered} recalled · +{revision.xp} XP.
        {due > 0 ? ` ${due} card${due === 1 ? "" : "s"} come back tomorrow.` : " Nothing is due tomorrow yet."}
      </p>
      <div className="mt-6 grid grid-cols-5 gap-2">
        {counts.map((n, i) => (
          <div key={i} className="rounded-lg bg-surface px-2 py-3 text-center shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">Box {i + 1}</p>
            <p className="mt-1 font-display text-xl tabular-nums">{n}</p>
            <p className="mt-1 text-xs text-muted">{BOX_DAYS[i + 1]}d</p>
          </div>
        ))}
      </div>
      <section className="mt-8">
        <h2 className="font-display text-xl">Past papers</h2>
        <p className="mt-1 text-sm text-muted">
          {weekend
            ? "It’s the weekend — a good time to sit one under the real clock."
            : "Sit one under exam time when you have a longer stretch. Not inside the 30 minutes."}
        </p>
        <div className="mt-3 grid gap-2">
          <PaperLink paperId="maths-h1" title="Maths Higher Paper 1" detail="90 minutes · 80 marks · non-calculator" />
          <PaperLink paperId="business-u1" title="Business Unit 1" detail="2 hours · 100 marks" />
          <PaperLink paperId="business-u2" title="Business Unit 2" detail="90 minutes · 60 marks" />
        </div>
      </section>
      <Button asChild className="mt-8">
        <Link to="/">Back to the hall</Link>
      </Button>
    </div>
  );
}

function PaperLink({ paperId, title, detail }: { paperId: string; title: string; detail: string }) {
  return (
    <Link
      to="/exam/$paperId"
      params={{ paperId }}
      className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
    >
      <span>
        <span className="text-sm">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{detail}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted" />
    </Link>
  );
}
