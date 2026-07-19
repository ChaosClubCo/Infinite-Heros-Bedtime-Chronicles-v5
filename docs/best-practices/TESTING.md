# Testing Manual & Best Practices

> **Infinity Heroes: Bedtime Chronicles v5** — Comprehensive Testing Guide

This manual serves as the single source of truth for the codebase testing framework, configuration, mocking patterns, coverage analysis, and instructions for adding new tests.

**Current Status:** **1347 Vitest unit and integration tests passed** across **75 test files** (100% green).

---

## 1. Testing Framework & Configuration

### The Test Stack
- **Vitest v4** — ESM-native, high-performance test runner.
- **@vitest/coverage-v8** — V8-based code coverage provider.
- **TypeScript** — All tests written in strict TypeScript.
- **Supertest** — Integration testing for HTTP-level endpoint validation.

### Configuration (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts', 'lib/**/*.test.ts', 'shared/**/*.test.ts'],
    exclude: ['node_modules', 'server_dist', 'static-build'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'lib/**/*.ts'],
      exclude: [
        'server/replit_integrations/**',
        'server/templates/**',
        '**/*.test.ts',
        '**/index.ts',
      ],
      thresholds: {
        branches: 80,
      },
    },
    testTimeout: 30000, // Timeout raised to 30s to prevent flaky runs
  },
});
```

### Test File Naming
- **Unit tests:** `<module>.test.ts` — Placed alongside the source file.
- **Comprehensive tests:** `<module>.comprehensive.test.ts` — Deeper coverage of complex modules.

---

## 2. Test File Inventory

The active test suite contains **75 test files** organized across the following locations:

| Directory | Scope / Purpose | Key Files |
| :--- | :--- | :--- |
| `__tests__/integration/` | End-to-end API HTTP tests | `api-routes.test.ts` |
| `__tests__/unit/` | Core business logic units | `ai-router.test.ts`, `badges-and-streaks.test.ts`, `elevenlabs.test.ts`, `parent-controls.test.ts`, `routes-utils.test.ts`, `settings-migration.test.ts`, `storage-crud.test.ts`, `video.test.ts` |
| `lib/` | Client-side utilities and contexts | `badges.test.ts`, `launch-gate.test.ts`, `narration.test.ts`, `query-client.test.ts`, `replay-params.test.ts`, `storage.test.ts`, `storage.comprehensive.test.ts`, `storage-migration.test.ts`, `sync-queue.test.ts`, `tts-cache.test.ts` |
| `lib/sync/` | Sync state engines & mappers | `engine.test.ts`, `mappers.test.ts`, `reconcile.test.ts`, `runSync.test.ts`, `storage-adapters.test.ts`, `supabase-sync.test.ts` |
| `server/` | Server infrastructure & middleware | `alerting.test.ts`, `circuit-breaker.test.ts`, `feature-flags.test.ts`, `idempotency.test.ts`, `index.integration.test.ts`, `kv.test.ts`, `load-shedding.test.ts`, `logger.test.ts`, `metrics.test.ts`, `prompts.test.ts`, `rate-limit.test.ts`, `retry.test.ts`, `routes.test.ts`, `security-fixes.test.ts`, `suno.test.ts`, `tts-cache.test.ts`, `utils.test.ts`, `validation.test.ts` |
| `server/ai/` | Multi-provider router and APIs | `router.test.ts`, `router.comprehensive.test.ts` |
| `server/ai/providers/` | AI provider adapters | `anthropic.test.ts`, `gemini.test.ts`, `openai.test.ts`, `openrouter.test.ts` |
| `server/routes/` | API routing logic | `github-webhook.test.ts`, `health.test.ts`, `music.branches.test.ts`, `story.branches.test.ts`, `story.kv-idempotency.test.ts`, `suggest.branches.test.ts`, `tts.branches.test.ts`, `video.file-serving.test.ts`, `video.sanitization.test.ts` |
| `server/safety/` | Safety guardrails | `content-safety.test.ts`, `story-guard.test.ts` |
| `server/replit_integrations/` | Replit environment helper tests | `audio/client.test.ts` |
| `shared/` | Shared schemas and metadata | `safety-terms.test.ts`, `schema.comprehensive.test.ts` |

---

## 3. Test Structure & Mocking Conventions

### Structure Patterns (`describe` / `it` / `expect`)
Group tests by **component/feature**, then by **function**, then by **scenario**.

```typescript
describe('AIRouter', () => {
  describe('registerProvider', () => {
    it('registers a single provider', () => {
      const provider = createMockProvider('gemini');
      router.registerProvider(provider);
      expect(router.getProvider('gemini' as any)).toBe(provider);
    });
  });
});
```

### Mocking client-side `AsyncStorage`
Client storage tests run in Node, so `AsyncStorage` must be fully mocked:

```typescript
const mockStore: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStore[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => { mockStore[key] = value; }),
    removeItem: vi.fn(async (key: string) => { delete mockStore[key]; }),
    clear: vi.fn(async () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }),
  },
}));

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
  vi.clearAllMocks();
});
```

---

## 4. Key Testing Priorities & Coverage Scenarios

### A. Badge & Streak Logic (`lib/storage.ts`) — **CRITICAL**
Verify all gamification rules:
- Confirm that each of the 12 badge conditions (e.g. `first_story`, `streak_3`, `all_heroes`) triggers at the correct threshold.
- Prevent duplicate badges on the same profile.
- Validate time-of-day constraints (e.g. `night_owl` triggers only at hour >= 20).
- Streak increments on consecutive days, resets to 1 after a 2+ day gap, and does not increment on same-day stories.

### B. AI Router Fallback Chain (`server/ai/router.ts`) — **CRITICAL**
Ensure reliability across all providers:
- Happy path returns response immediately.
- Primary provider failure cascades to fallbacks.
- All providers failing throws the last error.
- Verify JSON validation rejects invalid structures and moves to the next provider.

### C. Security Controls (Rate Limiters, Path Traversal) — **HIGH**
Validate protective boundaries:
- Check that the dual-layer rate limiters allow up to limit and block the N+1 request.
- Verify path traversal attempts in file-serving routes are blocked via regex and `path.resolve` check.
- Confirm production auth guard rejects unauthorized requests in production mode.

---

## 5. Running Tests

Execute tests locally using these commands:

```bash
# Run all tests once
npm test

# Run Vitest in watch mode (re-runs on changes)
npm run test:watch

# Generate coverage analysis report
npm run test:coverage

# Run a specific test file
npx vitest run server/ai/router.comprehensive.test.ts
```

---

## 6. Checklist: Adding New Tests

When writing new features, complete this checklist:

- [ ] **Location:** Create test file alongside source file (e.g. `server/feature.ts` -> `server/feature.test.ts`).
- [ ] **Mocks:** Mock external SDKs (such as ElevenLabs, Firebase Auth, or AsyncStorage).
- [ ] **Hoist Mocks:** Place `vi.mock()` calls at the very top of the file before imports.
- [ ] **Adversarial Cases:** Include negative tests (invalid params, timeouts, errors).
- [ ] **Coverage:** Verify branch coverage remains at or above the **80%** threshold (`npm run test:coverage`).
- [ ] **No Leaks:** Ensure `beforeEach` fully clears mocked mock instances and cache lists.
