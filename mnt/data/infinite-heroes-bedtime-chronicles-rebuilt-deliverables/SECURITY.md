# Security Policy & Best Practices — Infinity Heroes: Bedtime Chronicles

This document is the single source of truth for both the security policy (reporting, scope, SLAs) and the developer guidelines (authentication, sanitization, child safety, rate limiting, and PIN hashing) for Infinity Heroes: Bedtime Chronicles v5.

---

## PART 1: Security Policy

### Supported Versions
This is a single-branch project. Security fixes are applied to the `main` branch only. There are no versioned release branches.

| Version / Branch | Supported |
| :--- | :--- |
| `main` (latest) | ✅ Yes |
| Any older commit | ❌ No — update to `main` |

### Reporting a Vulnerability
**Do not open a public GitHub issue for security vulnerabilities.**

To report a vulnerability, contact the repository owner directly:
1.  **GitHub:** Open a [private security advisory](https://github.com/Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5/security/advisories/new) on this repository. This keeps the report confidential until a fix is released.
2.  **Email:** Contact `@Krosebrook` via GitHub profile contact information.

Please include:
- A description of the vulnerability and its impact.
- Steps to reproduce.
- Affected file(s) or endpoint(s).
- Any suggested fix (optional).

### Security Response SLA

| Stage | Target |
| :--- | :--- |
| Acknowledgment | Within 72 hours of report |
| Severity assessment | Within 5 business days |
| Fix for critical/high | Within 14 days |
| Fix for medium | Within 30 days |
| Fix for low | Next regular release |

### Scope

**In scope:**
- Server API endpoints (`/api/*`)
- AI prompt injection that bypasses child safety rules
- Authentication bypass (Firebase/Supabase token validation)
- Rate limiting bypass
- Input validation bypasses that could cause server errors or data exposure
- Dependency vulnerabilities with a direct exploitation path

**Out of scope:**
- Theoretical vulnerabilities without a practical exploitation path
- Issues that require physical access to the device
- Vulnerabilities in external services (ElevenLabs, OpenAI, Anthropic, Gemini) — report those directly to the provider
- Self-XSS or social-engineering attacks

---

## PART 2: Security Controls & OWASP Assessment

### Implemented Controls

| Control | Status | Details |
| :--- | :--- | :--- |
| **Server-side API proxy** | Active | All AI provider keys stay on the server; client never sees them |
| **Security headers** | Active | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy, X-Permitted-Cross-Domain-Policies |
| **CORS restrictions** | Active | Dynamic origin matching — only Replit domains + localhost allowed |
| **HTTP body size limits** | Active | 100KB for general requests, 10MB for audio payloads |
| **Input sanitization** | Active | All user inputs truncated to max length via `sanitizeString()` |
| **Input validation** | Active | Whitelisted modes, durations, speeds; validated voice keys; parseInt guards on route params |
| **Conversation ID validation** | Active | `parseIdParam()` rejects NaN, zero, negative, and non-integer IDs with 400 |
| **Message content validation** | Active | Type check, empty check, max 10,000 character limit |
| **Audio payload validation** | Active | Type check, base64 size estimation, max 10MB limit |
| **Voice parameter validation** | Active | Allowlist: alloy, echo, fable, onyx, nova, shimmer |
| **Conversation title sanitization**| Active | Trimmed and capped at 200 characters |
| **Conversation pagination** | Active | `limit`/`offset` query params with bounds (max 200 per page) |
| **Safe JSON parsing** | Active | AI response `JSON.parse` wrapped in try-catch to prevent crashes |
| **Typed error handling** | Active | `catch (error: any)` replaced with `error instanceof Error` checks |
| **Rate limiting** | Active | Per-UID (Firebase/Supabase) or per-IP, 10 req/min (configurable via env vars) |
| **Rate limit cleanup** | Active | Expired entries pruned every 5 minutes |
| **TTS file validation** | Active | Filename regex (`/^[a-f0-9]+\.mp3$/`) + path traversal prevention |
| **Video ID validation** | Active | Regex validation (`/^[a-f0-9]+$/`) |
| **Error sanitization** | Active | Internal errors not leaked to clients via `sanitizeErrorMessage()` |
| **Graceful shutdown** | Active | SIGTERM/SIGINT handlers with 10s timeout |
| **Child safety prompts** | Active | `CHILD_SAFETY_RULES` system prompt in `server/prompts.ts` enforces age-appropriate content |
| **Database cascade deletes** | Active | Deleting a conversation cascades to all messages |
| **Firebase/Supabase Auth** | Active | Optional, gated on keys; 503 in production when unconfigured |
| **Production auth guard** | Active | Blocks POST requests in production without authentication |
| **Parent PIN hashing** | Active | SHA-256 hash + random salt via expo-crypto; 5-attempt lockout |
| **Voice chat child safety** | Active | `VOICE_CHAT_SAFETY_PROMPT` prepended to all AI conversations |
| **Voice chat auth** | Active | `requireAuth` middleware on all `/api/conversations/*` endpoints |
| **Chat history cap** | Active | Max 20 messages sent to AI provider |
| **Load shedding** | Active | Active-request ceiling middleware drops excess requests with 503 |
| **Idempotency cache** | Active | 5-min TTL dedup keyed on request hash; prevents duplicate expensive AI calls |

### OWASP Top 10 Assessment

| # | Vulnerability | Status |
| :--- | :--- | :--- |
| **A01** | **Broken Access Control** | Mitigated — Supabase Auth on all POST endpoints; conversation ID validation; production auth guard |
| **A02** | **Cryptographic Failures** | Mitigated — parent PIN hashed with SHA-256 + salt; API keys server-only |
| **A03** | **Injection** | Mitigated — input sanitization via `sanitizeString()`; parameterized DB queries (Drizzle ORM); prompt injection risk acknowledged |
| **A04** | **Insecure Design** | Mitigated — `CHILD_SAFETY_RULES` + `VOICE_CHAT_SAFETY_PROMPT`; dual-layer rate limiting |
| **A05** | **Security Misconfiguration** | Mitigated — security headers; CORS restricted; body limits enforced; production auth guard |
| **A06** | **Vulnerable Components** | Monitor — run `npm audit` before each deployment; Dependabot PRs reviewed weekly |
| **A07** | **Auth Failures** | Mitigated — Supabase Auth with Bearer tokens; brute-force lockout on parent PIN |
| **A08** | **Data Integrity Failures** | Low risk — server validates AI responses before returning to client |
| **A09** | **Logging Failures** | Mitigated — pino structured logging; rate limit violation logging; auth failure logging |
| **A10** | **SSRF** | Low risk — server only makes outbound calls to known AI provider URLs |

---

## PART 3: Developer Security Guidelines

### Quick Reference Rules

| Rule | Priority | File / Module |
| :--- | :--- | :--- |
| Every story system prompt MUST include `CHILD_SAFETY_RULES` | **CRITICAL** | `server/routes/*.ts` |
| Every voice chat call MUST include `VOICE_CHAT_SAFETY_PROMPT` | **CRITICAL** | `server/replit_integrations/audio/routes.ts` |
| All POST `/api/*` and `/api/conversations/*` require authentication | **CRITICAL** | `server/auth.ts`, `server/routes.ts` |
| Sanitize ALL user strings with `sanitizeString(val, maxLen)` before prompt use | **CRITICAL** | `server/routes/story.ts`, `server/routes/suggest.ts` |
| Never expose stack traces or internal paths in client errors | **HIGH** | `server/index.ts` |
| Validate parameters against strict whitelists | **HIGH** | `server/routes/story.ts` |
| PIN hashed with SHA-256 + random salt; 5-attempt lockout | **HIGH** | [lib/storage.ts](file:///f:/Infinite-Heros-Bedtime-Chronicles-v5/lib/storage.ts) |
| Dual-layer rate limiting applied to generation endpoints | **HIGH** | `server/routes/*.ts` |
| Filenames validated with regex to prevent path traversal | **MEDIUM** | `server/routes/tts.ts` |
| API keys must live server-side only via `process.env` | **CRITICAL** | `server/index.ts` |

---

### 1. Authentication & JWT Validation

Authentication is implemented in `server/auth.ts`. The `requireAuth` middleware validates a Supabase access token (JWT Bearer token) from the `Authorization` header and attaches the authenticated user info to `req.user`.

```typescript
// server/auth.ts — Token extraction & validation pattern
const authHeader = req.headers.authorization;
if (!authHeader?.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Authentication required' });
}

const token = authHeader.slice(7);
if (token.length > 4096) { // Reject implausibly long tokens to prevent DoS
  return res.status(401).json({ error: 'Authentication required' });
}

const { data, error } = await supabase.auth.getUser(token);
if (error || !data?.user) {
  return res.status(401).json({ error: 'Invalid or expired token' });
}

req.user = {
  uid: data.user.id,
  isAnonymous: data.user.is_anonymous ?? false,
};
```

#### Production Guard
In production, if `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_URL` is not configured, **all requests are rejected** with a 503. There is no opt-out — the system ensures authentication is strictly enforced in production to prevent silent misconfiguration.

```typescript
// server/auth.ts — Production safety net
if (!supabase) {
  if (process.env.NODE_ENV === 'production') {
    logger.error({ path: req.path, method: req.method }, 'supabase auth missing in production; rejecting request');
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
  // Development mode fallback: allow with warning
  req.user = { uid: req.ip || 'anonymous', isAnonymous: true };
  return next();
}
```

---

### 2. Input Validation & Sanitization

#### `sanitizeString(val, maxLen)`
Every user-provided string MUST be sanitized before inclusion in an AI prompt. This function truncates to a maximum length and trims whitespace:

```typescript
function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== "string") return "";
  return val.slice(0, maxLen).trim();
}
```

#### Whitelisting Parameters
User-supplied mode and duration values are validated against explicit whitelists. Invalid values fall back to safe defaults:
```typescript
const VALID_MODES = ["classic", "madlibs", "sleep"];
const VALID_DURATIONS = ["short", "medium-short", "medium", "long", "epic"];

const storyMode = VALID_MODES.includes(mode) ? mode : "classic";
const storyDuration = VALID_DURATIONS.includes(duration) ? duration : "medium";
```

#### `sanitizeErrorMessage(err)`
Error responses MUST never leak internal details. The global error handler strips stack traces:
```typescript
function sanitizeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message.replace(/\n.*/gs, '').slice(0, 200);
  }
  return 'Internal Server Error';
}
```

---

### 3. Child Safety

#### `CHILD_SAFETY_RULES`
This constant is defined in `server/prompts.ts` and MUST be included in every story generation call.
```typescript
export const CHILD_SAFETY_RULES = `
CRITICAL SAFETY RULES (non-negotiable):
- NEVER include violence, weapons, fighting, battles, or physical conflict of any kind
- NEVER include scary, frightening, dark, or horror elements — no monsters, villains, or threats
- NEVER reference real-world brands, products, celebrities, or copyrighted characters
- NEVER include death, injury, illness, abandonment, or loss themes
- NEVER include bullying, meanness, exclusion, or unkind behavior that isn't immediately resolved
- NEVER use language that could cause anxiety, fear, or nightmares
- Every choice the hero makes leads to a positive, heroic, or interesting outcome — there are no failures
- Keep all content 100% appropriate for children ages 3-9
- Focus on themes of courage, kindness, friendship, wonder, imagination, and comfort
- All conflicts should be gentle (e.g., solving puzzles, helping friends, finding lost items) and resolve peacefully`;
```

#### Voice Chat History Cap
Voice chat history is capped at 20 messages to prevent unbounded token usage and keep the safety prompt effective:
```typescript
const messagesWithSafety = [
  { role: "system" as const, content: VOICE_CHAT_SAFETY_PROMPT },
  ...chatHistory.slice(-20),
];
```

---

### 4. Rate Limiting Details

The server applies dual-layer rate limiting:
1.  **IP-Based (Broad):** 10 requests per minute (sliding window, in-memory Map).
2.  **User-Based (Stricter):** 5 requests per minute via authenticated Firebase/Supabase UID.

```typescript
const clientIp = req.ip || req.socket.remoteAddress || "unknown";
const userId = req.user?.uid || clientIp;

if (!checkRateLimit(clientIp)) {
  return res.status(429).json({ error: "Too many requests. Please wait a moment." });
}
if (!checkUserRateLimit(userId)) {
  return res.status(429).json({ error: "Too many requests. Please wait a moment." });
}
```

---

### 5. Parent Controls & PIN Hashing

PINs are never stored in plaintext. They are hashed with SHA-256 using `expo-crypto` with a random 16-byte salt:

```typescript
// lib/storage.ts
export async function hashPin(pin: string, salt: string): Promise<string> {
  const { digestStringAsync, CryptoDigestAlgorithm } = await import('expo-crypto');
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, salt + pin);
}
```

#### Lockout Protection
5 failed attempts trigger a 30-second lockout:
```typescript
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000;

export function isPinLockedOut(controls: ParentControls): boolean {
  if (controls.lockoutUntil === 0) return false;
  return Date.now() < controls.lockoutUntil;
}
```

---

### 6. Data & File Safety

#### Path Traversal Mitigation
File-serving endpoints (such as TTS mp3 audio) validate filenames with strict regex and enforce path resolution boundaries:
```typescript
const fileName = req.params.file;
if (!fileName || !/^[a-f0-9]+\.mp3$/.test(fileName)) {
  return res.status(400).json({ error: "Invalid file name" });
}

const filePath = path.join(TTS_CACHE_DIR, fileName);
const resolved = path.resolve(filePath);
if (!resolved.startsWith(TTS_CACHE_DIR)) {
  return res.status(400).json({ error: "Invalid file path" });
}
```

#### CORS Restrictions
Locked to specific domains, Vercel preview URLs, and localhost ports:
```typescript
origins.add("https://bedtime-chronicles.com");
origins.add("https://www.bedtime-chronicles.com");

if (process.env.VERCEL_URL) {
  origins.add(`https://${process.env.VERCEL_URL}`);
}
```

---

### 7. New Endpoint Checklist

Every new API endpoint MUST satisfy all items in this checklist before merging:

- [ ] **Authentication:** Apply `requireAuth` middleware.
- [ ] **Input validation:** Validate request body with Zod schemas.
- [ ] **String sanitization:** Use `sanitizeString(val, maxLen)` on every user-provided string.
- [ ] **Whitelist validation:** Check enum values against whitelists (`VALID_MODES`, `VALID_DURATIONS`, etc.).
- [ ] **Rate limiting:** Apply `checkRateLimit(clientIp)` and `checkUserRateLimit(userId)` on generation endpoints.
- [ ] **Error sanitization:** Return generic error messages; never leak internals.
- [ ] **Child safety:** Include `CHILD_SAFETY_RULES` or `VOICE_CHAT_SAFETY_PROMPT` in AI requests.
- [ ] **File path safety:** Validate filenames with regex and verify resolved paths.

---

### Appendix: Environment Variables

- `FIREBASE_SERVICE_ACCOUNT_KEY` (Firebase credentials)
- `SUPABASE_SERVICE_ROLE_KEY` & `SUPABASE_URL` (Supabase production credentials)
- `NODE_ENV` (Controls production auth guard behaviour)
- `AI_INTEGRATIONS_GEMINI_API_KEY` (Gemini credentials)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` (Anthropic credentials)
