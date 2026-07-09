# Architecture

<!-- Last verified: 2026-07-09 -->

See also: [ADRs](./adr/) for individual architectural decisions.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Expo App (Client)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌────────┐ │
│  │  Screens │ │Components│ │   Contexts   │ │Storage │ │
│  │ (Router) │ │          │ │Settings/Auth │ │(Async) │ │
│  └────┬─────┘ └──────────┘ └──────────────┘ └────────┘ │
│       │ HTTPS + Auth Header                             │
└───────┼─────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────┐
│               Express Server (port 5000)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Security + Middleware Layer         │   │
│  │  Security Headers → CORS → Body Parser (100KB)  │   │
│  │  → Load Shedding → Auth (Supabase JWT)          │   │
│  │  → Rate Limiter → Idempotency → Request Logger  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │     Route Composer (server/routes.ts ~63 lines) │   │
│  │  health  → /api/health, /api/metrics            │   │
│  │  story   → /api/generate-story[-stream]         │   │
│  │  images  → /api/generate-avatar/scene           │   │
│  │  tts     → /api/tts, /api/voices                │   │
│  │  music   → /api/music/:mode                     │   │
│  │  suggest → /api/suggest-settings                │   │
│  │  video   → /api/generate-video                  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │               AI Router (server/ai/)            │   │
│  │  Anthropic → Gemini → OpenAI → OpenRouter       │   │
│  │  Circuit breakers + retry + per-provider jitter │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌───────────┐ ┌───────────────────────┐  │
│  │ElevenLabs│ │OpenAI Sora│ │  PostgreSQL (Drizzle) │  │
│  │  (TTS)   │ │  (Video)  │ │ conversations/messages│  │
│  └──────────┘ └───────────┘ └───────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## AI Provider Routing

The AI Router (`server/ai/`) implements task-specific fallback chains with circuit breakers and retry.

### Story Generation Chain (`taskType: "story"`)

| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Anthropic | `claude-sonnet-4-6` |
| 2 | Gemini | `gemini-2.5-flash` |
| 3 | OpenAI | `gpt-4o-mini` |
| 4 | OpenRouter / Meta Llama | `meta-llama/llama-4-scout-17b-16e-instruct` |
| 5 | OpenRouter / xAI | `x-ai/grok-3-mini` |
| 6 | OpenRouter / Mistral | `mistralai/mistral-small-3.1-24b-instruct` |
| 7 | OpenRouter / Cohere | `cohere/command-a-03-2025` |

### Suggestion Chain (`taskType: "suggestion"`)

Gemini-first: `gemini → mistral → anthropic → meta-llama → xai → cohere`

### Image Generation Chain (`taskType: "image" | "avatar" | "scene"`)

| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Gemini | `gemini-2.5-flash-image` |
| 2 | OpenAI | `gpt-image-1` |

If all providers in a chain fail, the router returns a 503.

## Data Flow

### Story Generation Flow

```
User selects hero + mode + settings
  → Client POST /api/generate-story
    → Server validates and sanitizes input
    → Server builds system prompt + user prompt
    → AI Router calls provider chain until success
    → Server parses JSON response and normalizes parts
    → Client receives story and begins playback
      → Per-part optional scene generation
      → Per-part optional TTS narration
    → On completion: save story + scenes to AsyncStorage
    → Award badges based on profile history
```

### Settings Architecture

```
SettingsContext (lib/SettingsContext.tsx)
  ├── AppSettings interface (source of truth)
  ├── AsyncStorage key: @infinity_heroes_app_settings
  ├── Used by: SettingsModal.tsx, settings.tsx, story.tsx
  └── Legacy migration: reads @infinity_heroes_preferences on first load
```

## Client State Management

| Data | Storage | Mechanism |
|------|---------|-----------|
| App Settings | AsyncStorage (`@infinity_heroes_app_settings`) | React Context + Reducer |
| Stories | AsyncStorage (`@infinity_heroes_stories`) | Direct read/write |
| Child Profiles | AsyncStorage (`@infinity_heroes_profiles`) | Direct read/write |
| Badges | AsyncStorage (`@infinity_heroes_badges`) | Direct read/write |
| Streaks | AsyncStorage (`@infinity_heroes_streaks`) | Direct read/write |
| Parent Controls | AsyncStorage (`@infinity_heroes_parent_controls`) | Direct read/write |
| Favorites | AsyncStorage (`@infinity_heroes_favorites`) | Direct read/write |

## Server Architecture

### Middleware Stack (in order)

1. **Environment Validation** — warns on missing providers at startup
2. **Security Headers** — X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP, HSTS
3. **CORS** — dynamic origin matching (Replit domains, localhost, bedtime-chronicles.com, Vercel previews)
4. **Body Parser** — JSON + URL-encoded (100KB limit)
5. **Request Logger** — pino structured logging (method, path, status, duration)
6. **Load Shedding** — rejects when active-request ceiling is exceeded (503)
7. **Expo Manifest Routing + Static File Serving**
8. **Route Registration** — auth gate for API writes and protected reads (`GET /api/conversations*`), then domain modules (`/api/github/webhook` exempt)
9. **Global Error Handler** — sanitized responses via `sanitizeErrorMessage()`

