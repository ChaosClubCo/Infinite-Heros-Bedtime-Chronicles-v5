# API Inventory

Evidence-grounded inventory of every Express endpoint, verified against source on 2026-09-20 —
**not** against `docs/API.md`, which is independently cross-checked below and found stale in
several places. See `README.md` for scope and method.

## Middleware order (`server/index.ts`)

`trust proxy=1` → `validateEnvironment()` (logs only) → security headers (X-Content-Type-Options,
X-Frame-Options=DENY, Referrer-Policy, CSP, HSTS) → CORS → body parsing (JSON+urlencoded, 100KB,
exempts `/api/github/webhook` for raw-body HMAC) → request logging (pino) → load shedding →
Expo manifest/static routing → `registerRoutes(app)` → global error handler.

**CORS allow-list exactly as coded**: `https://bedtime-chronicles.com`,
`https://www.bedtime-chronicles.com`, `https://${REPLIT_DEV_DOMAIN}` if set, each
`REPLIT_DOMAINS` entry, localhost/127.0.0.1 on ports 5000/8081/19000-19006. **No Vercel-preview
regex and no `VERCEL_URL` handling exist in code** — both `CLAUDE.md` files' claim of
`infinite-hero*.vercel.app` matching is doc drift, not implemented. Methods: GET/POST/PUT/
DELETE/OPTIONS, credentials allowed.

**Doc-drift bug found**: a startup log line still warns `"FIREBASE_SERVICE_ACCOUNT_KEY not set"`
while `isAuthEnabled()` actually checks Supabase env vars — a stale variable name in a log
message, not a functional bug (auth is Supabase-only in code).

## Global gates (`server/routes.ts`)

Two gates apply before any route handler runs, both mounted on `app.use('/api', ...)`:

1. **`requireAuth`** — gated by `requiresAuthGate(method, path)`: `/github/webhook` is exempt for
   every method (uses HMAC instead); for `GET`, only `/conversations*` and
   `/v1/realtime-media-sessions*` require auth; every other method on every other path requires
   it. This is a global rule, not per-route — no domain module can "forget" it.
2. **`requiresAiProviderCompliance`** (`server/compliance.ts`) — **undocumented in both
   `CLAUDE.md` files.** Fail-closed 503 in production unless `AI_PROVIDER_DPA_CONFIRMED`,
   `AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED`, `PRIVACY_POLICY_PUBLISHED`, and
   `APP_STORE_DATA_SAFETY_REVIEWED` are all `"true"`. Applies to any path starting with
   `/generate-`, `/suggest-settings`, `/tts`, `/conversations`, `/v1/realtime-media-sessions`.

Ownership (not role-based authorization — see `AUTHORIZATION-MATRIX.md`) is enforced inside
handlers via `req.user.uid`, confirmed in `server/routes/realtime-media.ts` and
`server/integrations/audio/routes.ts`.

## Endpoint table

