import { describe, it, expect } from 'vitest';
import {
  verifyM1Safety,
  verifyM2NarrationCache,
  verifyM3CloudSync,
  verifyMilestones,
  REQUIRED_FALLBACK_MODES,
  REQUIRED_SAFETY_CATEGORIES,
  REQUIRED_SYNC_ENTITIES,
  TTS_FILENAME_PATTERN,
} from '../scripts/verify-milestones.mjs';

describe('Milestones M1–M3 Verification Engine', () => {
  it('validates Milestone 1: Content Safety and Fallback Stories', () => {
    const result = verifyM1Safety();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(REQUIRED_FALLBACK_MODES).toEqual(['classic', 'madlibs', 'sleep']);
    expect(REQUIRED_SAFETY_CATEGORIES).toContain('violence');
    expect(REQUIRED_SAFETY_CATEGORIES).toContain('scary');
  });

  it('validates Milestone 2: TTS Narration Caching & File Validation', () => {
    const result = verifyM2NarrationCache();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(TTS_FILENAME_PATTERN.test('abcdef0123456789.mp3')).toBe(true);
    expect(TTS_FILENAME_PATTERN.test('invalid-file.wav')).toBe(false);
    expect(TTS_FILENAME_PATTERN.test('../traversal.mp3')).toBe(false);
  });

  it('validates Milestone 3: Cloud Sync, Storage Envelope, and Account Deletion', () => {
    const result = verifyM3CloudSync();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(REQUIRED_SYNC_ENTITIES).toEqual([
      'stories',
      'badges',
      'streaks',
      'favorites',
      'read',
      'profileStub',
    ]);
  });

  it('executes full verifyMilestones suite with all milestones passing', () => {
    const suiteResult = verifyMilestones();
    expect(suiteResult.ok).toBe(true);
    expect(suiteResult.summary.passed).toBe(3);
    expect(suiteResult.summary.failed).toBe(0);
    expect(suiteResult.m1.ok).toBe(true);
    expect(suiteResult.m2.ok).toBe(true);
    expect(suiteResult.m3.ok).toBe(true);
  });
});
