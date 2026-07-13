import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { pullRecords, pushRecords, purgeCloud } from './supabase-sync';

interface BuilderState {
  op: 'select' | 'upsert' | 'delete' | null;
  filters: [string, unknown][];
  rows: unknown;
  opts: unknown;
}
interface Handlers {
  select?: (s: BuilderState) => { data: unknown; error: unknown };
  upsert?: (s: BuilderState) => { error: unknown };
  delete?: (s: BuilderState) => { error: unknown };
}

/** Minimal chainable/thenable stand-in for the Supabase query builder. */
function fakeClient(handlers: Handlers): SupabaseClient {
  return {
    from() {
      const state: BuilderState = { op: null, filters: [], rows: undefined, opts: undefined };
      const builder = {
        select() { state.op = 'select'; return builder; },
        upsert(rows: unknown, opts: unknown) { state.op = 'upsert'; state.rows = rows; state.opts = opts; return builder; },
        delete() { state.op = 'delete'; return builder; },
        eq(k: string, v: unknown) { state.filters.push([k, v]); return builder; },
        then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
          try {
            const h = handlers[state.op as keyof Handlers];
            resolve(h ? h(state) : { data: [], error: null });
          } catch (e) { reject(e); }
        },
      };
      return builder;
    },
  } as unknown as SupabaseClient;
}

describe('pullRecords', () => {
  it('filters by user + entity and maps rows to SyncRecords', async () => {
    let seen: BuilderState | undefined;
    const sb = fakeClient({
      select: (s) => {
        seen = s;
        return { data: [{ id: 'a', updated_at: 5, deleted: false, payload: { x: 1 } }], error: null };
      },
    });
    const recs = await pullRecords(sb, 'user1', 'stories');
    expect(recs).toEqual([{ id: 'a', updatedAt: 5, deleted: false, payload: { x: 1 } }]);
    expect(seen?.filters).toEqual([['user_id', 'user1'], ['entity', 'stories']]);
  });

  it('returns [] for null data', async () => {
    const sb = fakeClient({ select: () => ({ data: null, error: null }) });
    expect(await pullRecords(sb, 'u', 'badges')).toEqual([]);
  });

  it('throws on a query error', async () => {
    const sb = fakeClient({ select: () => ({ data: null, error: { message: 'boom' } }) });
    await expect(pullRecords(sb, 'u', 'badges')).rejects.toThrow(/boom/);
  });
});

describe('pushRecords', () => {
  it('upserts rows with user_id/entity and blanks tombstone payloads', async () => {
    let rows: Record<string, unknown>[] = [];
    const sb = fakeClient({ upsert: (s) => { rows = s.rows as Record<string, unknown>[]; return { error: null }; } });
    await pushRecords(sb, 'user1', 'stories', [
      { id: 'a', updatedAt: 1, deleted: false, payload: { keep: true } },
      { id: 'b', updatedAt: 2, deleted: true, payload: { stale: true } },
    ]);
    expect(rows[0]).toEqual({ user_id: 'user1', entity: 'stories', id: 'a', updated_at: 1, deleted: false, payload: { keep: true } });
    expect(rows[1]).toEqual({ user_id: 'user1', entity: 'stories', id: 'b', updated_at: 2, deleted: true, payload: {} });
  });

  it('is a no-op for an empty batch', async () => {
    const upsert = vi.fn(() => ({ error: null }));
    await pushRecords(fakeClient({ upsert }), 'u', 'stories', []);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('throws on an upsert error', async () => {
    const sb = fakeClient({ upsert: () => ({ error: { message: 'nope' } }) });
    await expect(pushRecords(sb, 'u', 'stories', [{ id: 'a', updatedAt: 1, deleted: false, payload: {} }])).rejects.toThrow(/nope/);
  });
});

describe('purgeCloud', () => {
  it('deletes all rows for the user', async () => {
    let seen: BuilderState | undefined;
    const sb = fakeClient({ delete: (s) => { seen = s; return { error: null }; } });
    await purgeCloud(sb, 'user1');
    expect(seen?.filters).toEqual([['user_id', 'user1']]);
  });

  it('throws on a delete error', async () => {
    const sb = fakeClient({ delete: () => ({ error: { message: 'denied' } }) });
    await expect(purgeCloud(sb, 'u')).rejects.toThrow(/denied/);
  });
});
