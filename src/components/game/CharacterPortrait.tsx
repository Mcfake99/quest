import { APPAREL, apparelById } from "@/lib/game/apparel";
import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function CharacterPortrait({
  className,
  kitId,
  alt,
}: {
  className?: string;
  kitId?: string;
  alt?: string;
}) {
  const equipped = useGameStore((s) => s.equippedApparel);
  const kit = apparelById(kitId ?? equipped);
  return (
    <figure className={cn("overflow-hidden bg-surface", className)}>
      <img
        src={kit.src}
        alt={alt ?? kit.name}
        className="h-full w-full object-cover object-[center_12%]"
      />
    </figure>
  );
}

export function WardrobeGrid() {
  const owned = useGameStore((s) => s.apparel) ?? ["default"];
  const equipped = useGameStore((s) => s.equippedApparel) ?? "default";
  const marks = useGameStore((s) => s.marks);
  const buy = useGameStore((s) => s.buy);
  const equipApparel = useGameStore((s) => s.equipApparel);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {APPAREL.map((kit) => {
        const has = owned.includes(kit.id);
        const on = equipped === kit.id;
        return (
          <button
            key={kit.id}
            type="button"
            onClick={() => {
              if (has) equipApparel(kit.id);
              else if (kit.cost > 0 && marks >= kit.cost) buy(`kit-${kit.id}`);
            }}
            className={cn(
              "overflow-hidden rounded-xl bg-surface text-left shadow-[var(--shadow-border)] transition-shadow duration-150",
              on && "shadow-[var(--shadow-border-hover)]",
            )}
          >
            <div className="relative aspect-[2/3] overflow-hidden">
              <img
                src={kit.src}
                alt=""
                className={cn(
                  "h-full w-full object-cover object-[center_12%]",
                  !has && "opacity-40 grayscale",
                )}
              />
              {!has ? (
                <span className="absolute inset-x-2 bottom-2 rounded-md bg-bg/80 px-2 py-1 text-center text-xs tabular-nums">
                  {kit.cost} mk
                </span>
              ) : on ? (
                <span className="absolute inset-x-2 bottom-2 rounded-md bg-accent px-2 py-1 text-center text-xs text-accent-fg">
                  Wearing
                </span>
              ) : null}
            </div>
            <div className="px-2.5 py-2">
              <p className="truncate text-sm text-fg">{kit.name}</p>
              <p className="truncate text-xs text-muted">{kit.blurb}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
