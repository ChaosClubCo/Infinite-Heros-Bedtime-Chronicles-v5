/**
 * Map the app's local AsyncStorage shapes to/from the transport-neutral
 * `SyncRecord` envelope. Client-side because these know about `CachedStory`
 * etc. (`@/constants/types`); the envelope + reconcile stay dependency-free.
 *
 * Key rules:
 *   - Stories drop the heavy base64 blobs (`avatar`, `scenes`) before syncing —
 *     they are regenerable on the new device and would bloat Postgres/jsonb.
 *   - `updatedAt` is derived from the entity's own timestamps so last-write-wins
 *     works without adding new local bookkeeping (for entities that have one).
 *
 * Timestamp-less set entities (`favorites`, `read`) need a per-item change-time
 * sidecar and are handled in Phase 2 — they are intentionally not mapped here.
 */

import type { CachedStory, EarnedBadge, StreakData, ChildProfile } from '@/constants/types';
import type { SyncRecord, SyncRecordMap } from '@shared/sync-types';

/** A CachedStory as synced — without the base64 blobs. */
export type SyncedStory = Omit<CachedStory, 'avatar' | 'scenes'>;

/** Index an array of records by id for `reconcile`. Later ids win on collision. */
export function indexById<T>(records: SyncRecord<T>[]): SyncRecordMap<T> {
  const map: SyncRecordMap<T> = {};
  for (const rec of records) map[rec.id] = rec;
  return map;
}

// ---- stories ----------------------------------------------------------------

export function storyToRecord(story: CachedStory): SyncRecord<SyncedStory> {
  const { avatar: _avatar, scenes: _scenes, ...synced } = story;
  return {
    id: story.id,
    updatedAt: Math.max(story.timestamp, story.feedback?.timestamp ?? 0),
    deleted: false,
    payload: synced,
  };
}

/** Reconstruct a CachedStory from a synced record (blobs come back absent). */
export function recordToStory(rec: SyncRecord<SyncedStory>): CachedStory {
  return { ...rec.payload };
}

// ---- badges ----------------------------------------------------------------

export function badgeToRecord(badge: EarnedBadge): SyncRecord<EarnedBadge> {
  return { id: badge.id, updatedAt: badge.earnedAt, deleted: false, payload: badge };
}

// ---- streaks (id = profileId) ----------------------------------------------

export function streakToRecord(streak: StreakData): SyncRecord<StreakData> {
  const parsed = Date.parse(streak.lastStoryDate);
  return {
    id: streak.profileId,
    updatedAt: Number.isNaN(parsed) ? 0 : parsed,
    deleted: false,
    payload: streak,
  };
}

// ---- profile stub (id + createdAt ONLY — no name/age/avatar PII) ------------

export interface ProfileStub {
  createdAt: number;
}

export function profileStubToRecord(profile: ChildProfile): SyncRecord<ProfileStub> {
  return {
    id: profile.id,
    updatedAt: profile.createdAt,
    deleted: false,
    payload: { createdAt: profile.createdAt },
  };
}
