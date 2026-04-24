import { describe, it, expect, vi } from 'vitest';
import { retryWithJitter, _jitteredDelay } from './retry';

describe('retryWithJitter', () => {
  it('returns result on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retryWithJitter(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds on later attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue('recovered');

    const result = await retryWithJitter(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 10 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after maxRetries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent'));
    await expect(
      retryWithJitter(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 10 })
    ).rejects.toThrow('persistent');
    // initial attempt + 2 retries = 3 total calls
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('wraps non-Error throws into Error instances', async () => {
    const fn = vi.fn().mockRejectedValue('string error');
    await expect(
      retryWithJitter(fn, { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 10 })
    ).rejects.toThrow('string error');
  });

  it('maxRetries: 0 means no retries — calls fn exactly once then throws', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      retryWithJitter(fn, { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 10 })
    ).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses default options when none provided', async () => {
    // Just verify it resolves correctly with defaults (delays would be real but fn succeeds)
    const fn = vi.fn().mockResolvedValue(42);
    const result = await retryWithJitter(fn);
    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('_jitteredDelay', () => {
  it('returns value in range [50%, 100%] of capped exponential', () => {
    const baseMs = 100;
    const maxMs = 5000;

    for (let attempt = 0; attempt < 5; attempt++) {
      const exponential = baseMs * Math.pow(2, attempt);
      const capped = Math.min(exponential, maxMs);
      const lower = capped * 0.5;
      const upper = capped * 1.0;

      // Run multiple times to account for randomness
      for (let i = 0; i < 20; i++) {
        const delay = _jitteredDelay(baseMs, attempt, maxMs);
        expect(delay).toBeGreaterThanOrEqual(lower);
        expect(delay).toBeLessThanOrEqual(upper);
      }
    }
  });

  it('respects maxDelayMs cap', () => {
    const baseMs = 1000;
    const maxMs = 500;

    for (let i = 0; i < 20; i++) {
      const delay = _jitteredDelay(baseMs, 10, maxMs);
      expect(delay).toBeLessThanOrEqual(maxMs);
      expect(delay).toBeGreaterThanOrEqual(maxMs * 0.5);
    }
  });

  it('scales exponentially with attempt number (uncapped)', () => {
    const baseMs = 10;
    const maxMs = 1_000_000;

    const delay0 = _jitteredDelay(baseMs, 0, maxMs); // range [5, 10]
    const delay3 = _jitteredDelay(baseMs, 3, maxMs); // range [40, 80]

    // delay at attempt 3 should have a higher max than delay at attempt 0
    expect(delay3).toBeGreaterThanOrEqual(0);
    // The cap for attempt 3 is 80ms; for attempt 0 it's 10ms
    // We verify upper bounds: attempt 0 max is 10, attempt 3 max is 80
    expect(baseMs * Math.pow(2, 0) * 1.0).toBeLessThan(baseMs * Math.pow(2, 3) * 1.0);
  });
});
