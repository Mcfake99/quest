import { createFileRoute, Link } from "@tanstack/react-router";
import { ExamSession } from "@/components/game/ExamSession";
import { businessU1 } from "@/lib/game/exam/business-u1";
import { businessU2 } from "@/lib/game/exam/business-u2";
import { mathsH1 } from "@/lib/game/exam/maths-h1";
import type { ExamPaper } from "@/lib/game/exam/types";
import { Button } from "@/components/ui/button";

const PAPERS: Record<string, ExamPaper> = {
  "business-u1": businessU1,
  "business-u2": businessU2,
  "maths-h1": mathsH1,
};

export const Route = createFileRoute("/exam/$paperId")({
  component: ExamPage,
});

function ExamPage() {
  const { paperId } = Route.useParams();
  const paper = PAPERS[paperId];
  if (!paper) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-3xl">That paper is not in the hall yet.</h1>
        <p className="mt-2 text-sm text-muted">Business Unit 1, Business Unit 2 and Maths Higher Paper 1 are the practice papers in the hall.</p>
        <Button asChild className="mt-6">
          <Link to="/exam/$paperId" params={{ paperId: "business-u1" }}>
            Open Business Unit 1
          </Link>
        </Button>
      </main>
    );
  }
  return <ExamSession paper={paper} />;
}
