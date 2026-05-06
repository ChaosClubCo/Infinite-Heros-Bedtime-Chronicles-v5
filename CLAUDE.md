# CLAUDE.md - Infinity Heroes: Bedtime Chronicles v5

## Project Overview

AI-powered interactive bedtime story app for children ages 3-9. Kids create custom superheroes and experience personalized, AI-generated adventures with illustrations, narration, and gamification. Full-stack mobile-first app using Expo (React Native) frontend with Express.js backend.

**Repository type:** Single full-stack app (Expo mobile + Express API server)
**Primary language:** TypeScript (strict)
**Package manager:** npm

## Tech Stack

- **Frontend:** Expo SDK 54, React Native 0.85 (New Architecture), Expo Router v6 (file-based routing)
- **State:** TanStack React Query v5 (server state) + React Context (app settings, profiles)
- **Local Storage:** AsyncStorage for stories, profiles, badges, streaks, parent controls
- **Styling:** React Native StyleSheet + react-native-reanimated v4 for animations
- **Fonts:** Nunito (primary), Plus Jakarta Sans (UI), Bangers (display/titles)
- **Validation:** Zod v4
- **Backend:** Express.js v5, TypeScript, Node.js 18+
- **Database:** PostgreSQL + Drizzle ORM v0.45 (voice chat features only)
- **Auth:** Firebase Admin (optional) — bearer-token middleware gated on `FIREBASE_SERVICE_ACCOUNT_KEY`
- **AI:** Multi-provider router with per-task fallback chains, circuit breakers, retry with jitter, and timeouts (see `server/ai/router.ts`). Chains: `story`: Anthropic → Gemini → OpenAI → Meta-Llama → xAI → Mistral → Cohere; `suggestion`: Gemini-first chain
- **Observability:** pino structured logging, in-process metrics, load-shedding, idempotency cache, feature flags
- **TTS:** ElevenLabs API (eleven_multilingual_v2 model, MP3 44.1kHz/128kbps, 9 narrator voices)
- **Video:** OpenAI Sora 2 (optional)
- **Build:** esbuild (server), Metro (client), Babel with React Compiler

## Project Structure

