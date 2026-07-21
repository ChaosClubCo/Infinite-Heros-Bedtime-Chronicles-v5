/**
 * Supabase I/O for the cloud-sync engine — the thin layer that reads/writes the
 * `public.sync_records` table (see `supabase/migrations/20260713000817_0001_sync_tables.sql`).
 *
 * Row-Level Security restricts every row to `auth.uid() = user_id`, so these
 * queries only ever touch the signed-in parent's own data. Takes a
 * `SupabaseClient` as a parameter (rather than importing the app singleton) so
 * it stays decoupled and unit-testable with a fake client.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncEntity, SyncRecord } from '@shared/sync-types';

const TABLE = 'sync_records';

interface SyncRow {
  id: string;
  updated_at: number;
  deleted: boolean;
  payload: unknown;
}

function rowToRecord(row: SyncRow): SyncRecord {
  return { id: row.id, updatedAt: row.updated_at, deleted: row.deleted, payload: row.payload };
}

/**
 * Pull all of an entity's cloud records for a user. Full-scan (no incremental
 * cursor) — kid datasets are small (a family's stories/badges), so a complete
 * pull each sync is simpler and avoids incremental-cursor edge cases.
 */
export async function pullRecords(
  sb: SupabaseClient,
  userId: string,
  entity: SyncEntity,
): Promise<SyncRecord[]> {
  const { data, error } = await sb
    .from(TABLE)
    .select('id, updated_at, deleted, payload')
    .eq('user_id', userId)
    .eq('entity', entity);
  if (error) throw new Error(`sync pull (${entity}) failed: ${error.message}`);
  return (data as SyncRow[] | null ?? []).map(rowToRecord);
}

/**
 * Upsert records (including tombstones) for an entity. Tombstones store an empty
 * payload so no stale data lingers server-side. No-op for an empty batch.
 */
export async function pushRecords(
  sb: SupabaseClient,
  userId: string,
  entity: SyncEntity,
  records: SyncRecord[],
): Promise<void> {
  if (records.length === 0) return;
  const rows = records.map((r) => ({
    user_id: userId,
    entity,
    id: r.id,
    updated_at: r.updatedAt,
    deleted: r.deleted,
    payload: r.deleted ? {} : r.payload,
  }));
  const { error } = await sb.from(TABLE).upsert(rows, { onConflict: 'user_id,entity,id' });
  if (error) throw new Error(`sync push (${entity}) failed: ${error.message}`);
}

/**
 * Hard-delete every synced row for a user — used by the "clear all data" flow so
 * a local wipe also purges the cloud copy. (Deleting the account itself purges
 * server-side via the auth.users cascade.)
 */
export async function purgeCloud(sb: SupabaseClient, userId: string): Promise<void> {
  const { error } = await sb.from(TABLE).delete().eq('user_id', userId);
  if (error) throw new Error(`cloud purge failed: ${error.message}`);
}
