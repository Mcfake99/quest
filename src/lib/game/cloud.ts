import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { sanitizeSave } from "./save";
import type { SaveState } from "./types";

function asSave(value: unknown): SaveState | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return sanitizeSave(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }
  return sanitizeSave(value);
}

export const loadCloudSave = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ save: unknown; updated_at: string }>`
      select save, updated_at from game_saves where user_id = ${context.userId} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const save = asSave(row.save);
    if (!save) return null;
    return { save, updatedAt: row.updated_at };
  });

export const saveCloudSave = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => sanitizeSave(data))
  .handler(async ({ context, data }) => {
    const payload = JSON.stringify(data);
    if (payload.length > 400_000) {
      throw new Error("Save is too large.");
    }
    const sql = await getSql();
    await sql.query(
      `insert into game_saves (user_id, save, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (user_id) do update set save = excluded.save, updated_at = now()`,
      [context.userId, payload],
    );
    return { ok: true as const };
  });