```
app/                    # Expo Router screens (file-based routing)
  _layout.tsx           # Root layout — providers: ErrorBoundary → QueryClient → Profile → Settings → Gesture → Keyboard
  (tabs)/               # Tab navigation (home, create, library, saved, profile)
    _layout.tsx          # Tab bar layout (5 tabs, 60px height + bottom inset)
  story.tsx             # Story reading/playback (largest screen ~60KB / 1627 lines, fullScreen fade modal)
  story-details.tsx     # Story customization wizard (slide from right)
  completion.tsx        # Post-story celebration + badge awarding (fullScreen fade modal)
  quick-create.tsx      # Fast onboarding hero creation (modal from bottom)
  madlibs.tsx           # Mad Libs mode wizard (slide from right)
  sleep-setup.tsx       # Sleep mode setup (slide from right)
  settings.tsx          # App settings (slide from right)
  trophies.tsx          # Badge collection view (slide from right)
  welcome.tsx           # Onboarding splash (fade animation)
components/             # Reusable React Native components
  ErrorBoundary.tsx     # Error boundary wrapper
  ErrorFallback.tsx     # Error fallback UI component
  HeroCard.tsx          # Hero template card (used in hero selection grid)
  KeyboardAwareScrollViewCompat.tsx  # Cross-platform keyboard-aware scroll
  MemoryJar.tsx         # Story memory display
  OfflineBanner.tsx     # Offline state banner (orphaned — not yet wired into app layout)
  ParentControlsModal.tsx  # Parent controls (PIN-protected)
  ProfileModal.tsx      # Child profile management
  SettingsModal.tsx     # Settings overlay
  PulsingOrb.tsx        # Animated orb effect
  StarField.tsx         # Background star animation
constants/              # Types, hero templates, colors, timing
  types.ts              # Core TypeScript interfaces
  heroes.ts             # 8 pre-defined hero templates
  colors.ts             # Cosmic theme palette
  timing.ts             # Animation timing constants
lib/                    # Client utilities
  SettingsContext.tsx    # Unified settings provider (React Context)
  ProfileContext.tsx     # Child profile context
  AuthContext.tsx        # Authentication context
  storage.ts            # AsyncStorage helpers
  storage.test.ts       # Storage unit tests
  storage.comprehensive.test.ts  # Extended storage test suite
  storage-migration.ts  # Versioned AsyncStorage migration runner (see Known Gotchas)
  storage-migration.test.ts      # Storage migration tests
  query-client.ts       # TanStack React Query config (staleTime: Infinity, retry: false)
  query-client.test.ts  # Query client unit tests
  useNetworkStatus.ts   # NetInfo hook returning { isConnected, isInternetReachable } (orphaned — not yet used)
server/                 # Express.js backend
  index.ts              # Server bootstrap, security middleware, CORS, graceful shutdown
  routes.ts             # All API endpoints (~18KB / ~550 lines, 30+ endpoints; post-extraction refactor)
  auth.ts               # Firebase Admin bearer-token middleware (optional, lazy-init)
  validation.ts         # Zod request schemas + sanitizeString
  prompts.ts            # Story system/user prompt builders + CHILD_SAFETY_RULES
  rate-limit.ts         # Per-IP sliding-window rate limiter (in-memory Map)
  circuit-breaker.ts    # Circuit breaker for AI providers
  retry.ts              # Retry with jitter
  load-shedding.ts      # Active-request ceiling middleware
  idempotency.ts        # Idempotency cache (TTL 5 min, keyed by request hash)
  logger.ts             # pino structured logger
  metrics.ts            # In-process metrics (request/provider counters)
  feature-flags.ts      # Runtime feature flag resolver
  tts-cache.ts          # TTS file cache with size + age limits
  utils.ts              # toErrorMessage, classifyError, createErrorResponse
  ai/                   # Multi-provider AI router
    index.ts            # Provider registration & status checking
    router.ts           # AIRouter class with fallback chain, circuit breakers, retry
    types.ts            # AI provider interface definitions
    providers/          # Gemini, OpenAI, Anthropic, OpenRouter
  elevenlabs.ts         # TTS voice definitions & generation
  suno.ts               # Background music serving
  video.ts              # Sora video generation
  storage.ts            # Server-side in-memory story cache (NOT the same as lib/storage.ts)
  db.ts                 # Drizzle ORM client
  replit_integrations/  # Audio, chat, image, batch modules (conditionally registered)
  templates/            # HTML templates (landing page, privacy policy)
shared/                 # Shared between client & server
  schema.ts             # Drizzle ORM schema (users table, re-exports models/chat.ts)
  models/chat.ts        # Conversation & message tables
docs/                   # Project documentation
  ARCHITECTURE.md       # System design & data flow
  API.md                # API endpoint reference (40+ endpoints)
  SECURITY.md           # OWASP assessment
  ROADMAP.md            # Development roadmap (WSJF-prioritized)
  CHANGELOG.md          # Version history
  DEAD-CODE-TRIAGE.md   # Code audit report
  COPPA-COMPLIANCE.md   # COPPA audit and privacy analysis
  BETA_TESTING.md       # Beta testing plan
  TEST-COVERAGE-ANALYSIS.md  # Test coverage status + known bugs
  GITHUB-CUSTOM-AGENTS.md    # GitHub Copilot custom agent configurations
  AUDIT-SECURITY-2026-03-27.md      # Security audit findings (2026-03-27)
  COMPREHENSIVE-AUDIT-2026-03-27.md # Full codebase audit (2026-03-27)
  SECURITY-FIXES-2026-03-27.md      # Security fixes applied (2026-03-27)
  adr/                  # Architecture Decision Records (5 ADRs)
  agents/               # 15 files: 12 agent spec files + README + pr-review.md + security.md
  best-practices/       # Best-practice guides (ACCESSIBILITY, PERFORMANCE, SECURITY, TESTING)
  operations/           # PLAY_STORE_DEPLOYMENT.md
  runbooks/             # deploy, incident-response, database-migrations, provider-outage, rollback
  superpowers/plans/    # Maturity & hardening plans (2026-04-08)
api/                    # Vercel serverless entry point
  server.mjs            # Handler that imports createApp from server_dist
patches/                # patch-package fixes for dependencies
scripts/                # Build scripts
  build.js              # Expo static build script
  build-android.sh      # Android build script
  preflight.js          # Pre-build environment / dependency checks
```

