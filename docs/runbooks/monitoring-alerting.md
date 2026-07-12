# Runbook: Monitoring & Alerting

<!-- Last verified: 2026-07-12 -->

This runbook covers how to investigate and respond to alerts from the observability systems provisioned for Infinity Heroes: Bedtime Chronicles — **Sentry** (server + client error tracking, plus threshold-based alerting), and **Cloudflare KV** (rate-limit state monitoring).

---

## 1. Sentry Error Tracking

### Architecture

- **Server:** `@sentry/node` is initialized in `server/index.ts` (`initSentry()`) when `SENTRY_DSN` is set. It captures 5xx errors from the global error handler, `unhandledRejection`/`uncaughtException` process events, per-generation cost anomalies (`server/ai/cost.ts`), and the threshold-based alerts described in §4 (`server/alerting.ts`).
- **Client:** `@sentry/react-native` initialized in `app/_layout.tsx`. Captures JS errors and React component crashes.
- **No-op behavior:** both SDKs gracefully no-op when their DSN env var is unset — `Sentry.captureException`/`captureMessage` are safe to call unconditionally.

### Configuration

| Env Var | Where Set | Notes |
|---------|-----------|-------|
| `SENTRY_DSN` | Server env (Vercel/Replit secret) | Server-only — never bundle into the client |
| `EXPO_PUBLIC_SENTRY_DSN` | EAS secret | Bundled into APK — not a secret, but should match project DSN |

### Responding to a Sentry Alert

1. **Open the Sentry issue** — note the error message, stack trace, and affected release.
2. **Check frequency** — is this a spike (new regression) or a steady baseline (pre-existing)?
3. **Identify the route** — stack trace will point to `server/routes/<domain>.ts` or a client screen.
4. **Check AI provider status** — many errors originate from provider timeouts. See [provider-outage runbook](./provider-outage.md).
5. **Check server logs** — pino structured logs give the full request context (method, path, duration, uid).
6. **Fix → deploy** — follow [deploy runbook](./deploy.md).

### Common Server Error Patterns

| Error Pattern | Likely Cause | Resolution |
|---------------|-------------|------------|
| `AI provider chain exhausted` | All providers in fallback chain failed | Check provider status pages; circuit breakers will reset after 60s |
| `Rate limit exceeded` | Client hitting endpoints too fast | Expected behavior; no action needed unless legitimate user |
| `ElevenLabs TTS failed` | ElevenLabs API down or rate limited | Stories still work without audio; wait for recovery |
| `Zod validation failed` | Client sending malformed request | Check client app version; may need force-update |
| `Database connection error` | Supabase unavailable | Voice chat only; core features unaffected |

### Common Client Error Patterns

| Error Pattern | Likely Cause | Resolution |
|---------------|-------------|------------|
| `AsyncStorage read failed` | Device storage full or corrupted | User needs to clear app data |
| `Network request failed` | Device offline or server down | Check server health; offline banner should appear |
| `Component render error` | Uncaught exception in React tree | ErrorBoundary should catch; investigate stack trace |

---

## 2. Cloudflare KV Rate Limit Monitoring

### Architecture

`server/rate-limit.ts` uses `checkRateLimitAsync()` which writes to Cloudflare KV namespace `infinity-heroes-rate-limit` (id: `ed09afa77f9243bbb08f3dbe34df1e70`) when the three required env vars are set. This persists rate-limit state across server restarts and instances.

| Env Var | Value |
|---------|-------|
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `CLOUDFLARE_KV_NAMESPACE_ID` | `ed09afa77f9243bbb08f3dbe34df1e70` |
| `CLOUDFLARE_API_TOKEN` | KV write-permission token |

### Verifying KV is Active

There is no dedicated "KV mode" startup log line. Instead, `validateEnvironment()` in `server/index.ts` logs a warning only when the three `CLOUDFLARE_*` vars are *partially* set (likely misconfiguration); when all three are absent it silently falls back to in-memory state (expected for local/Replit dev), and when all three are present KV is used with no explicit log. To confirm KV is actually active, check the namespace via the Cloudflare API (below) after issuing a few requests, or read the `KV_ENABLED` check in `server/kv.ts`.

### Viewing Rate Limit State

Via Cloudflare dashboard:
1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages → KV**
3. Select namespace `infinity-heroes-rate-limit`
4. Browse keys — each key is a Firebase UID or IP address

