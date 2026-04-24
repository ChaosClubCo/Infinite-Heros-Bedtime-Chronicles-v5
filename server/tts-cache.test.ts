import { describe, it, expect } from 'vitest';
import { TtsCacheManager } from './tts-cache';

describe('TtsCacheManager', () => {
  it('defaults maxSizeBytes to 500MB when not specified', () => {
    const manager = new TtsCacheManager({
      cacheDir: '/tmp/test-tts',
      maxAgeMs: 86400000,
    });
    expect(manager.getMaxSizeBytes()).toBe(500 * 1024 * 1024);
  });

  it('respects custom maxSizeBytes', () => {
    const manager = new TtsCacheManager({
      cacheDir: '/tmp/test-tts',
      maxAgeMs: 86400000,
      maxSizeBytes: 100 * 1024 * 1024,
    });
    expect(manager.getMaxSizeBytes()).toBe(100 * 1024 * 1024);
  });

  it('shouldEvict returns true when size exceeds limit', () => {
    const manager = new TtsCacheManager({
      cacheDir: '/tmp/test-tts',
      maxAgeMs: 86400000,
      maxSizeBytes: 1000,
    });
    expect(manager.shouldEvict(1001)).toBe(true);
    expect(manager.shouldEvict(999)).toBe(false);
    expect(manager.shouldEvict(1000)).toBe(false);
  });
});
