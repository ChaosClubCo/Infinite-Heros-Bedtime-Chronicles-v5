# Security, Quality and Operations Assessment

**Baseline:** `0e31e776b4c4817e3d67b174fd9177791a2c5238`  
**Assessment date:** 2026-07-15  
**Release posture:** **Blocked pending critical remediation and operational proof**

## Purpose

Assess security, privacy/COPPA posture, performance, reliability, code quality, testing, CI/CD, observability, incident readiness, and production operations.

## Scope

Repository code/configuration and GitHub metadata were inspected. No legal opinion, provider contract review, cloud-console audit, penetration test, dependency audit execution, or physical-device test was performed.

## Current State

The project has substantial security engineering: production auth fails closed, conversation ownership checks exist, Zod and prompt sanitization are used, story output is moderated before delivery, HMAC webhook verification exists, security headers/body limits are set, rate limiting/idempotency/load shedding exist, and Pino/Sentry/health probes are wired.

The remaining release blockers are product-boundary failures: false privacy/consent claims, unsafe audio-conversation policy divergence, incomplete remote deletion/account lifecycle, and unproven production enforcement.

# Security and Privacy Review

## Implemented Controls

| Control | Evidence | Assessment |
|---|---|---|
| Supabase bearer verification | `server/auth.ts` | Production fails closed; transient auth errors return 503 |
| Ownership checks | chat/audio storage and routes | Prevents cross-user conversation access in inspected paths |
| Input validation | `server/validation.ts` | Zod length/type/allowlist controls |
| Prompt-injection reduction | `sanitizePromptInput` | Defangs common role/control delimiters |
| Story output moderation | `server/safety/`, story routes | Moderate → stricter regenerate → safe fallback |
| Client story fail-safe | `StoryTextDisplay` + shared safety terms | Defense in depth before render |
| Security headers/CORS/body limits | `server/index.ts` | Positive baseline; environment behavior needs tests |
| HMAC webhook auth | `server/routes/github-webhook.ts` | Correct separate trust boundary |
| Rate limiting | `server/rate-limit.ts` | Persistent option exists; not atomic/fail-safe |
| Idempotency | `server/idempotency.ts`, KV | Reduces duplicate expensive generation |
| Load shedding | `server/load-shedding.ts` | Limits active request pressure |
| Cost signals | `server/ai/cost.ts` | Per-generation estimates/anomaly reporting |
| Structured logging/Sentry | logger/index/alerting | Implemented; production ownership/filters unverified |
| RLS migration for sync | `0001_sync_tables.sql` | Owner-only policy design and auth cascade |

## Critical Findings

### SEC-01 — Consent and privacy notices contradict runtime behavior

**Verified conflict:** the app tells parents “no accounts,” “no server-side user data retained,” and that Voice Chat data is not stored. Current code includes Supabase accounts, optional cloud backup, and PostgreSQL user/assistant transcripts.

**Impact:** misleading direct notice, invalid consent basis, app-store/legal exposure, and inability to accurately answer a parental data request.

**Resolution:** decide the actual data model, implement it, obtain privacy/legal approval, update both in-app and web notices, bump `CONSENT_VERSION`, and re-consent existing installations.

### SEC-02 — Audio Voice Chat lacks the safer text-chat policy

Text chat prepends a child-safe system prompt, sanitizes content, and caps history at 20. Audio Voice Chat:

- parses large base64 JSON;
- transcribes child audio;
- persists the transcript;
- replays stored history without a mandatory system prompt or history cap;
- streams `gpt-audio` output;
- persists assistant transcript.

**Impact:** unsafe or instruction-injected child-facing output plus unbounded contextual persistence.

**Resolution:** keep audio Voice Chat disabled; route text and audio through one policy service; add mandatory system safety, capped history, transcript sanitization, output moderation, adversarial evaluations, and an explicit retention/deletion design.

### SEC-03 — Complete parental deletion/account lifecycle is missing

The current delete flow is improved: it purges optional cloud-sync records, clears local data, and signs out. It does not delete:

- PostgreSQL conversations/messages;
- the Supabase Auth identity;
- provider-held data (subject to provider policy);
- Sentry/provider telemetry according to a documented process.

**Resolution:** re-authenticated account deletion endpoint, delete-all-chat transaction, auth admin deletion, idempotent orchestration, deletion receipt/audit, failure recovery, and end-to-end tests.

### SEC-04 — Provider/legal readiness for child data is unverified

Child name/age, story text, images, narration text, audio, and transcripts can reach multiple providers. Repository code cannot establish provider DPAs, zero-retention/training settings, Families policy compliance, or verifiable parental consent.

**Resolution:** remove child PI from provider payloads for first release or complete counsel/provider review and record evidence.

## High Findings

### SEC-05 — Distributed rate limiting is non-atomic and fail-open

KV behavior is GET → increment → fire-and-forget PUT. Concurrent requests can overwrite counts. A failed read returns `null`, which is treated as a new window.

**Fix:** atomic Redis Lua/transaction, Cloudflare Durable Object, or rate-limit service; local fallback; per-account/day AI budget; alert on backend failure.

### SEC-06 — Audio body memory exposure

The audio route accepts a 50 MB JSON body before enforcing an estimated 25 MB decoded limit. Base64 and JSON parsing increase memory amplification.

**Fix:** multipart/binary streaming, low edge limit, `Content-Length` rejection, request timeout, and concurrency limits.

### SEC-07 — PostgreSQL TLS identity verification weakness

The inspected DB configuration uses `rejectUnauthorized: false` when `sslmode=require`. No rebaseline commit changed `server/db.ts`.

**Fix:** provider CA verification or a provider-supported verified connection string.

### SEC-08 — Public operational diagnostics

`/api/metrics` and `/api/ai-providers` are public. `/api/health` exposes breakers/features and always reports `status: ok`/200 even when dependencies are unavailable.

**Fix:** public liveness with minimal output; authenticated/internal readiness and metrics; 503 on not-ready; no secret/config inference.

### SEC-09 — Chat schema constraints/indexes and retention

No DB-level role enum/check, message/title limits, user FK, transcript TTL, or verified indexes for primary chat query paths were found.

### SEC-10 — Account UX/security lifecycle unverified

Email verification, password-reset UX, brute-force controls, MFA decision, re-authentication for destructive actions, and compromised-account recovery require validation.

## Medium Findings

- Development anonymous auth can hide missing auth in local/integration scenarios.
- Console logging remains in audio/chat/DB integration paths.
- CSP allows `unpkg.com`; mutable third-party script dependency should be eliminated or pinned.
- Feature flags are environment/static; no audited rollout/kill-switch control plane.
- Metrics, circuit breakers, and alert cooldown are per process.
- Dependency/SBOM/license/secret-history scans were not independently executed.
- Local AsyncStorage contains child profile and story content without app-layer encryption.

## OWASP Top 10

| Area | Status | Reason |
|---|---|---|
| A01 Broken Access Control | Conditional | Ownership and RLS design are positive; live RLS and account deletion unverified |
| A02 Cryptographic Failures | Blocked | DB TLS verification and local sensitive-data posture need hardening |
| A03 Injection | Conditional | Strong validation/sanitization; audio transcript/output path lags |
| A04 Insecure Design | Blocked | Consent/deletion/audio lifecycle is not safe enough for child release |
| A05 Security Misconfiguration | Blocked | Public diagnostics, multi-target drift, unknown secrets/config |
| A06 Vulnerable Components | Unable to Verify | No current lockfile audit executed in this session |
| A07 Auth Failures | Conditional | Server token verification good; lifecycle/recovery controls unverified |
| A08 Integrity Failures | Conditional | Lockfile/workflows exist; provenance/enforced checks unproven |
| A09 Logging/Monitoring | Conditional | Pino/Sentry/alerts exist; durability, redaction, destinations unverified |
| A10 SSRF | Conditional | Provider base URLs are configurable; egress allowlist not verified |

