# Server Hardening & Best Practices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break up the monolithic `server/routes.ts`, fix security gaps, add Zod validation, add request timeouts, and improve observability across the Express backend.

**Architecture:** Extract validation, rate-limiting, prompt-building, and utility code from `routes.ts` into focused modules. Add Zod request schemas. Add timeouts to AI calls. Fix CORS wildcard and auth logging gaps. Enhance health check.

**Tech Stack:** TypeScript, Express 5, Zod 3, Vitest, Node.js AbortController

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `server/validation.ts` | `sanitizeString`, `validateMadlibWords`, `parseStoryRequest`, Zod request schemas, constants (`VALID_MODES`, `VALID_DURATIONS`, `MAX_INPUT_STRING_LENGTH`, `MAX_TTS_TEXT_LENGTH`) |
| Create | `server/validation.test.ts` | Tests for validation module |
| Create | `server/prompts.ts` | `CHILD_SAFETY_RULES`, `STORY_RESPONSE_SCHEMA`, `ART_STYLES`, `getStorySystemPrompt`, `getStoryUserPrompt`, `getRandomStyle`, `getPartCount`, `getWordCount` |
| Create | `server/prompts.test.ts` | Tests for prompt module |
| Create | `server/rate-limit.ts` | `checkRateLimit`, rate limit map, cleanup interval |
| Create | `server/rate-limit.test.ts` | Tests for rate-limit module |
| Create | `server/utils.ts` | `toErrorMessage` helper |
| Create | `server/utils.test.ts` | Tests for utils module |
| Modify | `server/routes.ts` | Remove extracted code, import from new modules, use Zod schemas, use `parseStoryRequest` |
| Modify | `server/ai/router.ts` | Add timeout support via AbortController, return parsed JSON for `jsonMode` |
| Modify | `server/ai/router.test.ts` | Add timeout and parsed-JSON tests |
| Modify | `server/ai/types.ts` | Add `timeoutMs` to `TextGenerationRequest`, add `parsedJson` to `TextGenerationResponse` |
| Modify | `server/index.ts` | Restrict CORS wildcard, remove `X-XSS-Protection`, add auth warning to `validateEnvironment` |
| Modify | `server/auth.ts` | Add `isAuthEnabled()` export for startup check |

---

### Task 1: Create `server/utils.ts` — shared error utility

**Files:**
- Create: `server/utils.ts`
- Create: `server/utils.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toErrorMessage } from './utils';

describe('toErrorMessage', () => {
  it('extracts message from Error objects', () => {
    expect(toErrorMessage(new Error('something broke'))).toBe('something broke');
  });

  it('converts non-Error values to string', () => {
    expect(toErrorMessage('raw string')).toBe('raw string');
    expect(toErrorMessage(42)).toBe('42');
    expect(toErrorMessage(null)).toBe('null');
    expect(toErrorMessage(undefined)).toBe('undefined');
  });

  it('handles objects without message property', () => {
    expect(toErrorMessage({ code: 'ENOENT' })).toBe('[object Object]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/utils.test.ts`
Expected: FAIL — module `./utils` has no export `toErrorMessage`

- [ ] **Step 3: Write minimal implementation**

Create `server/utils.ts`:

```ts
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/utils.ts server/utils.test.ts
git commit -m "refactor: extract toErrorMessage utility to server/utils.ts"
```

---

### Task 2: Create `server/validation.ts` — input validation + Zod schemas