Via Cloudflare API:
```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/storage/kv/namespaces/$CLOUDFLARE_KV_NAMESPACE_ID/keys" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

### Clearing a Specific Rate Limit Key

If a legitimate user is erroneously blocked:

```bash
# Delete the rate limit entry for a specific UID or IP
curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/storage/kv/namespaces/$CLOUDFLARE_KV_NAMESPACE_ID/values/<uid-or-ip>" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

### Clearing All Rate Limit State

Only in an emergency (e.g., KV contains corrupted entries):

```bash
# List all keys, then delete each — or delete the namespace and recreate
# Prefer targeted deletion of specific keys to avoid disrupting all rate limiting
```

---

## 3. Health Check Endpoint

`GET /api/health` returns the server's live status:

```json
{
  "status": "ok",
  "timestamp": 1752000000000,
  "aiProvidersAvailable": true,
  "ttsAvailable": true,
  "ttsLive": { "reachable": true, "checkedAt": 1752000000000, "latencyMs": 120 },
  "aiProvidersLive": { "reachable": true, "checkedAt": 1752000000000, "latencyMs": 80 },
  "breakers": [{ "provider": "anthropic", "state": "closed" }, { "provider": "gemini", "state": "open" }],
  "features": { "voiceChatEnabled": false },
  "activeRequests": 2
}
```

`ttsLive`/`aiProvidersLive` come from a background-refreshed, ~45s-TTL cache (`server/health-checks.ts`) — a genuine reachability probe (ElevenLabs `GET /v1/user`, Anthropic `GET /v1/models`), never a synchronous call on the request path, so the endpoint never blocks waiting on an outbound network call. `reachable: null` means "not probed yet" (expected right after a cold start) — don't treat it as unhealthy. `breakers` exposes each AI provider's circuit-breaker state (`closed`/`open`/`half-open`) from `server/ai/router.ts`.

Monitor this endpoint from an external uptime tool (e.g., UptimeRobot, BetterUptime) with a 1-minute check interval. Alert when `status !== "ok"`, when `ttsLive.reachable === false` or `aiProvidersLive.reachable === false` for more than one consecutive check, when any `breakers` entry reports `"open"`, or when response time exceeds 5 seconds.

---

## 4. Alerting Thresholds

`server/alerting.ts` automates the two request-rate thresholds below: `checkAlertThresholds()` reads `server/metrics.ts` counters and fires `Sentry.captureMessage()` (level `warning` or `error`) plus a `logger.warn`, rate-limited by a cooldown (`ALERT_COOLDOWN_MS`, default 15 min) so a sustained outage doesn't spam. It's invoked periodically from the request-finish hook in `server/index.ts` (every ~20th request), so no separate process/cron is needed on either Replit or Vercel. Thresholds are env-tunable (`ALERT_5XX_RATE_WARN_PCT`/`_CRIT_PCT`, `ALERT_TTS_FAILURE_WARN_PCT`/`_CRIT_PCT`); it skips evaluation until a minimum sample size is reached (≥20 requests / ≥10 TTS calls) to avoid noise from tiny denominators.

**Known limitation:** `server/metrics.ts` counters are lifetime-cumulative for the process (only test code calls `resetMetrics()`), not a rolling window, and reset to zero on every Vercel cold start — so the computed rate is "since this process/invocation started," not "in the last N minutes." A true sliding-window metric store would be a larger follow-up.

| Metric | Warning | Critical | Automated? | Response |
|--------|---------|----------|------------|----------|
| `/api/health` response time | > 3s | > 10s | No — external uptime tool | Check AI provider latency; restart if needed |
| Sentry error rate | > 10/min | > 50/min | No — configure in Sentry's own alert rules | Investigate top error; may need rollback |
| `/api/generate-story` 5xx rate | > 5% | > 20% | Yes — `server/alerting.ts` | Check AI chain; follow provider-outage runbook |
| TTS failures | > 10% | > 50% | Yes — `server/alerting.ts` | ElevenLabs outage; stories still work without audio |
| Rate limit hits | Sudden spike | — | No | May indicate abuse; check request patterns |

---

## 5. Escalation Path

1. **On-call developer** — First responder for all Sentry alerts and health check failures
2. **Deploy rollback** — If a new deployment caused the spike, follow [rollback runbook](./rollback.md)
3. **Provider outage** — If AI chain is exhausted, follow [provider-outage runbook](./provider-outage.md)
4. **Incident declaration** — If the app is fully down for > 15 minutes, follow [incident-response runbook](./incident-response.md)
