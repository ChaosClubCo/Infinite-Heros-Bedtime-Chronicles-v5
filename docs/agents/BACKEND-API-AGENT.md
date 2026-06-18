<!-- Last verified: 2026-06-18 -->
# BACKEND-API-AGENT.md — Express Server Expert

Specialized agent context for all work touching the Express.js backend: routes, middleware, server bootstrap, and API design.

---

## Domain Scope

This agent is authoritative for:
- `server/index.ts` — Server bootstrap, middleware stack, Sentry init, graceful shutdown
- `server/routes.ts` — Route composer (~43 lines); installs auth gate then calls domain modules
- `server/routes/health.ts` — GET /api/health, GET /api/ai-providers, GET /api/metrics
- `server/routes/story.ts` — POST /api/generate-story, POST /api/generate-story-stream
- `server/routes/images.ts` — POST /api/generate-avatar, POST /api/generate-scene
- `server/routes/tts.ts` — POST /api/tts, GET /api/tts-audio/:file, GET /api/voices, POST /api/tts-preview
- `server/routes/music.ts` — GET /api/music/:mode, GET /api/music-info/:mode
- `server/routes/suggest.ts` — POST /api/suggest-settings
- `server/routes/video.ts` — POST /api/generate-video, GET /api/video-status/:id, GET /api/video/:id
- `server/routes/context.ts` — Shared singleton instances (AI router, idempotency cache, etc.)
- `server/routes/helpers.ts` — `rateLimited()` middleware, `sendRouteError()`, IP/cache-path helpers
- `server/storage.ts` — In-memory story cache (not the client-side AsyncStorage helpers)
- `server/db.ts` — Drizzle ORM client
- `server/elevenlabs.ts` — TTS voice generation
- `server/suno.ts` — Background music serving
- `server/video.ts` — Sora video generation
- `server/replit_integrations/` — Audio, chat, image, batch modules (conditionally registered)

> **Architecture note (2026-06-13):** `server/routes.ts` is now a pure route composer (~43 lines).
> All handlers live in `server/routes/<domain>.ts` modules. Do **not** add inline handlers to
> `server/routes.ts` — create or extend the appropriate domain module instead.

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Framework | Express.js v5 |
| Runtime | Node.js 18+ |
| Language | TypeScript (strict) |
| Validation | Zod v4 |
| ORM | Drizzle ORM v0.45 |
| Database | PostgreSQL (Supabase, voice chat only) |
| Error Tracking | Sentry (`@sentry/node` — no-ops when `SENTRY_DSN` unset) |
| Rate Limit Persistence | Cloudflare KV (falls back to in-memory when env vars absent) |
| Build | esbuild → `server_dist/index.js` (ESM format) |

---

## Server Bootstrap Order (`server/index.ts`)

The middleware stack is applied in this exact order — do not reorder:

1. Sentry init (before all middleware — captures unhandled errors)
2. Environment validation (warns on missing providers)
3. Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `X-Permitted-Cross-Domain-Policies`)
4. CORS — dynamic origin matching; methods: `GET/POST/PUT/DELETE/OPTIONS`
5. Body parsing — JSON + URL-encoded, **100KB limit**
6. Request logging (pino)
7. Load shedding (rejects if active-request ceiling exceeded)
8. Expo manifest routing + static file serving
9. Route registration (`registerRoutes`) — installs auth gate on all POST `/api/*` then registers domain modules
10. Sentry error handler (before generic handler)
11. Global error handler (sanitizes messages via `sanitizeErrorMessage()`, never leaks stack traces)

---

## Adding a New Endpoint

New routes go into the appropriate domain module under `server/routes/`:

