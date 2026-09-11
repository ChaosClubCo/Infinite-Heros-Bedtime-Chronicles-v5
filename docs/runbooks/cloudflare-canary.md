# Cloudflare Production Canary Runbook

**Status:** PROCEDURE DEFINED / RUNTIME NOT YET EXECUTED  
**Applies to:** Cloudflare edge migration v1  
**Architecture authority:** `docs/adr/0008-cloudflare-edge-target-architecture.md`

## Objective

Shift a bounded amount of production web/API traffic to an exact, already-verified Cloudflare Worker candidate, observe defined service-health signals, and either promote or roll back using evidence rather than operator intuition.

This runbook does not authorize a canary until staging verification, persistence/media checks, security parity, and exact-SHA provenance are green for the same candidate.

## Preconditions

Every item is blocking.

- [ ] Candidate GitHub SHA is immutable and recorded.
- [ ] Existing repository CI gates are green for that exact SHA.
- [ ] Worker unit tests and Wrangler/workerd build validation are green.
- [ ] Staging `/api/health` reports the exact candidate SHA.
- [ ] Staging `/api/metrics` and the first ported non-AI route match expected response contracts.
- [ ] Canonical CORS/security-header matrix passes in staging.
- [ ] AI adapter tests prove delegation to the existing `server/ai` semantics.
- [ ] R2 `MediaStore` contract and staging read/write/delete proof are green for a disposable canary object.
- [ ] PostgreSQL connectivity benchmark is within the accepted limits documented in the release matrix.
- [ ] A known-good Cloudflare deployment/version is identified as the rollback target.
- [ ] Operator has permission to change Cloudflare traffic/routing and execute rollback.
- [ ] Current production error/latency baseline has been captured immediately before canary.

## Candidate identity contract

The candidate is valid only if these values reconcile exactly:

```text
GitHub candidate SHA
        ==
Cloudflare deployment/source metadata SHA
        ==
GET /api/health -> sourceCommitSha
```

Any mismatch aborts the canary before traffic is shifted.

## Canary stages

Traffic percentages are maximums, not targets. Use the smallest routing primitive Cloudflare makes available for the active account/zone. If the platform cannot provide a safely bounded slice, use a dedicated production-hostname canary instead of approximating a percentage with uncontrolled DNS behavior.

| Stage | Maximum production traffic | Minimum observation requirement | Promotion rule |
|---|---:|---|---|
| 0 | 0% | exact-SHA production-origin probe | identity + security + static/API routing pass |
| 1 | 1% | enough requests to exercise static, health, metrics, auth rejection, and one safe read path | no abort threshold breached |
| 2 | 5% | sustained mixed web/API traffic including AI and media reads | no abort threshold breached |
| 3 | 25% | representative production load across at least one normal usage window | no abort threshold breached |
| 4 | 50% | representative production load with stable dependency health | no abort threshold breached |
| 5 | 100% | full traffic, rollback target retained | post-cutover verification green |

Do not advance stages merely because a fixed amount of wall-clock time passed. Advance only after enough requests have exercised the relevant surfaces to make the observed error/latency rates meaningful.

## Signals to observe

### Edge/API

- request count by status;
- HTTP 5xx rate;
- HTTP 429 rate;
- p50/p95/p99 API latency;
- Worker exceptions / uncaught rejections;
- CPU/runtime-limit failures;
- request-ID continuity where available.

### AI

- provider success/failure counts;
- failover/circuit-breaker activation;
- story-generation first-response latency;
- safety block/regeneration/fallback counts;
- schema/JSON normalization failures.

### Persistence/auth

- Postgres query/connect latency;
- connection/query timeout count;
- Supabase bearer-token validation failures separated from legitimate 401s;
- RLS/database errors;
- sanitized dependency-failure responses.

### Media

- R2 read/write error rate;
- generated-media persistence failures;
- content-type/ETag mismatch;
- missing-object rates;
- TTS/image delivery latency.

### Web/static

- root document success;
- hashed asset 2xx rate;
- SPA deep-route fallback success;
- `/api/*` never returning SPA HTML;
- cache-control behavior for versioned vs non-versioned resources.

## Abort thresholds

Any **critical** condition triggers immediate rollback. Warning conditions block promotion to the next stage and require investigation.

| Signal | Warning | Critical / abort |
|---|---|---|
| Edge/API 5xx | > 0.5% over a representative sample | > 1.0% or materially above pre-canary baseline |
| Worker exceptions | any recurring pattern | any error affecting child-facing generation or auth boundary |
| p95 non-AI API latency | > 2x pre-canary baseline | > 3x baseline or sustained timeout behavior |
| AI upstream failure | > 2% excluding intentional breaker tests | > 5% or fallback chain exhausted |
| Unsafe/safety-gate bypass | none | **one verified bypass** |
| Auth fail-open behavior | none | **one verified fail-open** |
| Postgres connectivity | intermittent bounded retry | sustained connection failure / unbounded waits |
| R2 generated-media persistence | > 1% failure | > 2% failure or object corruption/mismatch |
| `/api/*` served SPA HTML | none | **one verified routing leak** |
| Candidate SHA mismatch | none | **immediate abort** |

Baseline-relative thresholds take precedence when production normally operates materially below the numeric ceilings above.

## Rollback procedure

1. Stop progression immediately.
2. Record current canary stage, candidate deployment/version ID, GitHub SHA, UTC timestamp, and triggering metric/error evidence.
3. Shift traffic back to the previously identified known-good Cloudflare deployment/version using the account-supported rollback/version mechanism.
4. Do **not** change application code while rollback is in progress.
5. Re-read `/api/health` from the production origin after rollback.
6. Prove runtime identity equals the known-good rollback SHA/version.
7. Re-run root static document, deep SPA route, `/api/health`, `/api/metrics`, auth rejection, and one safe read-path synthetic.
8. Confirm production metrics returned to baseline bounds.
9. Preserve the rollback receipt and classify the candidate `BLOCKED` until a new revision and fresh acceptance run exist.

A successful rollback command without post-rollback readback is not rollback evidence.

## Promotion to full cutover

After Stage 5 reaches 100%:

- preserve the prior known-good deployment for the defined rollback window;
- execute full production synthetic checks;
- reconcile candidate SHA one final time;
- verify no stale non-Cloudflare origin continues serving production traffic unexpectedly;
- preserve deployment/version IDs, traffic-shift evidence, metrics snapshots, and synthetic results in the release receipt;
- do not mark the migration `READY` until the explicit rollback rehearsal has also passed.

## Evidence receipt fields

At minimum preserve:

```text
candidate_sha
candidate_deployment_id
candidate_version_id
rollback_deployment_id
rollback_version_id
canary_stage
traffic_fraction_or_canary_hostname
started_at_utc
completed_at_utc
pre_canary_baseline_ref
metrics_evidence_refs
synthetic_evidence_refs
security_evidence_refs
persistence_evidence_refs
media_evidence_refs
identity_readback
verdict
rollback_rehearsal_verdict
```

## Current execution state

As of the creation of this runbook, no production Cloudflare canary or rollback rehearsal is claimed. The procedure is defined so that those actions can be executed only after the earlier migration gates produce exact-revision evidence.
