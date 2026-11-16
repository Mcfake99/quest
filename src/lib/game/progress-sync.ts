import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { mergeProgress, sanitizeProgress } from "./papers-merge";
import { sanitizeStudyBatch } from "./study-log-core";

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

/** Record an app visit (heartbeat); the server dedupes to one visit per 30 min. */
export const recordVisit = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { touchVisit } = await import("@/lib/admin/visits.server");
    await touchVisit(context.userId, true);
    return { ok: true as const };
  });

/** Upsert study-session log entries (mock sittings, quizzes, flashcard runs…). */
export const recordStudy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => sanitizeStudyBatch(data))
  .handler(async ({ context, data }) => {
    if (!data.length) return { saved: 0 };
    const sql = await getSql();
    const ts = (v: number | null | undefined) => (v == null ? null : new Date(v).toISOString());
    for (const e of data) {
      await sql.query(
        `insert into study_sessions
           (user_id, client_id, kind, mode, subject_id, ref, title, status, ended_by, started_at, ended_at, score, max_score, items, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, now())
         on conflict (user_id, client_id) do update set
           kind = excluded.kind, mode = excluded.mode, subject_id = excluded.subject_id, ref = excluded.ref,
           title = excluded.title, status = excluded.status, ended_by = excluded.ended_by,
           started_at = excluded.started_at, ended_at = excluded.ended_at, score = excluded.score,
           max_score = excluded.max_score, items = excluded.items, updated_at = now()
         -- never downgrade a finished sitting back to in-progress (stale retry)
         where study_sessions.status not in ('completed', 'abandoned') or excluded.status in ('completed', 'abandoned')`,
        [
          context.userId, e.id, e.kind, e.mode ?? null, e.subjectId ?? null, e.ref ?? null, e.title ?? null,
          e.status, e.endedBy ?? null, ts(e.startedAt), ts(e.endedAt), e.score ?? null, e.max ?? null, JSON.stringify(e.items),
        ],
      );
    }
    return { saved: data.length };
  });
