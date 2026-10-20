import { useEffect, type ReactNode } from "react";
import { CloudSync } from "@/components/game/CloudSync";
import { useGameStore } from "@/lib/game/store";

function ThemeApplier() {
  const theme = useGameStore((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (!theme || theme === "hall") delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);
  return null;
}

export function GameProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const apply = () => {
      try {
        useGameStore.getState().hydrateDay();
      } catch {
        /* A bad save must not take down the hall. */
      }
    };
    const persistApi = useGameStore.persist;
    if (!persistApi?.rehydrate) {
      apply();
      return;
    }
    const unsub = persistApi.onFinishHydration?.(apply);
    try {
      void persistApi.rehydrate();
    } catch {
      apply();
    }
    if (persistApi.hasHydrated?.()) apply();
    return typeof unsub === "function" ? unsub : undefined;
  }, []);

  return (
    <>
      <ThemeApplier />
      <CloudSync />
      {children}
    </>
  );
}
