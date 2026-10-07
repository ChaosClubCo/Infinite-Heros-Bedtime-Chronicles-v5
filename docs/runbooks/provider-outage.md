# Provider Outage Runbook

<!-- Last verified: 2026-10-07 -->

## Detection

**Health check:** `GET /api/health` returns provider availability and feature state.

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
| **P1 — Critical** | All text providers down | Story generation completely unavailable |
| **P1 — Critical** | Both image providers down (Gemini + OpenAI) | Avatar and scene generation unavailable |
| **P2 — Degraded** | One or more text providers down, fallback working | Increased latency, circuit breaker handling it |
| **P3 — Minor** | TTS down | Stories still work, narration unavailable |
| **P3 — Minor** | Single non-primary provider down | Minimal impact, fallback chain skips it |

---

## Immediate Response (Automatic)

The system handles most single-provider outages automatically:

1. **Circuit breaker** opens after repeated failures per provider.
2. Open circuit **skips** the failed provider temporarily.
3. **Fallback chain** routes to the next available provider.
4. A later probe/request tests recovery.
5. Successful recovery closes the circuit.

**No manual action is normally needed** unless multiple providers fail simultaneously or a credential/configuration issue is suspected.

---

## Manual Intervention

### Disable a specific provider

Remove or empty the canonical provider env var and restart/redeploy the server:

```bash
# Anthropic
unset ANTHROPIC_API_KEY
unset ANTHROPIC_BASE_URL       # only if a custom gateway was configured

# Gemini
unset GEMINI_API_KEY

# OpenAI
unset OPENAI_API_KEY

# OpenRouter (disables xAI, Mistral, Cohere, Meta-Llama)
unset OPENROUTER_API_KEY
unset OPENROUTER_BASE_URL      # only if a custom gateway was configured

# ElevenLabs TTS
unset ELEVENLABS_API_KEY
```

Do not restore retired `AI_INTEGRATIONS_*` variables as an outage workaround. They are no longer part of the runtime contract.

### Check configured providers

```bash
curl -s http://localhost:5000/api/health | jq .
curl -s http://localhost:5000/api/ai-providers | jq .
```

### Disable features under load

```bash
export FEATURE_VIDEO_ENABLED=false
export FEATURE_VOICE_CHAT_ENABLED=false
export FEATURE_REALTIME_MEDIA_ENABLED=false
```

---

## Recovery Verification

1. **Health check:** confirm the relevant provider/feature is available.
2. **Provider list:** `curl /api/ai-providers` and verify the recovered provider reports `available: true`.
3. **Representative request:** run a story/image/TTS/voice request for the affected path.
4. **Check logs:** verify successful calls on the recovered provider.
5. **Circuit state:** confirm normal traffic resumes without repeated fallback/open-circuit events.

---

## Escalation

| Condition | Action |
|-----------|--------|
| Single provider down < 30min | Monitor; circuit breaker/fallback handles it |
| Single provider down > 30min | Check provider status page and credential validity |
| Multiple text providers down | **P1** — inspect common network/configuration dependencies and provider status |
| All text providers down | **P1** — disable affected generation flows or use approved static fallback content |
| TTS down > 1hr | Check ElevenLabs status; stories remain functional without narration |

---

## Post-Incident

1. Record incident date, duration, affected providers, and user impact.
2. Review circuit-breaker thresholds and fallback ordering.
3. Check whether the outage exposed monitoring or alerting gaps.
4. Verify no secret values appeared in logs or incident notes.
5. Update this runbook when the response procedure changes.
