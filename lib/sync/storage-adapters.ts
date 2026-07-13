/**
 * EntityAdapters bind the sync engine to local AsyncStorage. Wired today:
 * `stories` (blob-preserving), `badges`, and `streaks`.
 *
 * Known limitation: badges/streaks key on a per-install `profileId`, so their
 * cross-device / post-reinstall value is bounded by the no-PII decision (profile
 * identity itself isn't synced). Still valuable for same-account backup/restore.
 *
 * Staged:
 *   - profileStub: syncing profile identity across devices without leaking
 *     name/age needs a placeholder-profile UX decision;
 *   - favorites / read: timestamp-less sets that need a per-item change-time
 *     sidecar before last-write-wins is meaningful.
 */

import {
  getAllStories, mergeSyncedStories,
  getAllBadges, mergeSyncedBadges,
  getAllStreaks, mergeSyncedStreaks,
} from '@/lib/storage';
import type { EarnedBadge, StreakData } from '@/constants/types';
import type { SyncRecord } from '@shared/sync-types';
import type { EntityAdapter } from './engine';
import {
  storyToRecord, recordToStory, type SyncedStory,
  badgeToRecord, recordToBadge,
  streakToRecord, recordToStreak,
} from './mappers';

const deletedIds = (records: SyncRecord[]) => records.filter((r) => r.deleted).map((r) => r.id);

export const storiesAdapter: EntityAdapter = {
  async readLocal(): Promise<SyncRecord[]> {
    const stories = await getAllStories();
    return stories.map(storyToRecord);
  },
  async applyLocal(records: SyncRecord[]): Promise<void> {
    const upserts = records
      .filter((r) => !r.deleted)
      .map((r) => recordToStory(r as SyncRecord<SyncedStory>));
    await mergeSyncedStories(upserts, deletedIds(records));
  },
};

export const badgesAdapter: EntityAdapter = {
  async readLocal(): Promise<SyncRecord[]> {
    const badges = await getAllBadges();
    return badges.map(badgeToRecord);
  },
  async applyLocal(records: SyncRecord[]): Promise<void> {
    const upserts = records.filter((r) => !r.deleted).map((r) => recordToBadge(r as SyncRecord<EarnedBadge>));
    await mergeSyncedBadges(upserts, deletedIds(records));
  },
};

export const streaksAdapter: EntityAdapter = {
  async readLocal(): Promise<SyncRecord[]> {
    const streaks = await getAllStreaks();
    return streaks.map(streakToRecord);
  },
  async applyLocal(records: SyncRecord[]): Promise<void> {
    const upserts = records.filter((r) => !r.deleted).map((r) => recordToStreak(r as SyncRecord<StreakData>));
    await mergeSyncedStreaks(upserts, deletedIds(records));
  },
};
