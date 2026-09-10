# Cloudflare Edge Migration v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the web/API release surface to a staged Cloudflare Workers + Static Assets architecture while preserving Expo/EAS, PostgreSQL/Supabase, child-safety controls, and the existing `server/ai` provider semantics.

**Architecture:** A Hono Worker becomes the edge adapter and owns `/api/*` routing, security headers, CORS parity, provenance, and Worker-native media access. Runtime-neutral contracts isolate request/response, AI orchestration, media storage, and persistence so the Node/Express runtime can remain available during migration. PostgreSQL stays authoritative during v1; R2 is introduced only for generated media behind `MediaStore`.

**Tech Stack:** TypeScript, Hono, Cloudflare Workers, Workers Static Assets, R2, Wrangler, Vitest, Expo/React Native, Express, Supabase/PostgreSQL/Drizzle, GitHub Actions.

**Spec:** `docs/adr/0008-cloudflare-edge-target-architecture.md`

## Global Constraints

- Frozen baseline: `main@1de01334c2337d6aadc9afae3a19c3bcab45e781`.
- Work only on `migration/cloudflare-edge-v1`; never commit migration work directly to `main`.
- Preserve Expo/EAS native delivery.
- Preserve PostgreSQL/Supabase as v1 persistence authority; no D1 migration in this release train.
- Preserve `server/ai` provider ordering, breaker behavior, task types, and safety contracts; do not create a second semantic AI router.
- Preserve existing child-safety, validation, error-sanitization, authentication, rate-limit, CORS, and security-header invariants.
- No production secret values in repository files.
- No `READY` release status without deployed exact-SHA readback and rollback evidence.
- Cloudflare deployment, canary, and production readback are external gates when Cloudflare account access is unavailable.

---

### Task 1: Freeze baseline and evidence ledger

**Files:**
- Create: `docs/release/cloudflare-edge-v1-baseline.md`

**Interfaces:**
- Consumes: frozen main SHA and GitHub Actions evidence.
- Produces: immutable baseline identifier and inherited-blocker list used by all later release receipts.

- [ ] Record exact baseline SHA, branch, commit timestamp, and latest observed workflow conclusions.
- [ ] Record missing `package-lock.json` as an inherited deterministic-install blocker if still absent.
- [ ] Record current branch-protection state as an inherited release-control gap.
- [ ] Never convert inherited failures into migration regressions without evidence.

### Task 2: Superseding ADR

**Files:**
- Create: `docs/adr/0008-cloudflare-edge-target-architecture.md`
- Modify: `docs/adr/README.md`
- Modify: `docs/ARCHITECTURE.md`

**Interfaces:**
- Produces: authoritative architecture decision for Hono edge adapter + Postgres retention + R2 media boundary.

- [ ] Mark the August 28 design as superseded where it conflicts with the August 31 directive.
- [ ] Define Hono as edge adapter, not replacement business-logic framework.
- [ ] Keep Express/Node as transitional/local adapter.
- [ ] Keep Postgres/Supabase authoritative in v1.
- [ ] Require exact-SHA provenance and rollback before `READY`.

### Task 3: Runtime-neutral contracts

**Files:**
- Create: `shared/runtime/http.ts`
- Create: `shared/runtime/ai.ts`
- Create: `shared/runtime/media-store.ts`
- Create: `shared/runtime/persistence.ts`
- Test: `shared/runtime/runtime-contracts.test.ts`

**Interfaces:**
- Produces: `RuntimeRequest`, `RuntimeResponse`, `AIOrchestrator`, `MediaStore`, `PersistenceHealth`.

- [ ] Write contract tests first for normalized headers, media object metadata, persistence health shape, and AI adapter delegation.
- [ ] Verify tests fail because contracts do not exist.
- [ ] Add minimal typed interfaces with no Cloudflare/Express imports.
- [ ] Verify focused tests pass.

### Task 4: Minimal Hono Worker and health provenance

**Files:**
- Create: `worker/env.ts`
- Create: `worker/app.ts`
- Create: `worker/index.ts`
- Create: `worker/routes/health.ts`
- Test: `worker/app.test.ts`
- Create: `wrangler.jsonc`
- Modify: `package.json`

**Interfaces:**
- Produces: `createWorkerApp(env)` and `GET /api/health`.

- [ ] Test first: health returns `200`, `ok:true`, environment, application version, and source SHA without secrets.
- [ ] Add Hono worker shell.
- [ ] Add staging/production Wrangler environments and Static Assets routing with `/api/*` worker-first.
- [ ] Add `hono` and `wrangler` package entries and worker scripts.
- [ ] Validate Wrangler config/build in CI before deployment.

### Task 5: Static Assets staging proof

**Files:**
- Create: `.github/workflows/cloudflare-staging.yml`
- Create: `scripts/verify-cloudflare-staging.mjs`

