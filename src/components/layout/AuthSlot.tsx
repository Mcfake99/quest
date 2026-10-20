import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useCloudStatus } from "@/lib/game/cloud-status";
import { Button } from "@/components/ui/button";

export function AuthSlot({ compact = false }: { compact?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  const status = useCloudStatus((s) => s.status);

  if (isPending) {
    return <div className="size-10 shrink-0 animate-pulse rounded-full bg-raised" aria-hidden />;
  }

  if (!user) {
    return (
      <Button asChild variant="secondary" size={compact ? "sm" : "default"}>
        <Link to="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex min-w-0 max-w-[11rem] items-center gap-2 overflow-hidden sm:max-w-none">
      {compact ? null : (
        <p className="hidden text-[11px] uppercase tracking-wider text-muted lg:block">
          {status === "saving" ? "Saving" : status === "error" ? "Save failed" : "Saved"}
        </p>
      )}
      <UserButton />
    </div>
  );
}
