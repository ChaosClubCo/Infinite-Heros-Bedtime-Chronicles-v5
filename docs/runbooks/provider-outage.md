# Provider Outage Runbook

## Detection

**Health check:** `GET /api/health` returns `{ aiProvidersAvailable, ttsAvailable, features }`

**Log signals (grep pino JSON logs):**
```bash
# Circuit breaker opening
grep "circuit open" logs.json

# Provider failures
grep "failed for story" logs.json
grep "timed out after" logs.json

# All providers exhausted
grep "All providers failed" logs.json
```

**Provider status pages:**
| Provider | Status Page |
|----------|------------|
| Anthropic | https://status.anthropic.com |
| Google Cloud / Gemini | https://status.cloud.google.com |
| OpenAI | https://status.openai.com |
| ElevenLabs | https://status.elevenlabs.io |
| OpenRouter | https://status.openrouter.ai |

---

## Severity Assessment

| Severity | Condition | Impact |
|----------|-----------|--------|
| **P1 — Critical** | All text providers down (`aiProvidersAvailable: false`) | Story generation completely unavailable |
| **P1 — Critical** | Both image providers down (Gemini + OpenAI) | Avatar and scene generation unavailable |
| **P2 — Degraded** | One or more text providers down, fallback working | Increased latency, circuit breaker handling it |
| **P3 — Minor** | TTS down (`ttsAvailable: false`) | Stories still work, narration unavailable |
| **P3 — Minor** | Single non-primary provider down | Minimal impact, fallback chain skips it |

---

## Immediate Response (Automatic)

The system handles most single-provider outages automatically:

1. **Circuit breaker** opens after 5 consecutive failures per provider (configurable via code)
2. Open circuit **skips** the failed provider for 60 seconds
3. **Fallback chain** routes to the next available provider
4. After 60s, circuit goes **half-open** and allows one test request
5. If test succeeds, circuit **closes** (recovered); if fails, re-opens

**No manual action needed** unless multiple providers fail simultaneously.

---

## Manual Intervention

### Disable a specific provider

Remove or empty the provider's env vars and restart the server:

```bash
# Anthropic
unset AI_INTEGRATIONS_ANTHROPIC_API_KEY
unset AI_INTEGRATIONS_ANTHROPIC_BASE_URL

# Gemini
unset AI_INTEGRATIONS_GEMINI_API_KEY
unset AI_INTEGRATIONS_GEMINI_BASE_URL

# OpenAI (integrations)
unset AI_INTEGRATIONS_OPENAI_API_KEY
unset AI_INTEGRATIONS_OPENAI_BASE_URL

# OpenRouter (disables xAI, Mistral, Cohere, Meta-Llama)
unset AI_INTEGRATIONS_OPENROUTER_API_KEY
unset AI_INTEGRATIONS_OPENROUTER_BASE_URL

# ElevenLabs TTS
unset ELEVENLABS_API_KEY

# Direct OpenAI (video/Sora + fallback text)
unset OPENAI_API_KEY
```

### Check configured providers

```bash
curl -s http://localhost:5000/api/health | jq .
curl -s http://localhost:5000/api/ai-providers | jq .
```

### Disable features under load

```bash
# Disable video generation
export FEATURE_VIDEO_ENABLED=false

# Disable voice chat
export FEATURE_VOICE_CHAT_ENABLED=false
```

---

## Recovery Verification

1. **Health check:** `curl /api/health` — confirm `aiProvidersAvailable: true`
2. **Provider list:** `curl /api/ai-providers` — verify the recovered provider shows `available: true`
3. **Test generation:** Send a test story request and verify the response includes the recovered provider
4. **Check logs:** Look for successful calls on the recovered provider:
   ```bash
   grep '"provider":"gemini"' logs.json | grep '"msg":"story generated"' | tail -5
   ```
5. **Circuit state:** After a successful call, the circuit breaker auto-closes — no manual reset needed

---

## Escalation

| Condition | Action |
|-----------|--------|
| Single provider down < 30min | Monitor, circuit breaker handles it |
| Single provider down > 30min | Check provider status page, consider removing env var |
| Multiple text providers down | **P1** — check all status pages, prepare to communicate downtime |
| All text providers down | **P1** — immediate response needed, consider static fallback stories |
| TTS down > 1hr | Check ElevenLabs status, stories still functional without narration |

---

## Post-Incident

1. Record incident in project log: date, duration, affected providers, user impact
2. Review circuit breaker thresholds — were they appropriate?
3. Review fallback chain ordering — should a more reliable provider be promoted?
4. Check if the outage exposed gaps in monitoring or alerting
5. Update this runbook if the response process could be improved
