# Architecture

<!-- Last verified: 2026-06-18 -->

See also: [ADRs](./adr/) for individual architectural decisions.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Expo App (Client)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌────────┐ │
│  │  Screens │ │Components│ │   Contexts   │ │Storage │ │
│  │ (Router) │ │          │ │Settings/Auth │ │(Async) │ │
│  └────┬─────┘ └──────────┘ └──────────────┘ └────────┘ │
│       │ HTTPS + Bearer Token                             │
└───────┼─────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────┐
│                  Express Server (port 5000)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Security + Middleware Layer           │   │
│  │  Security Headers → CORS → Body Parser (100KB)    │   │
│  │  → Load Shedding → Auth (Firebase) → Rate Limiter │   │
│  │  → Idempotency Cache → Request Logger             │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │       Route Composer (server/routes.ts ~43 lines) │   │
│  │  routes/health.ts  → /api/health, /api/metrics   │   │
│  │  routes/story.ts   → /api/generate-story[-stream]│   │
│  │  routes/images.ts  → /api/generate-avatar/scene  │   │
│  │  routes/tts.ts     → /api/tts, /api/voices       │   │
│  │  routes/music.ts   → /api/music/:mode             │   │
│  │  routes/suggest.ts → /api/suggest-settings        │   │
│  │  routes/video.ts   → /api/generate-video          │   │
│  │  replit_integrations/audio → /api/conversations/* │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              AI Router (server/ai/)               │   │
│  │  Anthropic → Gemini → OpenAI → OpenRouter         │   │
│  │  Circuit breakers + retry + per-provider jitter   │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌───────────┐ ┌───────────────────────┐  │
│  │ElevenLabs│ │OpenAI Sora│ │  PostgreSQL (Drizzle)  │  │
│  │  (TTS)   │ │  (Video)  │ │ conversations/messages │  │
│  └──────────┘ └───────────┘ └───────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## AI Provider Routing

The AI Router (`server/ai/`) implements a task-specific fallback chain with circuit breakers and retry. Each provider is wrapped in a 5-failure circuit breaker that opens for 60 seconds before resetting.

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

If all providers in a chain fail, the router returns a 503 error.

## Data Flow

### Story Generation Flow
```
User selects hero + mode + settings
  → Client POST /api/generate-story
    → Server validates & sanitizes input
    → Server builds system prompt (mode-specific) + user prompt
    → AI Router calls provider chain until success
    → Server parses JSON response, normalizes parts
    → Client receives story, begins playback
      → Per-part: optional scene image generation (POST /api/generate-scene)
      → Per-part: optional TTS narration (POST /api/tts)
    → On completion: save story + scenes to AsyncStorage
    → Award badges based on profile history
```

### Settings Architecture
```
SettingsContext (lib/SettingsContext.tsx)
  ├── AppSettings interface (canonical source of truth)
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
1. **Environment Validation** — Warns on missing providers at startup
2. **Security Headers** — X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP, HSTS
3. **CORS** — Dynamic origin matching (Replit domains, localhost, bedtime-chronicles.com, Vercel previews)
4. **Body Parser** — JSON + URL-encoded (100KB limit)
5. **Request Logger** — pino structured logging (method, path, status, duration)
6. **Load Shedding** — Rejects requests when active-request ceiling is exceeded (503)
7. **Expo Manifest Routing + Static File Serving** — Dev server integration
8. **Route Registration** — Auth gate (POST /api/* requires Firebase token) + domain modules
9. **Global Error Handler** — Sanitized error responses via `sanitizeErrorMessage()`

### Rate Limiting
- In-memory rate limiter, keyed by authenticated user UID (falls back to IP)
- Default: 10 requests per 60 seconds
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`
- Applied to all generation endpoints (story, avatar, scene, TTS, video, suggestions)
- Optional Cloudflare KV persistence: when `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_KV_NAMESPACE_ID`, and `CLOUDFLARE_API_TOKEN` are set, rate-limit state survives server restarts. Without these vars, the in-memory Map resets on every restart.

### TTS Caching
- Generated audio cached to `/tmp/tts-cache/` as MP3 files
- Cache key: MD5 of `voice:mode:text`
- Auto-cleanup of expired files every hour
- Configurable max age via `TTS_CACHE_MAX_AGE_MS` (default: 24h)

## Authentication Flow

1. App launches → `AuthProvider` in `app/_layout.tsx` initializes Firebase Auth
2. If no existing user, `signInAnonymously()` creates an anonymous Firebase user
3. `AuthBridge` component passes the token getter to `query-client.ts`
4. All API requests include `Authorization: Bearer <token>` header
5. Server middleware (`server/auth.ts`) validates the token via Firebase Admin SDK
6. Rate limiting keys on `req.user.uid` instead of IP address
7. Production guard: if `FIREBASE_SERVICE_ACCOUNT_KEY` is unset in `NODE_ENV=production`, all auth-gated routes return 503; in dev, auth is skipped and an anonymous user is synthesized from the client IP

## Infrastructure Topology

| Component | Provider | Notes |
|-----------|---------|-------|
| API + Web server | Replit Cloud Run | Primary deployment; `deploymentTarget = "cloudrun"` in `.replit` |
| API serverless | Vercel | `api/server.mjs` entry point; 60s max duration; all routes rewrite to `/api/server` |
| Mobile (Android) | EAS Build | `.aab` uploaded to Google Play Console; package `com.infinityheroes.bedtime` |
| Mobile (iOS) | EAS Build | Configured but no App Store submission yet |
| Database | Supabase PostgreSQL | Project `aeraxfupuvwiskmfjliq` (us-east-1); required only for voice chat |
| Rate limit state | Cloudflare KV | `infinity-heroes-rate-limit` namespace; optional — falls back to in-memory |
| Error tracking | Sentry | `@sentry/react-native` (client only); `EXPO_PUBLIC_SENTRY_DSN` must be set. Server-side `@sentry/node` is installed but not yet wired in `server/index.ts`. |
| TTS cache | `/tmp/tts-cache/` | In-process on the server instance; not shared across instances |
| AI providers | External APIs | Anthropic, Gemini, OpenAI, OpenRouter — no on-premises models |

The app runs as a single-instance Express server. There is no load balancer, no Redis, and no shared cache between instances. Stateful data (voice chat history) lives in PostgreSQL; story data lives in client-side AsyncStorage.

## Failure Modes and Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| AI provider outage | Story generation fails if all providers in chain are down | Router tries each provider in order; 503 after exhaustion. See [provider-outage runbook](./runbooks/provider-outage.md) |
| ElevenLabs outage | TTS narration unavailable | App degrades gracefully — stories still work without audio |
| PostgreSQL unavailable | Voice chat routes fail | Voice chat is gated on `DATABASE_URL`; core story features are unaffected |
| Server crash | All endpoints down | Replit auto-restarts; EAS builds serve the last deployed bundle to mobile |
| AI circuit breaker open | Specific provider temporarily bypassed | Circuit opens after 5 consecutive failures; resets after 60 seconds |
| TTS cache full | TTS generation still works | Cache evicts by age (24h TTL) and size (500 MB cap) — oldest files removed first |

## Scaling Model

**Current ceiling (single instance):**
- Rate limiter: 10 requests/60 s per user/IP
- Load shedding: active-request ceiling middleware drops excess requests with 503
- In-memory state (rate limiter, idempotency cache, circuit breakers) resets on restart

**Bottlenecks:**
- AI provider latency is the dominant response-time factor (~2–10 s per story)
- TTS generation: ~1–3 s per story part, cached for reuse
- PostgreSQL: only used for voice chat; not a bottleneck for core features

**Horizontal scaling notes:**
- Rate limiter and circuit breakers are in-process — a second instance would start fresh
- Adding Redis would fix per-user rate limiting across instances
- TTS cache is filesystem-only; a shared cache (e.g., S3 + CloudFront) would be needed for multi-instance

## Security Boundaries

| Boundary | Policy |
|----------|--------|
| AI provider keys | Server-side env vars only; never exposed to client |
| Client data | AsyncStorage on-device; no PII stored server-side |
| Auth tokens | Firebase JWT validated server-side on every POST request |
| TTS filenames | Regex `/^[a-f0-9]+\.mp3$/` enforced before serving; path traversal impossible |
| Video IDs | Regex `/^[a-f0-9]+$/` enforced before lookup |
| CORS | Replit domains + localhost only; no wildcard |
| Error messages | `sanitizeErrorMessage()` strips stack traces and internal paths before sending to client |
| `EXPO_PUBLIC_*` vars | Bundled into client APK — never put secrets with this prefix |

See [SECURITY.md](./SECURITY.md) for the full security policy and OWASP assessment.

## Voice Chat Module

When `AI_INTEGRATIONS_OPENAI_API_KEY` and `DATABASE_URL` are set:
- Conversation history stored in PostgreSQL (`conversations` + `messages` tables)
- Audio input: auto-format detection (WAV, MP3, WebM, MP4, OGG) — all natively supported by OpenAI
- Speech-to-text: OpenAI `gpt-4o-mini-transcribe`
- Voice response: OpenAI `gpt-4o-audio-preview` model with streaming audio output
- Response delivery: Server-Sent Events (SSE)
- Input validation: route param IDs validated (positive integers), message length capped (10K chars), audio size capped (25MB), voice parameter allowlisted, conversation titles sanitized (200 chars)
- Pagination: conversation list supports `limit`/`offset` query params (max 200 per page)
