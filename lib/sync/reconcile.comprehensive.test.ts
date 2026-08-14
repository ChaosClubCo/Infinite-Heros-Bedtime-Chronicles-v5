import { describe, it, expect } from 'vitest';
import { reconcile } from './reconcile';
import type { SyncRecord, SyncRecordMap } from '@shared/sync-types';

function createRec<T = unknown>(
  id: string,
  updatedAt: number,
  payload: T,
  deleted = false,
): SyncRecord<T> {
  return { id, updatedAt, deleted, payload };
}

function toMap<T = unknown>(...records: SyncRecord<T>[]): SyncRecordMap<T> {
  return Object.fromEntries(records.map((r) => [r.id, r]));
}

describe('reconcile (comprehensive edge cases)', () => {
  it('handles empty local and empty remote gracefully', () => {
    const result = reconcile({}, {});
    expect(result.applyLocal).toEqual([]);
    expect(result.pushRemote).toEqual([]);
  });

  it('handles multi-item batches with disjoint and overlapping keys', () => {
    const local = toMap(
      createRec('item1', 100, { title: 'Local 1' }),
      createRec('item2', 300, { title: 'Local 2 Newer' }),
      createRec('item3', 100, { title: 'Local 3 Older' }),
    );

    const remote = toMap(
      createRec('item2', 200, { title: 'Remote 2 Older' }),
      createRec('item3', 400, { title: 'Remote 3 Newer' }),
      createRec('item4', 500, { title: 'Remote 4 Only' }),
    );

    const { applyLocal, pushRemote } = reconcile(local, remote);

    // item1 is local only -> push
    // item2 is local newer -> push
    // item3 is remote newer -> apply local
    // item4 is remote only -> apply local
    expect(pushRemote.map((r) => r.id).sort()).toEqual(['item1', 'item2']);
    expect(applyLocal.map((r) => r.id).sort()).toEqual(['item3', 'item4']);
  });

  it('preserves deletion preference during timestamp ties across multiple items', () => {
    const local = toMap(
      createRec('tie1', 1000, { v: 1 }, true), // local deleted
      createRec('tie2', 1000, { v: 1 }, false), // local alive
    );

    const remote = toMap(
      createRec('tie1', 1000, { v: 1 }, false), // remote alive
      createRec('tie2', 1000, { v: 1 }, true), // remote deleted
    );

    const { applyLocal, pushRemote } = reconcile(local, remote);

    // tie1: local deleted wins -> push deletion
    expect(pushRemote).toEqual([
      expect.objectContaining({ id: 'tie1', deleted: true }),
    ]);

    // tie2: remote deleted wins -> apply remote deletion locally
    expect(applyLocal).toEqual([
      expect.objectContaining({ id: 'tie2', deleted: true }),
    ]);
  });

  it('guarantees idempotency of reconciliation results', () => {
    const local = toMap(
      createRec('a', 100, { val: 'a' }),
      createRec('b', 500, { val: 'b' }),
    );
    const remote = toMap(
      createRec('b', 200, { val: 'b_old' }),
      createRec('c', 300, { val: 'c' }),
    );

    const firstPass = reconcile(local, remote);

    // Simulate applying reconciliation to local and remote
    const simulatedLocal = { ...local };
    for (const rec of firstPass.applyLocal) {
      simulatedLocal[rec.id] = rec;
    }

    const simulatedRemote = { ...remote };
    for (const rec of firstPass.pushRemote) {
      simulatedRemote[rec.id] = rec;
    }

    // Second pass should be a complete no-op (all in sync)
    const secondPass = reconcile(simulatedLocal, simulatedRemote);
    expect(secondPass.applyLocal).toEqual([]);
    expect(secondPass.pushRemote).toEqual([]);
  });

  it('handles negative or zero timestamps safely', () => {
    const local = toMap(createRec('zero_ts', 0, { val: 'local_zero' }));
    const remote = toMap(createRec('zero_ts', 10, { val: 'remote_newer' }));

    const res = reconcile(local, remote);
    expect(res.applyLocal.map((r) => r.id)).toEqual(['zero_ts']);
    expect(res.pushRemote).toEqual([]);
  });
});
