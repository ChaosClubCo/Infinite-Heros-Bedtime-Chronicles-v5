/**
 * Cloud-sync orchestration: for one entity, pull the cloud copy, reconcile it
 * against local (last-write-wins), then apply the winners locally and push the
 * local winners up. Storage access is abstracted behind an `EntityAdapter` so
 * the engine stays pure orchestration and is unit-testable with fakes.
 *
 * The engine does NOT decide whether to sync — callers gate it on the parent
 * opt-in flag + a signed-in session (see the SyncContext wiring).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncEntity, SyncRecord } from '@shared/sync-types';
import { reconcile } from './reconcile';
import { indexById } from './mappers';
import { pullRecords, pushRecords } from './supabase-sync';

/**
 * Bridges one entity to local storage. `readLocal` returns the device's current
 * records (via the mappers); `applyLocal` writes the reconciled winners back
 * (upserting non-deleted records, removing tombstoned ones).
 */
export interface EntityAdapter {
  readLocal(): Promise<SyncRecord[]>;
  applyLocal(records: SyncRecord[]): Promise<void>;
}

export interface EntitySyncResult {
  entity: SyncEntity;
  pulled: number;
  pushed: number;
}

/** Sync a single entity. Throws if the network/storage layer throws. */
export async function syncEntity(
  sb: SupabaseClient,
  userId: string,
  entity: SyncEntity,
  adapter: EntityAdapter,
): Promise<EntitySyncResult> {
  const [localArr, remoteArr] = await Promise.all([
    adapter.readLocal(),
    pullRecords(sb, userId, entity),
  ]);

  const { applyLocal, pushRemote } = reconcile(indexById(localArr), indexById(remoteArr));

  // Push first so a later local-apply failure doesn't lose our outbound changes;
  // both are idempotent (upsert / last-write-wins) so ordering is safe either way.
  await pushRecords(sb, userId, entity, pushRemote);
  if (applyLocal.length > 0) await adapter.applyLocal(applyLocal);

  return { entity, pulled: applyLocal.length, pushed: pushRemote.length };
}

/**
 * Sync every registered entity. Entities are independent, so one entity's
 * failure is isolated (recorded) rather than aborting the whole run.
 */
export async function syncAll(
  sb: SupabaseClient,
  userId: string,
  adapters: Partial<Record<SyncEntity, EntityAdapter>>,
): Promise<{ results: EntitySyncResult[]; errors: { entity: SyncEntity; error: string }[] }> {
  const results: EntitySyncResult[] = [];
  const errors: { entity: SyncEntity; error: string }[] = [];

  for (const [entity, adapter] of Object.entries(adapters) as [SyncEntity, EntityAdapter][]) {
    try {
      results.push(await syncEntity(sb, userId, entity, adapter));
    } catch (err) {
      errors.push({ entity, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { results, errors };
}
