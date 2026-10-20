import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cardsFor } from "@/lib/game/flashcards";
import { dueCards, usePapersStore } from "@/lib/game/papers-store";
import { isSubjectId, SUBJECTS } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/flashcards/$subject")({
  component: Flashcards,
});

function Flashcards() {
  const { subject } = Route.useParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const progress = usePapersStore((s) => s.flash);
  const rateCard = usePapersStore((s) => s.rateCard);
  const [deck, setDeck] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(0);
  const all = useMemo(() => (isSubjectId(subject) ? cardsFor(subject) : []), [subject]);
  const decks = useMemo(() => [...new Set(all.map((c) => c.deck))], [all]);
  const pool = all.filter((c) => !deck || c.deck === deck);
  // The queue is computed from the saved Leitner boxes, so a rated card drops out until it is due again.
  const queue = mounted ? dueCards(pool, progress) : [];
  const card = queue[0];
  const learned = mounted ? pool.filter((c) => (progress[c.id]?.box ?? 0) >= 3).length : 0;

  if (!isSubjectId(subject)) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl">Unknown subject</h1>
        <Button asChild className="mt-6">
          <Link to="/papers">All papers</Link>
        </Button>
      </div>
    );
  }
  const name = SUBJECTS.find((s) => s.id === subject)!.name;

  function rate(known: boolean) {
    if (!card) return;
    rateCard(card.id, known);
    setFlipped(false);
    setSeen((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/subjects/$id" params={{ id: subject }} className="text-sm text-muted">
        ← {name}
      </Link>
      <h1 className="mt-4 font-display text-3xl md:text-4xl">{name} flashcards</h1>
      <p className="mt-2 text-sm text-muted">
        {queue.length} due · {learned}/{pool.length} learned · {seen} reviewed this visit. Cards you know come back
        later (1, 3, 7, 14 then 30 days); cards you miss come back tomorrow.
      </p>
      <Progress value={pool.length ? (learned / pool.length) * 100 : 0} className="mt-3" />

      <div className="mt-6 flex flex-wrap gap-2">
        {["", ...decks].map((d) => (
          <button
            key={d || "all"}
            type="button"
            onClick={() => {
              setDeck(d);
              setFlipped(false);
            }}
            className={cn(
              "min-h-9 rounded-full px-3 text-xs",
              deck === d ? "bg-accent text-accent-fg" : "bg-raised text-muted shadow-[var(--shadow-border)]",
            )}
          >
            {d || "All decks"}
          </button>
        ))}
      </div>

      {card ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-64 w-full flex-col justify-center rounded-2xl bg-surface p-6 text-left shadow-[var(--shadow-border)] transition-transform duration-200 active:scale-[0.99]"
            aria-label={flipped ? "Show the front" : "Flip the card"}
          >
            <p className="text-xs uppercase tracking-widest text-muted">
              {card.deck} · {flipped ? "back" : "front"}
            </p>
            <p className={cn("mt-4 whitespace-pre-wrap", flipped ? "text-base" : "font-display text-2xl")}>
              {flipped ? card.back : card.front}
            </p>
            {!flipped ? <p className="mt-6 text-xs text-muted">Tap to flip</p> : null}
          </button>
          {card.source && flipped ? (
            <a href={card.source.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-muted underline underline-offset-4">
              From question {card.source.label} — open the paper
            </a>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="secondary" size="lg" onClick={() => rate(false)} disabled={!flipped}>
              Don’t know
            </Button>
            <Button size="lg" onClick={() => rate(true)} disabled={!flipped}>
              Know it (+2 XP)
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
          <p className="font-display text-xl">{mounted ? "Nothing due in this deck." : "Shuffling…"}</p>
          {mounted ? <p className="mt-2 text-sm text-muted">Come back tomorrow, or pick another deck.</p> : null}
        </div>
      )}
    </div>
  );
}