**Files:**
- Create: `server/validation.ts`
- Create: `server/validation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/validation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validateMadlibWords,
  VALID_MODES,
  VALID_DURATIONS,
  StoryRequestSchema,
  AvatarRequestSchema,
  SceneRequestSchema,
  TtsRequestSchema,
  parseStoryRequest,
} from './validation';

describe('sanitizeString', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizeString(123, 100)).toBe('');
    expect(sanitizeString(null, 100)).toBe('');
    expect(sanitizeString(undefined, 100)).toBe('');
  });

  it('truncates strings exceeding max length', () => {
    expect(sanitizeString('a'.repeat(600), 500)).toHaveLength(500);
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ', 100)).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeString('', 100)).toBe('');
  });
});

describe('validateMadlibWords', () => {
  it('returns undefined for null input', () => {
    expect(validateMadlibWords(null)).toBeUndefined();
  });

  it('returns undefined for non-object input', () => {
    expect(validateMadlibWords('string')).toBeUndefined();
    expect(validateMadlibWords([1, 2])).toBeUndefined();
  });

  it('returns sanitized key-value pairs', () => {
    expect(validateMadlibWords({ noun: 'cat', verb: 'jump' })).toEqual({ noun: 'cat', verb: 'jump' });
  });

  it('limits to 20 keys', () => {
    const input: Record<string, string> = {};
    for (let i = 0; i < 25; i++) input[`key${i}`] = 'val';
    expect(validateMadlibWords(input)).toBeUndefined();
  });

  it('truncates long keys and values to 100 chars', () => {
    const result = validateMadlibWords({ ['k'.repeat(200)]: 'v'.repeat(200) });
    const key = Object.keys(result!)[0];
    const val = Object.values(result!)[0];
    expect(key).toHaveLength(100);
    expect(val).toHaveLength(100);
  });
});

describe('StoryRequestSchema', () => {
  it('validates a minimal story request', () => {
    const result = StoryRequestSchema.safeParse({ heroName: 'Luna' });
    expect(result.success).toBe(true);
  });

  it('rejects missing heroName', () => {
    const result = StoryRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('applies defaults for optional fields', () => {
    const result = StoryRequestSchema.parse({ heroName: 'Luna' });
    expect(VALID_MODES).toContain(result.mode);
    expect(VALID_DURATIONS).toContain(result.duration);
  });

  it('truncates long strings', () => {
    const result = StoryRequestSchema.parse({ heroName: 'a'.repeat(600) });
    expect(result.heroName.length).toBeLessThanOrEqual(500);
  });
});

describe('parseStoryRequest', () => {
  it('returns parsed result for valid body', () => {
    const result = parseStoryRequest({ heroName: 'Luna', mode: 'sleep' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.heroName).toBe('Luna');
      expect(result.data.mode).toBe('sleep');
    }
  });

  it('returns error for missing heroName', () => {
    const result = parseStoryRequest({});
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/validation.test.ts`
Expected: FAIL — module has no exports

- [ ] **Step 3: Write implementation**

Create `server/validation.ts`:

```ts
import { z } from 'zod';

export const VALID_MODES = ['classic', 'madlibs', 'sleep'] as const;
export const VALID_DURATIONS = ['short', 'medium-short', 'medium', 'long', 'epic'] as const;
export const MAX_INPUT_STRING_LENGTH = 500;
export const MAX_TTS_TEXT_LENGTH = 5000;

export function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen).trim();
}

export function validateMadlibWords(input: unknown): Record<string, string> | undefined {
  if (input == null) return undefined;
  if (typeof input !== 'object' || Array.isArray(input)) return undefined;
  const obj = input as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length > 20) return undefined;
  const result: Record<string, string> = {};
  for (const key of keys) {
    if (typeof key !== 'string' || key.length > 100) continue;
    const val = obj[key];
    if (typeof val !== 'string') continue;
    result[key.slice(0, 100)] = String(val).slice(0, 100);
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/** Zod transform that truncates a string to maxLen and trims. */
function truncated(maxLen: number) {
  return z.string().transform((s) => s.slice(0, maxLen).trim());
}

/** Optional truncated string that becomes undefined when empty. */
function optTruncated(maxLen: number) {
  return z.string().optional().default('').transform((s) => {
    const v = s.slice(0, maxLen).trim();
    return v || undefined;
  });
}

export const StoryRequestSchema = z.object({
  heroName: truncated(MAX_INPUT_STRING_LENGTH).refine((s) => s.length > 0, { message: 'Hero name is required' }),
  heroTitle: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroPower: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  duration: z.string().default('medium').transform((s) =>
    (VALID_DURATIONS as readonly string[]).includes(s) ? s : 'medium'
  ),
  mode: z.string().default('classic').transform((s) =>
    (VALID_MODES as readonly string[]).includes(s) ? s : 'classic'
  ),
  madlibWords: z.unknown().optional().transform((v) => validateMadlibWords(v)),
  soundscape: optTruncated(30),
  setting: optTruncated(100),
  tone: optTruncated(50),
  childName: optTruncated(50),
  sidekick: optTruncated(100),
  problem: optTruncated(100),
});

export type StoryRequest = z.output<typeof StoryRequestSchema>;

export const AvatarRequestSchema = z.object({
  heroName: truncated(MAX_INPUT_STRING_LENGTH).refine((s) => s.length > 0, { message: 'Hero name is required' }),
  heroTitle: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroPower: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
});

export type AvatarRequest = z.output<typeof AvatarRequestSchema>;

export const SceneRequestSchema = z.object({
  heroName: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  sceneText: truncated(2000).refine((s) => s.length > 0, { message: 'Scene text is required' }),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
});

export type SceneRequest = z.output<typeof SceneRequestSchema>;

export const TtsRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(MAX_TTS_TEXT_LENGTH, `Text too long. Maximum ${MAX_TTS_TEXT_LENGTH} characters.`),
  voice: z.string().optional().default('moonbeam').transform((s) => s.slice(0, 20).toLowerCase()),
  mode: z.string().optional().transform((s) => s ? s.slice(0, 20) : undefined),
});

export type TtsRequest = z.output<typeof TtsRequestSchema>;

export const VideoRequestSchema = z.object({
  sceneText: truncated(2000).refine((s) => s.length > 0, { message: 'Scene text is required' }),
  heroName: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
});

export type VideoRequest = z.output<typeof VideoRequestSchema>;

export const SuggestSettingsRequestSchema = z.object({
  heroName: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroPower: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  hour: z.number().int().min(0).max(23).optional().default(new Date().getHours()),
  childAge: z.number().int().min(1).max(12).optional(),
  childName: optTruncated(30),
});

export type SuggestSettingsRequest = z.output<typeof SuggestSettingsRequestSchema>;

/**
 * Parse and validate a story request body.
 * Returns a Zod SafeParseReturnType — caller checks `.success`.
 */
export function parseStoryRequest(body: unknown): z.SafeParseReturnType<unknown, StoryRequest> {
  return StoryRequestSchema.safeParse(body);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run server/validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/validation.ts server/validation.test.ts
git commit -m "refactor: extract validation, Zod schemas, and parseStoryRequest to server/validation.ts"
```