## Privacy and COPPA

### Current Data-Minimization Posture

- Profiles remain local.
- Cloud backup excludes profile name/age/avatar and is parent opt-in.
- Story/suggestion requests can still transmit child name/age.
- TTS can transmit a child name embedded in story text.
- Audio Voice Chat sends child speech and stores transcripts.

### Consent

The arithmetic parent gate is a useful barrier, not by itself proof of legally sufficient verifiable parental consent for third-party child PI processing. Parent-facing disclosures are currently inaccurate, so the gate cannot be considered release-ready.

### Recommended First-Release Privacy Model

- Parent account optional and truthfully disclosed.
- Child name/age never sent to providers.
- Audio Voice Chat disabled.
- Cloud backup off by default, explicit parent opt-in, no profile PI.
- Complete account/export/deletion flow.
- Sentry PII scrubbing and minimal sampling.
- Provider terms/retention settings recorded in a compliance evidence file.

# Performance and Reliability

## Positive Controls

- Provider fallback, retry, circuit breakers.
- Per-call token ceilings and non-streaming timeout.
- Story idempotency with KV option.
- Story output fallback instead of unsafe/raw failure.
- Load shedding.
- Server and on-device narration cache.
- Static web export and bundled server.
- Background-cached provider/TTS live probes.
- Graceful shutdown for long-running server.

## Performance Risks

| Area | Finding | Priority |
|---|---|---|
| Provider chain | Multiple providers/retry can produce long tail and cost multiplication | High |
| Vercel | 60-second serverless function ceiling | High |
| Audio | Large base64 JSON allocation and transcoding | High |
| Video | Long-running request/job/cache architecture | High |
| Server cache | TTS/video instance-local and ephemeral | Medium |
| Database | Chat indexes/constraints not verified | Medium |
| Client | Stories/images in AsyncStorage can exceed practical limits | High |
| Sync | State sync + event queue overlap on favorites/completions | Medium |
| Metrics | Percentile computation and counters are local/process-lifetime | Low at beta scale |

## Scalability

Safe target is a small controlled beta with feature flags and hard AI budgets. Horizontal scale is limited by non-atomic rate limiting, process-local circuit/metrics/alert state, local media cache, and potentially multiplied DB pools.

## Reliability Gaps

- Health has richer live data but still no strict readiness status/503.
- Alerting uses process-lifetime counters rather than rolling windows.
- No verified external uptime monitor/on-call destination.
- No verified backup restore or disaster-recovery drill.
- No verified production rollback/canary.
- Cloud sync is not yet device-E2E validated.
- Cloud Run code fix is merged, but deployed revision evidence is missing.

# Code Quality and Testing

## Strengths

- Strict TypeScript/no-emit-on-error.
- Domain route modules and provider abstractions.
- Zod schemas and shared contracts.
- Extensive unit/branch/integration tests.
- Safety, health, KV, sync, narration, and route tests added in recent commits.
- ADRs, conventions, runbooks, and AI-agent guidance.

## Maintainability Risks

- Separate text and audio chat route implementations with policy drift.
- Scaffolded Replit integration code uses `any`/console logging.
- Static feature flags and environment-specific behavior.
- Documentation changes lag implementation.
- Historical prompts/assets/archive content increase repository noise.
- `package.json` repository URL points to a different owner path than the active repository.
- Package version remains `1.0.0` despite substantial unreleased change volume.

## Testing Evidence

A merged Cloud Run fix reported typecheck, lint, and 1,102 passing Vitest tests. Later commits add more tests for safety, sync, health, alerts, narration, and KV. This is meaningful code-review evidence, but current-main GitHub Actions execution was not returned by the connector.

### Missing Release Evidence

1. Current-main CI run with install, lock drift, lint, typecheck, tests, audit, server build, and web export.
2. Real-device Android/iOS onboarding, consent, story, narration, deletion, auth, and sync tests.
3. Audio Voice Chat adversarial safety tests.
4. Cross-account RLS/isolation tests against the deployed Supabase project.
5. Deployed Cloud Run/Vercel smoke and rollback tests.
6. App-store internal-track install/upgrade/uninstall tests.
7. Load/cost/chaos tests around provider failure and rate limiting.
8. Accessibility audit with screen reader, font scaling, reduced motion, and child-size targets.

