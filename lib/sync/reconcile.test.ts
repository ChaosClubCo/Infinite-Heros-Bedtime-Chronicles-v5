import { describe, it, expect } from 'vitest';
import { reconcile } from './reconcile';
import type { SyncRecord, SyncRecordMap } from '@shared/sync-types';

function rec(id: string, updatedAt: number, deleted = false): SyncRecord<{ v: string }> {
  return { id, updatedAt, deleted, payload: { v: id } };
}
function map(...records: SyncRecord<{ v: string }>[]): SyncRecordMap<{ v: string }> {
  return Object.fromEntries(records.map((r) => [r.id, r]));
}

describe('reconcile', () => {
  it('pushes records that exist only locally', () => {
    const r = reconcile(map(rec('a', 1)), {});
    expect(r.pushRemote.map((x) => x.id)).toEqual(['a']);
    expect(r.applyLocal).toEqual([]);
  });

  it('applies records that exist only remotely', () => {
    const r = reconcile({}, map(rec('a', 1)));
    expect(r.applyLocal.map((x) => x.id)).toEqual(['a']);
    expect(r.pushRemote).toEqual([]);
  });

  it('takes the newer side when both exist', () => {
    const remoteNewer = reconcile(map(rec('a', 1)), map(rec('a', 2)));
    expect(remoteNewer.applyLocal.map((x) => x.id)).toEqual(['a']);
    expect(remoteNewer.pushRemote).toEqual([]);

    const localNewer = reconcile(map(rec('a', 3)), map(rec('a', 2)));
    expect(localNewer.pushRemote.map((x) => x.id)).toEqual(['a']);
    expect(localNewer.applyLocal).toEqual([]);
  });

  it('is a no-op when both sides agree at the same timestamp', () => {
    const r = reconcile(map(rec('a', 5)), map(rec('a', 5)));
    expect(r.applyLocal).toEqual([]);
    expect(r.pushRemote).toEqual([]);
  });

  it('lets deletion win on an exact timestamp tie', () => {
    const remoteDeleted = reconcile(map(rec('a', 5, false)), map(rec('a', 5, true)));
    expect(remoteDeleted.applyLocal.map((x) => x.id)).toEqual(['a']);
    expect(remoteDeleted.applyLocal[0].deleted).toBe(true);

    const localDeleted = reconcile(map(rec('a', 5, true)), map(rec('a', 5, false)));
    expect(localDeleted.pushRemote.map((x) => x.id)).toEqual(['a']);
    expect(localDeleted.pushRemote[0].deleted).toBe(true);
  });

  it('propagates a newer remote tombstone as a local delete', () => {
    const r = reconcile(map(rec('a', 1, false)), map(rec('a', 2, true)));
    expect(r.applyLocal).toHaveLength(1);
    expect(r.applyLocal[0].deleted).toBe(true);
  });

  it('does not resurrect: an older remote copy loses to a newer local tombstone', () => {
    const r = reconcile(map(rec('a', 3, true)), map(rec('a', 2, false)));
    expect(r.pushRemote).toHaveLength(1);
    expect(r.pushRemote[0].deleted).toBe(true);
    expect(r.applyLocal).toEqual([]);
  });

  it('handles disjoint sets and empty inputs', () => {
    const r = reconcile(map(rec('a', 1)), map(rec('b', 1)));
    expect(r.pushRemote.map((x) => x.id)).toEqual(['a']);
    expect(r.applyLocal.map((x) => x.id)).toEqual(['b']);
    expect(reconcile({}, {})).toEqual({ applyLocal: [], pushRemote: [] });
  });
});
