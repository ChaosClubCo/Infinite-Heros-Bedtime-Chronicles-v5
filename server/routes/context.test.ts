import { describe, it, expect } from 'vitest';
import {
  ttsCacheManager,
  TTS_CACHE_DIR,
  aiRouter,
  idempotencyCache,
} from './context';

describe('Server Route Shared Context', () => {
  it('initializes and exports singleton instances', () => {
    expect(ttsCacheManager).toBeDefined();
    expect(TTS_CACHE_DIR).toBeDefined();
    expect(aiRouter).toBeDefined();
    expect(idempotencyCache).toBeDefined();
  });

  it('verifies idempotencyCache instance methods', () => {
    expect(typeof idempotencyCache.get).toBe('function');
    expect(typeof idempotencyCache.set).toBe('function');
    expect(typeof idempotencyCache.has).toBe('function');
  });

  it('verifies ttsCacheManager instance methods', () => {
    expect(typeof ttsCacheManager.get).toBe('function');
    expect(typeof ttsCacheManager.put).toBe('function');
    expect(typeof ttsCacheManager.cleanup).toBe('function');
  });
});
