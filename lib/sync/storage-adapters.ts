/**
 * EntityAdapters bind the sync engine to local AsyncStorage. Phase 2 ships the
 * flagship `stories` adapter end-to-end (backup/restore of the story library).
 *
 * The other entities are staged (Phase 2b):
 *   - badges / streaks: clean array merges, but they key on a per-device
 *     `profileId`, so cross-device value depends on syncing profile identity;
 *   - profileStub: applying a stub for an unknown id needs a placeholder-profile
 *     UX decision;
 *   - favorites / read: timestamp-less sets that need a per-item change-time
 *     sidecar before last-write-wins is meaningful.
 */

import { getAllStories, mergeSyncedStories } from '@/lib/storage';
import type { SyncRecord } from '@shared/sync-types';
import type { EntityAdapter } from './engine';
import { storyToRecord, recordToStory, type SyncedStory } from './mappers';

export const storiesAdapter: EntityAdapter = {
  async readLocal(): Promise<SyncRecord[]> {
    const stories = await getAllStories();
    return stories.map(storyToRecord);
  },
  async applyLocal(records: SyncRecord[]): Promise<void> {
    const upserts = records
      .filter((r) => !r.deleted)
      .map((r) => recordToStory(r as SyncRecord<SyncedStory>));
    const deletedIds = records.filter((r) => r.deleted).map((r) => r.id);
    await mergeSyncedStories(upserts, deletedIds);
  },
};
