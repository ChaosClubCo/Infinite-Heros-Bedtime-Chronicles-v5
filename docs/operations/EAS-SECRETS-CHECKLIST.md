# EAS & Deployment Secrets Checklist

This document details the configuration for **EAS Mobile Client Build Secrets** (`EXPO_PUBLIC_*`) and **Server Environment Variables** (Vercel / Backend hosting).

> [!SECURITY]
> **Client Security Rule**: Never embed server-only API keys (`AI_INTEGRATIONS_*`, `ELEVENLABS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) into the client APK/AAB bundle. The mobile client communicates solely via the Express API server and Supabase client SDK using `EXPO_PUBLIC_*` configuration.

---

## 1. EAS Mobile Client Build Secrets (`EXPO_PUBLIC_*`)

Set these in EAS before triggering mobile builds (`eas secret:create --scope project --name <NAME> --value <VALUE>` or in `eas.json`):

| Variable Name | Description | Required For |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Full URL to the production Express server (e.g. `https://www.bedtime-chronicles.com`) | All mobile client API requests |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://aeraxfupuvwiskmfjliq.supabase.co`) | Client Supabase Auth & Cloud Sync |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous client key | Client Supabase Auth & Cloud Sync |
| `EXPO_PUBLIC_ENV` | Environment identifier (`production`, `preview`, `development`) | Environment detection & logging |
| `EXPO_PUBLIC_SENTRY_DSN` *(Optional)* | Client Sentry DSN for React Native crash tracking | Mobile crash monitoring |

---

## 2. Server Environment Variables (Vercel / Hosting Target)

Set these securely in your server hosting environment (e.g., Vercel Project Settings > Environment Variables):

### Core AI & TTS Providers (Server Only)

| Secret Name | Description | Required For |
|---|---|---|
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic Claude API key | Primary story generation |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Google Gemini API key | Primary fallback story generation & illustration |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key | Fallback story generation & image generation |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | Narration TTS (multilingual v2) |
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` *(Optional)* | OpenRouter API key | xAI, Mistral, Cohere, Meta Llama fallbacks |

### Backend Database & Storage (Server Only)

| Secret Name | Description | Required For |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key | Server-authoritative auth & account management |
| `DATABASE_URL` | PostgreSQL connection string | Voice chat & server-side data persistence |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Cloudflare R2 binary TTS cache & KV rate limiting |
| `CLOUDFLARE_R2_BUCKET` | Cloudflare R2 bucket name | Binary TTS MP3 caching |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Cloudflare R2 Access Key ID | S3-compatible R2 authentication |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Access Key | S3-compatible R2 authentication |
| `CLOUDFLARE_KV_REST_API_URL` | Cloudflare KV REST URL | Persistent rate limiting & deduplication |
| `CLOUDFLARE_KV_REST_API_TOKEN` | Cloudflare KV REST Token | KV authentication |
| `SENTRY_DSN` | Server Sentry DSN | Node.js error reporting & alerting thresholds |

## Optional — Persistent Rate Limiting

| Secret Name | Description |
|-------------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_KV_NAMESPACE_ID` | KV namespace ID: `ed09afa77f9243bbb08f3dbe34df1e70` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with KV write permission |

## Optional — Server Config

| Secret Name | Default | Description |
|-------------|---------|-------------|
| `PORT` | `5000` | Server port |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in ms |
| `RATE_LIMIT_MAX` | `10` | Max requests per window |
| `TTS_CACHE_MAX_AGE_MS` | `86400000` | TTS cache TTL (24h) |
| `TTS_CACHE_MAX_SIZE_BYTES` | `524288000` | TTS cache max size (500MB) |

## Feature Flags

| Secret Name | Default | Description |
|-------------|---------|-------------|
| `FEATURE_VIDEO_ENABLED` | `false` | Enable Sora 2 video generation |
| `FEATURE_VOICE_CHAT_ENABLED` | `true` | Enable voice chat routes |
| `FEATURE_STREAMING_ENABLED` | `true` | Enable SSE story streaming |

---

## Verification

After setting all secrets, verify with:

```bash
eas secret:list
```

Then trigger a preview build to confirm the app starts without missing-env warnings:

```bash
bash scripts/build-android.sh preview
```

Check the build logs for `[Env] WARNING` lines — these indicate missing providers.

---

## Play Store Submission

Once the production AAB is built:

```bash
bash scripts/build-android.sh submit
```

This submits to the `internal` track in draft status. Promote to production in the Play Console after internal testing.

See `docs/operations/DEPLOYMENT.md` for the full runbook.