---

### Task 3: Create `server/rate-limit.ts`

**Files:**
- Create: `server/rate-limit.ts`
- Create: `server/rate-limit.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/rate-limit.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

    vi.advanceTimersByTime(61_000); // past the 60s window
    expect(checkRateLimit('ip-c')).toBe(true);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/rate-limit.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `server/rate-limit.ts`:

```ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(60 * 1000), 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10', 10);

/**
 * Sliding-window per-key rate limiter.
 * When auth is enabled, callers should pass `req.user.uid` so authenticated
 * users on shared IPs don't exhaust each other's quota.
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

/** Periodic cleanup — call via setInterval in the server bootstrap. */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

/** For testing only. */
export function resetRateLimits(): void {
  rateLimitMap.clear();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run server/rate-limit.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/rate-limit.ts server/rate-limit.test.ts
git commit -m "refactor: extract rate limiting to server/rate-limit.ts"
```

---

### Task 4: Create `server/prompts.ts`

**Files:**
- Create: `server/prompts.ts`
- Create: `server/prompts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/prompts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  CHILD_SAFETY_RULES,
  getStorySystemPrompt,
  getStoryUserPrompt,
  getPartCount,
  getWordCount,
  getRandomStyle,
  ART_STYLES,
  STORY_RESPONSE_SCHEMA,
} from './prompts';

describe('CHILD_SAFETY_RULES', () => {
  it('includes non-negotiable safety phrases', () => {
    expect(CHILD_SAFETY_RULES).toContain('NEVER include violence');
    expect(CHILD_SAFETY_RULES).toContain('ages 3-9');
  });
});

describe('getPartCount', () => {
  it('returns correct counts for each duration', () => {
    expect(getPartCount('short')).toBe(3);
    expect(getPartCount('medium')).toBe(5);
    expect(getPartCount('epic')).toBe(7);
  });

  it('defaults to 5 for unknown durations', () => {
    expect(getPartCount('unknown')).toBe(5);
  });
});

describe('getWordCount', () => {
  it('returns a range string', () => {
    expect(getWordCount('short')).toBe('200-300');
    expect(getWordCount('epic')).toBe('1000-1300');
  });
});

