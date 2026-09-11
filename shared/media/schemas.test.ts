import { describe, expect, it } from 'vitest';
import {
  MediaSessionSchema,
  isMediaSession,
  CharacterProfileSchema,
  isCharacterProfile,
  CHARACTER_PROFILE_SEEDS,
  findCharacterProfile,
  isPerformanceProfile,
  isGenerationJob,
  isSafetyInspection,
  isConsentArtifact,
  EXPECTED_CONSENT_RECORD_VERSION,
  isProvenanceRecord,
  isRealtimeEvent,
} from './schemas';

function validMediaSession() {
  return {
    schemaVersion: 1,
    id: 'session-1',
    status: 'active',
    mode: 'classic',
    characterProfileId: 'moonbeam',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    consentArtifactId: 'consent-1',
    transport: 'websocket',
    ownerId: 'user-1',
  };
}

describe('MediaSessionSchema', () => {
  it('accepts a valid session', () => {
    expect(MediaSessionSchema.safeParse(validMediaSession()).success).toBe(true);
    expect(isMediaSession(validMediaSession())).toBe(true);
  });

  it('rejects a schema-version mismatch', () => {
    const bad = { ...validMediaSession(), schemaVersion: 2 };
    expect(isMediaSession(bad)).toBe(false);
  });

  it('rejects an unknown status', () => {
    const bad = { ...validMediaSession(), status: 'paused' };
    expect(isMediaSession(bad)).toBe(false);
  });

  it('rejects a non-websocket/sse-fallback transport', () => {
    const bad = { ...validMediaSession(), transport: 'webrtc' };
    expect(isMediaSession(bad)).toBe(false);
  });
});

describe('CharacterProfile', () => {
  it('has exactly the 9 seeded personas matching server/elevenlabs.ts VOICE_MAP keys', () => {
    const ids = CHARACTER_PROFILE_SEEDS.map((p) => p.id).sort();
    expect(ids).toEqual([
      'aurora', 'blaze', 'captain', 'giggles', 'moonbeam',
      'professor', 'stardust', 'whisper', 'ziggy',
    ]);
  });

  it('every seed validates against CharacterProfileSchema', () => {
    for (const seed of CHARACTER_PROFILE_SEEDS) {
      expect(isCharacterProfile(seed)).toBe(true);
      expect(CharacterProfileSchema.safeParse(seed).success).toBe(true);
    }
  });

  it('findCharacterProfile resolves a known id and misses an unknown one', () => {
    expect(findCharacterProfile('moonbeam')?.displayName).toBe('Moonbeam');
    expect(findCharacterProfile('nonexistent')).toBeUndefined();
  });

  it('rejects an invalid category', () => {
    const bad = { ...CHARACTER_PROFILE_SEEDS[0], category: 'spooky' };
    expect(isCharacterProfile(bad)).toBe(false);
  });
});

describe('PerformanceProfileSchema', () => {
  it('accepts a valid performance profile', () => {
    const profile = {
      schemaVersion: 1,
      characterProfileId: 'captain',
      mode: 'sleep',
      stabilityDelta: 0.15,
      styleDelta: -0.1,
      speakerBoostOverride: false,
    };
    expect(isPerformanceProfile(profile)).toBe(true);
  });

  it('rejects a missing schemaVersion', () => {
    const bad = {
      characterProfileId: 'captain',
      mode: 'sleep',
      stabilityDelta: 0.15,
      styleDelta: -0.1,
      speakerBoostOverride: false,
    };
    expect(isPerformanceProfile(bad)).toBe(false);
  });
});

describe('GenerationJobSchema', () => {
  it('accepts a succeeded speech job with a null resultRef', () => {
    const job = {
      schemaVersion: 1,
      id: 'job-1',
      kind: 'speech',
      status: 'succeeded',
      provider: 'elevenlabs',
      model: 'eleven_multilingual_v2',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      resultRef: null,
      error: null,
    };
    expect(isGenerationJob(job)).toBe(true);
  });

  it('rejects an invalid kind', () => {
    const bad = {
      schemaVersion: 1,
      id: 'job-1',
      kind: 'video',
      status: 'succeeded',
      provider: 'elevenlabs',
      model: 'x',
      createdAt: new Date().toISOString(),
      completedAt: null,
      resultRef: null,
      error: null,
    };
    expect(isGenerationJob(bad)).toBe(false);
  });
});

