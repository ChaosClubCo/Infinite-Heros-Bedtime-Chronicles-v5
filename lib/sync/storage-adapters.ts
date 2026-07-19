/**
 * EntityAdapters bind the sync engine to local AsyncStorage. All six entities
 * are wired: `stories` (blob-preserving), `badges`, `streaks`, `favorites`,
 * `read`, and `profileStub`.
 *
 * Known limitation: badges/streaks key on a per-install `profileId`. `profileStub`
 * anchors them across devices by creating an editable placeholder profile for an
 * unknown id (the parent renames it; name/age never sync) — see
 * `mergeSyncedProfileStubs`.
 */

import {
  getAllStories, mergeSyncedStories,
  getAllBadges, mergeSyncedBadges,
  getAllStreaks, mergeSyncedStreaks,
  getSyncSetRecords, applySyncedSet,
  getProfiles, mergeSyncedProfileStubs,
  getEntityTombstones, stampEntityTombstone, clearEntityMeta,
} from '@/lib/storage';
import type { EarnedBadge, StreakData } from '@/constants/types';
import type { SyncRecord } from '@shared/sync-types';
import type { EntityAdapter } from './engine';
import {
  storyToRecord, recordToStory, type SyncedStory,
  badgeToRecord, recordToBadge,
  streakToRecord, recordToStreak,
  profileStubToRecord, type ProfileStub,
} from './mappers';

const deletedIds = (records: SyncRecord[]) => records.filter((r) => r.deleted).map((r) => r.id);

export const storiesAdapter: EntityAdapter = {
  async readLocal(): Promise<SyncRecord[]> {
    const live = (await getAllStories()).map(storyToRecord);
    const liveIds = new Set(live.map((r) => r.id));
    // Include local deletion tombstones so a delete wins reconciliation.
    const tombs: SyncRecord[] = (await getEntityTombstones('stories'))
      .filter((t) => !liveIds.has(t.id))
      .map((t) => ({ ...t, payload: {} }));
    return [...live, ...tombs];
  },
  async applyLocal(records: SyncRecord[]): Promise<void> {
    const upserts = records
      .filter((r) => !r.deleted)
      .map((r) => recordToStory(r as SyncRecord<SyncedStory>));
    await mergeSyncedStories(upserts, deletedIds(records));
    // Keep the sidecar consistent: a live upsert clears any stale local tombstone;
    // an applied remote deletion is recorded at the remote's timestamp so it wins
    // future reconciles without a "now" stamp beating a newer live copy elsewhere.
    for (const r of records) {
      if (r.deleted) await stampEntityTombstone('stories', r.id, r.updatedAt);
      else await clearEntityMeta('stories', r.id);
    }
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

/** Favorites/read are presence sets: the record's `deleted` flag IS the value. */
function setAdapter(entity: 'favorites' | 'read'): EntityAdapter {
  return {
    async readLocal(): Promise<SyncRecord[]> {
      const records = await getSyncSetRecords(entity);
      return records.map((r) => ({ ...r, payload: {} }));
    },
    async applyLocal(records: SyncRecord[]): Promise<void> {
      await applySyncedSet(entity, records.map((r) => ({ id: r.id, updatedAt: r.updatedAt, deleted: r.deleted })));
    },
  };
}

export const favoritesAdapter: EntityAdapter = setAdapter('favorites');
export const readAdapter: EntityAdapter = setAdapter('read');

export const profileStubAdapter: EntityAdapter = {
  async readLocal(): Promise<SyncRecord[]> {
    const live = (await getProfiles()).map(profileStubToRecord);
    const liveIds = new Set(live.map((r) => r.id));
    const tombs: SyncRecord[] = (await getEntityTombstones('profileStub'))
      .filter((t) => !liveIds.has(t.id))
      .map((t) => ({ ...t, payload: {} }));
    return [...live, ...tombs];
  },
  async applyLocal(records: SyncRecord[]): Promise<void> {
    const stubs = records
      .filter((r) => !r.deleted)
      .map((r) => ({ id: r.id, createdAt: (r.payload as ProfileStub).createdAt }));
    await mergeSyncedProfileStubs(stubs, deletedIds(records));
    for (const r of records) {
      if (r.deleted) await stampEntityTombstone('profileStub', r.id, r.updatedAt);
      else await clearEntityMeta('profileStub', r.id);
    }
  },
};
