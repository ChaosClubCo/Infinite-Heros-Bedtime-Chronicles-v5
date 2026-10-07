<!-- Last verified: 2026-10-07 -->
# AUDIO-TTS-AGENT.md — Audio & Text-to-Speech Expert

Specialized agent context for all work touching ElevenLabs TTS, voice chat, background music, and the audio playback system.

---

## Domain Scope

This agent is authoritative for:
- `server/elevenlabs.ts` — Voice definitions, TTS generation, ElevenLabs API integration
- `server/suno.ts` — Background music file serving
- `server/integrations/audio/` — Voice chat audio processing
- `src/integrations/audio/` — Web voice recording/streaming/playback helpers
- `assets/music/` — Background music MP3 files (per mode)
- TTS cache management (`/tmp/tts-cache`)
- Audio playback on the client
- Voice selection UI in settings
- `app/story.tsx` audio composition

---

## ElevenLabs TTS System

### API Configuration

ElevenLabs uses the `eleven_multilingual_v2` model with MP3 output at 44.1 kHz / 128 kbps.

The server reads `ELEVENLABS_API_KEY` directly from the deployment environment. It is a server-only secret and must never be exposed through an `EXPO_PUBLIC_*` variable.

### Voice Catalog (`server/elevenlabs.ts`)

| Voice Key | ElevenLabs Voice | Mode |
|-----------|-----------------|------|
| `moonbeam` | Laura | Sleep |
| `whisper` | Sarah | Sleep |
| `stardust` | Gigi | Sleep |
| `captain` | Charlotte | Classic |
| `professor` | Callum | Classic |
| `aurora` | Rachel | Classic |
| `giggles` | Freya | Fun |
| `blaze` | Dave | Fun |
| `ziggy` | Matilda | Fun |

Voice defaults per story mode:
- **Sleep:** `moonbeam` (Laura)
- **Classic:** `captain` (Charlotte)
- **Fun/Mad Libs:** `giggles` (Freya)

### Voice Metadata Endpoint
```
GET /api/voices
Response: { voices: VoiceMetadata[], defaults: { sleep, classic, fun } }
```

---

## TTS Generation Pattern

```typescript
// POST /api/tts
// Body: { text: string (max 5000 chars), voiceKey?: string }
// Returns: { audioUrl: string }  (path to cached MP3)

// POST /api/tts-preview
// Body: { voiceKey: string }
// Returns: { audioUrl: string }  (short preview clip)
```

### Sleep Mode Voice Adjustment

When a non-sleep voice is used in sleep mode, the TTS parameters are adjusted dynamically:
- `stability` increased (smoother, less expressive)
- `style` decreased (calmer delivery)
- `use_speaker_boost` disabled

```typescript
const sleepOverrides = {
  stability: Math.min(voiceSettings.stability + 0.2, 1.0),
  style: Math.max(voiceSettings.style - 0.3, 0),
  use_speaker_boost: false,
};
```

---

## TTS Cache Management

Files are stored in `/tmp/tts-cache` with a hex-hash filename.

- Cache TTL: `TTS_CACHE_MAX_AGE_MS` env var (default: 86400000ms = 24 hours)
- Files expire and are re-generated on next request
- Filename format: `[a-f0-9]+.mp3` — hex hash only

### Security: Filename Validation (Mandatory)
```typescript
if (!/^[a-f0-9]+\.mp3$/.test(filename)) {
  return res.status(400).json({ error: 'Invalid filename' });
}
```

Never relax this validation — it prevents path traversal attacks.

---

## Background Music (`server/suno.ts`)

```
GET /api/music/:mode
```

Mode-to-file mapping:
| Mode | Music File |
|------|-----------|
| `sleep` | `assets/music/sleep.mp3` |
| `classic` | `assets/music/classic.mp3` |
| `madlibs` | `assets/music/fun.mp3` |

Music files are served as static MP3 streams with appropriate `Content-Type: audio/mpeg` headers.

---

## Voice Chat System (`server/integrations/audio/`)

Voice chat uses:
- **STT:** OpenAI `gpt-4o-mini-transcribe`, after server-side audio format detection.
- **Text response:** `VOICE_CHAT_TEXT_MODEL` when configured, otherwise `gpt-4o-mini`.
- **Child safety:** input sanitization, bounded history, output moderation, then persistence/return of the approved transcript.
- **Playback:** the web voice stack under `src/integrations/audio/` can consume SSE transcript/audio events and uses `public/audio-playback-worklet.js` for PCM playback.

Voice chat routes are only registered when the feature/compliance gates pass and both of these runtime dependencies exist:
```typescript
process.env.OPENAI_API_KEY &&
process.env.DATABASE_URL
```

Voice chat conversation history is stored in PostgreSQL (`conversations` + `messages` tables) and scoped to the authenticated Supabase user.

---

## Client Audio Playback

The native client uses the app's current Expo audio implementation; the web integration uses an AudioWorklet-based PCM playback path. Always release audio resources when the owning component unmounts to avoid leaked contexts/sounds.

---

## Settings Integration

Audio settings live in `SettingsContext`:

| Setting | Type | Default | Usage |
|---------|------|---------|-------|
| `audioVolume` | `number` (0–100) | `80` | TTS and music volume |
| `audioSpeed` | `number` | `1.0` | TTS playback rate |
| `narratorVoice` | `string` | `"moonbeam"` | Selected voice key |
| `isMuted` | `boolean` | `false` | Global mute toggle |
| `autoPlay` | `boolean` | `false` | Auto-play narration |

---

## What This Agent Must Flag for Human Review

- Changes to ElevenLabs voice IDs in `server/elevenlabs.ts`
- Changes to TTS filename validation regex
- Changes to voice chat routes that affect database writes or retention
- Audio format changes that could break cached or streamed audio
- New `assets/music/` files (licensing must be verified)
- Any attempt to expose `OPENAI_API_KEY` or `ELEVENLABS_API_KEY` to the client

---

## Related Agent Files

- [`BACKEND-API-AGENT.md`](./BACKEND-API-AGENT.md) — TTS route patterns
- [`SECURITY-SAFETY-AGENT.md`](./SECURITY-SAFETY-AGENT.md) — TTS filename security
- [`DATABASE-AGENT.md`](./DATABASE-AGENT.md) — Voice chat conversation storage
- [`STORY-GENERATION-AGENT.md`](./STORY-GENERATION-AGENT.md) — Story modes and voice selection
