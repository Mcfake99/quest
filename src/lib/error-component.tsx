import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-2xl">The hall hit a snag</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {(error instanceof Error ? error.message : "") || "Something unexpected happened. You can go back to the hall."}
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
      >
        Back to the hall
      </Link>
    </main>
  );
}

export function AppNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <p className="text-xs uppercase tracking-widest text-muted">404</p>
      <h1 className="font-display text-2xl">That corridor doesn’t exist</h1>
      <p className="max-w-md text-sm text-muted">This page isn’t part of QuestForge.</p>
      <Link
        to="/"
        className="mt-4 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
      >
        Back to the hall
      </Link>
    </main>
  );
}
