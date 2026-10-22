import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { progressEqual, sanitizeProgress, type PapersProgress } from "@/lib/game/papers-merge";
import { usePapersStore } from "@/lib/game/papers-store";
import { recordVisit, syncPapersProgress } from "@/lib/game/progress-sync";

function localProgress(): PapersProgress {
  const s = usePapersStore.getState();
  return sanitizeProgress({ attempts: s.attempts, flash: s.flash, mistakes: s.mistakes, cleared: s.cleared });
}

/** Syncs mock/flashcard/mistake progress to the server and logs visits. */
export function PapersSync() {
  const { user, isPending } = useCurrentUserState();
  const userId = user && !user.isDevFallback ? user.id : null;
  const ready = useRef(false);

  // Visit heartbeat: on open, on returning to the tab, and every 10 min while open
  // (the server dedupes to one row per 30 min).
  useEffect(() => {
    if (isPending || !userId) return;
    const ping = () => void recordVisit().catch(() => undefined);
    ping();
    const onVis = () => document.visibilityState === "visible" && ping();
    document.addEventListener("visibilitychange", onVis);
    const t = window.setInterval(ping, 10 * 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(t);
    };
  }, [userId, isPending]);

  useEffect(() => {
    if (isPending || !userId) return;
    let cancelled = false;
    let timer: number | undefined;
    let inflight = false;
    let queued = false;
    ready.current = false;

    const push = async () => {
      if (inflight) {
        queued = true;
        return;
      }
      inflight = true;
      try {
        const local = localProgress();
        const merged = await syncPapersProgress({ data: local });
        if (!cancelled && !progressEqual(localProgress(), merged)) {
          // Only adopt the merge if nothing changed locally mid-flight.
          if (progressEqual(localProgress(), local)) usePapersStore.getState().applyProgress(merged as Parameters<ReturnType<typeof usePapersStore.getState>["applyProgress"]>[0]);
          else queued = true;
        }
      } catch {
        /* retry on next change */
      } finally {
        inflight = false;
        ready.current = true;
        if (queued && !cancelled) {
          queued = false;
          void push();
        }
      }
    };

    const start = async () => {
      const api = usePapersStore.persist;
      if (api?.hasHydrated && !api.hasHydrated()) await api.rehydrate();
      if (!cancelled) await push();
    };
    void start();

    const unsub = usePapersStore.subscribe((s, prev) => {
      if (!ready.current) return;
      if (s.attempts === prev.attempts && s.flash === prev.flash && s.mistakes === prev.mistakes && s.cleared === prev.cleared) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void push(), 2000);
    });
    const onHide = () => document.visibilityState === "hidden" && void push();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unsub();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [userId, isPending]);

  return null;
}
