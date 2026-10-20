import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { playCheckIn } from "@/lib/game/audio";
import { useGameStore } from "@/lib/game/store";

export function CheckIn() {
  const claimed = useGameStore((s) => s.daily?.claimed);
  const sound = useGameStore((s) => s.sound);
  const claimCheckIn = useGameStore((s) => s.claimCheckIn);
  const [open, setOpen] = useState(false);
  const [reward, setReward] = useState<{
    xp: number;
    marks: number;
    streak: number;
    freezeUsed: boolean;
    crates: number;
  } | null>(null);

  useEffect(() => {
    if (claimed && !reward) return;
    if (!claimed) setOpen(true);
  }, [claimed, reward]);

  if (!open) return null;
  if (claimed && !reward) return null;

  function collect() {
    let result: ReturnType<typeof claimCheckIn> = null;
    try {
      result = claimCheckIn();
    } catch {
      setOpen(false);
      return;
    }
    if (result) {
      setReward(result);
      if (sound) playCheckIn();
    } else {
      setOpen(false);
    }
  }

  const streakLabel = reward
    ? `${reward.streak} ${reward.streak === 1 ? "day" : "days"}`
    : "";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)] sm:p-6">
        {!reward ? (
          <>
            <p className="text-xs uppercase tracking-widest text-muted">Daily board</p>
            <h2 className="mt-2 font-display text-3xl">Sign the roll</h2>
            <p className="mt-3 text-sm text-muted">
              Open QuestForge each day to keep your streak and collect marks. Miss a day and the
              streak resets — unless you hold a freeze.
            </p>
            <Button className="mt-6 w-full" size="lg" onClick={collect}>
              Collect today’s marks
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-widest text-muted">Streak</p>
            <h2 className="mt-2 font-display text-4xl tabular-nums">{streakLabel}</h2>
            <p className="mt-3 text-sm text-muted">
              +{reward.xp} XP and +{reward.marks} marks added to the ledger
              {reward.freezeUsed ? " · a freeze covered yesterday" : ""}
              {reward.crates > 0
                ? ` · ${reward.crates} loot crate${reward.crates === 1 ? "" : "s"} for the week.`
                : "."}
            </p>
            <Button className="mt-6 w-full" size="lg" onClick={() => setOpen(false)}>
              To the hall
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
