# API Reference

Base URL: `http://localhost:5000` (development)

All endpoints return JSON unless otherwise noted. Rate limiting applies to all POST endpoints (10 req/min per IP by default).

---

## Authentication

All non-GET API endpoints (`POST`, `PUT`, `DELETE`) require a valid Supabase access token (JWT) in the Authorization header. The only exception is `POST /api/github/webhook`, which is authenticated via `X-Hub-Signature-256` HMAC verification.

- **Dev mode**: If `SUPABASE_SERVICE_ROLE_KEY` (+ Supabase URL) is not set, auth is bypassed and requests are accepted without tokens.
- **Production**: The server validates tokens via the Supabase service-role client (`supabase.auth.getUser`). Invalid/expired tokens return `401 Unauthorized`; if Supabase is unconfigured in production, auth-gated routes return `503`.
- **GET endpoints** are public by default (`/api/health`, `/api/voices`, `/api/ai-providers`, etc.), **except** `GET /api/conversations` and `GET /api/conversations/:id`, which are auth-gated.

Rate limiting uses the authenticated user's UID when available, falling back to IP-based limiting.

---

## Account

### `DELETE /api/account`
Parent-initiated account deletion — the COPPA-relevant account/data-deletion
mechanism. Requires a signed-in (non-anonymous) Supabase access token, same as
other non-GET `/api/*` routes, including the `503` fallback when Supabase is
not configured in production.

Permanently deletes the authenticated parent's Supabase Auth identity along
with all server-retained data tied to it: voice-chat conversation history in
PostgreSQL (only when `DATABASE_URL` is configured — this step is skipped
otherwise) and cloud-sync records. `sync_records` and related rows cascade
via `ON DELETE CASCADE` foreign keys when the `auth.users` row is deleted
(see `supabase/migrations/*_sync_tables.sql`). Release metadata is resolved
before any destructive step runs, so an unverifiable deployment fails closed
instead of deleting data without being able to issue a receipt.

The success response is a PII-free receipt confirming server-side deletion
only — it deliberately contains no user id, email, profile, story, or
transcript data. The client is responsible for clearing local device storage
(profiles, stories, badges, streaks, etc.) after receiving a successful
response; if the request fails, local data is left intact so the parent can
retry.

**Response:**
```json
{
  "version": 2,
  "receiptId": "b3f1c9d0-2e4a-4b3f-9c1a-7e6d5f4a3b2c",
  "completedAt": "2026-08-12T03:14:00.000Z",
  "releaseSha": "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
  "status": "completed",
  "deletedScopes": ["voice_chat_history", "cloud_sync_records", "parent_auth_identity"],
  "localDeviceData": "pending_client_cleanup"
}
```

**Error Responses:**
- `400 { "error": "A signed-in parent account is required" }` — no user on the request, or the session is anonymous
- `503 { "error": "Account deletion could not be completed. Your local data was not cleared; please retry." }` — a deletion step failed (e.g. release SHA unresolvable, database or auth-identity deletion error); no partial receipt is ever returned

**Scope Resolution:** `deletedScopes` dynamically lists the precise scopes executed by the server during deletion (`['cloud_sync_records', 'parent_auth_identity']` by default, plus `'voice_chat_history'` when `DATABASE_URL` is configured and PostgreSQL transcripts are purged). This guarantees receipts accurately reflect data store purges without false claims.

---

## Health & Status

