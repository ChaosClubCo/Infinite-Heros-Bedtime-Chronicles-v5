# Server Resilience Implementation Plan (Tier A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured logging with request correlation, circuit breaker on AI providers, idempotency for generation endpoints, client-facing error classification, and TTS cache size limits.

**Architecture:** Replace `console.log/error` with pino structured logger; thread `requestId` through Express middleware → AI router → providers. Add a CircuitBreaker class that wraps provider calls with failure counting and half-open recovery. Add an IdempotencyCache backed by a Map with TTL for deduplicating concurrent identical requests. Classify errors as `transient`/`permanent` in all error responses. Add size-based eviction to TTS cache.

**Tech Stack:** pino (structured logger), Node.js crypto (requestId), Vitest

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `server/logger.ts` | pino logger instance, `createRequestLogger` with requestId child |
| Create | `server/logger.test.ts` | Tests for logger module |
| Create | `server/circuit-breaker.ts` | `CircuitBreaker` class: closed→open→half-open states, failure thresholds |
| Create | `server/circuit-breaker.test.ts` | Tests for circuit breaker |
| Create | `server/idempotency.ts` | `IdempotencyCache` with TTL, key generation from request body |
| Create | `server/idempotency.test.ts` | Tests for idempotency cache |
| Create | `server/tts-cache.ts` | TTS cache management: size-limited eviction, cleanup |
| Create | `server/tts-cache.test.ts` | Tests for TTS cache manager |
| Modify | `server/ai/types.ts` | Add `requestId` to request types |
| Modify | `server/ai/router.ts` | Integrate circuit breaker, pass requestId to logger |
| Modify | `server/index.ts` | Replace `console.log` with logger, add requestId middleware |
| Modify | `server/routes.ts` | Use logger, idempotency, error classification, TTS cache manager |
| Modify | `server/utils.ts` | Add `classifyError` and error response helpers |

---

### Task 1: Install pino and create `server/logger.ts`

**Files:**
- Create: `server/logger.ts`
- Create: `server/logger.test.ts`

- [ ] **Step 1: Install pino**

Run: `npm install pino`

- [ ] **Step 2: Write the failing test**

Create `server/logger.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger, createRequestId } from './logger';

describe('createRequestId', () => {
  it('returns a 16-char hex string', () => {
    const id = createRequestId();
    expect(id).toMatch(/^[a-f0-9]{16}$/);
  });

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createRequestId()));
    expect(ids.size).toBe(100);
  });
});

describe('createLogger', () => {
  it('returns a pino logger instance', () => {
    const logger = createLogger();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.child).toBe('function');
  });

  it('creates a child logger with requestId', () => {
    const logger = createLogger();
    const child = logger.child({ requestId: 'abc123' });
    expect(typeof child.info).toBe('function');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run server/logger.test.ts`
Expected: FAIL — no module

- [ ] **Step 4: Write implementation**

Create `server/logger.ts`:

```ts
import pino from 'pino';
import crypto from 'node:crypto';

export function createLogger() {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export function createRequestId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export const logger = createLogger();
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run server/logger.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/logger.ts server/logger.test.ts package.json package-lock.json
git commit -m "feat: add pino structured logger with request ID generation"
```

---

### Task 2: Create `server/circuit-breaker.ts`