**Root-level docs and config** (not part of the app source tree):
- `AGENTS.md` — agent framework conventions
- `CONTRIBUTING.md` — contribution guidelines
- `CONVENTIONS.md` — code conventions reference
- `GEMINI.md` — Gemini-specific agent instructions
- `GLOSSARY.md` — project terminology
- `MEMORY.md` — persistent agent memory/context
- `TODO.md` — tracked work items
- `replit.md` — Replit-specific setup notes
- `agent-registry.json` — registered agent definitions
- `skills-lock.json` — locked agent skill versions
- `CLAUDE.md` — this file (primary AI agent instructions)

## Common Commands

```bash
# Development (parallel frontend + backend)
npm run server:dev          # Backend on port 5000 (tsx server/index.ts)
npm run expo:dev            # Frontend on port 8081 (Replit environment)
npx expo start              # Frontend (non-Replit)

# Build
npm run server:build        # esbuild → server_dist/index.js (ESM format)
npm run expo:static:build   # Expo static build (node scripts/build.js)

# Production
npm run server:prod         # NODE_ENV=production node server_dist/index.js

# Code Quality
npm run lint                # npx expo lint
npm run lint:fix            # npx expo lint --fix
npm run typecheck           # npx tsc --noEmit

# Testing
npm test                    # vitest run (single run)
npm run test:watch          # vitest (watch mode)
npm run test:coverage       # vitest run --coverage

# Database
npm run db:push             # Drizzle schema migration (needs DATABASE_URL)
```

## Architecture

```
[Expo Mobile App] → HTTPS/JSON → [Express Server (port 5000, 0.0.0.0)]
                                    ├→ [Auth middleware] — Firebase bearer token (optional)
                                    ├→ [Rate limiter] — per-IP sliding window
                                    ├→ [Load shedding] — active-request ceiling
                                    ├→ [Idempotency cache] — 5-min dedup on POSTs
                                    ├→ [AI Router] → Anthropic → Gemini → OpenAI → OpenRouter (circuit-broken + retried)
                                    ├→ [ElevenLabs TTS] → /tmp/tts-cache (size + age bounded)
                                    ├→ [PostgreSQL + Drizzle] (voice chat history)
                                    └→ [OpenAI Sora] (video generation)
```

### AI Provider Fallback Chain

**Text Generation:**
| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Anthropic | `claude-sonnet-4-6` |
| 2 | Gemini | `gemini-2.5-flash` |
| 3 | OpenAI | `gpt-4o-mini` |
| 4 | OpenRouter/Meta | `meta-llama/llama-4-scout-17b-16e-instruct` |
| 5 | OpenRouter/xAI | `x-ai/grok-3-mini` |
| 6 | OpenRouter/Mistral | `mistralai/mistral-small-3.1-24b-instruct` |
| 7 | OpenRouter/Cohere | `cohere/command-a-03-2025` |

Each provider is wrapped in a circuit breaker (5 failures → open → 60s reset) and retried with jitter (maxRetries: 1) before the router falls through to the next provider.

**Image Generation:**
| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Gemini | `gemini-2.5-flash-image` (with optional thinking budget) |
| 2 | OpenAI | `gpt-image-1` |

### Story Modes
- **Classic** — Adventure stories with choices
- **Mad Libs** — Silly stories with user-provided words
- **Sleep** — Calming, meditative stories for bedtime

