import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
  });

  it('starts in closed state', () => {
    expect(breaker.getState()).toBe('closed');
  });

  it('stays closed on successful calls', async () => {
    await breaker.execute(() => Promise.resolve('ok'));
    await breaker.execute(() => Promise.resolve('ok'));
    expect(breaker.getState()).toBe('closed');
  });

  it('opens after reaching failure threshold', async () => {
    for (let i = 0; i < 3; i++) {
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }
    expect(breaker.getState()).toBe('open');
  });

  it('rejects immediately when open', async () => {
    for (let i = 0; i < 3; i++) {
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }
    await expect(breaker.execute(() => Promise.resolve('ok'))).rejects.toThrow(/circuit is open/i);
  });

  it('transitions to half-open after reset timeout', async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) {
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }
    expect(breaker.getState()).toBe('open');

    vi.advanceTimersByTime(1001);
    expect(breaker.getState()).toBe('half-open');
    vi.useRealTimers();
  });

  it('closes on successful call in half-open state', async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) {
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }
    vi.advanceTimersByTime(1001);
    expect(breaker.getState()).toBe('half-open');

    await breaker.execute(() => Promise.resolve('ok'));
    expect(breaker.getState()).toBe('closed');
    vi.useRealTimers();
  });

  it('re-opens on failure in half-open state', async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) {
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }
    vi.advanceTimersByTime(1001);

    await breaker.execute(() => Promise.reject(new Error('still broken'))).catch(() => {});
    expect(breaker.getState()).toBe('open');
    vi.useRealTimers();
  });

  it('resets failure count on success', async () => {
    await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    await breaker.execute(() => Promise.resolve('ok'));
    // Failure count reset — need 3 more failures to open
    await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    expect(breaker.getState()).toBe('closed');
  });
});