```typescript
// server/routes/example.ts — new domain module
import type { Express } from "express";
import { z } from "zod";
import { rateLimited, sendRouteError } from "./helpers";
import { sanitizeString } from "../validation";

export function registerExampleRoutes(app: Express) {
  app.post('/api/my-endpoint', rateLimited(), async (req, res) => {
    const schema = z.object({
      heroName: z.string().min(1).max(100),
      userInput: z.string().max(500),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const { heroName, userInput } = result.data;

    // ALWAYS sanitize strings before AI prompt inclusion
    const safeHeroName = sanitizeString(heroName);
    const safeInput = sanitizeString(userInput);

    try {
      const output = await someLogic(safeHeroName, safeInput);
      return res.json({ result: output });
    } catch (err) {
      return sendRouteError(res, err, 'my-endpoint');
    }
  });
}
```

Then wire it in `server/routes.ts`:
```typescript
import { registerExampleRoutes } from "./routes/example";
// inside registerRoutes():
registerExampleRoutes(app);
```

### Rules for New Endpoints
1. **Domain module** — add to `server/routes/<domain>.ts`, export a `registerXxxRoutes(app)` function, import and call it in `server/routes.ts`.
2. **Validate input** with Zod — define schema inline or in `server/validation.ts`.
3. **Sanitize** all user string fields with `sanitizeString()` before AI prompt use.
4. **Apply rate limiter** via `rateLimited()` from `server/routes/helpers.ts` on all POST endpoints that call external APIs.
5. **Error handling** — use `sendRouteError(res, err, 'route-name')` in catch blocks for consistent logging and sanitized responses.
6. **Return JSON** — always use `res.json({ ... })`.
7. **Document** in `docs/API.md` with method, path, body, response, and error shapes.

---

## Rate Limiting

Rate limiter is a per-IP (or per-UID when auth is enabled) sliding window:

```
RATE_LIMIT_WINDOW_MS=60000   # default 60 seconds
RATE_LIMIT_MAX=10            # default 10 requests per window
```

**Cloudflare KV persistence (optional):** when `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_KV_NAMESPACE_ID`, and `CLOUDFLARE_API_TOKEN` are set, rate-limit state survives server restarts and is shared across instances. Falls back to the in-memory Map automatically when those vars are absent.

Apply `rateLimited()` from `server/routes/helpers.ts` to new POST endpoints that call external APIs. **Never** create endpoints that bypass the rate limiter.

---

## CORS Configuration

CORS is restricted to:
- Replit dev domain (`REPLIT_DEV_DOMAIN` env var)
- Replit production domains (`REPLIT_DOMAINS` env var, comma-separated)
- `localhost` ports 5000, 8081, 19000–19006
- `https://bedtime-chronicles.com` and `https://www.bedtime-chronicles.com`
- Vercel preview URLs matching `infinite-hero*.vercel.app`
- `VERCEL_URL` env var

**Never** add wildcard CORS (`*`). Changes to CORS config require human review.

---

## Input Sanitization

```typescript
// sanitizeString() — strips potentially unsafe characters, truncates to max length
// Default max: 500 chars. Higher limits for specific fields (e.g., sceneText: 2000 chars)
const safeText = sanitizeString(req.body.text);
const safeLongText = sanitizeString(req.body.sceneText, 2000);
```

---

## Error Handling

```typescript
// Global error handler in server/index.ts — never return raw errors
// sanitizeErrorMessage() strips newlines, truncates to 200 chars
try {
  // ... logic
} catch (err) {
  const message = sanitizeErrorMessage(err);
  return res.status(500).json({ error: message });
}
```

HTTP status codes:
- `400` — bad input (Zod validation failure)
- `404` — resource not found
- `429` — rate limit exceeded
- `500` — unexpected server error

---

## Conditional Route Registration

Voice chat routes are only registered when required env vars are present **and** the feature flag is enabled:

```typescript
// Voice chat — requires OpenAI key + DATABASE_URL + feature flag
if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY &&
    process.env.DATABASE_URL &&
    isFeatureEnabled('voiceChatEnabled')) {
  registerAudioRoutes(app);
}

// Gemini image generation route
if (process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
  registerImageRoutes(app);
}
```

