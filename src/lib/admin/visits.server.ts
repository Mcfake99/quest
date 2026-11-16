import { getSql } from "@/lib/db";

const g = globalThis as typeof globalThis & { __qfLastTouch__?: Map<string, number> };
const lastTouch = (g.__qfLastTouch__ ??= new Map());

/**
 * Mark a signed-in user as active now: bump user_presence.last_seen and log a
 * 'visit' event at most once per 30 min (any activity event counts). Throttled
 * in memory to one DB round-trip per user per minute. Best-effort; never throws.
 */
export async function touchVisit(userId: string | null | undefined, force = false): Promise<void> {
  if (!userId || userId === "dev-user") return;
  const now = Date.now();
  if (!force && now - (lastTouch.get(userId) ?? 0) < 60_000) return;
  lastTouch.set(userId, now);
  if (lastTouch.size > 5000) lastTouch.clear();
  try {
    const sql = await getSql();
    await sql.query(
      `with p as (
         insert into user_presence (user_id) values ($1::text)
         on conflict (user_id) do update set last_seen = now()
         returning 1
       )
       insert into activity_events (user_id, type)
       select $1::text, 'visit'
       where not exists (
         select 1 from activity_events
         where user_id = $1::text and created_at > now() - interval '30 minutes'
       )`,
      [userId],
    );
  } catch (err) {
    console.error("[activity] visit log failed", err);
  }
}
