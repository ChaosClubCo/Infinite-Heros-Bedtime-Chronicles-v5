import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, resetRateLimits } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows requests under the limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('192.168.1.1')).toBe(true);
    }
  });

  it('blocks requests over the limit', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('192.168.1.2');
    }
    expect(checkRateLimit('192.168.1.2')).toBe(false);
  });

  it('tracks different IPs independently', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('ip-a');
    }
    expect(checkRateLimit('ip-a')).toBe(false);
    expect(checkRateLimit('ip-b')).toBe(true);
  });

  it('resets after window expires', () => {
    vi.useFakeTimers();
    for (let i = 0; i < 10; i++) {
      checkRateLimit('ip-c');
    }
    expect(checkRateLimit('ip-c')).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(checkRateLimit('ip-c')).toBe(true);
    vi.useRealTimers();
  });
});
