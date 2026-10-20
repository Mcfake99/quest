import { apparelById } from "@/lib/game/apparel";
import { Button } from "@/components/ui/button";
import { RARITY_LABEL, type LootDrop, type Rarity } from "@/lib/game/loot";
import { cn } from "@/lib/utils";

const TONE: Record<Rarity, string> = {
  common: "text-muted",
  rare: "text-accent",
  epic: "text-warn",
  legend: "text-ok",
};

export function CrateReveal({ drop, onClose }: { drop: LootDrop; onClose: () => void }) {
  const kit = drop.apparel ? apparelById(drop.apparel) : null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/75 p-4 sm:items-center">
      <div className="stagger-in w-full max-w-md rounded-2xl bg-surface p-5 shadow-[var(--shadow-lift)] sm:p-7">
        <p className={cn("text-xs uppercase tracking-widest", TONE[drop.rarity])}>
          {RARITY_LABEL[drop.rarity]} drop
        </p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">{drop.name}</h2>
        <p className="mt-3 text-sm text-muted">{drop.blurb}</p>
        {kit && kit.id !== "default" ? (
          <div className="mx-auto mt-5 h-64 w-44 overflow-hidden rounded-xl bg-raised sm:h-72 sm:w-48">
            <img
              src={kit.src}
              alt={kit.name}
              className="h-full w-full object-cover object-[center_10%]"
            />
          </div>
        ) : null}
        <Button className="mt-6 w-full" size="lg" onClick={onClose}>
          {kit ? "Wear it" : "Claim it"}
        </Button>
      </div>
    </div>
  );
}