# CI/CD and Deployment

## CI Definition

The repository defines a CI workflow for lockfile verification, install, preflight, lint, tests, critical dependency audit, typecheck, production-install smoke, and server build. Branch-protection documentation claims required checks.

## CI Execution Finding

For assessed `main`, the connector returned no combined status checks and no workflow runs. Possible explanations include workflow permissions/triggers, connector limitations, disabled Actions, skipped jobs, or commits not receiving checks. Therefore:

- **CI definition:** Verified.
- **CI execution on current main:** Unable to Verify.
- **Branch protection requiring checks:** Requires Manual Validation.

## Deployment

Cloud Run boot/build code is corrected: production `start`, `Procfile`, server build, and web export are present. This closes the code defect, not the operational validation. Vercel and EAS remain configured, but a canonical primary target and production evidence packet are missing.

Required evidence per target:

- exact commit/release ID;
- immutable environment manifest without secret values;
- successful build and boot;
- `/api/health` and functional generation smoke;
- auth/consent/deletion checks;
- alert receipt;
- rollback test;
- domain/TLS/CORS/deep-link validation.

# Observability and Operations

## Implemented

- Pino request/error logs and request IDs.
- Client/server Sentry initialization.
- In-process request/AI/TTS metrics.
- Live provider/TTS probes cached in background.
- Breaker and feature state in health response.
- Sentry messages for 5xx and TTS rate thresholds.
- Cost anomaly reporting.
- Runbooks for deployment, rollback, incident response, provider outage, monitoring.

## Gaps

- Detailed endpoints are public.
- Metrics and alert cooldown are per process.
- Alert rates are cumulative since process start, not rolling windows.
- Sentry DSNs, alert rules, notification destinations, PII filters, release tagging, and ownership are unverified.
- No traces or end-to-end generation spans were verified.
- No SLO dashboard or error budget.
- No synthetic story generation check.
- No backup/restore or deletion audit telemetry.

## Recommended SLOs

| SLI | Initial beta target |
|---|---|
| API liveness | 99.9% monthly |
| Story generation success | ≥99% excluding client-invalid requests |
| Story safety fallback rate | Alert on sudden increase; define baseline during beta |
| p95 story completion | Set from beta data; separate by mode/provider |
| Auth verification availability | ≥99.95% |
| TTS success | ≥98% when enabled |
| Deletion completion | 100% within documented SLA |
| Cross-account data leakage | 0 tolerated |

## Incident Readiness

Before public release, assign incident commander/on-call ownership, severity matrix, provider escalation contacts, privacy incident workflow, child-safety escalation, status communication channel, and evidence-preserving postmortem process. Run at least one provider-outage drill and one data-deletion failure drill.

## Findings

Engineering controls have improved substantially, but operational assurance and product-level privacy/audio safety remain behind implementation.

## Recommendations

1. Disable audio Voice Chat and Video for first release.
2. Repair consent/privacy/account/deletion before any public child use.
3. Replace the rate limiter with an atomic implementation and hard cost budgets.
4. Split liveness/readiness/internal metrics.
5. Enforce current-main CI/branch checks.
6. Produce device, deployment, alert, backup, and rollback evidence.
7. Consolidate chat policy and add adversarial evaluations.

## Next Actions

Use [RISK_AND_RELEASE_PLAN.md](./RISK_AND_RELEASE_PLAN.md) as the execution queue.

## Claims Check

This assessment does not claim legal compliance, production availability, provider contractual suitability, or test pass status beyond the repository evidence explicitly described.

## Version History

| Version | Date | Change |
|---|---|---|
| 1.1 | 2026-07-15 | Re-baselined security, quality, CI, and operations to `0e31e776`. |
| 1.0 | 2026-07-11 | Superseded initial review. |
