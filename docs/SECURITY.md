<!-- Last verified: 2026-08-14 -->
# Security Policy

## Supported versions

This repository is maintained on a single active branch.

| Version / branch | Supported |
|------------------|-----------|
| `main` | ✅ Yes |
| historical commits / stale branches | ❌ No |

## Reporting a vulnerability

Do **not** open a public issue for a security report.

Preferred paths:

1. Open a GitHub **private security advisory** for this repository.
2. If private advisory access is unavailable, contact the repository maintainers through the repository owner contact path and include `SECURITY:` in the subject or message.

Include:
- affected endpoint, workflow, script, or file
- reproduction steps or proof of concept
- expected impact and severity estimate
- whether child-facing content, auth, or secrets are involved

## Security response SLA

| Stage | Target |
|------|--------|
| Initial acknowledgment | within 72 hours |
| Triage / severity assessment | within 5 business days |
| Critical / high remediation plan | within 14 days |
| Medium remediation plan | within 30 days |
| Low severity fix | next scheduled release or maintenance window |

## Scope

### In scope

- `/api/*` application routes and middleware
- auth and authorization enforcement
- prompt-injection or moderation bypasses that could surface unsafe child-facing content
- secrets exposure, webhook verification failures, or CI/CD release gate bypasses
- dependency vulnerabilities with a realistic exploitation path in production
- cloud-sync isolation and Supabase RLS failures

### Out of scope

- issues in third-party providers themselves (report those to the provider)
- social engineering or self-XSS with no privilege escalation or data exposure
- theoretical-only issues with no practical reproduction path
- local developer machine compromise unrelated to this repository

## Security architecture summary

- **Secrets:** server-side environment variables only; `EXPO_PUBLIC_*` variables are never secret.
- **Auth:** Supabase bearer tokens are verified server-side in `server/auth.ts`.
- **Fail-closed production behavior:** auth-gated routes return `503` in production if required Supabase server configuration is missing.
- **Child safety:** every story prompt includes `CHILD_SAFETY_RULES`, and generated story output is moderated before it reaches the client.
- **Rate limiting:** per-UID or per-IP sliding-window limiter, with optional Cloudflare KV persistence.
- **Media safety:** TTS filenames are validated against `/^[a-f0-9]+\.mp3$/`; video IDs are validated before lookup.

## Known security considerations

| Area | Consideration |
|------|---------------|
| Child-directed content | Generated stories must remain appropriate for ages 3–9; unsafe outputs fall back to a known-safe story |
| Voice chat | Feature is conditional and must satisfy explicit compliance gates before it registers in production |
| Cloud sync | Sync stores non-PII progress data only; profile stubs do not include name or age |
| Deployment provenance | Release workflows enforce controlled deployment and verification paths |
| Client data | Local device storage contains stories, settings, and badges; parent PIN data is hashed and salted |

## Dependency management

- `npm audit --omit=dev` is available through `npm run audit`.
- Dependabot configuration lives in `.github/dependabot.yml`.
- Verification scripts and CI workflows act as release gates for dependency, provenance, and build checks.
- High or critical findings should be fixed or explicitly triaged before release approval.
- Do **not** use `npm audit fix --force` without human review when it would introduce breaking dependency jumps.

## Secrets management policy

- Keep secrets in deployment platform secret stores, not in source control.
- `.env.example` contains placeholders and examples only.
- `SUPABASE_SERVICE_ROLE_KEY`, AI provider keys, Sentry DSNs, Cloudflare credentials, and webhook secrets must never appear in committed code.
- `EXPO_PUBLIC_*` values are bundled into the client app; treat them as public configuration.
- Rotate secrets after any suspected exposure and document operational changes in `docs/operations/SECRETS-ROTATION.md`.

## Security controls in the codebase

| Control | Location | Purpose |
|--------|----------|---------|
| Input sanitization | `server/validation.ts` | truncates and normalizes user-controlled strings |
| Auth gate | `server/auth.ts`, `server/routes.ts` | verifies bearer tokens and protects sensitive routes |
| Rate limiting | `server/rate-limit.ts` | throttles abusive or accidental burst traffic |
| Idempotency | `server/idempotency.ts` | deduplicates expensive POST requests |
| Load shedding | `server/load-shedding.ts` | rejects excess concurrent work |
| Output moderation | `server/safety/` | blocks unsafe child-facing story text |
| TTS path validation | `server/routes/tts.ts` | prevents path traversal and arbitrary file reads |
| Webhook signature verification | `server/routes/github-webhook.ts` | validates GitHub webhook authenticity |

## Security review expectations for contributors

- Update [docs/ARCHITECTURE.md](./ARCHITECTURE.md) and this file when security boundaries change.
- Add tests for route-level validation, auth, or safety logic when behavior changes.
- Run secret scanning before commit and never paste live credentials into docs, fixtures, or screenshots.
- Escalate auth, database schema, and child-safety changes for human review.
