/**
 * Pure last-write-wins reconciliation between a device's local records and the
 * cloud's records for one entity. No I/O, no time, no randomness — deterministic
 * and fully unit-testable (the risky heart of the sync engine).
 *
 * Rules per record id (union of both sides):
 *   - present on only one side          → copy it to the other side
 *   - present on both, newer updatedAt  → that side wins
 *   - equal updatedAt, differing delete → DELETION wins (converge to removed;
 *     safer for a kids' app than resurrecting content)
 *   - equal updatedAt, same delete      → already agree, no-op
 *
 * Tombstones (`deleted: true`) are ordinary records here: applying one locally
 * means "delete it locally", pushing one means "delete it in the cloud".
 */

import type { SyncRecord, SyncRecordMap } from '@shared/sync-types';

export interface ReconcileResult<T = unknown> {
  /** Remote records the device should apply locally (incl. tombstones to delete). */
  applyLocal: SyncRecord<T>[];
  /** Local records the device should push to the cloud (incl. tombstones). */
  pushRemote: SyncRecord<T>[];
}

/** True if `a` should win over `b` (newer, or deletion-wins on an exact tie). */
function wins<T>(a: SyncRecord<T>, b: SyncRecord<T>): boolean {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt;
  // Exact timestamp tie: a deletion is authoritative over a non-deletion.
  return a.deleted && !b.deleted;
}

export function reconcile<T = unknown>(
  local: SyncRecordMap<T>,
  remote: SyncRecordMap<T>,
): ReconcileResult<T> {
  const applyLocal: SyncRecord<T>[] = [];
  const pushRemote: SyncRecord<T>[] = [];

  const ids = new Set<string>([...Object.keys(local), ...Object.keys(remote)]);
  for (const id of ids) {
    const l = local[id];
    const r = remote[id];

    if (l && !r) {
      pushRemote.push(l);
    } else if (r && !l) {
      applyLocal.push(r);
    } else if (l && r) {
      if (wins(r, l)) applyLocal.push(r);
      else if (wins(l, r)) pushRemote.push(l);
      // else: identical winner state — already converged.
    }
  }

  return { applyLocal, pushRemote };
}
