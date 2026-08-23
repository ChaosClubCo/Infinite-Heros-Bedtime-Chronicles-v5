import crypto from 'node:crypto';

interface IdempotencyCacheOptions {
  ttlMs: number;
  maxEntries: number;
}

interface CacheEntry {
  promise: Promise<unknown>;
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
    const json = JSON.stringify(body, Object.keys(body as Record<string, unknown>).sort());
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
}
