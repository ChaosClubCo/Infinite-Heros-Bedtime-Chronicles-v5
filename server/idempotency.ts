import crypto from 'node:crypto';
import { KV_ENABLED, kvGet, kvSet } from './kv';

interface IdempotencyCacheOptions {
  ttlMs: number;
  maxEntries: number;
}

interface CacheEntry {
  promise: Promise<unknown>;
  createdAt: number;
}

interface StoredResult {
  body: unknown;
  createdAt: number;
}

export class IdempotencyCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(options: IdempotencyCacheOptions) {
    this.ttlMs = options.ttlMs;
    this.maxEntries = options.maxEntries;
  }

  static keyFromBody(body: unknown): string {
    const safeBody = (body !== null && typeof body === 'object' && !Array.isArray(body))
      ? (body as Record<string, unknown>)
      : {};
    const json = JSON.stringify(safeBody, Object.keys(safeBody).sort());
    return crypto.createHash('sha256').update(json).digest('hex').slice(0, 32);
  }

  get(key: string): Promise<unknown> | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.promise;
  }

  set(key: string, promise: Promise<unknown>): void {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { promise, createdAt: Date.now() });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Cross-invocation dedup: checks Cloudflare KV for a result from a
   * *different* process/invocation than this one (the in-memory `get()`
   * above only ever sees in-flight requests within this same process).
   * KV can only hold a resolved value, not an in-flight Promise, so this is
   * a separate lookup rather than an extension of `get()`. Returns
   * `undefined` when KV is disabled, on a miss, or on any fetch error —
   * callers should treat that identically to a normal cache miss.
   */
  async getResolved(key: string): Promise<unknown | undefined> {
    if (!KV_ENABLED) return undefined;
    const stored = await kvGet<StoredResult>(`idem:${key}`);
    return stored?.body;
  }

  /**
   * Mirrors a successfully-resolved generation into KV (fire-and-forget) so
   * other processes/invocations can hit it. Only call this on success —
   * failures should never be cached (matches the existing `.delete()`-on-
   * failure behavior of the in-memory path).
   */
  setResolved(key: string, body: unknown): void {
    if (!KV_ENABLED) return;
    kvSet<StoredResult>(`idem:${key}`, { body, createdAt: Date.now() }, Math.ceil(this.ttlMs / 1000));
  }
}
