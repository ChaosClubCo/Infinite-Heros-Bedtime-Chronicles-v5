# Security Policy

<!-- Last verified: 2026-05-05 -->

## Supported Versions

This is a single-branch project. Security fixes are applied to the `main` branch only. There are no versioned release branches.

| Version / Branch | Supported |
|-----------------|-----------|
| `main` (latest) | ✅ Yes |
| Any older commit | ❌ No — update to `main` |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

To report a vulnerability, contact the repository owner directly:

1. **GitHub:** Open a [private security advisory](https://github.com/Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5/security/advisories/new) on this repository. This keeps the report confidential until a fix is released.
2. **Email:** Contact `@Krosebrook` via GitHub profile contact information.

Please include:
- A description of the vulnerability and its impact
- Steps to reproduce
- Affected file(s) or endpoint(s)
- Any suggested fix (optional)

## Security Response SLA

| Stage | Target |
|-------|--------|
| Acknowledgment | Within 72 hours of report |
| Severity assessment | Within 5 business days |
| Fix for critical/high | Within 14 days |
| Fix for medium | Within 30 days |
| Fix for low | Next regular release |

## Scope

**In scope:**
- Server API endpoints (`/api/*`)
- AI prompt injection that bypasses child safety rules
- Authentication bypass (Firebase token validation)
- Rate limiting bypass
- Input validation bypasses that could cause server errors or data exposure
- Dependency vulnerabilities with direct exploitation path

**Out of scope:**
- Theoretical vulnerabilities without a practical exploitation path
- Issues that require physical access to the device
- Vulnerabilities in external services (ElevenLabs, OpenAI, Anthropic, Gemini) — report those directly to the provider
- Self-XSS or social-engineering attacks

## Dependency Management

- Dependencies are audited with `npm audit` (scripts: `npm run audit`, `npm run audit:fix`)
- Dependabot is configured (`.github/dependabot.yml`) to open PRs for dependency updates weekly
- Target: zero critical and zero high vulnerabilities in direct and indirect dependencies
- Remaining vulnerabilities blocked on upstream packages are documented in `docs/CHANGELOG.md`
- Run `npm audit` before every production deployment

## Secrets Management

- All API keys and secrets are stored as **environment variables** — never in source code
- Replit Secrets (`Settings → Secrets`) for Replit deployments
- EAS Secrets (`eas secret:create`) for mobile builds
- The `FIREBASE_SERVICE_ACCOUNT_KEY` is a JSON string; treat it as a private key
- `EXPO_PUBLIC_*` variables are bundled into the client APK — **never** put secrets with this prefix
- `.env` is in `.gitignore`; `.env.example` contains only blank placeholder values

---

## Security Controls

**Last Updated:** 2026-05-05

### Implemented

| Control | Status | Details |
|---------|--------|---------|
| Server-side API proxy | Active | All AI provider keys stay on the server; client never sees them |
| Security headers | Active | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy, X-Permitted-Cross-Domain-Policies |
| CORS restrictions | Active | Dynamic origin matching — only Replit domains + localhost allowed |
| HTTP body size limits | Active | 100KB for general requests, 10MB for audio payloads |
| Input sanitization | Active | All user inputs truncated to max length via `sanitizeString()` |
| Input validation | Active | Whitelisted modes, durations, speeds; validated voice keys; parseInt guards on route params |
| Conversation ID validation | Active | `parseIdParam()` rejects NaN, zero, negative, and non-integer IDs with 400 |
| Message content validation | Active | Type check, empty check, max 10,000 character limit |
| Audio payload validation | Active | Type check, base64 size estimation, max 10MB limit |
| Voice parameter validation | Active | Allowlist: alloy, echo, fable, onyx, nova, shimmer |
| Conversation title sanitization | Active | Trimmed and capped at 200 characters |
| Conversation pagination | Active | `limit`/`offset` query params with bounds (max 200 per page) |
| Safe JSON parsing | Active | AI response `JSON.parse` wrapped in try-catch to prevent crashes |
| Typed error handling | Active | `catch (error: any)` replaced with `error instanceof Error` checks |
| Rate limiting | Active | Per-UID (Firebase) or per-IP, 10 req/min (configurable via env vars) |
| Rate limit cleanup | Active | Expired entries pruned every 5 minutes |
| TTS file validation | Active | Filename regex (`/^[a-f0-9]+\.mp3$/`) + path traversal prevention |
| Video ID validation | Active | Regex validation (`/^[a-f0-9]+$/`) |
| Error sanitization | Active | Internal errors not leaked to clients via `sanitizeErrorMessage()` |
| Graceful shutdown | Active | SIGTERM/SIGINT handlers with 10s timeout |
| Child safety prompts | Active | `CHILD_SAFETY_RULES` system prompt in `server/prompts.ts` enforces age-appropriate content |
| Database cascade deletes | Active | Deleting a conversation cascades to all messages |
| Firebase Authentication | Active | Firebase Auth with Bearer tokens; anonymous sign-in for frictionless UX |
| Production auth guard | Active | Blocks all POST requests in NODE_ENV=production without Firebase key (503) |
| Parent PIN hashing | Active | SHA-256 hash + random salt via expo-crypto; 5-attempt lockout |
| Voice chat child safety | Active | VOICE_CHAT_SAFETY_PROMPT prepended to all AI conversations |
| Voice chat auth | Active | requireAuth middleware on all /api/conversations/* endpoints |
| Chat history cap | Active | Max 20 messages sent to AI provider |
| Load shedding | Active | Active-request ceiling middleware drops excess requests with 503 |
| Idempotency cache | Active | 5-min TTL dedup keyed on request hash; prevents duplicate expensive AI calls |

### Not Implemented (Acceptable Risk)

| Item | Risk Level | Rationale |
|------|-----------|-----------|
| Client-side encryption | Low | Cached data is non-sensitive (story text, audio); no PII stored |
| Explicit prompt injection defense | Low | AI safety filters + child-safety system prompt constrain output |
| CSP headers | Medium | API-only server; CSP is not applicable to most endpoints |
| Per-user rate limiting on all routes | Low | UID-based rate limiting already active when Firebase auth is configured |
| Redis-backed rate limiting | Low | In-memory limiting is acceptable for single-instance deployment |

## OWASP Top 10 Assessment

| # | Vulnerability | Status |
|---|--------------|--------|
| A01 | Broken Access Control | Mitigated — Firebase Auth on all POST endpoints; conversation ID validation; production auth guard |
| A02 | Cryptographic Failures | Mitigated — parent PIN hashed with SHA-256 + salt; API keys server-only |
| A03 | Injection | Mitigated — input sanitization via `sanitizeString()`; parameterized DB queries (Drizzle ORM); prompt injection risk acknowledged |
| A04 | Insecure Design | Mitigated — `CHILD_SAFETY_RULES` + `VOICE_CHAT_SAFETY_PROMPT`; dual-layer rate limiting |
| A05 | Security Misconfiguration | Mitigated — security headers; CORS restricted; body limits enforced; production auth guard |
| A06 | Vulnerable Components | Monitor — run `npm audit` before each deployment; Dependabot PRs reviewed weekly |
| A07 | Auth Failures | Mitigated — Firebase Auth with Bearer tokens; brute-force lockout on parent PIN |
| A08 | Data Integrity Failures | Low risk — server validates AI responses before returning to client |
| A09 | Logging Failures | Mitigated — pino structured logging; rate limit violation logging; auth failure logging |
| A10 | SSRF | Low risk — server only makes outbound calls to known AI provider URLs |

## Rate Limiting Details

- **Algorithm:** Sliding window (in-memory Map)
- **Window:** 60 seconds (configurable: `RATE_LIMIT_WINDOW_MS`)
- **Max requests:** 10 per window (configurable: `RATE_LIMIT_MAX`)
- **Key:** Firebase UID when auth is configured; falls back to client IP (`req.ip || req.socket.remoteAddress`)
- **Response on limit:** `429 Too Many Requests`
- **Cleanup:** Expired entries pruned every 5 minutes