### Story Duration Configuration
| Duration | Parts | Word Count |
|----------|-------|------------|
| short | 3 | 200-300 |
| medium-short | 4 | 350-450 |
| medium | 5 | 500-650 |
| long | 6 | 750-950 |
| epic | 7 | 1000-1300 |

## Key API Endpoints

**Story Generation:**
- `POST /api/generate-story` — Synchronous story generation (JSON)
- `POST /api/generate-story-stream` — Streaming story generation (SSE)
- `POST /api/generate-avatar` — Hero portrait image
- `POST /api/generate-scene` — Story scene illustration (random art style from 12 presets)
- `POST /api/suggest-settings` — AI-powered story recommendations

**Text-to-Speech:**
- `POST /api/tts` — Generate narration (max 5000 chars)
- `GET /api/tts-audio/:file` — Retrieve cached audio file
- `POST /api/tts-preview` — Voice preview for selection

**Configuration & Observability:**
- `GET /api/voices` — Available narrator voices for current mode
- `GET /api/music/:mode` — Background music track
- `GET /api/music-info/:mode` — Music track metadata
- `GET /api/health` — Server health check (AI/TTS availability, features, active requests)
- `GET /api/ai-providers` — Provider availability status
- `GET /api/metrics` — In-process metrics
- `GET /privacy` — Privacy policy HTML

**Video (optional):**
- `POST /api/generate-video` — Create video via Sora 2
- `GET /api/video-status/:id` — Check video job status
- `GET /api/video/:id` — Retrieve generated video

**Voice Chat (requires AI_INTEGRATIONS_OPENAI_API_KEY + AI_INTEGRATIONS_OPENAI_BASE_URL + DATABASE_URL):**
- `GET /api/conversations` — List conversations
- `POST /api/conversations` — Create new conversation
- `GET /api/conversations/:id` — Get conversation history
- `DELETE /api/conversations/:id` — Delete conversation
- `POST /api/conversations/:id/messages` — Send voice message in a conversation

**Replit Integrations (conditional — registered by `server/replit_integrations/*`):**
- `/api/audio/*` — audio pipeline routes (registered by `registerAudioRoutes()`)
- `/api/image/*` — image pipeline routes (registered by `registerImageRoutes()`)

## Authentication

- The server uses Firebase Admin (`server/auth.ts`) for token verification. Clients hit Firebase anonymous-auth on the web side (`lib/AuthContext.tsx`) and send the resulting ID token as a `Bearer` header.
- `requireAuth` middleware attaches `req.user = { uid, isAnonymous }` and 401s on a missing or invalid token.
- **Production guard:** when `NODE_ENV=production` and `FIREBASE_SERVICE_ACCOUNT_KEY` is unset, every auth-gated route returns 503. There is no `AUTH_DISABLED` opt-out — it was removed in the 2026-04 audit.
- In dev (no `NODE_ENV=production`), auth is skipped and an anonymous `req.user` is assigned from the client IP.

## Code Conventions

### Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- React components: PascalCase
- Hooks: `use` prefix, camelCase (`useSettings`, `useProfileStore`)
- Constants: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config objects
- AsyncStorage keys: `@infinity_heroes_<descriptor>` pattern

### TypeScript
- Strict mode enabled — never use `any` without a `// intentional: <reason>` comment
- Path aliases: `@/*` (project root), `@shared/*` (shared folder)
- All API request/response shapes defined in `server/validation.ts` (Zod) or `shared/schema.ts`
- Component props typed inline as interfaces above the component
- Core interfaces in `constants/types.ts`: StoryPart, CachedStory, ChildProfile, EarnedBadge, ParentControls

### Styling
- Use `StyleSheet.create()` — no inline style objects except for dynamic values
- Color constants from `constants/colors.ts` — never hardcode color hex values
- Cosmic theme: primary `#05051e`, accent `#6366f1`, starlight `#E8E4F0`
- Glassmorphism: `rgba(255,255,255,0.03)` bg + `rgba(255,255,255,0.1)` border
- Dark UI by default (`userInterfaceStyle: "dark"` in app.json)
- Portrait orientation only
- Use `StyleSheet.absoluteFill` (not `absoluteFillObject` — removed in RN 0.85)

