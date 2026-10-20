import { QuestionFigure } from "@/components/game/Figure";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { playCombo, playCorrect, playLevel, playWrong, unlockAudio } from "@/lib/game/audio";
import { badgeById } from "@/lib/game/badges";
import { clueFor } from "@/lib/game/clues";
import { getSubject, type PlayKind, type Question, type QuizResult } from "@/lib/game/types";
import { answersMatch, comboMultiplier, levelFromXp, scoreAnswer } from "@/lib/game/scoring";
import { isBoosted, useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export type QuizConfig = {
  title: string;
  questions: Question[];
  timed: boolean;
  seconds: number;
  questId: string | null;
  kind: PlayKind;
};

type Phase = "ask" | "retry" | "feedback" | "done";

export function QuizSession({ config }: { config: QuizConfig }) {
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const grant = useGameStore((s) => s.grant);
  const finishQuest = useGameStore((s) => s.finishQuest);
  const grantCrates = useGameStore((s) => s.grantCrates);
  const sound = useGameStore((s) => s.sound);
  const boostUntil = useGameStore((s) => s.xpBoostUntil);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ask");
  const [typed, setTyped] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [eliminated, setEliminated] = useState<string | null>(null);
  const [usedClue, setUsedClue] = useState(false);
  const [correctThis, setCorrectThis] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboMax, setComboMax] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [earnedMarks, setEarnedMarks] = useState(0);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [cratesGained, setCratesGained] = useState(0);
  const [jackpotMarks, setJackpotMarks] = useState(0);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(0);
  const [shake, setShake] = useState(0);
  const [remaining, setRemaining] = useState(config.timed ? config.seconds * 1000 : null);
  const [pop, setPop] = useState<{ xp: number; combo: number; hinted: boolean } | null>(null);

  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;
  const comboRef = useRef(combo);
  comboRef.current = combo;
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;
  const startLevelRef = useRef(levelFromXp(useGameStore.getState().xp));

  const question = config.questions[index];
  const questionId = question?.id;
  const total = config.questions.length;
  const answering = phase === "ask" || phase === "retry";

  useEffect(() => {
    unlockAudio();
  }, []);

  useEffect(() => {
    if (!config.timed || phase !== "ask" || !questionId) return;
    setRemaining(config.seconds * 1000);
    const started = Date.now();
    const id = window.setInterval(() => {
      const left = config.seconds * 1000 - (Date.now() - started);
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(id);
        resolveAnswer("", true);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [index, phase, config.timed, config.seconds, questionId]);

  useEffect(() => {
    if (!answering) return;
    function onKey(e: KeyboardEvent) {
      if (!question || question.type === "type") return;
      const opts = question.options ?? [];
      const n = Number(e.key);
      if (n >= 1 && n <= opts.length) {
        const opt = opts[n - 1] ?? "";
        if (eliminated && opt === eliminated) return;
        resolveAnswer(opt);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, questionId, eliminated]);

  function settle(given: string, ok: boolean, timeout: boolean, hinted: boolean) {
    if (!question) return;
    const nextCombo = ok && !hinted ? comboRef.current + 1 : 0;
    const duration = config.timed ? config.seconds * 1000 : null;
    const scored = scoreAnswer({
      question,
      correct: ok,
      combo: nextCombo,
      remainingMs: timeout ? 0 : remainingRef.current,
      durationMs: duration,
      boosted: isBoosted(boostUntil),
      hinted,
    });
    recordAnswer(question.id, ok);
    if (scored.xp || scored.marks) grant(scored.xp, scored.marks);
    setChosen(given);
    setCorrectThis(ok);
    setCombo(nextCombo);
    setComboMax((m) => Math.max(m, nextCombo));
    setEarnedXp((v) => v + scored.xp);
    setEarnedMarks((v) => v + scored.marks);
    if (ok) setCorrectIds((ids) => [...ids, question.id]);
    if (timeout) setTimedOut((n) => n + 1);
    phaseRef.current = "feedback";
    setPhase("feedback");
    setPop(ok ? { xp: scored.xp, combo: nextCombo, hinted } : null);
    if (!ok) setShake((n) => n + 1);
    if (sound) {
      if (!ok) playWrong();
      else if (nextCombo >= 3 && nextCombo % 3 === 0) playCombo();
      else playCorrect();
    }
  }

  function resolveAnswer(given: string, timeout = false) {
    const current = phaseRef.current;
    if ((current !== "ask" && current !== "retry") || !question) return;
    const ok = timeout ? false : answersMatch(given, question.answer, question.accept);

    if (!ok && current === "ask" && !timeout) {
      phaseRef.current = "retry";
      setPhase("retry");
      setChosen(given);
      setEliminated(given);
      setUsedClue(true);
      setCombo(0);
      comboRef.current = 0;
      setTyped("");
      setShake((n) => n + 1);
      if (sound) playWrong();
      return;
    }

    settle(given, ok, timeout, current === "retry" || usedClue);
  }

  function advance() {
    if (index + 1 >= total) {
      const result: QuizResult = {
        questionIds: config.questions.map((q) => q.id),
        correctIds,
        comboMax,
        xp: earnedXp,
        marks: earnedMarks,
        timedOut,
      };
      const outcome = finishQuest(config.questId, result);
      setNewBadges(outcome.badges);
      setCratesGained(outcome.crates);
      setJackpotMarks(outcome.jackpotMarks);
      const nextLevel = levelFromXp(useGameStore.getState().xp);
      if (nextLevel > startLevelRef.current) {
        const gained = nextLevel - startLevelRef.current;
        grantCrates(gained);
        setCratesGained((n) => n + gained);
        setLevelUp(nextLevel);
        if (sound) playLevel();
      }
      setPhase("done");
      phaseRef.current = "done";
      return;
    }
    setIndex((i) => i + 1);
    setPhase("ask");
    phaseRef.current = "ask";
    setTyped("");
    setChosen(null);
    setEliminated(null);
    setUsedClue(false);
    setPop(null);
  }

  if (!question && phase !== "done") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
        <h1 className="font-display text-3xl">No questions left</h1>
        <Button asChild className="mt-6">
          <Link to="/">Back to the hall</Link>
        </Button>
      </div>
    );
  }

  if (phase === "done") {
    const score = correctIds.length;
    const perfect = score === total && total > 0;
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-10">
        <div className="stagger-in">
          <p className="text-xs uppercase tracking-widest text-muted">Result</p>
          <h1 className="mt-2 font-display text-4xl">
            {perfect ? "Clean slate" : score >= total * 0.7 ? "Solid work" : "Keep at it"}
          </h1>
          <p className="mt-3 text-muted">
            {score}/{total} correct · {comboMax} max combo
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat label="XP" value={`+${earnedXp}`} />
            <Stat label="Marks" value={`+${earnedMarks}`} />
          </div>
          {levelUp ? (
            <p className="mt-5 text-sm text-accent">
              Level {levelUp} — loot crate unlocked.
            </p>
          ) : null}
          {jackpotMarks > 0 ? (
            <p className="mt-2 text-sm text-accent">Jackpot +{jackpotMarks} marks.</p>
          ) : null}
          {cratesGained > 0 ? (
            <p className="mt-2 text-sm text-accent">
              {cratesGained} loot crate{cratesGained === 1 ? "" : "s"} waiting in the Exchange.
            </p>
          ) : null}
          {newBadges.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {newBadges.map((id) => {
                const badge = badgeById(id);
                return (
                  <li key={id} className="rounded-md bg-raised px-3 py-2 text-sm">
                    <span className="text-fg">{badge?.name ?? id}</span>
                    <span className="block text-xs text-muted">{badge?.blurb}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link to="/">Hall</Link>
            </Button>
            <Button asChild variant="secondary" className="flex-1">
              <Link to="/shop">Exchange</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const subject = getSubject(question.subject);
  const options = question.options ?? [];
  const clue = phase === "retry" ? clueFor(question) : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Leave quest">
          <Link to="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{config.title}</p>
          <Progress value={((index + (phase === "feedback" ? 1 : 0)) / total) * 100} className="mt-2" />
        </div>
        <div className="text-right text-xs tabular-nums text-muted">
          <p>
            {index + 1}/{total}
          </p>
          {combo > 1 ? <p className="text-accent">×{comboMultiplier(combo)}</p> : null}
        </div>
      </div>

      {config.timed && phase === "ask" && remaining != null ? (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full origin-left bg-accent"
            style={{
              width: "100%",
              transform: `scaleX(${Math.max(0, remaining / (config.seconds * 1000))})`,
            }}
          />
        </div>
      ) : (
        <div className="mt-4 h-1" />
      )}

      <div className={cn("mt-8 flex-1", shake ? "shake-wrong" : "")} key={shake}>
        <p className="text-xs uppercase tracking-widest text-muted">
          {subject.short} · {question.topic}
          {question.figure ? " · Figure" : ""}
          {phase === "retry" ? " · Clue" : ""}
        </p>
        <h1 className="mt-3 font-display text-2xl leading-snug md:text-3xl">{question.prompt}</h1>
        <QuestionFigure figure={question.figure} alt={question.figureAlt} />

        {question.type === "type" ? (
          <form
            className="mt-8 flex flex-col gap-3"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (answering) resolveAnswer(typed);
            }}
          >
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={phase === "retry" ? "Try again" : "Type your answer"}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={!answering}
              autoFocus
            />
            {answering ? (
              <Button type="submit" disabled={!typed.trim()}>
                {phase === "retry" ? "Try again" : "Submit"}
              </Button>
            ) : null}
          </form>
        ) : (
          <div className="mt-8 grid gap-2">
            {options.map((opt, i) => {
              const selected = chosen === opt;
              const isAnswer =
                opt === question.answer || answersMatch(opt, question.answer, question.accept);
              const show = phase === "feedback";
              const ruledOut = phase === "retry" && eliminated === opt;
              const firstMiss = Boolean(eliminated && eliminated === opt && !isAnswer);
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={!answering || ruledOut}
                  onClick={() => resolveAnswer(opt)}
                  aria-label={opt}
                  className={cn(
                    "flex min-h-12 items-center justify-between rounded-lg px-4 py-3 text-left text-sm shadow-[var(--shadow-border)] transition-[background-color,box-shadow,transform] duration-150",
                    "bg-raised text-fg hover:shadow-[var(--shadow-border-hover)] disabled:opacity-100",
                    ruledOut && "text-muted",
                    show && isAnswer && "bg-ok text-ok-fg",
                    show && (selected || firstMiss) && !isAnswer && "bg-danger text-danger-fg",
                  )}
                >
                  <span>
                    <span className="mr-3 tabular-nums text-muted">{i + 1}</span>
                    {opt}
                  </span>
                  {show && isAnswer ? <Check className="size-4" /> : null}
                  {(show && (selected || firstMiss) && !isAnswer) || ruledOut ? <X className="size-4" /> : null}
                </button>
              );
            })}
          </div>
        )}

        {clue ? (
          <div className="mt-6 rounded-lg bg-raised p-4">
            <p className="text-sm font-medium text-warn">Clue</p>
            <p className="mt-1 text-sm text-muted">{clue}</p>
            <p className="mt-2 text-xs text-muted">Have another go — a correct answer here is worth half XP.</p>
          </div>
        ) : null}

        {phase === "feedback" ? (
          <div className="mt-6 rounded-lg bg-raised p-4">
            <p className="text-sm font-medium">
              {correctThis ? (usedClue ? "Correct — with a clue" : "Correct") : "Not this time"}
            </p>
            <p className="mt-1 text-sm text-muted">{question.explanation}</p>
            {question.type === "type" && !correctThis ? (
              <p className="mt-2 text-sm">
                Answer: <span className="text-fg">{question.answer}</span>
              </p>
            ) : null}
            {pop ? (
              <p className="pop-score mt-3 text-sm tabular-nums text-accent">
                +{pop.xp} XP
                {pop.hinted ? " · clue" : pop.combo >= 3 ? ` · combo ${pop.combo}` : ""}
              </p>
            ) : null}
            <Button className="mt-4 w-full" onClick={advance}>
              {index + 1 >= total ? "See result" : "Next"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-raised px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
