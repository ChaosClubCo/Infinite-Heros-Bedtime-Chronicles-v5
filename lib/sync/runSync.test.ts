import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSync, purgeCloudData } from './runSync';
import { getSupabaseClient } from '@/lib/AuthContext';
import { syncAll } from './engine';
import { purgeCloud } from './supabase-sync';

vi.mock('@/lib/AuthContext', () => ({ getSupabaseClient: vi.fn() }));
vi.mock('./engine', () => ({ syncAll: vi.fn() }));
vi.mock('./supabase-sync', () => ({ purgeCloud: vi.fn() }));
vi.mock('./storage-adapters', () => ({ storiesAdapter: { readLocal: vi.fn(), applyLocal: vi.fn() } }));

function clientWithUser(userId: string | null) {
  return { auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) } };
}

beforeEach(() => vi.clearAllMocks());

describe('runSync', () => {
  it('is a no-op (returns false) when disabled', async () => {
    expect(await runSync(false)).toBe(false);
    expect(getSupabaseClient).not.toHaveBeenCalled();
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
});