| Method | Path | File | Auth | Validation | Rate limit | Idempotent | Downstream | Client caller(s) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/api/metrics` | `routes/health.ts` | no | none | no | no | in-process metrics | none found | ORPHANED |
| GET | `/api/health` | `routes/health.ts` | no | none | no | no | provider/feature status | `src/context/SyncOfflineContext.tsx` (fire-and-forget, errors discarded) | No caller in the Expo app |
| GET | `/privacy` | `routes/health.ts` | no | none | no | no | static HTML | none found | ORPHANED (client-side; served for browsers) |
| GET | `/api/ai-providers` | `routes/health.ts` | no | none | no | no | AI router status | none found | ORPHANED |
| DELETE | `/api/account` | `routes/account.ts` | yes, non-anon required | none (uses `req.user`) | no | no | Supabase admin `deleteUser`, optional Postgres chat purge | `lib/sync/runSync.ts` → `purgeCloudData()` → `app/settings.tsx` | 400 if anonymous/missing user; 503 on failure; **not fully transactional** — see `FLOW-BREAKS.md` |
| POST | `/api/generate-story` | `routes/story.ts` | yes | `StoryRequestSchema` | yes | yes (uid-keyed) | AI router (text) → `guardStory` safety pipeline | `app/story.tsx` | |
| POST | `/api/generate-story-stream` | `routes/story.ts` | yes | `StoryRequestSchema` | yes | no | AI router streaming → buffered safety guard | **none found** | ORPHANED — `app/story.tsx` only uses the sync JSON endpoint; the SSE buffering path (see below) is entirely unexercised by the shipped app |
| POST | `/api/generate-avatar` | `routes/images.ts` | yes | `AvatarRequestSchema` | yes | no | AI router (image) | `app/(tabs)/create.tsx` | |
| POST | `/api/generate-scene` | `routes/images.ts` | yes | `SceneRequestSchema` | yes | no | AI router (image) | `lib/useSceneGeneration.ts` (used by `app/story.tsx`) | |
| POST | `/api/tts` | `routes/tts.ts` | yes | `TtsRequestSchema` | yes | no (fs-cache only) | ElevenLabs, `/tmp/tts-cache` | `lib/narration.ts` (via `lib/useStoryAudio.ts`) | **R2 persistent tier does not exist** — see doc-discrepancy list |
| GET | `/api/tts-audio/:file` | `routes/tts.ts` | no | filename regex `/^[a-f0-9]+\.mp3$/` | no | no | fs read | consumed indirectly via `audioUrl` | |
| POST | `/api/tts-preview` | `routes/tts.ts` | yes | inline (`sanitizeString` + voice-map lookup) | yes | no | ElevenLabs | `app/(tabs)/create.tsx` | |
| GET | `/api/voices` | `routes/tts.ts` | no | none | no | no | static voice map | none found | ORPHANED |
| GET | `/api/music/:mode` | `routes/music.ts` | no | inline mode check | no | no | `server/suno.ts` static file | `lib/useBackgroundMusic.ts` | |
| GET | `/api/music-info/:mode` | `routes/music.ts` | no | inline mode check | no | no | `server/suno.ts` | none found | ORPHANED |
| POST | `/api/suggest-settings` | `routes/suggest.ts` | yes | `SuggestSettingsRequestSchema` | yes | no | AI router (suggestion chain) | `app/(tabs)/create.tsx` | |
| GET | `/api/video-available` | `routes/video.ts` | no | none | no | no | feature-flag check | none found | ORPHANED |
| POST | `/api/generate-video` | `routes/video.ts` | yes | `VideoRequestSchema` | yes | no | Sora (`server/video.ts`) | `lib/useVideoGeneration.ts` | 404 if `videoEnabled` flag off |
| GET | `/api/video-status/:id` | `routes/video.ts` | no | inline `sanitizeString` | no | no | in-memory job map | `components/StorySceneDisplay.tsx` | |
| GET | `/api/video/:id` | `routes/video.ts` | no | regex `/^[a-f0-9]+$/` | no | no | fs file | consumed via `videoUrl` | |
| POST | `/api/github/webhook` | `routes/github-webhook.ts` | no (HMAC `X-Hub-Signature-256` instead) | none (raw body + HMAC) | yes | no | none (202 accept) | GitHub (external) | Intentionally exempt from both global gates |
| POST | `/api/v1/realtime-media-sessions` | `routes/realtime-media.ts` | yes | `CreateSessionRequestSchema` | yes | naturally idempotent | `realtime/session-store`, `realtime/connection-tickets` | none found | ORPHANED — `docs/API.md` itself notes no screen links to this feature |
| GET | `/api/v1/realtime-media-sessions/:id` | `routes/realtime-media.ts` | yes | inline | no | no | session store | none found | ORPHANED, 404s cross-owner |
| POST | `/api/v1/realtime-media-sessions/:id/cancel` | `routes/realtime-media.ts` | yes | inline | yes | naturally idempotent | session store + ws close | none found | ORPHANED |
| GET (WS upgrade) | `/api/v1/realtime-media-sessions/ws` | `realtime/ws-server.ts` | ticket-based | ticket validation | n/a | n/a | WebSocket upgrade | none found | ORPHANED, non-Vercel only |
| GET | `/api/conversations` | `integrations/audio/routes.ts` | yes | none | **no rate limit** | no | Drizzle/Postgres | none found | ORPHANED — `app/voice-chat.tsx` is a 144-line static stub with zero API imports |
| POST | `/api/conversations` | `integrations/audio/routes.ts` | yes | inline | **no rate limit** | no | Drizzle/Postgres | none found | ORPHANED |
| GET | `/api/conversations/:id` | `integrations/audio/routes.ts` | yes | inline | **no rate limit** | no | Drizzle/Postgres | none found | ORPHANED |
| DELETE | `/api/conversations/:id` | `integrations/audio/routes.ts` | yes | inline | **no rate limit** | no | Drizzle/Postgres | none found | ORPHANED |
| POST | `/api/conversations/:id/messages` | `integrations/audio/routes.ts` | yes | inline (audio size check) | **no rate limit** | no | OpenAI STT + chat completion, `chatStorage`, `server/safety/chat-safety.ts` | none found | ORPHANED; own 50MB body parser, separate from the app-wide 100KB limit |
| POST | `/api/generate-image` | `integrations/image/routes.ts` | yes (via the `/api`-prefix global gate) | inline (prompt ≤8000 chars) | **no rate limit** | no | `@google/genai` Gemini directly | none found | ORPHANED |

**`POST /api/sync/interactions` — documented in `docs/API.md` and both `CLAUDE.md` files, actively
called by the client, does not exist in source.** See "Documentation discrepancies" and
`FLOW-BREAKS.md` FLOW-BREAK-001 — this is the single most significant finding of this audit.

## Documentation discrepancies (`docs/API.md` and both `CLAUDE.md` files vs. source)

| Claim | Reality | Evidence |
|---|---|---|
| `POST /api/sync/interactions` exists, "logs and echoes" interactions | **Does not exist.** No route, no `SyncInteractionSchema` in `server/validation.ts`. `git log -S "sync/interactions"` shows the string entered only documentation, never `server/routes.ts`. | See `FLOW-BREAKS.md` FLOW-BREAK-001 |
| Server structure lives at `server/replit_integrations/` | Real path is `server/integrations/{audio,image,batch,chat}/` | `ls server/replit_integrations` → no such directory |
| `server/r2.ts` / Cloudflare R2 persistent TTS-audio tier is "live" | **Does not exist anywhere in source.** Grep for `r2Get\|r2Put\|R2_ENABLED` across `server/` → zero hits. TTS cache is `/tmp`-only. | Full-repo grep, both agents independently confirmed |
| CORS allows Vercel preview URLs (`infinite-hero*.vercel.app`) and reads `VERCEL_URL` | Not present in `setupCors()` | `server/index.ts` read in full |
| (undocumented) `server/compliance.ts` fail-closed AI-provider gate | Real, undocumented in either `CLAUDE.md` | `server/routes.ts`, `server/compliance.ts` |
| Voice chat requires `AI_INTEGRATIONS_OPENAI_API_KEY` | Requires plain `OPENAI_API_KEY` | `server/routes.ts` conditional-registration block |
| Realtime-media/`server/realtime/*`, `server/safety/*`, `server/providers/*`, `server/media/*`, `server/release-identity.ts` subsystems | Real, substantial, largely undocumented in either `CLAUDE.md` | Directory listing + route registration |

## Orphaned endpoints / broken client calls

**Orphaned** (server implements it, no client caller found in `app/`, `components/`, `lib/`, or
`src/`): `GET /api/metrics`, `GET /privacy`, `GET /api/ai-providers`, `GET /api/voices`,
`GET /api/music-info/:mode`, `GET /api/video-available`, `POST /api/generate-story-stream`,
`POST /api/generate-image`, all `/api/v1/realtime-media-sessions*` + its WS upgrade, all five
`/api/conversations*` endpoints. The realtime-media and voice-chat subsystems in particular
represent substantial, tested, production-grade server code with **zero UI wiring** —
architecturally significant, not just dead code.

**Broken client call** (client calls a path with no matching route): `lib/sync-queue.ts` →
`apiRequest("POST", "api/sync/interactions", ...)`, invoked from `lib/useSyncOffline.ts`'s
`syncOfflineInteractions()`, mounted once at app root via `lib/SyncOfflineContext.tsx` and fired
on every reconnect. This 404s every time; see `FLOW-BREAKS.md` FLOW-BREAK-001.

## Safety-guard flow (`server/safety/story-guard.ts`)

`guardStory()`: (1) regex-based `moderateStory()` on the freshly generated story; (2) an optional
LLM second-pass classifier for borderline soft-tier matches, which **fails toward "safe"** on a
provider outage so a moderation-service blip never blocks a regex-clean story; (3) on any block,
regenerates **exactly once** via `buildStricterSystemPrompt()` at lower temperature; (4)
re-moderates — clean → `outcome: 'regenerated'`; still unsafe or the regenerate call throws →
serves a pre-written `outcome: 'fallback'` story. The child never sees flagged text or a raw
error. Gated by `contentSafetyEnabled` (default on).

**SSE buffering** (`/api/generate-story-stream`, orphaned per above): when safety is on, the
stream loop accumulates the full response instead of forwarding per-token `chunk` events —
clients only ever receive one `complete` event. Since this endpoint has no confirmed caller, this
buffering path is currently unexercised by the shipped app.