### Error Handling
- Server (global handler): catch errors, sanitize via `sanitizeErrorMessage()` (strips newlines, truncates to 200 chars), return `{ error: string }` with appropriate HTTP status. Never leak stack traces.
- Route-level validation errors (e.g. Zod schema failures): return `{ error: "Human-readable message" }` directly from handler.
- Server errors should flow through `server/utils.ts` helpers (`toErrorMessage`, `classifyError`, `createErrorResponse`) so classification + logging stay consistent.
- Client: use React Error Boundaries for screen-level errors; show user-friendly message, not raw error
- AI calls: the AI router handles provider fallback, circuit breaking, and retry automatically; callers should still catch final failure

## Architecture Constraints

- **AI calls must go through `server/ai/index.ts`** — never call AI provider SDKs directly from routes
- **No AI keys on the client** — all provider keys are server-side environment variables only
- **Input sanitization is mandatory** — all user-provided string inputs must pass through `sanitizeString()` (`server/validation.ts`) before inclusion in AI prompts; default limit is 500 chars (higher limits for specific fields, e.g. `sceneText` uses 2000 chars)
- **Child safety system prompt** — the `CHILD_SAFETY_RULES` constant (`server/prompts.ts`) must be included in every story generation prompt. Never remove or bypass it
- **Rate limiting** — per-IP sliding window rate limiter (`server/rate-limit.ts`) protects all POST endpoints. Do not add endpoints that bypass it. When auth is enabled, `req.user.uid` is used instead of IP.
- **AsyncStorage** is the canonical client-side storage. Use helpers in `lib/storage.ts` rather than calling AsyncStorage directly
- **Settings** live exclusively in `SettingsContext` (`lib/SettingsContext.tsx`). Do not create parallel settings systems

## Security Rules

- Never commit secrets, API keys, or credentials. Use environment variables
- All server responses must use `sanitizeErrorMessage()` — never return raw error objects
- TTS filename serving: only files matching `/^[a-f0-9]+\.mp3$/` are served — do not relax this regex
- Video ID validation: only IDs matching `/^[a-f0-9]+$/` are accepted
- CORS allowed origins: Replit dev/prod domains, localhost (ports 5000/8081/19000-19006), `https://bedtime-chronicles.com`, `https://www.bedtime-chronicles.com`, Vercel preview URLs matching `infinite-hero*.vercel.app`, and `VERCEL_URL` env var — do not add wildcards
- Input truncation via `sanitizeString()` is mandatory before any prompt inclusion
- PIN storage: parent-controls PIN is currently stored plaintext in AsyncStorage (see `docs/COPPA-COMPLIANCE.md` §6). Hashing is a known pre-store-submission TODO.

### Child Safety Rules (enforced in AI prompts)
- No violence, weapons, fighting, scary/horror elements
- No real-world brands, celebrities, or copyrighted characters
- No death, injury, illness, abandonment, or loss
- No bullying, meanness, exclusion, or anxiety-inducing language
- All choices lead to positive outcomes
- Focus on: courage, kindness, friendship, wonder, imagination, comfort

### Server Middleware Order
1. Environment validation (warns on missing providers)
2. Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
3. CORS (see allowed origins above, methods: GET/POST/PUT/DELETE/OPTIONS)
4. Body parsing (JSON + URL-encoded, 100KB limit)
5. Request logging (pino)
6. Load shedding (rejects if active-request ceiling exceeded)
7. Expo manifest routing + static file serving
8. Route registration (`requireAuth` applied per-route to POSTs; rate limit + idempotency also per-route)
11. Error handler (sanitizes messages)

## Common Tasks

