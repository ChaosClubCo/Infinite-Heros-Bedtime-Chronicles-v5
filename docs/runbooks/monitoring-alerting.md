# Runbook: Monitoring & Alerting

<!-- Last verified: 2026-06-18 -->

This runbook covers how to investigate and respond to alerts from the two observability systems provisioned for Infinity Heroes: Bedtime Chronicles — **Sentry** (client error tracking) and **Cloudflare KV** (rate-limit state monitoring).

---

## 1. Sentry Error Tracking

### Architecture

- **Server:** No Sentry integration yet. Server errors are captured via pino structured logging and the Express global error handler. See server logs in your deployment dashboard.
- **Client:** `@sentry/react-native` initialized in `app/_layout.tsx`. Captures JS errors and React component crashes.
- **No-op behavior:** the client SDK gracefully no-ops when `EXPO_PUBLIC_SENTRY_DSN` is unset.

### Configuration

| Env Var | Where Set | Notes |
|---------|-----------|-------|
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

Check server startup logs — a log line confirms KV mode vs. in-memory fallback:

```
# KV active:
{"level":"info","msg":"rate limiter: cloudflare KV mode"}

# Fallback (env vars missing):
{"level":"info","msg":"rate limiter: in-memory mode"}
```

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
  "ai": { "available": true, "providers": ["anthropic", "gemini", "openai"] },
  "tts": { "available": true },
  "features": { "voiceChatEnabled": false },
  "activeRequests": 2
}
```

Monitor this endpoint from an external uptime tool (e.g., UptimeRobot, BetterUptime) with a 1-minute check interval. Alert when `status !== "ok"` or when response time exceeds 5 seconds.

---

## 4. Alerting Thresholds

| Metric | Warning | Critical | Response |
|--------|---------|----------|----------|
| `/api/health` response time | > 3s | > 10s | Check AI provider latency; restart if needed |
| Sentry error rate | > 10/min | > 50/min | Investigate top error; may need rollback |
| `/api/generate-story` 5xx rate | > 5% | > 20% | Check AI chain; follow provider-outage runbook |
| TTS failures | > 10% | > 50% | ElevenLabs outage; stories still work without audio |
| Rate limit hits | Sudden spike | — | May indicate abuse; check request patterns |

---

## 5. Escalation Path

1. **On-call developer** — First responder for all Sentry alerts and health check failures
2. **Deploy rollback** — If a new deployment caused the spike, follow [rollback runbook](./rollback.md)
3. **Provider outage** — If AI chain is exhausted, follow [provider-outage runbook](./provider-outage.md)
4. **Incident declaration** — If the app is fully down for > 15 minutes, follow [incident-response runbook](./incident-response.md)
