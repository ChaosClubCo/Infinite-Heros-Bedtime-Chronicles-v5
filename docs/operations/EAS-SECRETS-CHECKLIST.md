# EAS Secrets Checklist

All environment variables that must be set as EAS secrets before a production build will work.

Run each command from the project root after `eas login`:

```bash
eas secret:create --scope project --name <NAME> --value <VALUE>
```

---

## Required — Core App Functionality

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Google Gemini API key | Story generation (primary text), image generation |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic Claude API key | Story generation (primary) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key | Story generation (fallback), image generation (fallback) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | TTS narration (9 voices) |
| `EXPO_PUBLIC_API_URL` | Full URL to your Express API server (e.g. `https://your-app.replit.app`) | All API calls from the app |

## Required — Authentication

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only) | Server-side auth in production; omit → dev mode (no auth), 503 in production |
| `SUPABASE_URL` | Server-side Supabase project URL | Server-side auth (falls back to `EXPO_PUBLIC_SUPABASE_URL`) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Client Supabase Auth |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (bundled — not a secret) | Client Supabase Auth |

## Required — Voice Chat

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Voice chat conversations + messages |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL (Replit connector endpoint) | Voice chat audio processing (Whisper) |

> **Supabase DATABASE_URL format:**
> `postgresql://postgres.aeraxfupuvwiskmfjliq:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
>
> Get the DB password from: Supabase Dashboard → Project Settings → Database → Database password

## Optional — AI Fallback Chain

| Secret Name | Description |
|-------------|-------------|
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` | OpenRouter key for xAI, Mistral, Cohere, Meta Llama fallbacks |
| `OPENAI_API_KEY` | Direct OpenAI key for video generation via Sora 2 |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Custom Gemini base URL (proxy / regional override) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Custom OpenAI base URL |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Custom Anthropic base URL |

## Optional — Observability

| Secret Name | Description |
|-------------|-------------|
| `SENTRY_DSN` | Sentry DSN for server-side error tracking |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side error tracking |

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

See `docs/operations/PLAY_STORE_DEPLOYMENT.md` for the full runbook.
