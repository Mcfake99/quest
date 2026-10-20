import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadCloudSave, saveCloudSave } from "@/lib/game/cloud";
import { useCloudStatus } from "@/lib/game/cloud-status";
import { currentSnapshot, replaceSave, useGameStore } from "@/lib/game/store";

export function CloudSync() {
  const { user, isPending } = useCurrentUserState();
  const setStatus = useCloudStatus((s) => s.setStatus);
  const readyRef = useRef(false);
  const userId = user?.id ?? null;
  const displayName = user?.displayName;

  useEffect(() => {
    if (isPending) {
      setStatus("loading");
      return;
    }
    if (!userId) {
      readyRef.current = false;
      setStatus("guest");
      return;
    }

    let cancelled = false;
    readyRef.current = false;
    setStatus("loading");

    const run = async () => {
      const persistApi = useGameStore.persist;
      if (persistApi?.hasHydrated && !persistApi.hasHydrated()) {
        await persistApi.rehydrate();
      }
      if (cancelled) return;
      try {
        const cloud = await loadCloudSave();
        if (cancelled) return;
        const local = currentSnapshot();
        if (cloud?.save?.onboarded) {
          replaceSave(cloud.save);
        } else if (local.onboarded) {
          await saveCloudSave({ data: local });
        } else if (displayName) {
          useGameStore.getState().onboard(displayName);
          await saveCloudSave({ data: currentSnapshot() });
        }
        if (!cancelled) {
          readyRef.current = true;
          setStatus("saved");
        }
      } catch {
        if (!cancelled) {
          readyRef.current = true;
          setStatus("error");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [userId, displayName, isPending, setStatus]);

  useEffect(() => {
    if (!userId) return;

    let timer: number | undefined;
    let inflight = false;
    let queued = false;

    const flush = () => {
      if (!readyRef.current) return;
      if (inflight) {
        queued = true;
        return;
      }
      inflight = true;
      setStatus("saving");
      saveCloudSave({ data: currentSnapshot() })
        .then(() => setStatus("saved"))
        .catch(() => setStatus("error"))
        .finally(() => {
          inflight = false;
          if (queued) {
            queued = false;
            flush();
          }
        });
    };

    const unsub = useGameStore.subscribe(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, 1400);
    });

    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);

    return () => {
      window.clearTimeout(timer);
      unsub();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [userId, setStatus]);

  return null;
}
