# Observability Setup Guide

<!-- Last verified: 2026-06-18 -->

This guide covers the setup and configuration of the two observability systems used by Infinity Heroes: Bedtime Chronicles.

---

## Overview

| System | Purpose | SDK | No-op When |
|--------|---------|-----|-----------|
| **Sentry** | Error tracking (server + client) | `@sentry/node`, `@sentry/react-native` | `SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN` unset |
| **Cloudflare KV** | Persistent rate-limit state | REST API via `server/rate-limit.ts` | `CLOUDFLARE_*` env vars unset |

Both systems are **opt-in** — the app runs fully without them, falling back to in-memory rate limiting and no error reporting.

---

## 1. Sentry Setup

### Create a Sentry Project

1. Log in to [sentry.io](https://sentry.io)
2. Create two projects: one for **Node.js** (server), one for **React Native** (client)
3. Copy the DSN for each project

### Server Configuration

Set the `SENTRY_DSN` environment variable in your deployment environment:

**Replit:**
```bash
# In Replit Secrets panel
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project-id>
```

**Vercel:**
```bash
vercel env add SENTRY_DSN production
```

The server SDK is initialized in `server/index.ts`:
```typescript
// Sentry init happens before all middleware — do not move it
import * as Sentry from "@sentry/node";
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });
}
```

### Client Configuration

Set the `EXPO_PUBLIC_SENTRY_DSN` EAS secret:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN \
  --value "https://<key>@<org>.ingest.sentry.io/<project-id>"
```

The client SDK is initialized in `app/_layout.tsx`. Because it uses the `EXPO_PUBLIC_` prefix, it is bundled into the APK — use the client-project DSN (not the server-project DSN).

### Verifying Sentry is Working

**Server:** After deploying with `SENTRY_DSN` set, trigger a test error:
```bash
curl -X POST https://your-api/api/generate-story \
  -H "Content-Type: application/json" \
  -d '{"invalid": true}'
```
Check the Sentry dashboard for the captured event.

**Client:** In development, the Sentry SDK logs its initialization. In production, any unhandled JS error will appear in the React Native project's Sentry dashboard.

### Alert Rules (Recommended)

In your Sentry project settings → Alerts, create:

1. **High error rate:** trigger when error count > 50 in 5 minutes → notify on-call via email/Slack
2. **New issue:** trigger on every new issue type → notify on-call
3. **Regression:** trigger when a resolved issue re-appears → notify assignee

---

## 2. Cloudflare KV Persistent Rate Limiting

### Why KV?

The default in-memory rate limiter resets on every server restart and is not shared between instances. Cloudflare KV provides a globally distributed key-value store that persists rate-limit state across restarts and (future) multiple instances.

### Create a KV Namespace

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages → KV**
3. Create a namespace named `infinity-heroes-rate-limit`
4. Note the namespace ID (e.g., `ed09afa77f9243bbb08f3dbe34df1e70`)

### Create an API Token

1. Navigate to **My Profile → API Tokens**
2. Create a token with **KV Storage: Edit** permission for your account
3. Restrict it to the specific namespace for least-privilege

### Configure Environment Variables

```bash
# Replit Secrets panel or .env
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_KV_NAMESPACE_ID=ed09afa77f9243bbb08f3dbe34df1e70
CLOUDFLARE_API_TOKEN=<your-token>
```

**EAS secret (for Expo builds — not needed, rate limiting is server-only):**
KV env vars are server-side only and do not need EAS secrets.

### Verifying KV is Active

Check server startup logs:
```
{"level":"info","msg":"rate limiter: cloudflare KV mode"}
```

If you see `in-memory mode`, one or more env vars are missing.

### KV Key Schema

Each key is a Firebase UID (when auth is enabled) or client IP address. Values are JSON:

```json
{
  "count": 7,
  "resetAt": 1718755200000
}
```

Keys auto-expire after `RATE_LIMIT_WINDOW_MS` (default: 60 seconds) via KV TTL.

### Fallback Behavior

If the Cloudflare API is unreachable (network error, rate limited itself), `checkRateLimitAsync()` falls back to the in-memory Map for that request. This means the persistent state and in-memory state can briefly diverge, but the system remains operational and does not throw.

---

## 3. Server Health Dashboard

The `/api/health` endpoint provides a quick operational snapshot:

```
GET /api/health
```

```json
{
  "status": "ok",
  "ai": {
    "available": true,
    "providers": ["anthropic", "gemini", "openai", "openrouter-llama", "openrouter-xai", "openrouter-mistral", "openrouter-cohere"]
  },
  "tts": { "available": true },
  "features": { "voiceChatEnabled": false },
  "activeRequests": 3,
  "uptime": 14523.4
}
```

Set up an external uptime monitor (UptimeRobot, BetterUptime, etc.) to poll `/api/health` every 60 seconds. Alert when:
- `status !== "ok"`
- Response time > 5 seconds
- HTTP status code is not 200

---

## 4. Metrics Endpoint

`GET /api/metrics` returns in-process counters:

```json
{
  "requests": { "total": 1204, "errors": 12 },
  "providers": {
    "anthropic": { "success": 850, "failure": 3 },
    "gemini": { "success": 320, "failure": 1 }
  }
}
```

Use these to spot trends: if a provider's failure count is climbing, investigate before its circuit breaker opens.

---

## 5. Structured Logging (pino)

All server logs are emitted as JSON via pino. In production, pipe to a log aggregator (e.g., Datadog, Logtail, Papertrail):

```bash
# Replit: logs are available in the Replit console and can be exported
# Vercel: logs available in the Vercel dashboard under Functions → Logs
```

Key log fields:

| Field | Description |
|-------|-------------|
| `level` | `info`, `warn`, `error` |
| `msg` | Human-readable message |
| `method` | HTTP method |
| `path` | Request path |
| `status` | HTTP response status |
| `duration` | Response time in ms |
| `provider` | AI provider used (on generation requests) |
| `model` | Concrete model ID used |

**PII policy:** request bodies, hero names, child names, and story content are never logged. The rate-limit key (UID or IP) is passed to the rate limiter internally but is not emitted as a structured log field.

---

## 6. References

- [Monitoring & Alerting Runbook](../runbooks/monitoring-alerting.md) — incident response for alerts
- [Provider Outage Runbook](../runbooks/provider-outage.md) — AI provider failure procedures
- [Deploy Runbook](../runbooks/deploy.md) — deployment procedures
