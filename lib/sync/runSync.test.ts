import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSync, purgeCloudData } from './runSync';
import { getSupabaseClient } from '@/lib/AuthContext';
import { getConsentGiven } from '@/lib/storage';
import { syncAll } from './engine';
import { purgeCloud } from './supabase-sync';
import { reportSyncError } from './report';

vi.mock('@/lib/AuthContext', () => ({ getSupabaseClient: vi.fn() }));
vi.mock('@/lib/storage', () => ({ getConsentGiven: vi.fn() }));
vi.mock('./engine', () => ({ syncAll: vi.fn() }));
vi.mock('./supabase-sync', () => ({ purgeCloud: vi.fn() }));
vi.mock('./report', () => ({ reportSyncError: vi.fn() }));
vi.mock('./storage-adapters', () => {
  const stub = () => ({ readLocal: vi.fn(), applyLocal: vi.fn() });
  return {
    storiesAdapter: stub(), badgesAdapter: stub(), streaksAdapter: stub(),
    favoritesAdapter: stub(), readAdapter: stub(), profileStubAdapter: stub(),
  };
});

function clientWithUser(userId: string | null) {
  return { auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) } };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: parent consent is valid; individual tests override to exercise the gate.
  vi.mocked(getConsentGiven).mockResolvedValue(true);
});

describe('runSync', () => {
  it('is a no-op (returns false) when disabled', async () => {
    expect(await runSync(false)).toBe(false);
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it('is a no-op when parental consent is not given (COPPA gate)', async () => {
    vi.mocked(getConsentGiven).mockResolvedValue(false);
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    expect(await runSync(true)).toBe(false);
    expect(syncAll).not.toHaveBeenCalled();
  });

  it('is a no-op when the consent read throws (fail-safe to no-sync)', async () => {
    vi.mocked(getConsentGiven).mockRejectedValue(new Error('storage down'));
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    expect(await runSync(true)).toBe(false);
    expect(syncAll).not.toHaveBeenCalled();
  });

  it('is a no-op when Supabase is not configured', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null);
    expect(await runSync(true)).toBe(false);
    expect(syncAll).not.toHaveBeenCalled();
  });

  it('is a no-op when no user is signed in', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser(null) as never);
    expect(await runSync(true)).toBe(false);
    expect(syncAll).not.toHaveBeenCalled();
  });

  it('syncs when enabled + signed in', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    vi.mocked(syncAll).mockResolvedValue({ results: [], errors: [] });
    expect(await runSync(true)).toBe(true);
    expect(syncAll).toHaveBeenCalledWith(expect.anything(), 'user1', expect.objectContaining({ stories: expect.anything() }));
  });

  it('never throws — a sync failure returns false', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    vi.mocked(syncAll).mockRejectedValue(new Error('network down'));
    expect(await runSync(true)).toBe(false);
  });

  it('reports each per-entity error (still returns true — a run happened)', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    vi.mocked(syncAll).mockResolvedValue({
      results: [],
      errors: [
        { entity: 'stories', error: 'boom' },
        { entity: 'badges', error: 'kaboom' },
      ],
    });
    expect(await runSync(true)).toBe(true);
    expect(reportSyncError).toHaveBeenCalledWith('syncAll:stories', 'boom');
    expect(reportSyncError).toHaveBeenCalledWith('syncAll:badges', 'kaboom');
  });

  it('reports the top-level failure when the sync throws', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    const err = new Error('network down');
    vi.mocked(syncAll).mockRejectedValue(err);
    expect(await runSync(true)).toBe(false);
    expect(reportSyncError).toHaveBeenCalledWith('runSync', err);
  });
});

describe('purgeCloudData', () => {
  it('purges when signed in', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    vi.mocked(purgeCloud).mockResolvedValue(undefined);
    expect(await purgeCloudData()).toBe(true);
    expect(purgeCloud).toHaveBeenCalledWith(expect.anything(), 'user1');
  });

  it('is a no-op when not signed in', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser(null) as never);
    expect(await purgeCloudData()).toBe(false);
    expect(purgeCloud).not.toHaveBeenCalled();
  });

  it('reports the failure and returns false when the purge throws', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    const err = new Error('purge failed');
    vi.mocked(purgeCloud).mockRejectedValue(err);
    expect(await purgeCloudData()).toBe(false);
    expect(reportSyncError).toHaveBeenCalledWith('purgeCloudData', err);
  });
});
