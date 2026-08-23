import { describe, it, expect } from 'vitest';
import { SYNC_ENTITIES, type SyncEntity, type SyncRecord } from './sync-types';

describe('Shared Cloud Sync Types & Constants', () => {
  it('exports strictly defined sync entities array', () => {
    expect(SYNC_ENTITIES).toHaveLength(6);
    expect(SYNC_ENTITIES).toContain('stories');
    expect(SYNC_ENTITIES).toContain('badges');
    expect(SYNC_ENTITIES).toContain('streaks');
    expect(SYNC_ENTITIES).toContain('favorites');
    expect(SYNC_ENTITIES).toContain('read');
    expect(SYNC_ENTITIES).toContain('profileStub');
  });

  it('validates structure of a valid SyncRecord envelope', () => {
    const record: SyncRecord<{ title: string }> = {
      id: 'story-123',
      updatedAt: 1723650000000,
      deleted: false,
      payload: { title: 'Cosmic Adventure' },
    };

    expect(record.id).toBe('story-123');
    expect(typeof record.updatedAt).toBe('number');
    expect(record.deleted).toBe(false);
    expect(record.payload.title).toBe('Cosmic Adventure');
  });

  it('validates soft-delete tombstone record shape', () => {
    const tombstone: SyncRecord<Record<string, never>> = {
      id: 'story-deleted-999',
      updatedAt: 1723650005000,
      deleted: true,
      payload: {},
    };

    expect(tombstone.deleted).toBe(true);
    expect(tombstone.payload).toEqual({});
  });
});
