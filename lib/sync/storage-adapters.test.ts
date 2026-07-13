import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storiesAdapter, badgesAdapter, streaksAdapter } from './storage-adapters';
import {
  getAllStories, mergeSyncedStories,
  getAllBadges, mergeSyncedBadges,
  getAllStreaks, mergeSyncedStreaks,
} from '@/lib/storage';
import type { CachedStory, EarnedBadge, StreakData } from '@/constants/types';
import type { SyncRecord } from '@shared/sync-types';
import type { SyncedStory } from './mappers';

vi.mock('@/lib/storage', () => ({
  getAllStories: vi.fn(),
  mergeSyncedStories: vi.fn(),
  getAllBadges: vi.fn(),
  mergeSyncedBadges: vi.fn(),
  getAllStreaks: vi.fn(),
  mergeSyncedStreaks: vi.fn(),
}));

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

beforeEach(() => vi.clearAllMocks());

describe('storiesAdapter.readLocal', () => {
  it('maps local stories to records, stripping base64 blobs', async () => {
    vi.mocked(getAllStories).mockResolvedValue([baseStory]);
    const records = await storiesAdapter.readLocal();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('s1');
    expect('avatar' in (records[0].payload as object)).toBe(false);
    expect('scenes' in (records[0].payload as object)).toBe(false);
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
});

describe('badgesAdapter', () => {
  const badge: EarnedBadge = { id: 'b1', emoji: 'x', title: 't', description: 'd', earnedAt: 42, profileId: 'p1' };

  it('readLocal maps badges to records keyed by id', async () => {
    vi.mocked(getAllBadges).mockResolvedValue([badge]);
    const records = await badgesAdapter.readLocal();
    expect(records).toEqual([{ id: 'b1', updatedAt: 42, deleted: false, payload: badge }]);
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
