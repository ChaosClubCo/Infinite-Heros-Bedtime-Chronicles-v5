# Cloudflare Edge v1 Baseline Receipt

**Status:** BASELINE FROZEN / NOT GREEN  
**Recorded:** 2026-08-31  
**Canonical repository:** `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`  
**Canonical branch:** `main`  
**Frozen source SHA:** `1de01334c2337d6aadc9afae3a19c3bcab45e781`  
**Migration branch:** `migration/cloudflare-edge-v1`

## Purpose

This receipt freezes the exact pre-migration state. It exists to prevent inherited failures from being misclassified as Cloudflare regressions and to prevent migration work from claiming a stronger release state than the evidence supports.

## Frozen source identity

- Commit: `1de01334c2337d6aadc9afae3a19c3bcab45e781`
- Commit message: `feat: add morning awakening and playback UI`
- Commit timestamp: `2026-08-31T03:09:54Z`
- Migration branch was created directly from this SHA before migration edits.

## Baseline release-gate evidence

The frozen SHA is **not a green release candidate**.

Observed GitHub Actions runs for the same SHA include failures in:

| Workflow | Run ID | Event | Conclusion |
|---|---:|---|---|
| CI Pipeline | `33352942541` | push | FAILURE |
| EAS Build | `33352942354` | push | FAILURE |
| Markdown Link Check | `33352942572` | push | FAILURE |
| Main Governance Guard | `33352942433` | push | FAILURE |
| Agent - Security | `33352942477` | push | FAILURE |
| Deployment Drift Monitor | `33431603932` | schedule | FAILURE |

There were no pull-request-triggered workflow runs found for the frozen SHA at baseline capture time.

## Primary CI root cause

The `CI Pipeline` did not reach lint, tests, audit, typecheck, server build, or Expo web export.

Both `Lint and Test` and `Production Install Smoke Test` failed during `actions/setup-node@v7` because the workflow enables `cache: npm` but the repository contains no supported dependency lockfile.

Observed error:

```text
Dependencies lock file is not found ...
Supported file patterns: package-lock.json,npm-shrinkwrap.json,yarn.lock
```

Therefore the frozen SHA has **no fresh green evidence** for:

- `npm ci`
- preflight
- ESLint
- Vitest
- Jest/Expo component tests
- dependency security audit
- TypeScript typecheck
- Node server build
- Expo compatibility check
- Expo web export

The absence of this evidence is an inherited release blocker. It must not be described as a Cloudflare-introduced regression unless the same failure persists after deterministic dependency state is repaired and can be causally tied to migration changes.

## Repository governance baseline

At capture time, GitHub branch metadata reported `main` as not protected by an active branch-protection rule with required status checks. Repository-local governance files exist, but local policy files are not equivalent to server-enforced branch protection.

This is an inherited release-control gap and should be reconciled before production promotion.

## Architecture baseline

The frozen source currently implements:

- Expo / React Native client with Expo Router and EAS build paths.
- Vite-based web development/build support.
- Express 5 / Node backend built from `server/index.ts`.
- PostgreSQL via Drizzle and `pg.Pool`.
- Supabase authentication/sync integration.
- Existing multi-provider AI routing under `server/ai/`.
- Existing AWS S3-compatible object-storage dependency surface.
- Existing Vercel/Replit/GCP-era deployment artifacts.

The frozen source does **not** contain an implemented/certified Hono Cloudflare Worker entrypoint, Wrangler production configuration, R2 `MediaStore` implementation, exact-SHA Cloudflare staging deployment receipt, production canary receipt, or rollback rehearsal receipt.

## Baseline classification

| Domain | Baseline verdict |
|---|---|
| Source SHA frozen | PASS |
| Migration branch isolated from frozen SHA | PASS |
| Existing CI green | FAIL |
| Deterministic lockfile present | FAIL |
| Lint/test/typecheck/build evidence on frozen SHA | INCONCLUSIVE — jobs never reached these gates |
| Cloudflare Worker implemented | NOT IMPLEMENTED |
| Cloudflare staging deployed | NOT VERIFIED |
| Cloudflare production canary | NOT VERIFIED |
| Cloudflare rollback rehearsal | NOT VERIFIED |
| Release status | **NOT READY** |

## Baseline repair rule

The migration release train may repair inherited release infrastructure when required to obtain trustworthy evidence, but it must:

1. preserve strict deterministic installation (`npm ci`) once a lockfile is restored;
2. document each inherited defect separately from migration implementation;
3. avoid suppressing or weakening tests to obtain green status;
4. bind every new verification result to an exact migration-branch SHA; and
5. never promote the Cloudflare release matrix to `READY` without deployed exact-SHA readback plus a real rollback rehearsal.
