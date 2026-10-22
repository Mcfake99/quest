import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useCloudStatus } from "@/lib/game/cloud-status";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { checkAdmin } from "@/lib/admin/api";

export function AuthSlot({ compact = false }: { compact?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  const status = useCloudStatus((s) => s.status);
  const [admin, setAdmin] = useState(false);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return setAdmin(false);
    let live = true;
    checkAdmin()
      .then((r) => live && setAdmin(r.admin))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [userId]);

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
      {admin && !compact ? (
        <Link to="/admin" className="text-[11px] uppercase tracking-wider text-muted hover:text-fg">
          Admin
        </Link>
      ) : null}
      <UserButton />
    </div>
  );
}