describe('SafetyInspectionSchema', () => {
  it('accepts an approved inspection with no categories', () => {
    const inspection = {
      schemaVersion: 1,
      id: 'inspection-1',
      subjectType: 'realtime-utterance',
      outcome: 'approved',
      categories: [],
      checkedAt: new Date().toISOString(),
    };
    expect(isSafetyInspection(inspection)).toBe(true);
  });

  it('accepts a fallback inspection carrying arbitrary category strings', () => {
    const inspection = {
      schemaVersion: 1,
      id: 'inspection-2',
      subjectType: 'chat-reply',
      outcome: 'fallback',
      categories: ['violence', 'structural'],
      checkedAt: new Date().toISOString(),
    };
    expect(isSafetyInspection(inspection)).toBe(true);
  });

  it('rejects an unknown subjectType', () => {
    const bad = {
      schemaVersion: 1,
      id: 'inspection-3',
      subjectType: 'story',
      outcome: 'approved',
      categories: [],
      checkedAt: new Date().toISOString(),
    };
    expect(isSafetyInspection(bad)).toBe(false);
  });
});

describe('ConsentArtifactSchema', () => {
  it('accepts a valid realtime-media consent artifact at the expected version', () => {
    const artifact = {
      schemaVersion: 1,
      id: 'consent-1',
      consentRecordVersion: EXPECTED_CONSENT_RECORD_VERSION,
      grantedAt: new Date().toISOString(),
      scope: 'realtime-media',
    };
    expect(isConsentArtifact(artifact)).toBe(true);
  });

  it('accepts (schema-wise) a story-generation scope too — the route layer decides scope eligibility', () => {
    const artifact = {
      schemaVersion: 1,
      id: 'consent-2',
      consentRecordVersion: EXPECTED_CONSENT_RECORD_VERSION,
      grantedAt: new Date().toISOString(),
      scope: 'story-generation',
    };
    expect(isConsentArtifact(artifact)).toBe(true);
  });

  it('rejects a non-positive consentRecordVersion', () => {
    const bad = {
      schemaVersion: 1,
      id: 'consent-3',
      consentRecordVersion: 0,
      grantedAt: new Date().toISOString(),
      scope: 'realtime-media',
    };
    expect(isConsentArtifact(bad)).toBe(false);
  });
});

describe('ProvenanceRecordSchema', () => {
  it('accepts a record with a null releaseSha (unavailable) and null safetyInspectionId', () => {
    const record = {
      schemaVersion: 1,
      id: 'prov-1',
      subjectId: 'job-1',
      provider: 'elevenlabs',
      model: 'eleven_multilingual_v2',
      releaseSha: null,
      generatedAt: new Date().toISOString(),
      safetyInspectionId: null,
    };
    expect(isProvenanceRecord(record)).toBe(true);
  });

  it('rejects a malformed releaseSha', () => {
    const bad = {
      schemaVersion: 1,
      id: 'prov-2',
      subjectId: 'job-1',
      provider: 'elevenlabs',
      model: 'x',
      releaseSha: 'not-a-sha',
      generatedAt: new Date().toISOString(),
      safetyInspectionId: null,
    };
    expect(isProvenanceRecord(bad)).toBe(false);
  });

  it('accepts a valid 40-char releaseSha', () => {
    const record = {
      schemaVersion: 1,
      id: 'prov-3',
      subjectId: 'job-1',
      provider: 'elevenlabs',
      model: 'x',
      releaseSha: 'a'.repeat(40),
      generatedAt: new Date().toISOString(),
      safetyInspectionId: 'inspection-1',
    };
    expect(isProvenanceRecord(record)).toBe(true);
  });
});

describe('RealtimeEventSchema', () => {
  it('accepts a well-formed event', () => {
    const event = {
      schemaVersion: 1,
      eventId: 'evt-1',
      sessionId: 'session-1',
      sequence: 0,
      eventType: 'session_started',
      timestampMs: Date.now(),
      payload: {},
    };
    expect(isRealtimeEvent(event)).toBe(true);
  });

  it('rejects an unknown eventType', () => {
    const bad = {
      schemaVersion: 1,
      eventId: 'evt-1',
      sessionId: 'session-1',
      sequence: 0,
      eventType: 'audio_chunk_base64',
      timestampMs: Date.now(),
      payload: {},
    };
    expect(isRealtimeEvent(bad)).toBe(false);
  });

  it('rejects a negative sequence', () => {
    const bad = {
      schemaVersion: 1,
      eventId: 'evt-1',
      sessionId: 'session-1',
      sequence: -1,
      eventType: 'session_started',
      timestampMs: Date.now(),
      payload: {},
    };
    expect(isRealtimeEvent(bad)).toBe(false);
  });
});
