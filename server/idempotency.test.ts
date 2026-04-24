import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdempotencyCache } from './idempotency';

describe('IdempotencyCache', () => {
  let cache: IdempotencyCache;

  beforeEach(() => {
    cache = new IdempotencyCache({ ttlMs: 5 * 60 * 1000, maxEntries: 100 });
  });

  it('returns undefined for unknown keys', () => {
    expect(cache.get('unknown')).toBeUndefined();
  });

  it('stores and retrieves a pending entry', () => {
    const promise = new Promise(() => {});
    cache.set('key1', promise);
    expect(cache.get('key1')).toBe(promise);
  });

  it('generates deterministic keys from body', () => {
    const key1 = IdempotencyCache.keyFromBody({ heroName: 'Luna', mode: 'classic' });
    const key2 = IdempotencyCache.keyFromBody({ heroName: 'Luna', mode: 'classic' });
    expect(key1).toBe(key2);
  });

  it('generates different keys for different bodies', () => {
    const key1 = IdempotencyCache.keyFromBody({ heroName: 'Luna' });
    const key2 = IdempotencyCache.keyFromBody({ heroName: 'Nova' });
    expect(key1).not.toBe(key2);
  });

  it('evicts entries after TTL', () => {
    vi.useFakeTimers();
    cache.set('key1', Promise.resolve('result'));
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(cache.get('key1')).toBeUndefined();
    vi.useRealTimers();
  });

  it('respects maxEntries by evicting oldest', () => {
    const smallCache = new IdempotencyCache({ ttlMs: 60_000, maxEntries: 2 });
    smallCache.set('a', Promise.resolve(1));
    smallCache.set('b', Promise.resolve(2));
    smallCache.set('c', Promise.resolve(3));
    expect(smallCache.get('a')).toBeUndefined();
    expect(smallCache.get('c')).toBeDefined();
  });

  it('removes entries explicitly', () => {
    cache.set('key1', Promise.resolve('result'));
    cache.delete('key1');
    expect(cache.get('key1')).toBeUndefined();
  });
});
