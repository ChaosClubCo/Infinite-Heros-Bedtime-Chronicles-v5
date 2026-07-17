import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  storiesAdapter, badgesAdapter, streaksAdapter,
  favoritesAdapter, readAdapter, profileStubAdapter,
} from './storage-adapters';
import {
  getAllStories, mergeSyncedStories,
  getAllBadges, mergeSyncedBadges,
  getAllStreaks, mergeSyncedStreaks,
  getSyncSetRecords, applySyncedSet,
  getProfiles, mergeSyncedProfileStubs,
} from '@/lib/storage';
import type { CachedStory, EarnedBadge, StreakData, ChildProfile } from '@/constants/types';
import type { SyncRecord } from '@shared/sync-types';
import type { SyncedStory } from './mappers';

vi.mock('@/lib/storage', () => ({
  getAllStories: vi.fn(),
  mergeSyncedStories: vi.fn(),
  getAllBadges: vi.fn(),
  mergeSyncedBadges: vi.fn(),
  getAllStreaks: vi.fn(),
  mergeSyncedStreaks: vi.fn(),
  getSyncSetRecords: vi.fn(),
  applySyncedSet: vi.fn(),
  getProfiles: vi.fn(),
  mergeSyncedProfileStubs: vi.fn(),
  getEntityTombstones: vi.fn(),
  stampEntityTombstone: vi.fn(),
  clearEntityMeta: vi.fn(),
}));

import { getEntityTombstones, stampEntityTombstone, clearEntityMeta } from '@/lib/storage';

const baseStory: CachedStory = {
  id: 's1', timestamp: 1000,
  story: {
    title: 'T', parts: [{ text: 'x', partIndex: 0 }],
    vocabWord: { word: 'w', definition: 'd' }, joke: 'j', lesson: 'l', tomorrowHook: 'h',
    rewardBadge: { emoji: 'e', title: 'b', description: 'bd' },
  },
  avatar: 'data:image/png;base64,AAAA', scenes: { 0: 'data:image/png;base64,BBBB' },
  heroId: 'hero', mode: 'classic', voice: 'moonbeam', speed: 'medium', profileId: 'p1',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no local tombstones (individual tests override as needed).
  vi.mocked(getEntityTombstones).mockResolvedValue([]);
});

describe('storiesAdapter.readLocal', () => {
  it('maps local stories to records, stripping base64 blobs', async () => {
    vi.mocked(getAllStories).mockResolvedValue([baseStory]);
    const records = await storiesAdapter.readLocal();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('s1');
    expect('avatar' in (records[0].payload as object)).toBe(false);
    expect('scenes' in (records[0].payload as object)).toBe(false);
  });

  it('includes local deletion tombstones (for ids not currently live)', async () => {
    vi.mocked(getAllStories).mockResolvedValue([baseStory]);
    vi.mocked(getEntityTombstones).mockResolvedValue([
      { id: 'deleted-1', updatedAt: 9000, deleted: true },
    ]);
    const records = await storiesAdapter.readLocal();
    expect(records).toHaveLength(2);
    expect(records.find((r) => r.id === 'deleted-1')?.deleted).toBe(true);
  });

  it('does not emit a tombstone for an id that is also live locally', async () => {
    vi.mocked(getAllStories).mockResolvedValue([baseStory]);
    vi.mocked(getEntityTombstones).mockResolvedValue([
      { id: 's1', updatedAt: 9000, deleted: true },
    ]);
    const records = await storiesAdapter.readLocal();
    expect(records).toHaveLength(1);
    expect(records[0].deleted).toBe(false);
  });
});

describe('storiesAdapter.applyLocal', () => {
  it('splits upserts and tombstones and delegates to mergeSyncedStories', async () => {
    const { avatar: _a, scenes: _s, ...synced } = baseStory;
    const upsert: SyncRecord<SyncedStory> = { id: 's1', updatedAt: 1000, deleted: false, payload: synced };
    const tombstone: SyncRecord = { id: 'gone', updatedAt: 2000, deleted: true, payload: {} };

    await storiesAdapter.applyLocal([upsert, tombstone]);

    expect(mergeSyncedStories).toHaveBeenCalledTimes(1);
    const [upserts, deletes] = vi.mocked(mergeSyncedStories).mock.calls[0];
    expect(upserts.map((s) => s.id)).toEqual(['s1']);
    expect(deletes).toEqual(['gone']);
  });

  it('records an applied remote tombstone at the remote timestamp, and clears meta for upserts', async () => {
    const { avatar: _a, scenes: _s, ...synced } = baseStory;
    await storiesAdapter.applyLocal([
      { id: 's1', updatedAt: 1000, deleted: false, payload: synced },
      { id: 'gone', updatedAt: 2000, deleted: true, payload: {} },
    ]);
    expect(stampEntityTombstone).toHaveBeenCalledWith('stories', 'gone', 2000);
    expect(clearEntityMeta).toHaveBeenCalledWith('stories', 's1');
  });
});