describe('getStorySystemPrompt', () => {
  it('always includes CHILD_SAFETY_RULES', () => {
    expect(getStorySystemPrompt('classic', 5)).toContain('NEVER include violence');
    expect(getStorySystemPrompt('madlibs', 5)).toContain('NEVER include violence');
    expect(getStorySystemPrompt('sleep', 5)).toContain('NEVER include violence');
  });

  it('includes part count', () => {
    expect(getStorySystemPrompt('classic', 7)).toContain('7 parts');
  });

  it('disables choices in sleep mode', () => {
    const prompt = getStorySystemPrompt('sleep', 5);
    expect(prompt).toContain('do NOT include choices');
  });
});

describe('getStoryUserPrompt', () => {
  it('includes hero details', () => {
    const prompt = getStoryUserPrompt('classic', 'Luna', 'Star Guardian', 'light', 'Brave hero', '500-650', 5);
    expect(prompt).toContain('Luna');
    expect(prompt).toContain('Star Guardian');
  });

  it('includes madlib words when provided', () => {
    const prompt = getStoryUserPrompt('madlibs', 'Luna', '', '', '', '500', 5, { noun: 'banana' });
    expect(prompt).toContain('banana');
  });
});

describe('getRandomStyle', () => {
  it('returns a string from ART_STYLES', () => {
    const style = getRandomStyle();
    expect(ART_STYLES).toContain(style);
  });
});

describe('STORY_RESPONSE_SCHEMA', () => {
  it('has required fields', () => {
    expect(STORY_RESPONSE_SCHEMA.required).toContain('title');
    expect(STORY_RESPONSE_SCHEMA.required).toContain('parts');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/prompts.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `server/prompts.ts` — move the following verbatim from `server/routes.ts`:
- `ART_STYLES` array
- `getRandomStyle()`
- `STORY_RESPONSE_SCHEMA`
- `CHILD_SAFETY_RULES`
- `getPartCount(duration)`
- `getWordCount(duration)`
- `getStorySystemPrompt(mode, partCount)`
- `getStoryUserPrompt(mode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords?, soundscape?, setting?, tone?, childName?, sidekick?, problem?)`

Import `sanitizeString` from `./validation` (used inside `getStoryUserPrompt` for madlib words).

Export all functions and constants. The full file content is a direct extraction — no logic changes.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run server/prompts.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/prompts.ts server/prompts.test.ts
git commit -m "refactor: extract prompt building to server/prompts.ts"
```

---

### Task 5: Add timeout + parsed JSON to AI router

**Files:**
- Modify: `server/ai/types.ts`
- Modify: `server/ai/router.ts`
- Modify: `server/ai/router.test.ts`

- [ ] **Step 1: Add `timeoutMs` and `parsedJson` to types**

In `server/ai/types.ts`, add `timeoutMs` to `TextGenerationRequest`:

```ts
export interface TextGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  thinkingBudget?: number;
  responseSchema?: Record<string, unknown>;
  /** Abort if the provider doesn't respond within this many milliseconds. */
  timeoutMs?: number;
}
```

Add `parsedJson` to `TextGenerationResponse`:

```ts
export interface TextGenerationResponse {
  text: string;
  provider: ProviderName;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  /** When jsonMode is true, the router parses the JSON and sets this field. */
  parsedJson?: unknown;
}
```

- [ ] **Step 2: Write the failing test for timeout**

Add to `server/ai/router.test.ts`:

```ts
describe('timeout support', () => {
  it('rejects when provider exceeds timeoutMs', async () => {
    const router = new AIRouter();
    const slowProvider = createMockProvider({
      name: 'anthropic',
      generateText: vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          text: 'late',
          provider: 'anthropic' as const,
          model: 'model',
        }), 5000))
      ),
    });
    router.registerProvider(slowProvider);

    await expect(
      router.generateText('story', { ...DEFAULT_REQUEST, timeoutMs: 50 })
    ).rejects.toThrow();
  });
});

