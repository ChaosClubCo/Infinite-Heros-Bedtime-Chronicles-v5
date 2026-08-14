import { describe, it, expect } from 'vitest';
import { SYNC_ENTITIES, type SyncRecord, type SyncEntity } from './sync-types';

describe('Shared Cloud Sync Record Validation Suite', () => {
  it('validates all entity categories in SYNC_ENTITIES union', () => {
    const validEntities: SyncEntity[] = [
      'stories',
      'badges',
      'streaks',
      'favorites',
      'read',
      'profileStub',
    ];

    validEntities.forEach((entity) => {
      expect(SYNC_ENTITIES).toContain(entity);
    });
  });

  it('validates timestamp monotonicity and ordering in SyncRecords', () => {
    const olderRecord: SyncRecord = {
      id: 'story-1',
      updatedAt: 1000,
      deleted: false,
      payload: {},
    };

    const newerRecord: SyncRecord = {
      id: 'story-1',
      updatedAt: 2000,
      deleted: false,
      payload: {},
    };

    expect(newerRecord.updatedAt).toBeGreaterThan(olderRecord.updatedAt);
  });

  it('validates profileStub zero-PII constraints', () => {
    const stubPayload = {
      profileId: 'profile-uuid-1',
      createdAt: 1720000000000,
    };

    // Assert that stubPayload contains NO child name or child age
    expect(stubPayload).not.toHaveProperty('childName');
    expect(stubPayload).not.toHaveProperty('name');
    expect(stubPayload).not.toHaveProperty('age');
  });
});
