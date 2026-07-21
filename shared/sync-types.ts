/**
 * Cloud-sync transport contract (Milestone 3).
 *
 * Transport-neutral: this module has NO client or server imports so it can be
 * shared by the client sync engine (`lib/sync/*`) and any future Supabase Edge
 * function. Entity-specific shapes (CachedStory, EarnedBadge, …) and the
 * mapping to/from AsyncStorage live in `lib/sync/mappers.ts` on the client.
 *
 * Every synced item is a `SyncRecord` envelope. Conflict resolution is
 * last-write-wins by `updatedAt`; deletions are soft (tombstones) so a delete
 * on one device propagates to others rather than being resurrected by a stale
 * copy. Maps 1:1 to a row in the `public.sync_records` table (see
 * `supabase/migrations/20260713000817_0001_sync_tables.sql`).
 */

export interface SyncRecord<T = unknown> {
  /** Stable per-entity id (story id, badge id, storyId for favorites, profileId for streaks). */
  id: string;
  /** ms epoch of the last change — the last-write-wins comparison key. */
  updatedAt: number;
  /** Soft-delete tombstone. When true, `payload` is ignored / empty. */
  deleted: boolean;
  /** Entity data. Empty object for tombstones. */
  payload: T;
}

/**
 * The kinds of data eligible to sync. Per the M3 decision this is stories +
 * gamification only — NEVER child-profile PII. `profileStub` carries only a
 * profile's id + createdAt so per-profile records (badges/streaks) line up
 * across devices without the name/age ever leaving the device.
 */
export type SyncEntity =
  | 'stories'
  | 'badges'
  | 'streaks'
  | 'favorites'
  | 'read'
  | 'profileStub';

export const SYNC_ENTITIES: readonly SyncEntity[] = [
  'stories',
  'badges',
  'streaks',
  'favorites',
  'read',
  'profileStub',
] as const;

/** A map of record id → record, the shape both reconcile inputs use. */
export type SyncRecordMap<T = unknown> = Record<string, SyncRecord<T>>;
