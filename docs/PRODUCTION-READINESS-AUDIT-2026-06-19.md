# Production-Readiness Audit — Infinity Heroes: Bedtime Chronicles v5

**Date:** 2026-06-19
**Auditor role:** Staff-level Production Readiness Auditor (assessment only)
**Scope:** Express.js API server (`server/`) + Expo client, against the 7-category
production-readiness framework.

> This is a technical assessment. The final deploy decision belongs to a human.

## Executive summary

The server was audited across Resilience, Error Handling, Observability,
Scalability, Modularity, Security, and Deployment Safety. It scores **≈69%
(87 PASS / 126 applicable items)** with a strong security and code-quality
posture and **no CRITICAL findings**; the main gaps are in resilience cost-guards,
observability alerting wiring, and AI change-safety. **Recommendation: GO WITH
CONDITIONS** — ship to the current beta, with the three HIGH findings remediated
(done in the accompanying change) and the MEDIUM scalability/alerting items
cleared before scaling past beta.

## Prerequisite gate

| Question | Answer |
|----------|--------|
| Greenfield or production traffic | **Beta / limited** real users |
| Doc Audit Agent already run | Yes — recent (`#241` docs audit, `#243` audit-fix sprint); this is a **re-audit** |
| Test suite | **Yes** — 41 `*.test.ts`, Vitest + coverage gate |
| Deployment target | **Vercel serverless + Cloudflare KV** (`api/server.mjs`); also supports long-running Node (`server:prod`) |
| Known open P0s | None reported |

Because the deployment is serverless **with Cloudflare KV configured**, the
per-IP rate limiter persists across invocations (`server/rate-limit.ts`) — so the
in-memory rate-limit concern is **not** HIGH. In-memory idempotency and the
`/tmp` TTS cache still degrade to per-invocation on serverless, a cost/latency
(MEDIUM) issue rather than an abuse/correctness one.

## Scorecard

| Category | PASS | PARTIAL | FAIL | N/A |
|----------|:----:|:-------:|:----:|:---:|
| 1. Resilience | 9 | 4 | 4 | 0 |
| 2. Error Handling | 9 | 4 | 2 | 0 |
| 3. Observability | 8 | 7 | 1 | 0 |
| 4. Scalability | 9 | 4 | 2 | 1 |
| 5. Modularity | 21 | 1 | 0 | 0 |
| 6. Security | 20 | 1 | 0 | 1 |
| 7. Deployment Safety | 11 | 7 | 2 | 0 |
| **Total** | **87** | **28** | **11** | **2** |

**Overall score = 87 / 126 ≈ 69%.**