### Rate Limiting

- Sliding-window limiter keyed by authenticated user UID, fallback to IP
- Default 10 requests per 60 seconds
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`
- Applied to generation endpoints (story, avatar, scene, TTS, video, suggestions)
- Optional Cloudflare KV persistence via `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_KV_NAMESPACE_ID`, `CLOUDFLARE_API_TOKEN`

### TTS Caching

- Audio cached to `/tmp/tts-cache/`
- Cache key: MD5 of `voice:mode:text`
- Expired files cleaned hourly
- Max age via `TTS_CACHE_MAX_AGE_MS` (default 24h)

## Authentication Flow

1. `AuthProvider` in `app/_layout.tsx` initializes Supabase Auth when `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are configured.
2. `AuthBridge` passes `getIdToken()` to `query-client.ts` so requests can attach an Authorization header when a session exists.
3. Server middleware (`server/auth.ts`) validates bearer tokens through Supabase (`supabase.auth.getUser`).
4. Rate limiting keys on `req.user.uid` when authenticated, otherwise falls back to IP.
5. In production, missing Supabase server auth config causes auth-gated routes to return 503; in development, auth can run anonymous.

## Infrastructure Topology

| Component | Provider | Notes |
|-----------|----------|-------|
| API + Web server | Replit Cloud Run | Primary deployment; `deploymentTarget = "cloudrun"` in `.replit` |
| API serverless | Vercel | `api/server.mjs` entry point; 60s max duration; all routes rewrite to `/api/server` |
| Mobile (Android) | EAS Build | `.aab` uploaded to Play Console; package `com.infinityheroes.bedtime` |
| Mobile (iOS) | EAS Build | Configured but no App Store submission yet |
| Database | Supabase PostgreSQL | Required for voice chat only |
| Rate-limit state | Cloudflare KV | Optional; otherwise in-memory |
| Error tracking | Sentry | Client wired; server package present but not fully wired |
| TTS cache | `/tmp/tts-cache/` | Instance-local cache |
| AI providers | External APIs | Anthropic, Gemini, OpenAI, OpenRouter |

Single-instance Express today; no shared cache or load balancer. Voice-chat state is PostgreSQL-backed; story state is client AsyncStorage.

## Failure Modes and Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| AI provider outage | Story generation may fail if chain exhausts | Router falls through provider chain; returns 503 after exhaustion |
| ElevenLabs outage | TTS unavailable | Story generation still works without narration |
| PostgreSQL unavailable | Voice chat fails | Core story features unaffected |
| Server crash | API down | Runtime restarts process/invocation |
| Circuit breaker open | Provider bypassed temporarily | Auto-reset after timeout |
| TTS cache full | Cache churn increases | Eviction by age and size |

## Scaling Model

**Current ceiling (single instance):**

- Rate limiter: 10 requests / 60 s per user or IP
- Load shedding: 503 on active-request ceiling
- In-memory state resets on restart for non-KV paths

**Bottlenecks:**

- AI provider latency dominates request time
- TTS generation latency (improved by caching)
- PostgreSQL affects voice chat only

**Horizontal scaling notes:**

- In-process limiter/circuit state is instance-local unless KV-backed
- Shared media/cache storage would be needed for multi-instance TTS/video cache reuse

## Security Boundaries

| Boundary | Policy |
|----------|--------|
| AI provider keys | Server-side env vars only; never exposed to client |
| Client data | AsyncStorage on-device; no PII stored server-side |
| Auth tokens | Supabase access tokens validated server-side on auth-gated routes |
| TTS filenames | Regex `/^[a-f0-9]+\.mp3$/` enforced before serving; path traversal impossible |
| Video IDs | Regex `/^[a-f0-9]+$/` enforced before lookup |
| CORS | Replit domains + localhost only; no wildcard |
| Error messages | `sanitizeErrorMessage()` strips stack traces and internal paths before sending to client |
| `EXPO_PUBLIC_*` vars | Bundled into client APK — never put secrets with this prefix |

See [SECURITY.md](./SECURITY.md) for the full policy and OWASP assessment.

## Assets

Stock hero portraits live in `assets/heroes/`. `scripts/generate-hero-portraits.mjs` can regenerate via local `/api/generate-avatar`.

## Voice Chat Module

When `AI_INTEGRATIONS_OPENAI_API_KEY` and `DATABASE_URL` are set:

- Conversation history in PostgreSQL (`conversations`, `messages`)
- Audio input auto-format detection (WAV/MP3/WebM/MP4/OGG)
- STT: `gpt-4o-mini-transcribe`
- Voice response: `gpt-4o-audio-preview` with streaming output
- Delivery: SSE
- Validation: strict ID/message/audio/voice constraints
- Pagination support via `limit` / `offset`