**Files:**
- Create: `server/circuit-breaker.ts`
- Create: `server/circuit-breaker.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/circuit-breaker.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/circuit-breaker.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `server/circuit-breaker.ts`:

```ts
type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeoutMs = options.resetTimeoutMs;
  }

  getState(): CircuitState {
    if (this.state === 'open' && Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
      this.state = 'half-open';
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === 'open') {
      throw new Error('Circuit is open — provider temporarily unavailable');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run server/circuit-breaker.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/circuit-breaker.ts server/circuit-breaker.test.ts
git commit -m "feat: add circuit breaker for AI provider calls"
```

---

### Task 3: Create `server/idempotency.ts`

**Files:**
- Create: `server/idempotency.ts`
- Create: `server/idempotency.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/idempotency.test.ts`:

```ts
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
    const promise = new Promise(() => {}); // never resolves
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/idempotency.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `server/idempotency.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run server/idempotency.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/idempotency.ts server/idempotency.test.ts
git commit -m "feat: add idempotency cache for generation endpoints"
```

---

### Task 4: Add error classification to `server/utils.ts`

**Files:**
- Modify: `server/utils.ts`
- Modify: `server/utils.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `server/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toErrorMessage, classifyError, createErrorResponse } from './utils';

// ... existing toErrorMessage tests ...

describe('classifyError', () => {
  it('classifies timeout errors as transient', () => {
    expect(classifyError(new Error('timed out after 60000ms'))).toBe('transient');
  });

  it('classifies rate limit errors as transient', () => {
    expect(classifyError(new Error('429 Too Many Requests'))).toBe('transient');
  });

  it('classifies network errors as transient', () => {
    expect(classifyError(new Error('ECONNREFUSED'))).toBe('transient');
    expect(classifyError(new Error('ETIMEDOUT'))).toBe('transient');
    expect(classifyError(new Error('fetch failed'))).toBe('transient');
  });

  it('classifies circuit open as transient', () => {
    expect(classifyError(new Error('Circuit is open'))).toBe('transient');
  });

  it('classifies 5xx errors as transient', () => {
    expect(classifyError(new Error('500 Internal Server Error'))).toBe('transient');
    expect(classifyError(new Error('503 Service Unavailable'))).toBe('transient');
  });

  it('classifies validation errors as permanent', () => {
    expect(classifyError(new Error('Hero name is required'))).toBe('permanent');
  });

  it('classifies unknown errors as permanent', () => {
    expect(classifyError(new Error('something weird'))).toBe('permanent');
  });
});

describe('createErrorResponse', () => {
  it('creates a transient error response', () => {
    const resp = createErrorResponse('Service busy', 'transient');
    expect(resp).toEqual({ error: 'Service busy', retryable: true });
  });

  it('creates a permanent error response', () => {
    const resp = createErrorResponse('Invalid input', 'permanent');
    expect(resp).toEqual({ error: 'Invalid input', retryable: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/utils.test.ts`
Expected: FAIL — `classifyError` and `createErrorResponse` not exported

- [ ] **Step 3: Write implementation**

Update `server/utils.ts`:

```ts
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export type ErrorKind = 'transient' | 'permanent';

const TRANSIENT_PATTERNS = [
  /timed?\s*out/i,
  /429/,
  /too many requests/i,
  /ECONNREFUSED/,
  /ECONNRESET/,
  /ETIMEDOUT/,
  /ENOTFOUND/,
  /fetch failed/i,
  /circuit is open/i,
  /socket hang up/i,
  /5\d{2}\s/,
  /overloaded/i,
  /temporarily unavailable/i,
];

export function classifyError(err: unknown): ErrorKind {
  const message = toErrorMessage(err);
  for (const pattern of TRANSIENT_PATTERNS) {
    if (pattern.test(message)) return 'transient';
  }
  return 'permanent';
}

export function createErrorResponse(message: string, kind: ErrorKind): { error: string; retryable: boolean } {
  return { error: message, retryable: kind === 'transient' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run server/utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/utils.ts server/utils.test.ts
git commit -m "feat: add error classification (transient/permanent) and createErrorResponse"
```

---

### Task 5: Create `server/tts-cache.ts` with size limit

**Files:**
- Create: `server/tts-cache.ts`
- Create: `server/tts-cache.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/tts-cache.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TtsCacheManager } from './tts-cache';

describe('TtsCacheManager', () => {
  it('calculates cache size from file stats', () => {
    // This is an integration-style test; unit behavior is tested via the threshold check
    const manager = new TtsCacheManager({
      cacheDir: '/tmp/test-tts',
      maxAgeMsMs: 86400000,
      maxSizeBytes: 100 * 1024 * 1024,
    });
    expect(manager.getMaxSizeBytes()).toBe(100 * 1024 * 1024);
  });

  it('defaults maxSizeBytes to 500MB when not specified', () => {
    const manager = new TtsCacheManager({
      cacheDir: '/tmp/test-tts',
      maxAgeMsMs: 86400000,
    });
    expect(manager.getMaxSizeBytes()).toBe(500 * 1024 * 1024);
  });

  it('shouldEvict returns true when size exceeds limit', () => {
    const manager = new TtsCacheManager({
      cacheDir: '/tmp/test-tts',
      maxAgeMsMs: 86400000,
      maxSizeBytes: 1000,
    });
    expect(manager.shouldEvict(1001)).toBe(true);
    expect(manager.shouldEvict(999)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/tts-cache.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `server/tts-cache.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';

interface TtsCacheOptions {
  cacheDir: string;
  maxAgeMsMs: number;
  maxSizeBytes?: number;
}

interface CacheFileInfo {
  name: string;
  path: string;
  size: number;
  mtimeMs: number;
}

const DEFAULT_MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export class TtsCacheManager {
  private readonly cacheDir: string;
  private readonly maxAgeMs: number;
  private readonly maxSizeBytes: number;

  constructor(options: TtsCacheOptions) {
    this.cacheDir = options.cacheDir;
    this.maxAgeMs = options.maxAgeMsMs;
    this.maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  }

  getMaxSizeBytes(): number {
    return this.maxSizeBytes;
  }

  shouldEvict(currentSizeBytes: number): boolean {
    return currentSizeBytes > this.maxSizeBytes;
  }

  async ensureDir(): Promise<void> {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async cleanup(): Promise<{ removedCount: number; freedBytes: number }> {
    let removedCount = 0;
    let freedBytes = 0;

    try {
      const files = await this.listFiles();
      const now = Date.now();

      // Phase 1: Remove expired files
      for (const file of files) {
        if (now - file.mtimeMs > this.maxAgeMs) {
          await fs.promises.unlink(file.path);
          freedBytes += file.size;
          removedCount++;
        }
      }

      // Phase 2: If still over size limit, remove oldest files
      const remaining = await this.listFiles();
      let totalSize = remaining.reduce((sum, f) => sum + f.size, 0);

      if (totalSize > this.maxSizeBytes) {
        // Sort by oldest first
        remaining.sort((a, b) => a.mtimeMs - b.mtimeMs);
        for (const file of remaining) {
          if (totalSize <= this.maxSizeBytes) break;
          await fs.promises.unlink(file.path);
          totalSize -= file.size;
          freedBytes += file.size;
          removedCount++;
        }
      }
    } catch (err) {
      // Log but don't throw — cache cleanup is best-effort
      console.error('[TTS Cache] Cleanup error:', err);
    }

    return { removedCount, freedBytes };
  }

  private async listFiles(): Promise<CacheFileInfo[]> {
    try {
      const names = await fs.promises.readdir(this.cacheDir);
      const files: CacheFileInfo[] = [];
      for (const name of names) {
        const filePath = path.join(this.cacheDir, name);
        try {
          const stat = await fs.promises.stat(filePath);
          if (stat.isFile()) {
            files.push({ name, path: filePath, size: stat.size, mtimeMs: stat.mtimeMs });
          }
        } catch {
          // File may have been deleted between readdir and stat
        }
      }
      return files;
    } catch {
      return [];
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run server/tts-cache.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/tts-cache.ts server/tts-cache.test.ts
git commit -m "feat: add TTS cache manager with size-based eviction"
```

---

### Task 6: Integrate circuit breaker into AI router

**Files:**
- Modify: `server/ai/types.ts`
- Modify: `server/ai/router.ts`
- Modify: `server/ai/router.test.ts`

- [ ] **Step 1: Add requestId to types**

In `server/ai/types.ts`, add `requestId` to both request interfaces:

```ts
export interface TextGenerationRequest {
  // ... existing fields ...
  /** Correlation ID for logging. */
  requestId?: string;
}
```

No need to add to ImageGenerationRequest — it's passed through the router internally.

- [ ] **Step 2: Write the failing test**

Add to `server/ai/router.test.ts`:

```ts
describe('circuit breaker integration', () => {
  it('opens circuit after consecutive failures and skips the provider', async () => {
    // Create a router with low circuit breaker threshold for testing
    const failingRouter = new AIRouter({ circuitBreakerThreshold: 2, circuitBreakerResetMs: 10_000 });

    let callCount = 0;
    const failingProvider = createMockProvider({
      name: 'anthropic',
      generateText: vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('provider down'));
      }),
    });
    const fallbackProvider = createMockProvider({ name: 'gemini' });
    failingRouter.registerProvider(failingProvider);
    failingRouter.registerProvider(fallbackProvider);

    // First 2 calls fail on anthropic, fall back to gemini
    await failingRouter.generateText('story', DEFAULT_REQUEST);
    await failingRouter.generateText('story', DEFAULT_REQUEST);

    // Third call should skip anthropic entirely (circuit open) and go straight to gemini
    callCount = 0;
    await failingRouter.generateText('story', DEFAULT_REQUEST);
    expect(callCount).toBe(0); // anthropic was never called
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run server/ai/router.test.ts`
Expected: FAIL — AIRouter doesn't accept options

- [ ] **Step 4: Implement circuit breaker integration**

Update `server/ai/router.ts`:

The `AIRouter` constructor accepts optional `circuitBreakerThreshold` and `circuitBreakerResetMs`. Internally, it creates a `CircuitBreaker` per provider name. When iterating the fallback chain, it checks if the circuit is open before attempting a call. On failure, the circuit records the failure. On success, it resets.

```ts
import { CircuitBreaker } from '../circuit-breaker';

interface AIRouterOptions {
  circuitBreakerThreshold?: number;
  circuitBreakerResetMs?: number;
}

export class AIRouter {
  private providers: Map<ProviderName, AIProvider> = new Map();
  private chains: FallbackChain[] = DEFAULT_CHAINS;
  private breakers: Map<ProviderName, CircuitBreaker> = new Map();
  private readonly cbThreshold: number;
  private readonly cbResetMs: number;

  constructor(options?: AIRouterOptions) {
    this.cbThreshold = options?.circuitBreakerThreshold ?? 5;
    this.cbResetMs = options?.circuitBreakerResetMs ?? 60_000;
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
    this.breakers.set(provider.name, new CircuitBreaker({
      failureThreshold: this.cbThreshold,
      resetTimeoutMs: this.cbResetMs,
    }));
  }

  // In generateText, wrap provider.generateText in breaker.execute:
  // const breaker = this.breakers.get(provider.name)!;
  // if (breaker.getState() === 'open') continue; // skip open circuits
  // response = await breaker.execute(() => providerCall);
```

Apply the same pattern in `generateImage` and `generateTextStream`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run server/ai/router.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/ai/router.ts server/ai/router.test.ts server/ai/types.ts
git commit -m "feat: integrate circuit breaker into AI router fallback chain"
```

---

### Task 7: Integrate logger + requestId middleware into server

**Files:**
- Modify: `server/index.ts`
- Modify: `server/routes.ts`

- [ ] **Step 1: Add requestId middleware to `server/index.ts`**

In `setupRequestLogging`, replace the existing implementation with pino-based logging:

```ts
import { logger, createRequestId } from './logger';

// In the middleware:
app.use((req, _res, next) => {
  const requestId = req.header('x-request-id') || createRequestId();
  req.requestId = requestId;
  req.log = logger.child({ requestId, method: req.method, path: req.path });
  next();
});
```

Add `requestId` and `log` to Express Request type augmentation (in `server/index.ts` or a shared types file):

```ts
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
    requestId?: string;
    log?: import('pino').Logger;
  }
}
```

- [ ] **Step 2: Replace console.log/error calls in `server/routes.ts`**

Replace all `console.log(...)` and `console.error(...)` calls with `req.log.info(...)` and `req.log.error(...)` within route handlers. For module-level logs (outside request context), use the global `logger` import.

Examples:
- `console.log(\`[Story] Generated by ...\`)` → `req.log.info({ provider, model }, 'story generated')`
- `console.error("Error generating story:", ...)` → `req.log.error({ err: error }, 'story generation failed')`

- [ ] **Step 3: Pass requestId through AI calls**

In route handlers, add `requestId: req.requestId` to AI router calls:

```ts
const aiResponse = await aiRouter.generateText("story", {
  // ... existing fields ...
  requestId: req.requestId,
});
```

- [ ] **Step 4: Replace console.log in other server files**

Replace `console.log` / `console.error` in:
- `server/ai/index.ts` — provider status logging
- `server/rate-limit.ts` — (none currently)
- TTS cache cleanup in `server/routes.ts`

Use the global `logger` for non-request-scoped logs.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/index.ts server/routes.ts server/ai/index.ts
git commit -m "feat: replace console.log with pino structured logging and request correlation"
```

---

### Task 8: Integrate idempotency + error classification into routes

**Files:**
- Modify: `server/routes.ts`

- [ ] **Step 1: Add idempotency to generation endpoints**

At the top of `server/routes.ts`, create an idempotency cache instance:

```ts
import { IdempotencyCache } from './idempotency';
import { classifyError, createErrorResponse } from './utils';

const idempotencyCache = new IdempotencyCache({ ttlMs: 5 * 60 * 1000, maxEntries: 200 });
```

In `/api/generate-story`, wrap the generation in an idempotency check:

```ts
const idempotencyKey = IdempotencyCache.keyFromBody(parsed.data);
const cached = idempotencyCache.get(idempotencyKey);
if (cached) {
  const result = await cached;
  return res.json(result);
}

const generationPromise = (async () => {
  // ... existing generation logic ...
  // return story object
})();

idempotencyCache.set(idempotencyKey, generationPromise);
try {
  const story = await generationPromise;
  res.json(story);
} catch (error: unknown) {
  idempotencyCache.delete(idempotencyKey);
  const kind = classifyError(error);
  res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('Failed to generate story', kind));
}
```

Apply the same pattern to `/api/generate-avatar` and `/api/generate-scene`.

- [ ] **Step 2: Add error classification to all error responses**

Replace all `res.status(500).json({ error: "..." })` patterns with:

```ts
const kind = classifyError(error);
res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('...', kind));
```

This adds `retryable: true/false` to every error response, letting the client decide whether to retry.

- [ ] **Step 3: Integrate TTS cache manager**

Replace the inline `cleanTtsCache` and TTS_CACHE_DIR logic with the `TtsCacheManager`:

```ts
import { TtsCacheManager } from './tts-cache';

const ttsCacheManager = new TtsCacheManager({
  cacheDir: path.resolve('/tmp/tts-cache'),
  maxAgeMsMs: parseInt(process.env.TTS_CACHE_MAX_AGE_MS || String(24 * 60 * 60 * 1000), 10),
  maxSizeBytes: parseInt(process.env.TTS_CACHE_MAX_SIZE_BYTES || String(500 * 1024 * 1024), 10),
});

// Replace setInterval(cleanTtsCache, ...) with:
ttsCacheManager.ensureDir();
setInterval(() => ttsCacheManager.cleanup(), 60 * 60 * 1000);
ttsCacheManager.cleanup();
```

Update TTS route handlers to use `ttsCacheManager.cacheDir` (or keep the constant — the manager manages cleanup only).

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No new errors in server/ files

- [ ] **Step 6: Commit**

```bash
git add server/routes.ts
git commit -m "feat: integrate idempotency, error classification, and TTS cache manager into routes"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit` (check only `server/` output)
Expected: No new errors

- [ ] **Step 3: Verify server starts**

Run: `npm run server:dev` (or `npx tsx server/index.ts`)
Expected: Server starts with structured JSON log output, provider status logged, auth warning logged

- [ ] **Step 4: Final commit if any fixups needed**

---

## Self-Review

**Spec coverage:**
1. Structured logging + request correlation (pino) → Tasks 1, 7 ✓
2. Circuit breaker on AI provider calls → Tasks 2, 6 ✓
3. Idempotency for story/avatar/scene generation → Tasks 3, 8 ✓
4. Client-side error classification (transient vs. permanent) → Tasks 4, 8 ✓
5. TTS cache size limit → Tasks 5, 8 ✓

**Placeholder scan:** No TBDs or vague instructions found.

**Type consistency:** `CircuitBreaker`, `IdempotencyCache`, `TtsCacheManager`, `createErrorResponse`, `classifyError`, `ErrorKind`, `createRequestId`, `logger` — all consistent across tasks.
