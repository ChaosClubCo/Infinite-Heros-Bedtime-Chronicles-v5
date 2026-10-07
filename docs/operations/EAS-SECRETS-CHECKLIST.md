# EAS & Deployment Secrets Checklist

<!-- Last verified: 2026-10-07 -->

This document separates **EAS mobile client configuration** (`EXPO_PUBLIC_*`) from **server-only deployment secrets**.

> [!SECURITY]
> **Client Security Rule:** Never embed server-only API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `ELEVENLABS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) into the client APK/AAB bundle. The mobile client communicates through the API server and Supabase client SDK using only approved `EXPO_PUBLIC_*` values.

---

## 1. EAS Mobile Client Build Configuration (`EXPO_PUBLIC_*`)

Set only client-visible values in EAS before triggering mobile builds:

| Variable Name | Description | Required For |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Full URL to the production API | All mobile client API requests |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Client Supabase Auth & Cloud Sync |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous client key | Client Supabase Auth & Cloud Sync |
| `EXPO_PUBLIC_ENV` | Environment identifier (`production`, `preview`, `development`) | Environment detection & logging |
| `EXPO_PUBLIC_SENTRY_DSN` *(Optional)* | Client Sentry DSN | Mobile crash monitoring |

These values are intentionally visible in the built application. Treat them as configuration, not secrets.

---

## 2. Server Environment Variables

Set these only in the server/deployment secret store. For Google AI Studio/Gemini-backed development, `GEMINI_API_KEY` is the canonical Gemini credential. For other hosting targets, configure the same names in that platform's server-side secret system.

### Core AI & TTS Providers (Server Only)

| Secret Name | Description | Required For |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | Primary story generation when Anthropic is enabled |
| `GEMINI_API_KEY` | Google Gemini API key | Gemini story/image generation |
| `OPENAI_API_KEY` | OpenAI API key | OpenAI fallback, voice chat, image/video functionality |
| `OPENROUTER_API_KEY` *(Optional)* | OpenRouter API key | xAI, Mistral, Cohere, Meta Llama fallbacks |
| `ELEVENLABS_API_KEY` *(Optional)* | ElevenLabs API key | Narration TTS |
| `ANTHROPIC_BASE_URL` *(Optional)* | Custom Anthropic-compatible gateway | Gateway deployments only |
| `OPENROUTER_BASE_URL` *(Optional)* | Custom OpenRouter-compatible gateway | Gateway deployments only |

`AI_INTEGRATIONS_*` variables are retired and must not be used as fallbacks.

### Backend Database & Storage (Server Only)

| Secret Name | Description | Required For |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key | Server-authoritative auth & account management |
| `SUPABASE_URL` | Server-side Supabase project URL | Supabase server client |
| `DATABASE_URL` | PostgreSQL connection string | Voice chat & server-side data persistence |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | KV/R2 integrations |
| `CLOUDFLARE_R2_BUCKET` | Cloudflare R2 bucket name | Binary TTS caching |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Cloudflare R2 access key ID | R2 authentication |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret access key | R2 authentication |
| `CLOUDFLARE_KV_NAMESPACE_ID` | Cloudflare KV namespace ID | Persistent rate limiting/idempotency |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | KV authentication |
| `SENTRY_DSN` | Server Sentry DSN | Server error reporting |

### Optional Server Config

| Variable Name | Default | Description |
|-------------|---------|-------------|
| `PORT` | `5000` | Server port |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window in ms |
| `RATE_LIMIT_MAX` | `10` | Max requests per window |
| `TTS_CACHE_MAX_AGE_MS` | `86400000` | TTS cache TTL |
| `TTS_CACHE_MAX_SIZE_BYTES` | `524288000` | TTS cache max size |
| `VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS` | deployment policy | Retained voice-chat transcript window |

### Feature Flags

| Variable Name | Default | Description |
|-------------|---------|-------------|
| `FEATURE_VIDEO_ENABLED` | `false` | Enable video generation |
| `FEATURE_VOICE_CHAT_ENABLED` | feature-config dependent | Enable voice chat routes |
| `FEATURE_REALTIME_MEDIA_ENABLED` | feature-config dependent | Enable realtime media routes |
| `FEATURE_STREAMING_ENABLED` | feature-config dependent | Enable SSE story streaming |

---

## Verification

Before a mobile release:

```bash
eas secret:list
bash scripts/build-android.sh preview
```

Before a server release:

```bash
npm run preflight
npm run typecheck
npm test
npm run server:build
```

Check server logs for `[Env] WARNING` messages, then exercise `/api/health` and a representative provider-backed request.

---

## Play Store Submission

Once the production AAB is built and validated:

```bash
bash scripts/build-android.sh submit
```

Submit to the intended test track first and promote only after release checks pass.

See `docs/operations/DEPLOYMENT.md` for the full runbook.
