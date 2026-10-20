import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { SUBJECT_ICONS } from "@/lib/game/icons";
import { subjectMastery } from "@/lib/game/questions";
import { useGameStore } from "@/lib/game/store";
import { SUBJECTS } from "@/lib/game/types";

export const Route = createFileRoute("/subjects")({ component: Subjects });

function Subjects() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/subjects") {
    return <Outlet />;
  }

  return <SubjectList />;
}

function SubjectList() {
  const answers = useGameStore((s) => s.answers);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-widest text-muted">Halls</p>
      <h1 className="mt-2 font-display text-3xl md:text-4xl">Subjects</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Nine GCSE halls. Mastery rises when you get a question right more often than wrong.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {SUBJECTS.map((subject) => {
          const Icon = SUBJECT_ICONS[subject.id];
          const mastery = subjectMastery(subject.id, answers);
          return (
            <Link
              key={subject.id}
              to="/subjects/$id"
              params={{ id: subject.id }}
              className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{subject.group}</p>
                  <h2 className="mt-1 font-display text-2xl">{subject.name}</h2>
                </div>
                <Icon className="size-5 text-muted" strokeWidth={1.75} />
              </div>
              <Progress value={mastery.ratio * 100} className="mt-4" />
              <p className="mt-2 text-xs tabular-nums text-muted">
                {mastery.mastered}/{mastery.total} mastered · {mastery.seen} seen
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