describe('badgesAdapter', () => {
  const badge: EarnedBadge = { id: 'b1', emoji: 'x', title: 't', description: 'd', earnedAt: 42, profileId: 'p1' };

  it('readLocal maps badges to records keyed by (profileId, badge id) to avoid cross-profile collision', async () => {
    vi.mocked(getAllBadges).mockResolvedValue([badge]);
    const records = await badgesAdapter.readLocal();
    expect(records).toEqual([{ id: 'p1:b1', updatedAt: 42, deleted: false, payload: badge }]);
  });

  it('applyLocal upserts non-deleted and removes tombstones', async () => {
    await badgesAdapter.applyLocal([
      { id: 'b1', updatedAt: 42, deleted: false, payload: badge },
      { id: 'b2', updatedAt: 50, deleted: true, payload: {} },
    ]);
    const [upserts, deletes] = vi.mocked(mergeSyncedBadges).mock.calls[0];
    expect(upserts.map((b) => b.id)).toEqual(['b1']);
    expect(deletes).toEqual(['b2']);
  });
});

describe('streaksAdapter', () => {
  const streak: StreakData = { profileId: 'p1', currentStreak: 3, longestStreak: 5, lastStoryDate: '2026-07-12' };

  it('readLocal maps streaks to records keyed by profileId', async () => {
    vi.mocked(getAllStreaks).mockResolvedValue([streak]);
    const records = await streaksAdapter.readLocal();
    expect(records[0].id).toBe('p1');
    expect(records[0].payload).toEqual(streak);
  });

  it('applyLocal upserts non-deleted and removes tombstones', async () => {
    await streaksAdapter.applyLocal([
      { id: 'p1', updatedAt: 1, deleted: false, payload: streak },
      { id: 'p2', updatedAt: 2, deleted: true, payload: {} },
    ]);
    const [upserts, deletes] = vi.mocked(mergeSyncedStreaks).mock.calls[0];
    expect(upserts.map((s) => s.profileId)).toEqual(['p1']);
    expect(deletes).toEqual(['p2']);
  });
});

describe('favoritesAdapter / readAdapter (presence sets)', () => {
  it('readLocal wraps sidecar records with an empty payload', async () => {
    vi.mocked(getSyncSetRecords).mockResolvedValue([{ id: 'a', updatedAt: 5, deleted: false }]);
    const records = await favoritesAdapter.readLocal();
    expect(records).toEqual([{ id: 'a', updatedAt: 5, deleted: false, payload: {} }]);
    expect(getSyncSetRecords).toHaveBeenCalledWith('favorites');
  });

  it('applyLocal forwards id/updatedAt/deleted to applySyncedSet', async () => {
    await readAdapter.applyLocal([{ id: 'a', updatedAt: 5, deleted: true, payload: {} }]);
    expect(applySyncedSet).toHaveBeenCalledWith('read', [{ id: 'a', updatedAt: 5, deleted: true }]);
  });
});

describe('profileStubAdapter', () => {
  const profile: ChildProfile = { id: 'p1', name: 'Ada', age: 6, favoriteHeroId: 'h', avatarEmoji: '🦸', createdAt: 999 };

  it('readLocal emits stubs with no PII (id + createdAt only)', async () => {
    vi.mocked(getProfiles).mockResolvedValue([profile]);
    const records = await profileStubAdapter.readLocal();
    expect(records[0]).toEqual({ id: 'p1', updatedAt: 999, deleted: false, payload: { createdAt: 999 } });
    expect(JSON.stringify(records)).not.toContain('Ada');
  });

  it('applyLocal merges stubs and forwards tombstones', async () => {
    await profileStubAdapter.applyLocal([
      { id: 'p1', updatedAt: 999, deleted: false, payload: { createdAt: 999 } },
      { id: 'p2', updatedAt: 1, deleted: true, payload: {} },
    ]);
    const [stubs, deletes] = vi.mocked(mergeSyncedProfileStubs).mock.calls[0];
    expect(stubs).toEqual([{ id: 'p1', createdAt: 999 }]);
    expect(deletes).toEqual(['p2']);
    expect(stampEntityTombstone).toHaveBeenCalledWith('profileStub', 'p2', 1);
    expect(clearEntityMeta).toHaveBeenCalledWith('profileStub', 'p1');
  });

  it('readLocal includes profile tombstones so a deletion propagates', async () => {
    vi.mocked(getProfiles).mockResolvedValue([profile]);
    vi.mocked(getEntityTombstones).mockResolvedValue([
      { id: 'p-old', updatedAt: 500, deleted: true },
    ]);
    const records = await profileStubAdapter.readLocal();
    expect(records.find((r) => r.id === 'p-old')?.deleted).toBe(true);
  });
});
