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
    { "id": "act_abc123", "type": "like", "storyId": "story-1", "timestamp": 1700000000000, "status": "processed" }
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

> **Not currently live:** `server/replit_integrations/chat/routes.ts` implements a text-chat variant of this endpoint (`{ content }` request → `{content}`/`{done}` SSE events), but `registerChatRoutes()` is never called from `server/routes.ts` — there is no code path that registers it on the running server. Treat it as dead code, not a documented API surface, until something wires it up.

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