Feature flags are resolved in `server/feature-flags.ts` and can be toggled via environment variables without code changes.

---

## API Endpoint Reference (Key Endpoints)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/ai-providers` | Provider availability status |
| `POST` | `/api/generate-story` | Synchronous story generation |
| `POST` | `/api/generate-story-stream` | Streaming story generation (SSE) |
| `POST` | `/api/generate-avatar` | Hero portrait image |
| `POST` | `/api/generate-scene` | Story scene illustration |
| `POST` | `/api/suggest-settings` | AI story recommendations |
| `POST` | `/api/tts` | Generate TTS narration (max 5000 chars) |
| `GET` | `/api/tts-audio/:file` | Retrieve cached TTS audio |
| `POST` | `/api/tts-preview` | Voice preview |
| `GET` | `/api/voices` | Available narrator voices |
| `GET` | `/api/music/:mode` | Background music track |
| `POST` | `/api/generate-video` | Sora 2 video generation |
| `GET` | `/api/video-status/:id` | Video job status |
| `GET` | `/api/video/:id` | Retrieve generated video |

Full reference: `docs/API.md`

---

## TTS File Security

TTS audio files are cached in `/tmp/tts-cache`. Filename validation is **mandatory**:

```typescript
// Only files matching this pattern are served — do NOT relax this regex
const TTS_FILENAME_REGEX = /^[a-f0-9]+\.mp3$/;
if (!TTS_FILENAME_REGEX.test(filename)) {
  return res.status(400).json({ error: 'Invalid filename' });
}
```

---

## Video ID Validation

```typescript
// Only hex IDs accepted
const VIDEO_ID_REGEX = /^[a-f0-9]+$/;
if (!VIDEO_ID_REGEX.test(videoId)) {
  return res.status(400).json({ error: 'Invalid video ID' });
}
```

---

## Environment Variables

```
# Server config
PORT=5000                    # Default
NODE_ENV=development|production
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
TTS_CACHE_MAX_AGE_MS=86400000  # 24 hours

# Replit (auto-set)
REPLIT_DEV_DOMAIN=
REPLIT_DOMAINS=

# Observability (optional — both gracefully no-op when unset)
SENTRY_DSN=                  # Server-side Sentry error tracking
EXPO_PUBLIC_SENTRY_DSN=      # Client-side Sentry (bundled into APK — not a secret)

# Cloudflare KV persistent rate limiting (optional — falls back to in-memory)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_KV_NAMESPACE_ID=
CLOUDFLARE_API_TOKEN=

# Database (required for voice chat only)
DATABASE_URL=                # Supabase PostgreSQL connection string
```

Full list: `.env.example`

---

## Build & Run

```bash
npm run server:dev           # tsx server/index.ts (hot reload)
npm run server:build         # esbuild → server_dist/index.js (ESM)
npm run server:prod          # NODE_ENV=production node server_dist/index.js
```

Server binds to `0.0.0.0:5000` with `reusePort: true`.

---

## What This Agent Must Flag for Human Review

- Changes to CORS configuration
- Changes to rate limiting parameters or bypass logic
- Changes to TTS filename or video ID validation regex
- New `EXPO_PUBLIC_*` env vars (client-visible keys)
- Any authentication/authorization additions
- Changes to `server/index.ts` middleware order

---

## Related Agent Files

- [`AI-INTEGRATION-AGENT.md`](./AI-INTEGRATION-AGENT.md) — AI provider routing
- [`SECURITY-SAFETY-AGENT.md`](./SECURITY-SAFETY-AGENT.md) — Child safety, sanitization
- [`DATABASE-AGENT.md`](./DATABASE-AGENT.md) — Drizzle ORM, schema
- [`AUDIO-TTS-AGENT.md`](./AUDIO-TTS-AGENT.md) — ElevenLabs TTS system