### Add a new API endpoint
1. Add the route handler in `server/routes.ts` (or a new file under `server/`)
2. Follow the existing pattern: validate input with a Zod schema in `server/validation.ts`, call logic, return JSON
3. Apply `checkRateLimit` if the endpoint calls external APIs
4. Consider idempotency for expensive writes (use `IdempotencyCache.keyFromBody`)
5. Document in `docs/API.md`
6. Update `README.md` endpoint table if it's a primary endpoint

### Add a new AI provider
1. Create `server/ai/providers/<name>.ts` mirroring the existing provider pattern
2. Add it to the fallback chain in `server/ai/index.ts`
3. Add the API key env var to `.env.example`
4. Update `docs/ARCHITECTURE.md` AI routing section

### Add a new screen
1. Create `app/<screen-name>.tsx` (Expo Router auto-registers it)
2. For tab screens, place under `app/(tabs)/`
3. Import styles from `constants/colors.ts`, wrap in `SafeAreaView`
4. Update `README.md` project structure if it's a significant screen

### Add a new AsyncStorage key
1. Add the helper functions in `lib/storage.ts`
2. Use the `@infinity_heroes_<descriptor>` key naming convention
3. Document the key and data shape in `lib/storage.ts` with a JSDoc comment

## Environment Variables

```
# AI Providers (via Replit integrations)
AI_INTEGRATIONS_GEMINI_API_KEY=
AI_INTEGRATIONS_OPENAI_API_KEY=
AI_INTEGRATIONS_OPENAI_BASE_URL=     # Required for voice chat (Replit OpenAI connector base URL)
AI_INTEGRATIONS_ANTHROPIC_API_KEY=
AI_INTEGRATIONS_OPENROUTER_API_KEY=
OPENAI_API_KEY=              # Direct key for video generation

# TTS & Database
ELEVENLABS_API_KEY=          # Optional: if set, used directly; otherwise falls back to Replit ElevenLabs connector
DATABASE_URL=                # PostgreSQL (required for voice chat only)

# Authentication (optional)
FIREBASE_SERVICE_ACCOUNT_KEY=  # JSON string; enables Firebase Admin bearer-token auth on POST endpoints. If unset, auth is skipped and req.user falls back to IP-based anonymous identity.

# Server Config (optional)
PORT=5000                    # Default 5000
NODE_ENV=                    # development | production
RATE_LIMIT_WINDOW_MS=60000   # Default 60000ms
RATE_LIMIT_MAX=10            # Default 10 requests
TTS_CACHE_MAX_AGE_MS=86400000       # Default 24 hours
TTS_CACHE_MAX_SIZE_BYTES=524288000  # Default 500 MB

# Replit-specific (auto-set)
REPLIT_DEV_DOMAIN=           # Dev server domain
REPLIT_DOMAINS=              # Production domains (comma-separated)
EXPO_PUBLIC_DOMAIN=          # Client API domain (set by dev script)
```

Minimum required: `AI_INTEGRATIONS_GEMINI_API_KEY`. Optional for full features: OpenAI, Anthropic, ElevenLabs, DATABASE_URL, FIREBASE_SERVICE_ACCOUNT_KEY.

## Story Response Schema (AI must return)
```json
{
  "title": "3-6 word title",
  "parts": [{ "text": "2-4 paragraphs", "choices": ["A", "B", "C"], "partIndex": 0 }],
  "vocabWord": { "word": "...", "definition": "child-friendly definition" },
  "joke": "age-appropriate joke",
  "lesson": "gentle life lesson (1-2 sentences)",
  "tomorrowHook": "teaser for next adventure",
  "rewardBadge": { "emoji": "...", "title": "2-3 words", "description": "..." }
}
```

