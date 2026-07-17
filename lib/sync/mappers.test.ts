import { describe, it, expect } from 'vitest';
import {
  storyToRecord,
  recordToStory,
  badgeToRecord,
  badgeSyncId,
  streakToRecord,
  profileStubToRecord,
  indexById,
} from './mappers';
import type { CachedStory, EarnedBadge, StreakData, ChildProfile } from '@/constants/types';

const story: CachedStory = {
  id: 's1',
  timestamp: 1000,
  story: {
    title: 'T', parts: [{ text: 'x', partIndex: 0 }],
    vocabWord: { word: 'w', definition: 'd' }, joke: 'j', lesson: 'l', tomorrowHook: 'h',
    rewardBadge: { emoji: 'e', title: 'b', description: 'bd' },
  },
  avatar: 'data:image/png;base64,AAAA',
  scenes: { 0: 'data:image/png;base64,BBBB' },
  heroId: 'hero', mode: 'classic', voice: 'moonbeam', speed: 'medium', profileId: 'p1',
};

describe('storyToRecord / recordToStory', () => {
  it('strips base64 blobs (avatar, scenes) before syncing', () => {
    const rec = storyToRecord(story);
    expect('avatar' in rec.payload).toBe(false);
    expect('scenes' in rec.payload).toBe(false);
    expect(rec.payload.story.title).toBe('T'); // story JSON is retained
    expect(rec.id).toBe('s1');
  });

  it('derives updatedAt from the newer of timestamp and feedback timestamp', () => {
    expect(storyToRecord(story).updatedAt).toBe(1000);
    const withFeedback = { ...story, feedback: { rating: 5, text: 'ok', timestamp: 2000 } };
    expect(storyToRecord(withFeedback).updatedAt).toBe(2000);
  });

  it('round-trips (minus the dropped blobs)', () => {
    const back = recordToStory(storyToRecord(story));
    expect(back.id).toBe('s1');
    expect(back.heroId).toBe('hero');
    expect(back.avatar).toBeUndefined();
    expect(back.scenes).toBeUndefined();
  });
});

describe('badgeToRecord', () => {
  it('keys by (profileId, badge id) so the same slug across profiles does not collide', () => {
    const badge: EarnedBadge = { id: 'b1', emoji: 'x', title: 't', description: 'd', earnedAt: 42, profileId: 'p1' };
    const rec = badgeToRecord(badge);
    expect(rec.id).toBe('p1:b1');
    expect(rec.updatedAt).toBe(42);
    expect(rec.payload).toEqual(badge);
  });

  it('gives two profiles that earned the same badge slug distinct record ids', () => {
    const kid1: EarnedBadge = { id: 'first-adventure', emoji: '⭐', title: 'First', description: 'd', earnedAt: 1, profileId: 'p1' };
    const kid2: EarnedBadge = { id: 'first-adventure', emoji: '⭐', title: 'First', description: 'd', earnedAt: 2, profileId: 'p2' };
    expect(badgeToRecord(kid1).id).not.toBe(badgeToRecord(kid2).id);
    expect(badgeSyncId(kid1)).toBe('p1:first-adventure');
  });
});

describe('streakToRecord', () => {
  it('prefers the ms-granularity lastUpdatedAt when present', () => {
    const streak: StreakData = {
      profileId: 'p1', currentStreak: 3, longestStreak: 5,
      lastStoryDate: '2026-07-12', lastUpdatedAt: 1_752_300_000_123,
    };
    const rec = streakToRecord(streak);
    expect(rec.id).toBe('p1');
    expect(rec.updatedAt).toBe(1_752_300_000_123);
  });

  it('falls back to parsing lastStoryDate for legacy records without lastUpdatedAt', () => {
    const streak: StreakData = { profileId: 'p1', currentStreak: 3, longestStreak: 5, lastStoryDate: '2026-07-12' };
    expect(streakToRecord(streak).updatedAt).toBe(Date.parse('2026-07-12'));
  });

  it('falls back to 0 for an unparseable date and no stamp', () => {
    const streak: StreakData = { profileId: 'p1', currentStreak: 0, longestStreak: 0, lastStoryDate: 'not-a-date' };
    expect(streakToRecord(streak).updatedAt).toBe(0);
  });
});

describe('profileStubToRecord', () => {
  it('carries only id + createdAt — never name/age/avatar PII', () => {
    const profile: ChildProfile = { id: 'p1', name: 'Ada', age: 6, favoriteHeroId: 'hero', avatarEmoji: '🦸', createdAt: 999 };
    const rec = profileStubToRecord(profile);
    expect(rec.id).toBe('p1');
    expect(rec.updatedAt).toBe(999);
    expect(rec.payload).toEqual({ createdAt: 999 });
    expect(JSON.stringify(rec)).not.toContain('Ada');
    expect(JSON.stringify(rec)).not.toContain('"age"');
  });
});

describe('indexById', () => {
  it('maps records by id', () => {
    const m = indexById([badgeToRecord({ id: 'b1', emoji: 'x', title: 't', description: 'd', earnedAt: 1, profileId: 'p1' })]);
    expect(Object.keys(m)).toEqual(['p1:b1']);
    expect(m['p1:b1'].id).toBe('p1:b1');
  });
});
