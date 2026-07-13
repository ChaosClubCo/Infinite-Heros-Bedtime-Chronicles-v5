import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncRecord } from '@shared/sync-types';
import { syncEntity, syncAll, type EntityAdapter } from './engine';
import { pullRecords, pushRecords } from './supabase-sync';

vi.mock('./supabase-sync', () => ({
  pullRecords: vi.fn(),
  pushRecords: vi.fn(),
}));

const sb = {} as SupabaseClient;
const rec = (id: string, ts: number, deleted = false): SyncRecord => ({ id, updatedAt: ts, deleted, payload: { id } });

function adapter(local: SyncRecord[]): EntityAdapter & { applied: SyncRecord[][] } {
  const applied: SyncRecord[][] = [];
  return {
    applied,
    readLocal: vi.fn(async () => local),
    applyLocal: vi.fn(async (r: SyncRecord[]) => { applied.push(r); }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(pushRecords).mockResolvedValue(undefined);
});

describe('syncEntity', () => {
  it('applies remote winners locally and pushes local winners', async () => {
    // local A@2; remote A@1 (loses) + B@3 (new remote).
    vi.mocked(pullRecords).mockResolvedValue([rec('a', 1), rec('b', 3)]);
    const a = adapter([rec('a', 2)]);

    const result = await syncEntity(sb, 'user1', 'stories', a);

    expect(a.applied[0].map((r) => r.id)).toEqual(['b']); // pulled B locally
    expect(vi.mocked(pushRecords)).toHaveBeenCalledWith(sb, 'user1', 'stories', [expect.objectContaining({ id: 'a' })]);
    expect(result).toEqual({ entity: 'stories', pulled: 1, pushed: 1 });
  });

  it('does not call applyLocal when there is nothing to apply', async () => {
    vi.mocked(pullRecords).mockResolvedValue([]);
    const a = adapter([rec('a', 2)]);
    await syncEntity(sb, 'user1', 'stories', a);
    expect(a.applyLocal).not.toHaveBeenCalled();
    expect(vi.mocked(pushRecords)).toHaveBeenCalledWith(sb, 'user1', 'stories', [expect.objectContaining({ id: 'a' })]);
  });

  it('propagates a newer remote tombstone as a local delete', async () => {
    vi.mocked(pullRecords).mockResolvedValue([rec('a', 5, true)]);
    const a = adapter([rec('a', 2)]);
    const result = await syncEntity(sb, 'user1', 'badges', a);
    expect(a.applied[0][0]).toMatchObject({ id: 'a', deleted: true });
    expect(result.pulled).toBe(1);
  });
});

describe('syncAll', () => {
  it('syncs every adapter and isolates per-entity failures', async () => {
    vi.mocked(pullRecords).mockResolvedValue([]);
    const good = adapter([rec('a', 1)]);
    const bad: EntityAdapter = { readLocal: vi.fn(async () => { throw new Error('storage down'); }), applyLocal: vi.fn() };

    const { results, errors } = await syncAll(sb, 'user1', { stories: good, badges: bad });

    expect(results.map((r) => r.entity)).toEqual(['stories']);
    expect(errors).toEqual([{ entity: 'badges', error: 'storage down' }]);
  });
});
