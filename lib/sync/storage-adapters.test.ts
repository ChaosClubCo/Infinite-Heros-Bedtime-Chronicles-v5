import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storiesAdapter } from './storage-adapters';
import { getAllStories, mergeSyncedStories } from '@/lib/storage';
import type { CachedStory } from '@/constants/types';
import type { SyncRecord } from '@shared/sync-types';
import type { SyncedStory } from './mappers';

vi.mock('@/lib/storage', () => ({
  getAllStories: vi.fn(),
  mergeSyncedStories: vi.fn(),
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
