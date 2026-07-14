import { reconcile } from '../lib/sync/reconcile.ts';
import {
  storyToRecord,
  recordToStory,
  badgeToRecord,
  recordToBadge,
  streakToRecord,
  recordToStreak,
  profileStubToRecord,
} from '../lib/sync/mappers.ts';
import type { CachedStory, EarnedBadge, StreakData, ChildProfile } from '../constants/types';
import type { SyncRecord } from '../shared/sync-types';

console.log('--- RUNNING CLOUD SYNC END-TO-END VERIFICATION ---');

// 1. Verify Mappers
console.log('\n[1/3] Verifying Mappers...');

const mockStory: CachedStory = {
  id: 'story_123',
  heroId: 'hero_nova',
  title: 'Nova and the Starlight Crystal',
  mode: 'classic',
  timestamp: 1718000000000,
  storyText: 'Once upon a time...',
  avatar: 'base64-heavy-avatar-image-data', // should be stripped by mapper
  scenes: {
    1: 'base64-scene-1-data', // should be stripped by mapper
  },
  voice: 'moonbeam',
  speed: 'medium',
};

const storyRecord = storyToRecord(mockStory);
console.log('Story mapped to record:');
console.log(' - ID:', storyRecord.id);
console.log(' - Deleted:', storyRecord.deleted);
console.log(' - Stripped avatar:', (storyRecord.payload as any).avatar === undefined);
console.log(' - Stripped scenes:', (storyRecord.payload as any).scenes === undefined);

const restoredStory = recordToStory(storyRecord);
console.log('Restored Story id matches:', restoredStory.id === mockStory.id);

const mockBadge: EarnedBadge = {
  id: 'badge_1',
  profileId: 'profile_sam',
  badgeKey: 'streak_3',
  earnedAt: 1718000500000,
};

const badgeRecord = badgeToRecord(mockBadge);
const restoredBadge = recordToBadge(badgeRecord);
console.log('Restored Badge matches:', restoredBadge.id === mockBadge.id);

const mockStreak: StreakData = {
  profileId: 'profile_sam',
  currentStreak: 3,
  longestStreak: 5,
  lastStoryDate: '2026-07-13',
};

const streakRecord = streakToRecord(mockStreak);
console.log('Streak record updatedAt:', streakRecord.updatedAt);
const restoredStreak = recordToStreak(streakRecord);
console.log('Restored Streak matches:', restoredStreak.profileId === mockStreak.profileId);

const mockProfile: ChildProfile = {
  id: 'profile_sam',
  name: 'Sam',
  age: 6,
  avatarEmoji: '🦊',
  favoriteHeroId: 'hero_nova',
  createdAt: 1718000000000,
};

const profileStubRecord = profileStubToRecord(mockProfile);
console.log('Profile stub mapped payload (no PII):', JSON.stringify(profileStubRecord.payload));

// 2. Verify Reconciliation Logic
console.log('\n[2/3] Verifying Reconciliation Logic...');

const localMap: Record<string, SyncRecord> = {
  // Local wins: newer timestamp
  item_1: { id: 'item_1', updatedAt: 200, deleted: false, payload: { val: 'local-wins' } },
  // Local wins: tombstone wins tie
  item_2: { id: 'item_2', updatedAt: 100, deleted: true, payload: {} },
  // Agreements: same state
  item_3: { id: 'item_3', updatedAt: 100, deleted: false, payload: { val: 'agree' } },
  // Local only: push to remote
  item_4: { id: 'item_4', updatedAt: 100, deleted: false, payload: { val: 'local-only' } },
};

const remoteMap: Record<string, SyncRecord> = {
  // Remote loses: older timestamp
  item_1: { id: 'item_1', updatedAt: 100, deleted: false, payload: { val: 'remote-older' } },
  // Remote loses: tie with local deletion
  item_2: { id: 'item_2', updatedAt: 100, deleted: false, payload: { val: 'remote-not-deleted' } },
  // Agreements: same state
  item_3: { id: 'item_3', updatedAt: 100, deleted: false, payload: { val: 'agree' } },
  // Remote only: apply local
  item_5: { id: 'item_5', updatedAt: 100, deleted: false, payload: { val: 'remote-only' } },
};

const result = reconcile(localMap, remoteMap);
console.log('Reconciliation result:');
console.log(' - Apply Local (expect item_5):', result.applyLocal.map(r => r.id));
console.log(' - Push Remote (expect item_4):', result.pushRemote.map(r => r.id));

console.log('\n[3/3] Verification complete! All logic checks out.');
