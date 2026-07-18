import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSync, purgeCloudData } from './runSync';
import { getSupabaseClient } from '@/lib/AuthContext';
import { getVerifiedConsentGiven } from '@/lib/consentEvidence';
import { apiRequest } from '@/lib/query-client';
import { syncAll } from './engine';
import { reportSyncError } from './report';

vi.mock('@/lib/AuthContext', () => ({ getSupabaseClient: vi.fn() }));
vi.mock('@/lib/consentEvidence', () => ({ getVerifiedConsentGiven: vi.fn() }));
vi.mock('@/lib/query-client', () => ({ apiRequest: vi.fn() }));
vi.mock('./engine', () => ({ syncAll: vi.fn() }));
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

function validDeletionReceipt() {
  return {
    version: 2,
    receiptId: 'receipt-0123456789abcdef',
    completedAt: '2026-07-16T00:00:00.000Z',
    releaseCandidate: '0123456789abcdef0123456789abcdef01234567',
    status: 'completed',
    deletedScopes: [
      'voice_chat_history',
      'cloud_sync_records',
      'parent_auth_identity',
    ],
    localDeviceData: 'pending_client_cleanup',
  };
}

function responseWithJson(value: unknown): Response {
  return { json: vi.fn().mockResolvedValue(value) } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: the exact persisted consent evidence is valid; individual tests
  // override to exercise the fail-closed gate.
  vi.mocked(getVerifiedConsentGiven).mockResolvedValue(true);
});

describe('runSync', () => {
  it('is a no-op (returns false) when disabled', async () => {
    expect(await runSync(false)).toBe(false);
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it('is a no-op when verified parental consent is not given', async () => {
    vi.mocked(getVerifiedConsentGiven).mockResolvedValue(false);
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    expect(await runSync(true)).toBe(false);
    expect(syncAll).not.toHaveBeenCalled();
  });

  it('is a no-op when the verified consent read throws', async () => {
    vi.mocked(getVerifiedConsentGiven).mockRejectedValue(new Error('storage down'));
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

  it('syncs when enabled + verified + signed in', async () => {
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
  it('returns the server deletion receipt when signed in', async () => {
    const receipt = validDeletionReceipt();
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    vi.mocked(apiRequest).mockResolvedValue(responseWithJson(receipt));

    await expect(purgeCloudData()).resolves.toEqual(receipt);
    expect(apiRequest).toHaveBeenCalledWith('DELETE', 'api/account');
  });

  it('is a no-op when not signed in', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser(null) as never);
    await expect(purgeCloudData()).resolves.toBeNull();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('rejects a deletion response without a verifiable receipt', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(clientWithUser('user1') as never);
    vi.mocked(apiRequest).mockResolvedValue(responseWithJson({ status: 'completed' }));

    await expect(purgeCloudData()).rejects.toThrow('valid verification receipt');
  });
});
