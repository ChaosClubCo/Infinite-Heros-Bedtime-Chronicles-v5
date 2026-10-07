# Secrets Rotation Policy

<!-- Last verified: 2026-10-07 -->

This document defines how API keys and secrets are rotated for Infinity Heroes: Bedtime Chronicles.

---

## Rotation Schedule

| Secret | Rotation Interval | Trigger |
|--------|------------------|---------|
| AI provider API keys (Anthropic, Gemini, OpenAI, OpenRouter) | Every 90 days or on suspected compromise | Scheduled + incident |
| ElevenLabs API key | Every 90 days or on suspected compromise | Scheduled + incident |
| Supabase Service Role Key | Every 180 days or on suspected compromise | Scheduled + incident |
| Cloudflare API Token | Every 90 days or on suspected compromise | Scheduled + incident |
| EXPO_PUBLIC_SENTRY_DSN | On team member departure or suspected compromise | Incident only |
| Parent PIN (user-set) | User-controlled (hashed on device, never on server) | N/A |

---

## Rotation Procedure

### 1. Generate the New Secret

Generate the new key/token in the provider's dashboard **before** deactivating the old one. Most providers allow multiple active keys for zero-downtime rotation.

### 2. Update All Environments

Update every environment that actually runs the server or creates a client build:

| Environment | How to Update |
|------------|--------------|
| **Google AI Studio / server hosting** | Update the server-side secret in the active deployment environment. `GEMINI_API_KEY` is the canonical Gemini credential. |
| **Cloudflare / other backend target** | Update the corresponding server secret in the target's secret/environment configuration and redeploy. |
| **EAS (mobile builds)** | Update only the required client-visible `EXPO_PUBLIC_*` values; do not copy server provider keys into EAS client variables. |

Do not keep a retired platform's secret store as a hidden fallback. A rotation is complete only when the active deployment uses the new secret and the previous key is revoked.

### 3. Verify the New Secret Works

Before deactivating the old key, hit `/api/health` and confirm AI/TTS availability:

```bash
curl https://your-api/api/health
```

Then run a representative story/image/TTS request for the provider being rotated.

### 4. Deactivate the Old Secret

Revoke or delete the old key in the provider's dashboard. This ensures leaked keys cannot be used even if discovered.

### 5. Document the Rotation

Add a line to `docs/CHANGELOG.md` under `[Unreleased]` without recording the key value:

```markdown
### Security
- Rotated <provider> API key (scheduled 90-day rotation)
```

---

## Secret Inventory

| Secret Name | Provider | Where Used | Client-visible? |
|------------|---------|-----------|-----------------|
| `ANTHROPIC_API_KEY` | Anthropic | Server — primary story generation | No |
| `ANTHROPIC_BASE_URL` | Optional gateway | Server — custom Anthropic-compatible gateway only | No |
| `GEMINI_API_KEY` | Google | Server — Gemini story/image generation | No |
| `OPENAI_API_KEY` | OpenAI | Server — fallback text/image, voice chat, video | No |
| `OPENROUTER_API_KEY` | OpenRouter | Server — xAI/Mistral/Cohere/Llama fallbacks | No |
| `OPENROUTER_BASE_URL` | Optional gateway | Server — custom OpenRouter-compatible gateway only | No |
| `ELEVENLABS_API_KEY` | ElevenLabs | Server — TTS narration | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server — auth token verification/admin operations | No |
| `DATABASE_URL` | PostgreSQL/Supabase | Server — voice chat persistence | No |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | Server/infrastructure — KV/R2 | No |
| `CLOUDFLARE_KV_NAMESPACE_ID` | Cloudflare | Server/infrastructure — KV | No |
| `CLOUDFLARE_API_TOKEN` | Cloudflare | Server/infrastructure — KV | No |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Cloudflare | Server/infrastructure — R2 | No |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Cloudflare | Server/infrastructure — R2 | No |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase | Client — auth/cloud sync URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Client — auth/cloud sync public anon key | Yes |
| `EXPO_PUBLIC_API_URL` | Application | Client — API base URL | Yes |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry | Client — error reporting DSN | Yes |

> **Rule:** Any value with the `EXPO_PUBLIC_` prefix is bundled into the client app and is not secret. Never put provider API keys, database credentials, service-role keys, or infrastructure tokens under that prefix.

The retired `AI_INTEGRATIONS_*` names are not supported runtime credentials and must not be restored during rotation.

---

## Suspected Compromise Response

If a key is suspected to be leaked:

1. **Immediately revoke** the compromised key in the provider's dashboard.
2. **Generate a replacement** and update all active deployment environments.
3. **Audit usage logs** in the provider's dashboard for unauthorized requests during the exposure window.
4. **Search repository history and CI logs** for accidental disclosure.
5. **Document** the incident without recording the secret itself.
6. **Review** how the key leaked and remediate the root cause.

To scan for accidentally committed secrets:
```bash
git log --all --oneline | head -20
gitleaks detect --source .
```

---

## References

- [EAS Secrets Checklist](./EAS-SECRETS-CHECKLIST.md) — client/server environment boundary
- [Security Policy](../SECURITY.md) — overall security posture
- [Incident Response Runbook](../runbooks/incident-response.md) — escalation for security incidents