## Client Storage Keys (AsyncStorage)
- `@infinity_heroes_app_settings` — App settings JSON
- `@infinity_heroes_profiles` — Child profiles
- `@infinity_heroes_active_profile` — Currently selected profile
- `@infinity_heroes_stories` — Saved stories
- `@infinity_heroes_read` — Read story tracking
- `@infinity_heroes_badges` — Earned badges
- `@infinity_heroes_streaks` — Reading streaks
- `@infinity_heroes_parent_controls` — Parent controls (includes PIN — plaintext today, see Security Rules)
- `@infinity_heroes_favorites` — Favorite stories
- `@infinity_heroes_onboarding_complete` — Onboarding flag
- `@infinity_heroes_preferences` — Legacy key (auto-migrates to app_settings)
- `@infinity_heroes_settings_migrated` — Migration flag for legacy → new settings
- `@infinity_heroes_storage_version` — Storage-schema version tracked by `lib/storage-migration.ts`

## App Settings (defaults)
```typescript
{
  audioVolume: 80,           // 0-100
  audioSpeed: 1.0,
  narratorVoice: "moonbeam",
  autoPlay: false,
  storyLength: "medium",     // short | medium-short | medium | long | epic
  ageRange: "4-6",           // 2-4 | 4-6 | 6-8 | 8-10
  defaultTheme: "fantasy",
  autoGenerateImages: false,
  extendMode: false,
  autoPlayNext: false,
  textSize: "medium",        // small | medium | large
  librarySortOrder: "recent", // recent | alphabetical | theme
  showFavoritesOnly: false,
  autoSave: true,
  isMuted: false,
  reducedMotion: false,
  fontSize: "normal",        // normal | large
  sleepTheme: "Cloud Kingdom"
}
```

## Narrator Voices (ElevenLabs)
**Sleep mode:** moonbeam (Laura), whisper (Sarah), stardust (Gigi)
**Classic mode:** captain (Charlotte), professor (Callum), aurora (Rachel)
**Fun mode:** giggles (Freya), blaze (Dave), ziggy (Matilda)

Sleep mode dynamically adjusts non-sleep voices: +stability, -style, no speaker boost.

## Content Themes
`courage` | `kindness` | `friendship` | `wonder` | `imagination` | `comfort`

## Hero Templates (8 pre-defined)
Nova (Guardian of Light), Coral (Heart of the Ocean), Orion (Star of Friendship), Luna (Dream Weaver), Nimbus (Brave Cloud), Bloom (Garden Keeper), Whistle (Night Train Conductor), Shade (Shadow Friend)

## Badge System (12 achievements)
| Badge | Condition |
|-------|-----------|
| First Adventure | Complete first story |
| Night Owl | Listen after 8 PM |
| Early Bird | Listen 5-10 AM |
| Hero Collector | Use every hero at least once |
| Silly Storyteller | Complete 3 Mad Libs stories |
| Dream Weaver | Complete 3 Sleep mode stories |
| Classic Champion | Complete 5 Classic stories |
| On Fire! | 3-day reading streak |
| Diamond Reader | 7-day reading streak |
| Bookworm | Complete 10 total stories |
| Story Legend | Complete 25 total stories |
| Word Wizard | Learn 5 vocabulary words |

