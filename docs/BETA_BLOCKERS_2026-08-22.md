# Beta Blockers — 2026-08-22

## Current Candidate

- Repository: `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`
- Canonical branch: `main`
- Observed base head: `c63aa3ac608e6a73a1c32874d86c99ae38931566`
- Readiness branch: `beta/readiness-2026-08-22`
- Pull request: `#443`

## Release Decision

**BLOCKED**

The candidate is not beta-ready yet. The blocker set is now evidence-backed rather than inferred.

## Blocking Evidence

### B-01 — `package.json` and `package-lock.json` are out of sync

This is the primary automated-test blocker.

GitHub Actions run `32608207889`, job `97116690473` (`Lint and Test`) fails at `npm ci` before lint, tests, audit, or typecheck execute.

The runner reports the Expo SDK 55 patch versions in `package.json` do not match the lockfile, including:

- `expo` 55.0.29 vs lock 55.0.28
- `expo-router` 55.0.18 vs lock 55.0.17
- `expo-asset` 55.0.19 vs lock 55.0.18
- `expo-audio` 55.0.17 vs lock 55.0.16
- `expo-location` 55.1.13 vs lock 55.1.12
- `jest-expo` 55.0.21 vs lock 55.0.20
- associated Expo/Metro transitive packages

The same root cause blocks `Exact Head CI` and `Exact Head Security Agent` in run `32608207900`.

CI successfully generated a synchronized lockfile diagnostic artifact (`synchronized-package-lock`, artifact `9484740989`) using:

```bash
npm install --package-lock-only --ignore-scripts
```

A branch-scoped repair workflow now exists at `.github/workflows/beta-lockfile-repair.yml`. It regenerates the lockfile, verifies `npm ci --ignore-scripts`, ensures only `package-lock.json` changed, and commits the repaired lockfile back to the readiness branch. Until a resulting lockfile commit is observed and CI passes on that exact head, B-01 remains open.

### B-02 — Exact-head CI is blocked by B-01

GitHub Actions run `32608207900`, job `97116690534` (`Exact Head CI`) checks out the exact PR head successfully, then fails at `Install locked dependencies`.

The following steps therefore remain not executed on that revision:

- preflight
- ESLint with zero warnings
- complete Vitest suite
- jest-expo component suite
- typecheck
- server build
- Expo compatibility check
- Expo web export
- high/critical dependency audit

This gate cannot pass until B-01 is closed and the workflow succeeds on the resulting exact SHA.

### B-03 — Exact-head security agent is blocked by B-01

GitHub Actions run `32608207900`, job `97116690476` (`Exact Head Security Agent`) also fails at locked dependency installation before the security agent runs.

This is not currently evidence of a security finding. It is a dependency-install blocker that prevents the security verification from executing.

### B-04 — Production deployment status is failing

GitHub combined status reports Vercel failure for both:

- base `main` SHA `c63aa3ac608e6a73a1c32874d86c99ae38931566`
- readiness SHA `cec16c5d13db05b71e53bd7471c7ff943103de68`

The repository already contains a production-domain routing runbook describing a known Cloudflare/Vercel 403/1014 class of environmental failure, but the current status has not yet been proven to be that same failure. It must be diagnosed from current deployment evidence rather than assumed.

### B-05 — Physical Android critical journeys remain unverified

No evidence has yet been collected in this readiness pass for a physical-device or production-equivalent Android build covering:

- first launch -> parent gate -> COPPA consent -> onboarding
- hero creation
- Classic story generation
- Mad Libs story generation
- Sleep mode story generation
- narration playback
- story completion and persistence
- offline queue and reconnect drain
- signed-in cloud sync and account isolation
- reduced-motion/text-size/screen-reader critical path
- background/foreground recovery
- provider degradation behavior

These gates remain `NOT_RUN`, not `PASS`.

### B-06 — Rollback rehearsal remains unverified

Rollback documentation exists, but no exact-candidate rehearsal evidence has been collected in this pass. Documentation is necessary; execution evidence is what closes the gate.

## Passing Evidence On PR #443

The exact-head proof run already establishes two useful passes:

- `Exact Head CodeQL` — PASS (`32608207900`, job `97116690520`)
- `Exact Head Markdown Links` — PASS (`32608207900`, job `97116690596`)

The standalone Markdown Link Check also passed in run `32608207878`.

These passes are preserved in `docs/evidence/beta-acceptance-manifest.json`.

## Beta Decision Is Now Executable

The readiness branch adds:

- `docs/evidence/beta-acceptance-manifest.json`
- `scripts/verify-beta-readiness.mjs`
- npm script `verify:beta-readiness`

The reducer allows beta promotion only when every mandatory gate is `PASS` and open P0/P1 counts are within policy. A weighted score cannot override a failed, blocked, or unexecuted mandatory gate.

## Required Closure Sequence

1. Produce and commit the synchronized `package-lock.json`.
2. Run `npm ci` successfully on the exact resulting SHA.
3. Re-run exact-head CI and security verification on that SHA.
4. Diagnose and close the current Vercel failure with current deployment evidence.
5. Build the Android beta artifact from the exact accepted SHA.
6. Execute the critical-journey physical-device matrix.
7. Execute cloud-sync isolation and offline/reconnect checks.
8. Execute the accessibility critical journey.
9. Rehearse rollback against the candidate deployment.
10. Update the acceptance manifest with immutable run/build/evidence identifiers.
11. Run `npm run verify:beta-readiness`.
12. Promote only when the reducer returns `PASS`.

## Acceptance Rule

```text
IF any mandatory gate ∈ {FAIL, BLOCKED, NOT_RUN}
THEN beta_status = BLOCKED
ELSE IF open_P0 > 0 OR open_P1 > 0
THEN beta_status = BLOCKED
ELSE beta_status = PASS
```