**Interfaces:**
- Consumes: Cloudflare account/token secrets when present.
- Produces: staging deployment URL/version plus exact-SHA health receipt.

- [ ] Build Expo web artifact to `static-build/`.
- [ ] Deploy `--env staging` only when required secrets are available.
- [ ] Probe `/api/health`, `/`, and one deep SPA route.
- [ ] Fail if runtime SHA differs from GitHub candidate SHA.
- [ ] Upload receipt artifact even when deployment is externally blocked.

### Task 6: Port one non-AI route + security parity

**Files:**
- Create: `worker/middleware/security.ts`
- Create: `worker/middleware/cors.ts`
- Create: `worker/routes/providers.ts` or another read-only non-AI route selected from existing behavior.
- Test: `worker/security.test.ts`

**Interfaces:**
- Produces: Hono middleware preserving canonical origins and hardened response headers.

- [ ] Test canonical apex/www origins, denied lookalike/arbitrary origin, preflight, originless requests, HSTS, CSP, `nosniff`, frame denial, and request ID.
- [ ] Implement minimal parity middleware.
- [ ] Port one read-only route without changing its response contract.

### Task 7: AI orchestration adapter

**Files:**
- Create: `server/ai/runtime-adapter.ts`
- Create: `worker/routes/ai-providers.ts`
- Test: `server/ai/runtime-adapter.test.ts`

**Interfaces:**
- Consumes: existing `getAIRouter()`, `getProviderStatuses()`, breaker statuses.
- Produces: runtime-neutral `AIOrchestrator` adapter.

- [ ] Test delegation to the existing router rather than duplicate provider ordering/failover.
- [ ] Implement adapter only after red test.
- [ ] Keep all prompt/safety semantics in existing AI modules.

### Task 8: R2 MediaStore

**Files:**
- Create: `worker/storage/r2-media-store.ts`
- Create: `server/storage/media-store.ts`
- Test: `worker/storage/r2-media-store.test.ts`

**Interfaces:**
- Implements: `MediaStore.put/get/delete`.

- [ ] Test object key, content type, ETag/version metadata, not-found behavior, and delete idempotency.
- [ ] Add R2 binding in Wrangler for staging/production names only; no credentials in source.
- [ ] Migrate generated-media call sites through the `MediaStore` abstraction in bounded follow-up commits.

### Task 9: PostgreSQL retention benchmark gate

**Files:**
- Create: `docs/release/postgres-worker-benchmark.md`
- Create: `scripts/benchmark-persistence.mjs`

**Interfaces:**
- Produces: evidence deciding whether Postgres transport remains acceptable under Workers.

- [ ] Measure connect/query timeout behavior and p50/p95 latency from staging Worker.
- [ ] Verify failure is bounded and sanitized.
- [ ] Explicitly reject D1 migration unless benchmark evidence and a separate ADR approve it.

### Task 10: CI, synthetic checks, rollback contract

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/cloudflare-release.yml`
- Create: `scripts/verify-cloudflare-release.mjs`

**Interfaces:**
- Produces: exact-SHA Cloudflare build/provenance/rollback evidence.

- [ ] Add Worker unit tests and Wrangler build/config validation to existing CI.
- [ ] Add post-deploy synthetic health/static/API checks.
- [ ] Capture Cloudflare version/deployment IDs and source SHA.
- [ ] Add rollback rehearsal command path but do not mark rollback PASS without a real known-good target and post-rollback readback.

### Task 11: Production canary

**Files:**
- Create: `docs/runbooks/cloudflare-canary.md`

**Interfaces:**
- Produces: bounded traffic-shift procedure and abort thresholds.

- [ ] Begin with non-production verification complete.
- [ ] Shift a bounded canary slice only when account/routing controls are available.
- [ ] Observe latency, 5xx, AI failures, auth failures, and media failures.
- [ ] Abort and roll back on threshold breach.

### Task 12: READY promotion predicate

**Files:**
- Create: `docs/release/cloudflare-edge-v1-release-matrix.md`

**Interfaces:**
- Produces: final maturity verdict.

- [ ] Require exact candidate SHA equality across GitHub, deployment metadata, and `/api/health`.
- [ ] Require static CI, Worker/workerd, staging, canary, persistence, media, AI, security, and rollback evidence.
- [ ] Keep status `IMPLEMENTED`, `VERIFIED`, `DEPLOYED`, `BLOCKED`, or `INCONCLUSIVE` until every required runtime gate is evidenced.
- [ ] Change status to `READY` only after live readback and rollback rehearsal pass.

## Self-review

- Spec coverage: all 12 August 31 directive items map one-to-one to Tasks 1-12.
- Conflict resolution: Hono/R2 directives supersede the older design's contrary non-goals; Postgres retention and Expo/EAS preservation remain aligned.
- Placeholder scan: no TBD/TODO implementation placeholders are used as acceptance criteria.
- Type consistency: runtime contracts are defined centrally and adapters consume those contracts.
