import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { mergeProgress, sanitizeProgress } from "./papers-merge";

/**
 * Push this device's papers progress; the server merges it with its stored copy
 * (union, never a blind overwrite) and returns the merged result for the client.
 */
export const syncPapersProgress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => sanitizeProgress(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ data: unknown }>`select data from papers_progress where user_id = ${context.userId}`;
    const stored = rows[0] ? sanitizeProgress(typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data) : null;
    const merged = stored ? mergeProgress(stored, data) : data;
    const payload = JSON.stringify(merged);
    if (payload.length > 1_500_000) throw new Error("Progress is too large.");
    await sql.query(
      `insert into papers_progress (user_id, data, updated_at) values ($1, $2::jsonb, now())
       on conflict (user_id) do update set data = excluded.data, updated_at = now()`,
      [context.userId, payload],
    );
    return merged;
  });

/** Record an app visit, at most once per 30 minutes per user. */
export const recordVisit = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql.query(
      `insert into activity_events (user_id, type)
       select $1::text, 'visit'
       where not exists (
         select 1 from activity_events
         where user_id = $1::text and created_at > now() - interval '30 minutes'
       )`,
      [context.userId],
    );
    return { ok: true as const };
  });