describe('parsedJson in jsonMode', () => {
  it('returns parsedJson when jsonMode is true', async () => {
    const router = new AIRouter();
    const provider = createMockProvider({
      name: 'anthropic',
      generateText: vi.fn().mockResolvedValue({
        text: '{"title":"test"}',
        provider: 'anthropic',
        model: 'model',
      }),
    });
    router.registerProvider(provider);

    const result = await router.generateText('story', {
      ...DEFAULT_REQUEST,
      jsonMode: true,
    });
    expect(result.parsedJson).toEqual({ title: 'test' });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run server/ai/router.test.ts`
Expected: FAIL — timeout doesn't reject, parsedJson is undefined

- [ ] **Step 4: Implement timeout and parsedJson in router**

In `server/ai/router.ts`, update `generateText`:

```ts
async generateText(
  taskType: AITaskType,
  req: TextGenerationRequest
): Promise<TextGenerationResponse> {
  const chain = this.getAvailableChain(taskType, "text");
  if (chain.length === 0) {
    throw new Error(`No AI providers available for text generation (task: ${taskType})`);
  }

  let lastError: Error | null = null;
  for (const provider of chain) {
    try {
      const providerCall = provider.generateText(req);

      let response: TextGenerationResponse;
      if (req.timeoutMs && req.timeoutMs > 0) {
        response = await Promise.race([
          providerCall,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${provider.displayName} timed out after ${req.timeoutMs}ms`)), req.timeoutMs)
          ),
        ]);
      } else {
        response = await providerCall;
      }

      if (req.jsonMode) {
        let cleaned = response.text.trim();
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(`[AI Router] ${provider.displayName} returned non-JSON for ${taskType}, trying next provider`);
          lastError = new Error(`${provider.displayName} returned invalid JSON`);
          continue;
        }
        try {
          response.parsedJson = JSON.parse(jsonMatch[0]);
          response.text = jsonMatch[0];
        } catch {
          console.error(`[AI Router] ${provider.displayName} returned unparseable JSON for ${taskType}, trying next provider`);
          lastError = new Error(`${provider.displayName} returned malformed JSON`);
          continue;
        }
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[AI Router] ${provider.displayName} failed for ${taskType}: ${lastError.message}`);
    }
  }

  throw lastError || new Error("All providers failed");
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run server/ai/router.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/ai/types.ts server/ai/router.ts server/ai/router.test.ts
git commit -m "feat: add timeout support and parsedJson to AI router"
```

---

### Task 6: Rewire `server/routes.ts` — import extracted modules, deduplicate, use Zod

**Files:**
- Modify: `server/routes.ts`

This is a pure refactor — behavior must remain identical.

- [ ] **Step 1: Replace imports and remove extracted code**

At the top of `server/routes.ts`, replace the local definitions with imports:

```ts
import { sanitizeString, StoryRequestSchema, AvatarRequestSchema, SceneRequestSchema, TtsRequestSchema, VideoRequestSchema, SuggestSettingsRequestSchema, VALID_MODES, VALID_DURATIONS, MAX_TTS_TEXT_LENGTH } from './validation';
import { getStorySystemPrompt, getStoryUserPrompt, getPartCount, getWordCount, getRandomStyle, STORY_RESPONSE_SCHEMA, CHILD_SAFETY_RULES } from './prompts';
import { checkRateLimit, cleanupExpiredEntries } from './rate-limit';
import { toErrorMessage } from './utils';
```

Delete from `routes.ts`:
- `sanitizeString` function (lines 71-74)
- `validateMadlibWords` function (lines 76-90)
- `rateLimitMap`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `checkRateLimit`, rate limit cleanup interval (lines 49-69)
- `MAX_TTS_TEXT_LENGTH`, `MAX_INPUT_STRING_LENGTH`, `VALID_MODES`, `VALID_DURATIONS` constants (lines 44-47)
- `ART_STYLES`, `getRandomStyle` (lines 94-111)
- `STORY_RESPONSE_SCHEMA` (lines 113-151)
- `CHILD_SAFETY_RULES` (lines 153-164)
- `getPartCount`, `getWordCount` (lines 166-186)
- `getStorySystemPrompt`, `getStoryUserPrompt` (lines 188-312)

Add the rate-limit cleanup interval in `registerRoutes`:

```ts
const rateLimitCleanup = setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
```

- [ ] **Step 2: Refactor `/api/generate-story` to use Zod + parsedJson**

Replace the manual sanitization block (lines 339-358) and JSON re-parsing (lines 381-398) with:

```ts
app.post("/api/generate-story", async (req, res) => {
  const clientIp = req.user?.uid || req.ip || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const parsed = StoryRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
  }

  const { heroName, heroTitle, heroPower, heroDescription, duration, mode, madlibWords, soundscape, setting, tone, childName, sidekick, problem } = parsed.data;

  try {
    const partCount = getPartCount(duration);
    const wordCount = getWordCount(duration);

    const systemPrompt = getStorySystemPrompt(mode, partCount);
    const userPrompt = getStoryUserPrompt(mode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords, soundscape, setting, tone, childName, sidekick, problem);

    const aiResponse = await aiRouter.generateText("story", {
      systemPrompt,
      userPrompt,
      temperature: mode === "sleep" ? 0.7 : 0.9,
      maxTokens: 8192,
      jsonMode: true,
      responseSchema: STORY_RESPONSE_SCHEMA,
      timeoutMs: 60_000,
    });

    if (!aiResponse.parsedJson) {
      return res.status(500).json({ error: "Invalid story response" });
    }

    console.log(`[Story] Generated by ${aiResponse.provider} (${aiResponse.model})`);

    const story = aiResponse.parsedJson as Record<string, unknown>;

    if (!story.parts || !Array.isArray(story.parts)) {
      return res.status(500).json({ error: "Invalid story structure" });
    }

    story.parts = (story.parts as Array<{ text?: string; choices?: string[] }>).map((part, i) => ({
      text: part.text || "",
      choices: mode === "sleep" ? undefined : (part.choices || undefined),
      partIndex: i,
    }));

    if ((story.parts as unknown[]).length > 0 && mode !== "sleep") {
      delete (story.parts as Record<string, unknown>[])[(story.parts as unknown[]).length - 1].choices;
    }

    res.json(story);
  } catch (error: unknown) {
    console.error("Error generating story:", toErrorMessage(error));
    res.status(500).json({ error: "Failed to generate story" });
  }
});
```

- [ ] **Step 3: Refactor `/api/generate-story-stream` similarly**

Use `StoryRequestSchema.safeParse(req.body)` instead of manual parsing. Keep SSE logic unchanged. Add `timeoutMs: 60_000` is not applicable to streaming (streams have their own timeout behavior), so skip timeout for streaming.

- [ ] **Step 4: Refactor remaining endpoints**

Apply the same pattern to:
- `/api/generate-avatar` — use `AvatarRequestSchema.safeParse(req.body)`
- `/api/generate-scene` — use `SceneRequestSchema.safeParse(req.body)`
- `/api/tts` — use `TtsRequestSchema.safeParse(req.body)`
- `/api/generate-video` — use `VideoRequestSchema.safeParse(req.body)`
- `/api/suggest-settings` — use `SuggestSettingsRequestSchema.safeParse(req.body)`

Replace `error instanceof Error ? error.message : String(error)` with `toErrorMessage(error)` in all catch blocks.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: PASS — all existing tests + new tests pass

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add server/routes.ts
git commit -m "refactor: routes.ts uses extracted modules, Zod validation, and AI router parsedJson"
```

---

### Task 7: Fix CORS, security headers, and auth warning in `server/index.ts`

**Files:**
- Modify: `server/index.ts`
- Modify: `server/auth.ts`

- [ ] **Step 1: Restrict Vercel CORS wildcard**

In `server/index.ts`, replace line 109:

```ts
// Before:
const isVercelPreview = origin ? /\.vercel\.app$/.test(new URL(origin).hostname) : false;

// After:
const isVercelPreview = origin ? /^infinite-hero.*\.vercel\.app$/.test(new URL(origin).hostname) : false;
```

- [ ] **Step 2: Remove deprecated X-XSS-Protection header**

In `setupSecurityHeaders`, remove line 64:

```ts
// Delete this line:
res.setHeader("X-XSS-Protection", "1; mode=block");
```

- [ ] **Step 3: Add `isAuthEnabled` to `server/auth.ts`**

Add to `server/auth.ts`:

```ts
/** Check at startup whether Firebase auth is configured. */
export function isAuthEnabled(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
}
```

- [ ] **Step 4: Add auth warning to `validateEnvironment`**

In `server/index.ts`, import `isAuthEnabled` and add to `validateEnvironment()`:

```ts
import { isAuthEnabled } from './auth';

// Inside validateEnvironment(), after existing checks:
if (!isAuthEnabled()) {
  log("[Env] WARNING: FIREBASE_SERVICE_ACCOUNT_KEY not set — authentication is DISABLED (dev mode)");
}
```

- [ ] **Step 5: Enhance health check**

In `server/routes.ts`, update the health endpoint:

```ts
app.get("/api/health", (_req, res) => {
  const providers = getProviderStatuses();
  const aiAvailable = providers.some((p) => p.available && p.capabilities.text);
  const ttsAvailable = !!process.env.ELEVENLABS_API_KEY;
  res.json({
    status: "ok",
    timestamp: Date.now(),
    aiProvidersAvailable: aiAvailable,
    ttsAvailable,
  });
});
```

- [ ] **Step 6: Run typecheck and tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/index.ts server/auth.ts server/routes.ts
git commit -m "fix: restrict CORS wildcard, remove X-XSS-Protection, add auth startup warning, enhance health check"
```

---

### Task 8: Clean up old `server/routes.test.ts`

**Files:**
- Modify: `server/routes.test.ts`

- [ ] **Step 1: Update tests to import from validation.ts**

The existing `routes.test.ts` copies `sanitizeString` and `validateMadlibWords` locally because they weren't exported. Now they are. Replace the test file to import from `./validation` directly:

```ts
import { describe, it, expect } from 'vitest';
import { sanitizeString, validateMadlibWords } from './validation';

describe('sanitizeString', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizeString(123, 100)).toBe('');
    expect(sanitizeString(null, 100)).toBe('');
    expect(sanitizeString(undefined, 100)).toBe('');
    expect(sanitizeString({}, 100)).toBe('');
  });

  it('truncates strings exceeding max length', () => {
    expect(sanitizeString('a'.repeat(600), 500)).toHaveLength(500);
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ', 100)).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeString('', 100)).toBe('');
  });

  it('preserves valid strings under max length', () => {
    expect(sanitizeString('Captain Sparkle', 500)).toBe('Captain Sparkle');
  });

  it('handles max length of zero', () => {
    expect(sanitizeString('hello', 0)).toBe('');
  });
});

describe('validateMadlibWords', () => {
  it('returns undefined for null/undefined input', () => {
    expect(validateMadlibWords(null)).toBeUndefined();
    expect(validateMadlibWords(undefined)).toBeUndefined();
  });

  it('returns undefined for non-object input', () => {
    expect(validateMadlibWords('string')).toBeUndefined();
    expect(validateMadlibWords(42)).toBeUndefined();
    expect(validateMadlibWords([1, 2, 3])).toBeUndefined();
  });

  it('returns sanitized key-value pairs', () => {
    expect(validateMadlibWords({ noun: 'cat', verb: 'jump' }))
      .toEqual({ noun: 'cat', verb: 'jump' });
  });

  it('filters out non-string values', () => {
    expect(validateMadlibWords({ noun: 'cat', count: 5 }))
      .toEqual({ noun: 'cat' });
  });

  it('rejects objects with more than 20 keys', () => {
    const tooMany: Record<string, string> = {};
    for (let i = 0; i < 21; i++) tooMany[`key${i}`] = 'val';
    expect(validateMadlibWords(tooMany)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/routes.test.ts
git commit -m "refactor: routes.test.ts imports from validation.ts instead of duplicating functions"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run linter**

Run: `npx eslint server/ --ext .ts`
Expected: No new errors (existing warnings acceptable)

- [ ] **Step 4: Verify server starts**

Run: `npx tsx server/index.ts` (or `npm run server:dev`)
Expected: Server starts, logs provider status, logs auth warning if FIREBASE_SERVICE_ACCOUNT_KEY is unset

- [ ] **Step 5: Final commit if any fixups needed**

---

## Deferred Items (Not in This Plan)

These were identified in the review but are out of scope for this hardening pass:

- **Streaming fallback corruption** — requires client-side changes to handle "discard" signals; document the limitation for now
- **TTS cache size limit** — low risk, can be a follow-up
- **Structured logging (pino)** — adds a dependency; better as a separate focused PR
- **Request ID / correlation** — coupled with structured logging
- **lib/storage.ts versioned data migration** — client-side change, different risk profile
- **Graceful shutdown connection draining** — complex, low priority for single-instance deploys
