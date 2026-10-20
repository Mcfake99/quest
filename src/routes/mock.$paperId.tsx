import { createFileRoute, Link } from "@tanstack/react-router";
import { MockSession } from "@/components/game/MockSession";
import { Button } from "@/components/ui/button";
import { realPaper } from "@/lib/game/exam/real/lookup";

export const Route = createFileRoute("/mock/$paperId")({
  component: MockPage,
});

function MockPage() {
  const { paperId } = Route.useParams();
  const paper = realPaper(paperId);
  if (!paper) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-3xl">That paper is not in the library.</h1>
        <Button asChild className="mt-6">
          <Link to="/papers">All past papers</Link>
        </Button>
      </main>
    );
  }
  return <MockSession paper={paper} />;
}
