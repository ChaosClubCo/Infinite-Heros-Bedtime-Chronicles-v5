import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

describe('checkRateLimitAsync (Cloudflare KV path)', () => {
  const originalFetch = global.fetch;
  const ENV_KEYS = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_KV_NAMESPACE_ID', 'CLOUDFLARE_API_TOKEN'] as const;

  beforeEach(() => {
    vi.resetModules();
    for (const key of ENV_KEYS) process.env[key] = `test-${key}`;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it('allows a request on a KV miss and issues a fire-and-forget PUT', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const { checkRateLimitAsync } = await import('./rate-limit');

    expect(await checkRateLimitAsync('kv-ip-a')).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/values/kv-ip-a'), expect.objectContaining({ headers: expect.anything() }));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('expiration_ttl='), expect.objectContaining({ method: 'PUT' }));
  });

  it('blocks once the KV-stored count exceeds the max', async () => {
    const overLimitEntry = { count: 10, resetAt: Date.now() + 60_000 };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => overLimitEntry }) as unknown as typeof fetch;
    const { checkRateLimitAsync } = await import('./rate-limit');

    expect(await checkRateLimitAsync('kv-ip-b')).toBe(false);
  });

  it('falls back to allowing the request when the KV fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    const { checkRateLimitAsync } = await import('./rate-limit');

    // kvGet swallows the error and returns null, which is treated as a fresh entry.
    expect(await checkRateLimitAsync('kv-ip-c')).toBe(true);
  });

  it('falls back to the synchronous in-memory limiter when KV env vars are absent', async () => {
    for (const key of ENV_KEYS) delete process.env[key];
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const { checkRateLimitAsync } = await import('./rate-limit');

    expect(await checkRateLimitAsync('no-kv-ip')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps enforcing the limit from memory during a KV outage (does not reset each request)', async () => {
    // Every KV read fails. The old KV-first path reset the count to 1 each request
    // (disabling the limiter); the in-memory-authoritative path still counts up.
    global.fetch = vi.fn().mockRejectedValue(new Error('kv down')) as unknown as typeof fetch;
    const { checkRateLimitAsync } = await import('./rate-limit');

    for (let i = 0; i < 10; i++) {
      expect(await checkRateLimitAsync('kv-outage-ip')).toBe(true);
    }
    expect(await checkRateLimitAsync('kv-outage-ip')).toBe(false);
  });

  it("clamps the KV write TTL to Cloudflare's 60s minimum on a short remaining window", async () => {
    // Seed a window with only 3s left; an unclamped TTL (3s) is rejected by KV.
    const nearlyExpired = { count: 1, resetAt: Date.now() + 3_000 };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => nearlyExpired });
    global.fetch = fetchMock as unknown as typeof fetch;
    const { checkRateLimitAsync } = await import('./rate-limit');

    await checkRateLimitAsync('kv-clamp-ip');
    const putCall = fetchMock.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'PUT');
    expect(putCall).toBeDefined();
    const ttl = Number(new URL(putCall![0] as string).searchParams.get('expiration_ttl'));
    expect(ttl).toBeGreaterThanOrEqual(60);
  });
});