Blocking-threshold check: no CRITICAL; 3 HIGH FAILs (→ framework says "do not
ship" until fixed — all three are remediated in the accompanying change).

## Critical & High findings

No CRITICAL findings.

### H1 — Retry logic does not exclude 4xx client errors (Cat 1.1, HIGH)
- **Evidence:** `server/retry.ts:21-31` retried every error; `server/ai/router.ts:139-141`
  wraps provider calls in `retryWithJitter` with no error-class gate. `classifyError`
  existed (`server/utils.ts`) but only for HTTP-status mapping, not retry gating.
- **Risk:** 400/401/403/422 (bad key, malformed request) were retried, wasting paid
  API quota and adding latency.
- **Fix (applied):** `isRetryableError()` added to `server/utils.ts`; `retryWithJitter`
  now takes a `shouldRetry` predicate defaulting to it. 429 stays retryable.
- **Effort:** 1–2h.

### H2 — No global unhandledRejection / uncaughtException handlers (Cat 2.1, HIGH)
- **Evidence:** grep over `server/**` → 0 matches; only SIGTERM/SIGINT handled
  (`server/index.ts`).
- **Risk:** On the long-running server an unhandled rejection crashes the process
  with no structured log; on serverless it kills the invocation silently.
- **Fix (applied):** registered `unhandledRejection` (log) and `uncaughtException`
  (log + graceful drain) beside the signal handlers in `server/index.ts`.
- **Effort:** 1–2h.

### H3 — No LLM cost guards beyond a hardcoded per-call cap (Cat 1.4, HIGH)
- **Evidence:** hardcoded `maxTokens` (`server/routes/story.ts`, `server/routes/suggest.ts`);
  no per-user/day budget; cost-anomaly alerting documented but not wired;
  `recordAICall` aggregates tokens in-memory only.
- **Risk:** A runaway/abusive client can drive unbounded spend with no per-request
  cost signal.
- **Fix (applied):** token caps are now env-configurable (`STORY_MAX_TOKENS`,
  `SUGGEST_MAX_TOKENS`); each generation emits a structured cost log
  (`inputTokens`, `outputTokens`, `estCostUsd` via `server/ai/cost.ts`) for
  anomaly alerting.
- **Follow-up (not in this change):** persistent per-user daily token budget via
  Cloudflare KV (mirror `server/rate-limit.ts`).
- **Effort (applied part):** 2–4h.

## Medium & Low findings (documented debt)

| ID | Cat | Finding | Suggested fix |
|----|-----|---------|---------------|
| M1 | 4.1 | In-memory idempotency + `/tmp` TTS cache are per-invocation on serverless → duplicate generations / re-synthesis cost | Move dedup + TTS cache to Cloudflare KV / object storage |
| M2 | 3.3 | `/api/health` checks env-var presence, not live reachability; no liveness/readiness split | Add cached, non-blocking dependency pings |
| M3 | 3.4 | Alerting thresholds documented but not wired; no server-side Sentry | Add server Sentry + cost/latency/failure-rate alarms |
| M4 | 7.5 | No feature-flag toggle for model/prompt version; prompts not versioned | Add model/prompt version flags + changelog |
| M5 | 3.1 | ~9 raw `console.error/warn` in server paths | Route through pino `logger` |
| L1 | 2.4 | No `docs/ERRORS.md` error taxonomy | Add error catalog + top-5 remediation |
| L2 | 5.3 | TTS/video cache dirs + video TTL hardcoded | Env-configure |
| L3 | 6.5 | 15 moderate transitive Expo CVEs (`@expo/config*`); 0 critical/high | Track Expo SDK updates |
| L4 | 7.2 | Graceful shutdown does not `pool.end()` the DB pool | Drain pool on shutdown |

## Category strengths (verified)

- **Security:** secrets via env only, `.env` gitignored, no tracked `.env`; Zod
  validation at every boundary; `sanitizePromptInput` prompt-injection defense;
  Firebase auth with a production 503 guard; per-IP rate limiting (KV-backed);
  pino redaction of auth/tokens/`childName`; strict path-traversal guard on TTS
  serving.
- **Modularity:** prompts/validation/auth/rate-limit cleanly isolated; strict
  TypeScript; typed LLM responses; no circular deps; largest files justified.
- **Resilience (partial):** circuit breaker (5 fails → open → 60s), 7-provider
  fallback chain, jittered exponential backoff, explicit 60s LLM timeout,
  robust JSON extraction with provider fallthrough.

## Go / No-Go

**GO WITH CONDITIONS.**

- **Ship to beta/limited** — acceptable, with H1–H3 remediated (done here).
- **Before scaling past beta**, clear **M1** (KV-backed idempotency/TTS) and wire
  **M3** alerting (server-side Sentry + cost/latency/failure-rate alarms).
- **First-24h monitoring after deploy:** the new `story generated` cost logs
  (watch `estCostUsd` distribution), provider failure/fallthrough rate, p95 story
  latency, and 503 rates from load-shedding.

## Recommended next steps

- **Today:** merge H1–H3 fixes (this change); confirm `CLOUDFLARE_*` KV vars are
  actually set in the Vercel env (rate limiter falls back to in-memory silently if not).
- **This sprint:** M1 (KV idempotency/TTS), M3 (alerting + server Sentry), M2 (live health checks).
- **Backlog:** M4 (model/prompt version flags), M5 (logger cleanup), L1–L4.

## Claims check

- **VERIFIED:** missing crash handlers (grep, 0 matches); retry had no 4xx gate
  (`server/retry.ts`); hardcoded `maxTokens`; pino redaction, Zod validation, auth
  production-guard, circuit breaker, load-shedding, SSE error handling
  (file:line evidence); 15 moderate / 0 critical CVEs (`npm audit`).
- **ASSUMPTIONS:** per-token cost figures in `server/ai/cost.ts` are coarse
  list-price approximations — verify against current provider pricing.
- **UNKNOWNS:** whether `CLOUDFLARE_*` KV env vars are set in the live Vercel
  environment — surface via a startup assertion or the `/api/health` feature block.
