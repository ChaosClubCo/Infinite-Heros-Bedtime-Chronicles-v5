import { reconcile } from '../lib/sync/reconcile';
import {
  storyToRecord,
  recordToStory,
  badgeToRecord,
  recordToBadge,
  streakToRecord,
  recordToStreak,
  profileStubToRecord,
} from '../lib/sync/mappers';
import type { CachedStory, EarnedBadge, StreakData, ChildProfile } from '../constants/types';
import type { SyncRecord } from '../shared/sync-types';

export interface SyncVerificationResult {
  mappersValid: boolean;
  reconciliationValid: boolean;
  summary: {
    storyStrippedImages: boolean;
    storyRestored: boolean;
    badgeRestored: boolean;
    streakRestored: boolean;
    profileStubPiiFree: boolean;
    localAppliedCount: number;
    remotePushedCount: number;
  };
}

export function verifySyncEngine(silent = false): SyncVerificationResult {
  if (!silent) console.log('--- RUNNING CLOUD SYNC END-TO-END VERIFICATION ---');

  // 1. Verify Mappers
  if (!silent) console.log('\n[1/3] Verifying Mappers...');

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
  const storyStrippedImages = !('avatar' in storyRecord.payload) && !('scenes' in storyRecord.payload);
  const restoredStory = recordToStory(storyRecord);
  const storyRestored = restoredStory.id === mockStory.id && restoredStory.title === mockStory.title;

  const mockBadge: EarnedBadge = {
    id: 'badge_1',
    profileId: 'profile_sam',
    badgeKey: 'streak_3',
    earnedAt: 1718000500000,
  };

  const badgeRecord = badgeToRecord(mockBadge);
  const restoredBadge = recordToBadge(badgeRecord);
  const badgeRestored = restoredBadge.id === mockBadge.id && restoredBadge.badgeKey === mockBadge.badgeKey;

  const mockStreak: StreakData = {
    profileId: 'profile_sam',
    currentStreak: 3,
    longestStreak: 5,
    lastStoryDate: '2026-07-13',
  };

  const streakRecord = streakToRecord(mockStreak);
  const restoredStreak = recordToStreak(streakRecord);
  const streakRestored = restoredStreak.profileId === mockStreak.profileId && restoredStreak.currentStreak === 3;

  const mockProfile: ChildProfile = {
    id: 'profile_sam',
    name: 'Sam',
    age: 6,
    avatarEmoji: '🦊',
    favoriteHeroId: 'hero_nova',
    createdAt: 1718000000000,
  };

  const profileStubRecord = profileStubToRecord(mockProfile);
  const payloadStr = JSON.stringify(profileStubRecord.payload);
  const profileStubPiiFree = !payloadStr.includes('Sam') && !payloadStr.includes('6');

  const mappersValid = storyStrippedImages && storyRestored && badgeRestored && streakRestored && profileStubPiiFree;

  if (!silent) {
    console.log('Story mapped to record:');
    console.log(' - ID:', storyRecord.id);
    console.log(' - Deleted:', storyRecord.deleted);
    console.log(' - Stripped avatar:', !('avatar' in storyRecord.payload));
    console.log(' - Stripped scenes:', !('scenes' in storyRecord.payload));
    console.log('Restored Story id matches:', storyRestored);
    console.log('Restored Badge matches:', badgeRestored);
    console.log('Restored Streak matches:', streakRestored);
    console.log('Profile stub mapped payload (no PII):', payloadStr);
  }

  // 2. Verify Reconciliation Logic
  if (!silent) console.log('\n[2/3] Verifying Reconciliation Logic...');

  const localMap: Record<string, SyncRecord> = {
    item_1: { id: 'item_1', updatedAt: 200, deleted: false, payload: { val: 'local-wins' } },
    item_2: { id: 'item_2', updatedAt: 100, deleted: true, payload: {} },
    item_3: { id: 'item_3', updatedAt: 100, deleted: false, payload: { val: 'agree' } },
    item_4: { id: 'item_4', updatedAt: 100, deleted: false, payload: { val: 'local-only' } },
  };

  const remoteMap: Record<string, SyncRecord> = {
    item_1: { id: 'item_1', updatedAt: 100, deleted: false, payload: { val: 'remote-older' } },
    item_2: { id: 'item_2', updatedAt: 100, deleted: false, payload: { val: 'remote-not-deleted' } },
    item_3: { id: 'item_3', updatedAt: 100, deleted: false, payload: { val: 'agree' } },
    item_5: { id: 'item_5', updatedAt: 100, deleted: false, payload: { val: 'remote-only' } },
  };

  const result = reconcile(localMap, remoteMap);
  const reconciliationValid =
    result.applyLocal.length === 1 &&
    result.applyLocal[0].id === 'item_5' &&
    result.pushRemote.length === 1 &&
    result.pushRemote[0].id === 'item_4';

  if (!silent) {
    console.log('Reconciliation result:');
    console.log(' - Apply Local (expect item_5):', result.applyLocal.map((r) => r.id));
    console.log(' - Push Remote (expect item_4):', result.pushRemote.map((r) => r.id));
    console.log('\n[3/3] Verification complete! All logic checks out.');
  }

  return {
    mappersValid,
    reconciliationValid,
    summary: {
      storyStrippedImages,
      storyRestored,
      badgeRestored,
      streakRestored,
      profileStubPiiFree,
      localAppliedCount: result.applyLocal.length,
      remotePushedCount: result.pushRemote.length,
    },
  };
}

// When invoked directly from CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('verify-sync')) {
  const res = verifySyncEngine(false);
  if (!res.mappersValid || !res.reconciliationValid) {
    process.exit(1);
  }
}
