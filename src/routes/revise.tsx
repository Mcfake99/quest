import { createFileRoute } from "@tanstack/react-router";
import { Onboarding } from "@/components/game/Onboarding";
import { RevisionRun } from "@/components/game/RevisionRun";
import { useGameStore } from "@/lib/game/store";

export const Route = createFileRoute("/revise")({
  component: RevisePage,
});

function RevisePage() {
  const onboarded = useGameStore((s) => s.onboarded);
  if (!onboarded) return <Onboarding />;
  return <RevisionRun />;
}
