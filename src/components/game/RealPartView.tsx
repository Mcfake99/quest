import { ExternalLink, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { autoMark, pdfPage, type RealAnswer } from "@/lib/game/exam/real/mark";
import type { RealPaper, RealPart } from "@/lib/game/exam/real/types";
import { cn } from "@/lib/utils";

function Block({ text, className }: { text: string; className?: string }) {
  return <p className={cn("whitespace-pre-wrap break-words text-sm leading-relaxed", className)}>{text}</p>;
}

export function PaperLinks({ paper, part }: { paper: RealPaper; part?: RealPart }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="secondary">
        <a href={part ? pdfPage(paper.qp, part.page) : paper.qp} target="_blank" rel="noreferrer">
          <ExternalLink className="size-3.5" />
          {part ? `Original paper · p.${part.page}` : "View original PDF"}
        </a>
      </Button>
      {paper.insert ? (
        <Button asChild size="sm" variant="secondary">
          <a href={paper.insert} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3.5" />
            Insert / sources
          </a>
        </Button>
      ) : null}
    </div>
  );
}

/** One question part: printed context, the prompt and the answer box. */
export function RealPartInput({
  paper,
  part,
  value,
  onChange,
  flagged,
  onFlag,
  disabled,
}: {
  paper: RealPaper;
  part: RealPart;
  value: RealAnswer | undefined;
  onChange: (value: RealAnswer) => void;
  flagged?: boolean;
  onFlag?: () => void;
  disabled?: boolean;
}) {
  const picks = Array.isArray(value) ? value : value ? [value] : [];
  const multi = (part.answer?.length ?? 1) > 1;
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl tabular-nums">{part.label}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm tabular-nums text-muted">
            [{part.marks}
            {part.spag ? ` + ${part.spag} SPaG` : ""} mark{part.marks + (part.spag ?? 0) === 1 ? "" : "s"}]
          </span>
          {onFlag ? (
            <Button
              type="button"
              size="sm"
              variant={flagged ? "default" : "ghost"}
              onClick={onFlag}
              aria-pressed={flagged}
              aria-label={flagged ? "Unflag question" : "Flag question"}
            >
              <Flag className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      {part.lead ? <Block text={part.lead} className="mt-3 rounded-md bg-raised p-3 text-muted" /> : null}
      <Block text={part.prompt} className="mt-3" />
      {part.seePaper ? (
        <p className="mt-3 text-xs text-warn">
          This part uses a figure, table or source.{" "}
          <a className="underline underline-offset-4" href={pdfPage(paper.qp, part.page)} target="_blank" rel="noreferrer">
            See paper, page {part.page}
          </a>
          {paper.insert ? (
            <>
              {" "}
              or the{" "}
              <a className="underline underline-offset-4" href={paper.insert} target="_blank" rel="noreferrer">
                insert
              </a>
            </>
          ) : null}
          .
        </p>
      ) : null}

      <div className="mt-4">
        {part.kind === "mcq" && part.options ? (
          <div className="grid gap-2">
            {multi ? <p className="text-xs text-muted">Choose {part.answer?.length}.</p> : null}
            {part.options.map((option) => {
              const on = picks.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (multi) onChange(on ? picks.filter((p) => p !== option) : [...picks, option]);
                    else onChange([option]);
                  }}
                  className={cn(
                    "min-h-11 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    on ? "bg-accent text-accent-fg" : "bg-raised shadow-[var(--shadow-border)] hover:bg-bg",
                  )}
                  aria-pressed={on}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : part.kind === "numeric" ? (
          <input
            inputMode="decimal"
            disabled={disabled}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Answer (working can go before the final number)"
            className="h-11 w-full rounded-md bg-raised px-3 text-sm shadow-[var(--shadow-border)] outline-none focus:shadow-[var(--shadow-border-hover)]"
          />
        ) : (
          <textarea
            disabled={disabled}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.min(14, 3 + part.marks)}
            placeholder="Write your answer. You will mark it against the official scheme."
            className="w-full rounded-md bg-raised p-3 text-sm leading-relaxed shadow-[var(--shadow-border)] outline-none focus:shadow-[var(--shadow-border-hover)]"
          />
        )}
      </div>
    </section>
  );
}

/** Mark-scheme view with self-marking. Auto-marked parts start at the machine mark but can be changed. */
export function RealPartReview({
  paper,
  part,
  value,
  awarded,
  onAward,
}: {
  paper: RealPaper;
  part: RealPart;
  value: RealAnswer | undefined;
  awarded: number | undefined;
  onAward: (marks: number) => void;
}) {
  const max = part.marks + (part.spag ?? 0);
  const auto = autoMark(part, value);
  const shown = Array.isArray(value) ? value.join(", ") : value?.trim();
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl tabular-nums">{part.label}</h3>
        <span className="text-sm tabular-nums text-muted">
          {awarded ?? "–"}/{max}
        </span>
      </div>
      <Block text={part.prompt.length > 600 ? `${part.prompt.slice(0, 600)}…` : part.prompt} className="mt-2 text-muted" />
      <p className="mt-3 text-xs uppercase tracking-widest text-muted">Your answer</p>
      <Block text={shown || "(blank)"} className="mt-1 rounded-md bg-raised p-3" />
      {part.kind === "mcq" && part.answer ? (
        <p className={cn("mt-2 text-sm", auto === part.marks ? "text-ok" : "text-danger")}>
          {auto === part.marks ? "Correct" : `Answer: ${part.answer.join(" and ")}`}
        </p>
      ) : null}
      {part.kind === "numeric" && typeof part.numeric === "number" ? (
        <p className={cn("mt-2 text-sm", auto === part.marks ? "text-ok" : "text-warn")}>
          {auto === part.marks
            ? "Final answer matches the scheme — full marks."
            : `Final answer on the scheme: ${part.numeric}. Check the method marks below.`}
        </p>
      ) : null}
      <p className="mt-4 text-xs uppercase tracking-widest text-muted">Mark scheme</p>
      <Block text={part.scheme} className="mt-1 max-h-80 overflow-y-auto rounded-md bg-raised p-3 font-mono text-xs" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {paper.ms ? (
          <a className="text-xs text-muted underline underline-offset-4" href={paper.ms} target="_blank" rel="noreferrer">
            Full mark scheme PDF
          </a>
        ) : null}
        <a
          className="text-xs text-muted underline underline-offset-4"
          href={pdfPage(paper.qp, part.page)}
          target="_blank"
          rel="noreferrer"
        >
          Paper page {part.page}
        </a>
      </div>
      <div className="mt-4">
        <p className="text-xs text-muted">Your mark</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from({ length: max + 1 }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => onAward(n)}
              className={cn(
                "grid size-10 place-items-center rounded-md text-sm tabular-nums",
                awarded === n ? "bg-accent text-accent-fg" : "bg-raised shadow-[var(--shadow-border)]",
              )}
              aria-pressed={awarded === n}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PdfLinks({ qp, ms, ins }: { qp: string; ms: string | null; ins: string | null }) {
  return (
    <>
      <Button asChild size="sm" variant="secondary">
        <a href={qp} target="_blank" rel="noreferrer">
          QP
        </a>
      </Button>
      {ms ? (
        <Button asChild size="sm" variant="secondary">
          <a href={ms} target="_blank" rel="noreferrer">
            MS
          </a>
        </Button>
      ) : null}
      {ins ? (
        <Button asChild size="sm" variant="secondary">
          <a href={ins} target="_blank" rel="noreferrer">
            INS
          </a>
        </Button>
      ) : null}
    </>
  );
}
