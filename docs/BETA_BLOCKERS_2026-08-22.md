# Beta Blockers — 2026-08-22

## Current Candidate

- Repository: `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`
- Canonical branch: `main`
- Observed head: `c63aa3ac608e6a73a1c32874d86c99ae38931566`
- Observed commit message: `chore: bump Expo SDK 55 packages to pass compatibility check CI (#442)`

## Release Decision

**BLOCKED**

The current `main` head cannot be declared beta-ready from available GitHub evidence.

## Blocking Evidence

### B-01 — Current head has failing Vercel status

GitHub combined status for `c63aa3ac608e6a73a1c32874d86c99ae38931566` reports:

```text
context: Vercel
state: failure
```

This is a release blocker until the failure is diagnosed and either:

1. fixed and re-verified on the exact candidate revision, or
2. demonstrated to be a non-release deployment target with documented evidence and an independently passing production deployment proof.

### B-02 — Exact-head automated proof is incomplete

The repository contains extensive CI/release workflows, including `ci.yml`, `exact-head-pr-proof.yml`, `eas-build.yml`, `deployment-drift.yml`, and `prod-story-e2e-once.yml`.

However, the GitHub connector returned no PR-triggered workflow runs for the observed `main` head. That means the exact current head does not yet have sufficient workflow evidence available through this verification path.

Historical passing tests on earlier revisions are useful context, not acceptance evidence for the current revision.

### B-03 — Physical Android critical journeys remain unverified here

The current repository documentation explicitly requires Android/EAS beta validation. No evidence has yet been collected in this readiness pass for a physical-device or production-equivalent build covering:

- consent -> onboarding -> primary story journey
- all three story modes
- narration
- offline queue/reconnect
- cloud sync isolation
- accessibility critical path
- rollback rehearsal

These remain `BLOCKED`, not `PASS`.

## Non-Blocking Documentation Drift Fixed On Readiness Branch

The previous beta guide incorrectly stated:

- no account system exists and all data is device-only
- rate limiting always resets on server restart

Those statements conflict with the current Supabase auth/cloud-sync architecture and optional KV-backed persistence. They are corrected on `beta/readiness-2026-08-22`.

## Evidence Already Present In Repository

The project is substantially ahead of a typical beta candidate. The canonical architecture documents the following existing controls:

- COPPA first-launch parental consent
- Supabase auth
- cloud synchronization
- offline interaction queue
- multi-provider AI routing with fallback
- circuit breakers and retry
- Zod validation
- child-safety rules and shared unsafe-term detection
- structured logging
- metrics and health checks
- Sentry integration
- rate limiting
- load shedding
- idempotency
- runbooks for rollback/incidents/provider outages/deployment provenance
- EAS Android build workflow
- release proof and milestone verification scripts

These reduce implementation risk, but their existence does not substitute for exact-revision execution evidence.

## Required Closure Sequence

1. Diagnose the Vercel failure for `c63aa3a…`.
2. Resolve or formally disposition it with evidence.
3. Trigger/re-run required CI on the exact candidate revision.
4. Record exact SHA and workflow run identifiers.
5. Build Android beta artifact from that SHA.
6. Execute the critical-journey device matrix.
7. Verify staging rollback.
8. Record all results in an acceptance manifest.
9. Promote only if every mandatory gate is `PASS` and open P0/P1 count is zero.

## Acceptance Rule

```text
IF any mandatory gate ∈ {FAIL, BLOCKED, NOT_RUN}
THEN beta_status = BLOCKED
ELSE beta_status = PASS
```

No weighted score may override this reducer.
