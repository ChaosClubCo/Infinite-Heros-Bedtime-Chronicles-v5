# Beta Readiness — 2026-08-22

## Executive Summary

Infinity Heroes: Bedtime Chronicles v5 already contains much of the infrastructure normally added during a beta-hardening phase: typed API validation, Supabase auth, COPPA consent flow, cloud sync, offline queueing, structured logging, health checks, provider fallback, Sentry integration, rate limiting, idempotency, runbooks, EAS profiles, and release verification scripts.

The remaining work is therefore not a generic rewrite. It is a proof-and-gating exercise: verify the exact `main` revision, close documentation drift, validate production secrets and deployment provenance, run the real automated suites, execute device-level acceptance checks, and refuse beta promotion if any release-blocking condition fails.

The [public-v1 release freeze](./RELEASE_FREEZE_2026-08-24.md) is active. Feature work remains frozen until an exact-SHA public release receipt passes every gate.

## Canonical Beta Scope

The beta covers:

- Android via Expo/EAS and Google Play internal testing
- Supabase-backed authentication and cloud sync where configured
- First-launch COPPA parental-consent gate
- Hero creation and avatar generation
- Classic, Mad Libs, and Sleep story creation paths
- AI story generation with provider fallback
- Illustration generation
- Narration playback
- Offline interaction queue and reconnect sync
- Library, saved stories, profiles, settings, trophies, and streaks
- Health, observability, alerting, and rollback operations

The following are not required for beta acceptance unless explicitly enabled in the release configuration:

- Voice Chat route, which currently has no in-app entry point
- Sora video generation
- Optional R2 audio persistence
- Optional cross-invocation Cloudflare KV persistence

## Release-Blocking Gates

### G1 — Repository / Revision Binding

- [ ] Candidate commit SHA recorded
- [ ] All verification receipts identify the same SHA
- [ ] Build artifact identifies the same source revision
- [ ] No verification result from a different revision is accepted

The checked-in `docs/evidence/beta-acceptance-manifest.json` is policy only; it never claims that a candidate passed. Generate the candidate manifest at verification time:

```bash
npm run generate:beta-readiness
npm run verify:beta-readiness
```

Gate receipts belong in `.release-evidence/receipts/BR-XX.json` and must contain `gateId`, the full `candidateSha`, `status`, `executedAt`, and a `source` object with `provider` and immutable `uri`. The generator hashes each receipt into the manifest. Verification independently requires the candidate SHA to equal the checked-out `HEAD`, rejects receipt tampering and expiry, and fails unless every mandatory gate passes with a receipt plus a SHA-bound defect receipt proves P0/P1 counts. `--allow-blocked` validates manifest structure only and must not be used as a promotion decision.

### G2 — Static / Automated Verification

Run from a clean checkout using the Node/npm versions declared in `package.json`:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:components
npm run expo:check
npm run preflight
npm run verify:milestones
npm run verify:release-proof
npm run verify:mirror
```

Acceptance:

- [ ] TypeScript exits 0
- [ ] ESLint exits 0
- [ ] Vitest exits 0
- [ ] Jest component suite exits 0
- [ ] Expo dependency check exits 0
- [ ] Preflight exits 0
- [ ] Release proof exits 0
- [ ] No release-blocking audit finding remains open

### G3 — Security / Privacy

- [ ] `SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_URL` is configured on the server
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is configured only server-side
- [ ] Mobile bundle contains only public Supabase values
- [ ] AI provider keys remain server-side
- [ ] ElevenLabs key remains server-side
- [ ] Production CORS origin set is explicit
- [ ] No credential appears in git history or build logs
- [ ] COPPA consent gate executes before onboarding on first launch
- [ ] Privacy Policy is reachable offline from consent/settings
- [ ] Parent-control PIN lockout behavior is manually verified
- [ ] Cross-user or cross-profile cloud-sync isolation is verified

### G4 — Critical User Journeys

On a physical Android device or production-equivalent EAS build:

1. Fresh install -> consent -> onboarding -> quick-create -> tabs
2. Create custom hero -> save -> relaunch -> hero remains available
3. Generate Classic story -> choose branches -> finish -> completion saved
4. Generate Mad Libs story -> finish successfully
5. Generate Sleep story -> narration -> timer behavior
6. Network loss during interaction -> queue locally -> reconnect -> sync drains once
7. Sign in -> cloud sync -> second device/account state verification where available
8. Sign out -> auth-gated cloud behavior stops
9. Delete story/profile -> confirmation -> persistence/sync behavior correct
10. Reduce Motion enabled -> major decorative motion suppressed
11. Screen-reader flow for consent, story controls, and completion state

Acceptance:

- [ ] No P0/P1 defect
- [ ] No unsafe story content reaches rendering
- [ ] No data loss
- [ ] No duplicate interaction created during retry/reconnect
- [ ] App can recover from provider failure using configured fallback or an explicit user-visible error

### G5 — Backend Health / Resilience

- [ ] `/api/health` returns expected readiness data
- [ ] AI provider health status reflects real availability
- [ ] Story generation respects timeout/retry/circuit-breaker behavior
- [ ] Load shedding rejects excess traffic cleanly
- [ ] Rate limiting returns controlled responses
- [ ] Idempotency prevents duplicate mutation side effects
- [ ] Graceful shutdown completes without abandoned writes
- [ ] 5xx and TTS alert thresholds are wired to Sentry when DSN configured

### G6 — Deployment / Rollback

- [ ] Staging deployment uses the candidate SHA
- [ ] Production server deployment uses immutable artifact or exact revision
- [ ] EAS Android build profile validated
- [ ] Google Play internal track receives the intended AAB/APK
- [ ] Rollback runbook rehearsed against staging
- [ ] Previous known-good server artifact is identifiable
- [ ] Previous known-good Android release/version code is identifiable

## Severity Policy

### P0 — Beta Blocker

- Child-safety failure
- Cross-account data exposure
- Authentication bypass
- Data corruption or destructive sync bug
- App cannot complete primary story flow for most testers

### P1 — Beta Blocker

- Reproducible crash in a critical journey
- Consent gate bypass or persistence failure
- Story generation consistently fails without fallback
- Narration critical-path failure with no recovery
- Rollback cannot be executed

### P2 — May Ship Only With Explicit Known-Issue Entry

- Non-critical UX defect
- Optional provider failure with working fallback
- Slow non-critical screen
- Cosmetic accessibility issue that does not block task completion

### P3

- Cosmetic polish defects
- Copy inconsistencies
- Non-blocking animation/layout imperfections

## Observability Requirements

For every beta incident, capture:

- timestamp
- app version/build number
- server revision
- environment
- route or feature
- anonymous/user identifier where policy permits
- provider selected and fallback chain result where relevant
- request correlation identifier
- error classification

Do not log story/profile fields unnecessarily. Child-facing content and profile data should be minimized in diagnostics.

## Beta Feedback Contract

Every tester report should capture:

- Android model and OS version
- app build/version
- network state
- steps to reproduce
- expected result
- actual result
- screenshot/video when safe
- whether child-safety content was involved

Security/privacy/unsafe-content reports bypass normal product triage and receive immediate review.

## Beta Promotion Decision

Beta promotion is allowed only when:

```text
STATIC_AUTOMATION = PASS
SECURITY_PRIVACY = PASS
CRITICAL_JOURNEYS = PASS
DEPLOYMENT_PROVENANCE = PASS
ROLLBACK = PASS
P0_OPEN = 0
P1_OPEN = 0
```

Any `BLOCKED` gate means the release is not verified. “Not tested” is not equivalent to PASS, because apparently humans needed that written down.
