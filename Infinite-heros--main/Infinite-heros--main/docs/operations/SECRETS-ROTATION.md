# Secrets Rotation Policy

<!-- Last verified: 2026-06-18 -->

This document defines how API keys and secrets are rotated for Infinity Heroes: Bedtime Chronicles.

---

## Rotation Schedule

| Secret | Rotation Interval | Trigger |
|--------|------------------|---------|
| AI provider API keys (Anthropic, Gemini, OpenAI, OpenRouter) | Every 90 days or on suspected compromise | Scheduled + incident |
| ElevenLabs API key | Every 90 days or on suspected compromise | Scheduled + incident |
| Firebase Service Account Key | Every 180 days or on suspected compromise | Scheduled + incident |
| Cloudflare API Token | Every 90 days or on suspected compromise | Scheduled + incident |
| EXPO_PUBLIC_SENTRY_DSN | On team member departure or suspected compromise | Incident only |
| Parent PIN (user-set) | User-controlled (hashed on device, never on server) | N/A |

---

## Rotation Procedure

### 1. Generate the New Secret

Generate the new key/token in the provider's dashboard **before** deactivating the old one. Most providers allow multiple active keys for zero-downtime rotation.

### 2. Update All Environments

Secrets are deployed in three places — update all of them:

| Environment | How to Update |
|------------|--------------|
| **Replit** | Secrets panel → update the value |
| **Vercel** | `vercel env add <NAME> production` (then redeploy) |
| **EAS (mobile builds)** | `eas secret:create --scope project --name <NAME> --value <NEW>` |

### 3. Verify the New Secret Works

Before deactivating the old key, hit `/api/health` and confirm AI/TTS availability:

```bash
curl https://your-api/api/health
# Expect: { "status": "ok", "ai": { "available": true }, "tts": { "available": true } }
```

Run a quick story generation request to confirm end-to-end functionality.

### 4. Deactivate the Old Secret

Revoke or delete the old key in the provider's dashboard. This ensures leaked keys cannot be used even if discovered.

### 5. Document the Rotation

Add a line to `docs/CHANGELOG.md` under `[Unreleased]`:

```markdown
### Security
- Rotated <provider> API key (scheduled 90-day rotation)
```

---

## Secret Inventory

All secrets required to run the full stack:

| Secret Name | Provider | Where Used | EAS Secret? |
|------------|---------|-----------|-------------|
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic | Server — story generation | No (server-only) |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Google | Server — story generation + images | No (server-only) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI | Server — story generation + voice chat | No (server-only) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI / Replit | Server — voice chat | No (server-only) |
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` | OpenRouter | Server — story generation fallback | No (server-only) |
| `OPENAI_API_KEY` | OpenAI | Server — video generation (Sora) | No (server-only) |
| `ELEVENLABS_API_KEY` | ElevenLabs | Server — TTS narration | No (server-only) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase | Server — auth token verification | No (server-only) |
| `DATABASE_URL` | Supabase | Server — voice chat persistence | No (server-only) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | Server — KV rate limiting | No (server-only) |
| `CLOUDFLARE_KV_NAMESPACE_ID` | Cloudflare | Server — KV rate limiting | No (server-only) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare | Server — KV rate limiting | No (server-only) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase | Client — anonymous auth | **Yes** |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase | Client — anonymous auth | **Yes** |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase | Client — anonymous auth | **Yes** |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase | Client — anonymous auth | **Yes** |
| `EXPO_PUBLIC_API_URL` | — | Client — API base URL | **Yes** |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry | Client — error tracking | **Yes** |

> **Rule:** Any secret with the `EXPO_PUBLIC_` prefix is bundled into the APK and visible to users who decompile the app. Never put server-side API keys with this prefix. Firebase client config is intentionally public; it is not a security risk when Firebase Security Rules and App Check are configured correctly.

---

## Suspected Compromise Response

If a key is suspected to be leaked:

1. **Immediately revoke** the compromised key in the provider's dashboard — do not wait for rotation schedule.
2. **Generate a replacement** and update all environments per the rotation procedure above.
3. **Audit usage logs** in the provider's dashboard for unauthorized requests during the exposure window.
4. **Document** in the incident log (`docs/CHANGELOG.md`) with the exposure window and what was accessed.
5. **Review** how the key leaked (committed to git, exposed in logs, etc.) and remediate the root cause.

To scan for accidentally committed secrets:
```bash
git log --all --oneline | head -20  # Review recent commits
git secrets --scan                  # If git-secrets is installed
# Or use: gitleaks detect --source .
```

---

## References

- [EAS Secrets Checklist](./EAS-SECRETS-CHECKLIST.md) — full list of EAS secrets needed for mobile builds
- [Security Best Practices](../best-practices/SECURITY.md) — overall security posture
- [Incident Response Runbook](../runbooks/incident-response.md) — escalation for security incidents