See `docs/TEST-COVERAGE-ANALYSIS.md` for known logic bugs in badge evaluation (e.g. `vocab_5` currently counts total stories, `all_heroes` doesn't include custom heroes).

## Testing

**Framework:** Vitest v4 with @vitest/coverage-v8

```bash
npm test                # vitest run (single run)
npm run test:watch      # vitest (watch mode)
npm run test:coverage   # vitest run --coverage
```

- File naming: `<module>.test.ts` alongside the source file (e.g., `server/rate-limit.test.ts`)
- Target: >=80% branch coverage for server utilities (enforced in `vitest.config.ts`)
- Mocks: mock all external API calls (Gemini, OpenAI, ElevenLabs)
- Test fixtures for AI responses live in `__tests__/` where present

## Development Notes

- **Testing:** Vitest v4 configured with coverage via @vitest/coverage-v8
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml` — lint, test, typecheck, build on push/PR to main/develop; `eas-build.yml` — Expo EAS builds; `vercel-deploy.yml` — Vercel deployment; `publish.yml` — release publishing; `auto-merge.yml`, `branch-cleanup.yml`, `stale.yml` — repo hygiene; `agent-pr-review.yml`, `agent-security.yml` — automated AI agent PR review and security scanning; `markdown-link-check.yml` — broken-link checker). Also supports Replit push-to-deploy.
- **Vercel deployment:** `api/server.mjs` serverless handler wraps `server_dist/index.js` via `createApp()`. Config in `vercel.json` (60s max duration, all routes rewrite to `/api/server`)
- **React Compiler** enabled via app.json experiments
- **New Architecture** (React Native) enabled
- **Typed Routes** enabled for Expo Router
- **patch-package** used for dependency fixes (applied via postinstall)
- Database (PostgreSQL) only required for voice chat; core story functionality uses AsyncStorage only
- Server uses esbuild for production bundling to `server_dist/`
- Voice chat routes only registered when `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`, and `DATABASE_URL` are set
- React Query configured with `staleTime: Infinity`, `retry: false`, `refetchOnWindowFocus: false`
- TTS audio cached at `/tmp/tts-cache` with configurable max age and max size
- 12 randomized art styles for scene illustrations (watercolor, cel-shaded, paper cutout, gouache, crayon, digital, retro storybook, ink wash, pastel, pop art, chalk, flat design)
- Runbooks for deploy, incident response, provider outage, and rollback live in `docs/runbooks/`

## Known Gotchas

- `app/story.tsx` is the most complex screen (~60KB / 1627 lines) — story playback with audio/image/video integration; top refactor candidate
- `server/routes.ts` (~18KB / ~550 lines) was extracted; validation, prompts, rate-limit now live in their own files
- **`npm run dev` does not exist** — use `npm run server:dev` + `npm run expo:dev` separately
- **`expo:dev` requires Replit env vars** — outside Replit, use `npx expo start` directly
- **`patches/expo-asset+12.0.12.patch`** — patch-package fix for Expo dev server HTTPS; removed when SDK 55+
- AI router automatically falls back through providers, with circuit breakers and retry — check `server/ai/router.ts`
- ElevenLabs voices are hardcoded in `server/elevenlabs.ts` with specific voice IDs
- Expo Router v6 file-based routing — screen paths map to file paths in `app/`
- `postinstall` runs `patch-package` — don't skip it when installing dependencies
- Metro blocklist includes `.local/state/workflow-logs/**`
- Legacy `@infinity_heroes_preferences` key auto-migrates to `@infinity_heroes_app_settings`
- Server binds to `0.0.0.0` with `reusePort: true`
- JSON body limit is 100KB — large story payloads may need chunking
- **`lib/storage.ts` vs `server/storage.ts`** — client-side AsyncStorage helpers vs server-side in-memory story cache
- **`shared/schema.ts` vs `shared/models/chat.ts`** — schema.ts re-exports from models/chat.ts; both in drizzle.config.ts
- **`getReadStories` / `markStoryRead`** — wired into library screen (unread dot indicator) and completion screen (marks story read on completion)
- **`server/replit_integrations/`** — wired up but voice chat UI screen doesn't exist yet; backend routes are functional
- **Firebase auth is optional** — if `FIREBASE_SERVICE_ACCOUNT_KEY` is unset, all POSTs are treated as anonymous with IP-based rate-limit identity
- **AI router greedy-JSON regex bug** — see `docs/TEST-COVERAGE-ANALYSIS.md`; `router.ts` uses `\{[\s\S]*\}` which can grab across multiple JSON objects
- **Streaming model field** — `router.ts` reports `provider.name` as `model` in streaming chunks (should be actual model ID)

## Files/Directories — Do Not Modify Without Explicit Approval

- `patches/` (if present) — patch-package fixes; modifying breaks the postinstall step. Folder was removed after the SDK 55 upgrade but may return for future patches
- `server/replit_integrations/` — Replit-provided integration boilerplate; upstream updates may overwrite changes
- `shared/schema.ts` — database schema changes require coordinated migration; do not modify alone
- `.replit` — Replit workspace config; changes affect the dev environment for all contributors