### `GET /api/health`
Returns server health status, including AI/TTS availability, circuit-breaker state, and feature flags. `ttsLive`/`aiProvidersLive` come from a short-TTL background-refreshed cache (see `server/health-checks.ts`) — never a synchronous network probe — so they read `{ reachable: null, checkedAt: null }` until the first background check completes (e.g. right after a serverless cold start).

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1710000000000,
  "aiProvidersAvailable": true,
  "ttsAvailable": true,
  "ttsLive": { "reachable": true, "checkedAt": 1710000000000 },
  "aiProvidersLive": { "reachable": true, "checkedAt": 1710000000000 },
  "breakers": { "gemini": "closed", "openai": "closed" },
  "features": { "voiceChatEnabled": false },
  "activeRequests": 0
}
```

### `GET /api/ai-providers`
Returns availability status of all configured AI providers plus circuit-breaker state. `providers` is an array of status objects, not a boolean map.

**Response:**
```json
{
  "providers": [
    { "name": "anthropic", "available": true, "capabilities": { "text": true, "image": false, "streaming": true } },
    { "name": "gemini", "available": true, "capabilities": { "text": true, "image": true, "streaming": true } }
  ],
  "breakers": { "anthropic": "closed", "gemini": "closed" }
}
```

### `GET /api/metrics`
Returns in-process metrics (request counters, AI call counts/failures, error rate, token usage, and latency percentiles by provider). Intended for monitoring; not client-facing.

**Response:**
```json
{
  "requests": { "total": 0, "byStatus": {} },
  "ai": {
    "calls": 0,
    "failures": 0,
    "errorRate": "0%",
    "totalTokens": {},
    "latency": { "p50": 0, "p95": 0, "p99": 0 },
    "byProvider": {}
  }
}
```

### `GET /privacy`
Serves the static privacy-policy HTML page (`server/templates/privacy-policy.html`). Returns `text/html`, or `404 { "error": "Privacy policy not found" }` if the template is missing. Not a JSON API endpoint.

---

## Story Generation

### `POST /api/generate-story`
Generates a complete story as a single JSON response.

**Request Body:**
```json
{
  "heroName": "Luna",
  "heroTitle": "Guardian of Stars",
  "heroPower": "star magic",
  "heroDescription": "A brave astronaut who protects the constellations",
  "duration": "medium",
  "mode": "classic",
  "setting": "enchanted forest",
  "tone": "gentle",
  "childName": "Emma",
  "sidekick": "a talking owl",
  "problem": "finding a lost star",
  "soundscape": "rain",
  "madlibWords": { "noun": "banana", "adjective": "sparkly" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| heroName | string | Yes | Hero's name (max 500 chars) |
| heroTitle | string | No | Hero's title |
| heroPower | string | No | Hero's superpower |
| heroDescription | string | No | Hero background |
| duration | string | No | `short` \| `medium-short` \| `medium` \| `long` \| `epic` |
| mode | string | No | `classic` \| `madlibs` \| `sleep` (default: classic) |
| setting | string | No | Adventure setting (classic mode) |
| tone | string | No | `gentle` \| `adventurous` \| `funny` \| `mysterious` |
| childName | string | No | Child's name to weave into story |
| sidekick | string | No | Companion character |
| problem | string | No | Central challenge |
| customPrompt | string | No | Free-form story idea from the child (classic mode; max 500 chars, sanitized) |
| soundscape | string | No | `rain` \| `ocean` \| `crickets` \| `wind` \| `fire` \| `forest` (sleep mode) |
| madlibWords | object | No | Word substitutions (madlibs mode) |

**Response:**
```json
{
  "title": "The Starlight Adventure",
  "parts": [
    { "text": "Once upon a time...", "choices": ["Go left", "Go right", "Fly up"], "partIndex": 0 },
    { "text": "The story continues...", "partIndex": 1 }
  ],
  "vocabWord": { "word": "constellation", "definition": "A group of stars forming a pattern" },
  "joke": "Why did the star go to school? To get brighter!",
  "lesson": "True friends help each other shine.",
  "tomorrowHook": "Tomorrow, Luna discovers a secret galaxy...",
  "rewardBadge": { "emoji": "⭐", "title": "Star Finder", "description": "Found a lost constellation!" }
}
```

### `POST /api/generate-story-stream`
Same parameters as `/api/generate-story`. Returns a Server-Sent Events stream.

**SSE Events:**
```
data: {"type":"provider","provider":"gemini","model":"gemini-2.5-flash"}
data: {"type":"chunk","text":"Once upon..."}
data: {"type":"chunk","text":" a time..."}
data: {"type":"done"}
```

---

## Sync

### `POST /api/sync/interactions`
Best-effort drain target for the client's offline interaction queue
(`lib/sync-queue.ts`). The client queues `like`/`unlike`/`story_completion`
interactions in AsyncStorage while offline and posts the batch here once
connectivity is restored (`lib/useSyncOffline.ts`). The server currently
logs and echoes each interaction rather than persisting it — there is no
backing datastore for this endpoint yet.

Each element of `interactions` is validated against `SyncInteractionSchema`
(`server/validation.ts`): `type` must be `like`/`unlike`/`story_completion` and
`storyId` must be a non-empty string. Malformed items are not persisted or
echoed as processed — they come back with `status: "rejected"` and a `reason`,
while the request as a whole still returns `200`/`success: true` (partial
failure doesn't fail the batch).

**Request Body:**
```json
{
  "interactions": [
    { "id": "act_abc123", "type": "like", "storyId": "story-1", "timestamp": 1700000000000 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "syncedCount": 1,
  "results": [
    { "id": "act_abc123", "type": "like", "storyId": "story-1", "timestamp": 1700000000000, "status": "processed" },
    { "status": "rejected", "reason": "Invalid interaction type" }
  ]
}
```

---

## Image Generation

### `POST /api/generate-avatar`
Generates a hero portrait image.

**Request Body:**
```json
{
  "heroName": "Luna",
  "heroTitle": "Guardian of Stars",
  "heroPower": "star magic",
  "heroDescription": "A brave astronaut"
}
```

**Response:**
```json
{ "image": "data:image/png;base64,..." }
```

### `POST /api/generate-image`
Generates an image directly via Gemini (requires `AI_INTEGRATIONS_GEMINI_API_KEY`).

**Request Body:**
```json
{ "prompt": "A whimsical castle floating in the clouds" }
```

**Response:**
```json
{ "b64_json": "<base64-image-data>", "mimeType": "image/png" }
```

### `POST /api/generate-scene`
Generates a story scene illustration.

**Request Body:**
```json
{
  "heroName": "Luna",
  "sceneText": "Luna flew through the shimmering crystal cave...",
  "heroDescription": "A brave astronaut"
}
```

**Response:**
```json
{ "image": "data:image/png;base64,..." }
```

---

## Text-to-Speech

### `POST /api/tts`
Converts text to speech audio.

**Request Body:**
```json
{
  "text": "Once upon a time, in a land far away...",
  "voice": "moonbeam",
  "mode": "classic"
}
```

**Response:**
```json
{ "audioUrl": "/api/tts-audio/abc123.mp3" }
```

### `GET /api/tts-audio/:file`
Serves a cached TTS audio file. File name must match `/^[a-f0-9]+\.mp3$/`.

**Response:** `audio/mpeg` binary

### `POST /api/tts-preview`
Generates a short voice preview sample.

**Request Body:**
```json
{ "voice": "moonbeam" }
```

**Response:**
```json
{ "audioUrl": "/api/tts-audio/def456.mp3" }
```

### `GET /api/voices`
Lists all available narrator voices with metadata.

**Response:**
```json
{
  "voices": [
    { "id": "moonbeam", "name": "Moonbeam", "characterName": "...", "description": "...", "accent": "...", "personality": "...", "category": "sleep" }
  ],
  "defaults": { "classic": "moonbeam", "madlibs": "ziggy", "sleep": "moonbeam" }
}
```

---

## Music

### `GET /api/music/:mode`
Serves background music for a story mode (`classic`, `madlibs`, or `sleep`).

**Response:** `audio/mpeg` binary

### `GET /api/music-info/:mode`
Returns metadata about the available music tracks for a story mode. Validates `:mode` against the allowed modes (`400 { "error": "Invalid mode" }` otherwise).

**Response:**
```json
{ "trackCount": 3 }
```

---

## Smart Suggestions

### `POST /api/suggest-settings`
AI-powered story setting suggestions based on context.

**Request Body:**
```json
{
  "heroName": "Luna",
  "heroPower": "star magic",
  "heroDescription": "A brave astronaut",
  "hour": 20,
  "childAge": 5,
  "childName": "Emma"
}
```

**Response:**
```json
{
  "mode": "sleep",
  "duration": "short",
  "speed": "gentle",
  "voice": "moonbeam",
  "tip": "It's bedtime — a short, calming sleep story is perfect."
}
```

---

## Video Generation

### `GET /api/video-available`
Checks if video generation is available (requires `OPENAI_API_KEY`).

**Response:**
```json
{ "available": true }
```

### `POST /api/generate-video`
Starts an async video generation job.

**Request Body:**
```json
{
  "sceneText": "Luna flew through the crystal cave...",
  "heroName": "Luna",
  "heroDescription": "A brave astronaut"
}
```

**Response:**
```json
{ "jobId": "abc123" }
```

### `GET /api/video-status/:id`
Checks video generation progress.

**Response:**
```json
{ "status": "processing", "progress": 65 }
```
or
```json
{ "status": "completed", "progress": 100, "videoUrl": "/api/video/abc123" }
```

### `GET /api/video/:id`
Serves a completed video file. ID must match `/^[a-f0-9]+$/`.

**Response:** `video/mp4` binary

---

## Realtime Media Sessions (requires ELEVENLABS_API_KEY + FEATURE_REALTIME_MEDIA_ENABLED=true)

Typed-input-only moderated talkback: a realtime session accepts typed text (no
microphone — see the client-side release gate note below), runs the reply
through the same child-safety pipeline as story generation, generates the
approved reply's speech, then sends it to the client in fixed-size chunks
(the underlying ElevenLabs call — `server/elevenlabs.ts`'s `generateSpeech()`
— returns the full audio buffer before chunking begins; this is not
incremental/streaming synthesis today). Registered by
`registerRealtimeMediaRoutes()` in `server/routes/realtime-media.ts`, gated
exactly like Voice Chat (feature flag + compliance status + dependency check
in `server/routes.ts`).

**Deployment note:** production on Vercel serves requests through a single
stateless serverless function with no persistent process, so a session
created there gets `transport: "sse-fallback"` (no `wsUrl`) instead of a
live WebSocket. **This fallback currently has no working interactive
transport at all** — the `sseUrl` it returns is a plain JSON status-poll
endpoint (`GET /api/v1/realtime-media-sessions/:id`), not an
EventSource-compatible stream; the response also sets
`realtimeAvailable: false` and a `note` field saying so. A real Vercel-side
fallback (chunked SSE or similar) is unbuilt follow-up work. The WebSocket
transport only activates on a long-running deployment target (Replit) — see
`server/realtime/ws-server.ts`.

**Client note:** no screen in the current release links to this feature and
no microphone permission is requested by it — it is typed-input only. See
`__tests__/release/voice-containment.test.ts`, which this feature does not
touch or loosen.

### `POST /api/v1/realtime-media-sessions`
Creates a realtime media session. Requires a `realtime-media`-scoped consent
artifact — this is a new, additive consent scope; existing story-generation
consent does not cover it.

**Request Body:**
```json
{
  "mode": "sleep",
  "characterProfileId": "moonbeam",
  "consentArtifact": {
    "schemaVersion": 1,
    "id": "consent-1",
    "consentRecordVersion": 3,
    "grantedAt": "2026-09-11T00:00:00.000Z",
    "scope": "realtime-media"
  }
}
```

**Response (201, non-Vercel):**
```json
{
  "session": { "id": "...", "status": "active", "mode": "sleep", "characterProfileId": "moonbeam", "transport": "websocket", "ownerId": "...", "...": "..." },
  "wsUrl": "/api/v1/realtime-media-sessions/ws?sessionId=...&ticket=..."
}
```

The `ticket` query param is a single-use, 5-minute credential
(`server/realtime/connection-tickets.ts`) minted for the calling user and
consumed by the WS upgrade handshake below — it is not a bearer token and
cannot be reused or shared with another session id.

**Response (201, Vercel):** same shape plus `"transport": "sse-fallback"`, an
`sseUrl` (no `wsUrl`/`ticket`), `"realtimeAvailable": false`, and a `note`
explaining the fallback is status-poll only (see the deployment note above).

### `GET /api/v1/realtime-media-sessions/:id`
Returns the current session state — only to the user who created it. 404 both
for an unknown ID and for a session owned by a different user (a
distinguishing status code would let a caller enumerate other users'
session IDs).

### `POST /api/v1/realtime-media-sessions/:id/cancel`
Idempotent — cancelling an already-cancelled or completed session returns its
current state rather than erroring. Same ownership check (404 if not the
owner) as the GET endpoint above; also closes the live WebSocket connection
for that session, if one is open.

### WebSocket — `GET /api/v1/realtime-media-sessions/ws?sessionId=...&ticket=...`
Non-Vercel only. Upgrades to a WebSocket once `sessionId` resolves to an
active session created via the endpoint above **and** `ticket` is a valid,
unexpired, not-yet-consumed ticket minted for that same session — a session
ID alone is not sufficient authorization. Client sends typed-text JSON
frames (`{"type":"user_text","text":"..."}`), one at a time (a second message
while a reply is still generating is rejected with an `error` event rather
than queued); the server never sends audio as base64-in-JSON — a
`speech_chunk_ready` event (JSON) precedes each chunk's raw bytes, sent as a
separate **binary** WebSocket frame. Every server event is a versioned
envelope (`RealtimeEventSchema` in `shared/media/schemas.ts`):
`session_started`, `safety_inspection`, `response_text_delta` (only the
already-moderated, safe-to-display text — never raw model output),
`speech_chunk_ready`, `speech_complete`, `error`, `session_ended`.

---

## Voice Chat (requires DATABASE_URL + AI_INTEGRATIONS_OPENAI_API_KEY)

### `GET /api/conversations`
Lists conversations with optional pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 50 | Results per page (1-200) |
| offset | number | 0 | Number of results to skip |

**Response:**
```json
{
  "data": [{ "id": 1, "title": "Chat with Luna", "createdAt": "..." }],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### `POST /api/conversations`
Creates a new conversation. Title is sanitized (trimmed, max 200 chars).

**Request Body:**
```json
{ "title": "Chat with Luna" }
```

### `GET /api/conversations/:id`
Gets a conversation with all messages. Returns `400` if `:id` is not a valid positive integer.

### `DELETE /api/conversations/:id`
Deletes a conversation and all its messages. Returns `400` if `:id` is not a valid positive integer.

### `POST /api/conversations/:id/messages`
Sends a voice message and receives a streaming audio response.

**Request Body:**
```json
{
  "audio": "<base64-encoded-audio>",
  "voice": "alloy"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| audio | string | Yes | Base64-encoded audio data (max 25MB decoded) |
| voice | string | No | `alloy` \| `echo` \| `fable` \| `onyx` \| `nova` \| `shimmer` (default: alloy) |

**Validation:**
- `:id` must be a valid positive integer (returns `400` otherwise)
- `audio` must be a non-empty base64 string under 25MB decoded
- `voice` is validated against the allowlist; invalid values default to `alloy`

**SSE Response Events:**
```
data: {"type":"user_transcript","data":"Hello hero!"}
data: {"type":"transcript","data":"Hi there!"}
data: {"type":"audio","data":"<base64-pcm16-chunk>"}
data: {"type":"done","transcript":"Hi there! How are you?"}
```

---

## GitHub Integration

### `POST /api/github/webhook`
Receives GitHub repository webhook deliveries (e.g. `workflow_run`). **Not** authenticated via Supabase — GitHub cannot supply a bearer token — instead the raw request body is verified against the `X-Hub-Signature-256` header using HMAC-SHA256 with `GITHUB_WEBHOOK_SECRET` (timing-safe comparison). This is the one POST endpoint exempt from the Supabase auth gate described above.

**Headers read:** `X-GitHub-Event`, `X-GitHub-Delivery`, `X-Hub-Signature-256`

**Responses:**
- `202 { "ok": true }` — signature verified, delivery accepted
- `401 { "error": "Invalid signature" }` — missing/invalid `X-Hub-Signature-256`
- `400 { "error": "Bad request" }` — raw body unavailable
- `500 { "error": "Webhook not configured" }` — `GITHUB_WEBHOOK_SECRET` not set

---

## Error Responses

All errors follow this format:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid request (missing/invalid parameters) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 401 | Unauthorized (missing/invalid Supabase access token) |
| 503 | Service unavailable |
