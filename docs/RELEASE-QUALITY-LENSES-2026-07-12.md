# Release Quality Lenses — Reliability Sprint (PR #321 + #322)

<!-- Last verified: 2026-07-12 -->

Four-lens quality review of the "Reliability sprint" release — commit `d176618`
(PR #321, live health checks / wired alerting / KV-backed idempotency) plus its
immediate follow-up commit `429fffd` (PR #322, review-finding fixes), which
together are HEAD of `main` as of this review. Each lens was scored
independently from the diff, commit messages, and current source — no lens's
finding was used to justify another's score.

**Context**
- service: Express 5 backend for a children's bedtime-story app (`server/`),
  deployed to Replit Cloud Run (primary) and Vercel (serverless)
- risk_profile: **LOW** — additive observability/reliability plumbing only; no
  user-facing story-generation logic, no schema change, no new endpoints, no
  auth changes
- deploy_window: 2026-07-12 (commit `429fffd` merge time)

---

## Lens 1 — Release Management (8/12)

| Criterion | Score | Evidence |
|---|---|---|
| deployment_strategy_fit | 1/2 | No feature flag / staged rollout for the new `/api/health` fields (`ttsLive`, `aiProvidersLive`, `breakers`) or `server/alerting.ts`. Acceptable given they're purely additive, but undocumented as a deliberate choice. |
| rollback_plan | 1/2 | Generic `docs/runbooks/rollback.md` exists (git revert + redeploy) but wasn't updated for this change; no rollback-time estimate, no callout that KV entries written by `server/kv.ts` outlive a code revert. |
| changelog_accuracy | 2/2 | Both commit messages match the diff exactly (idempotency race fix, TTS alerting wiring, Gemini probe, logger.error fix, runbook correction) — verified line-by-line. |
| flag_state | 2/2 | KV idempotency, alerting, and live probes all fail safe: unconfigured env → in-memory-only / `null` / `false`, never throws. |
| freeze_integrity | 2/2 | Single linear PR → fixup-PR chain; no untracked commits interleaved. |
| comms_plan | 0/2 | No evidence of stakeholder notification before/during/after this deploy. |

**Blocking:** `comms_plan`. Verdict: **GO-WITH-CONDITIONS**.

## Lens 2 — Reliability (7/12)

| Criterion | Score | Evidence |
|---|---|---|
| observability_coverage | 2/2 | New paths fully instrumented: `pingAnthropic`/`pingGemini`/`pingElevenLabs` → `getLiveStatus()`; `recordTTS()` wired into both TTS routes; breaker state exposed via `getBreakerStatuses()`. |
| error_budget_impact | 1/2 | `server/alerting.ts` explicitly documents its own limitation (lifetime-cumulative counters, not a rolling window; 5xx alert diluted across all `/api/*` routes) — labeled, not resolved. |
| capacity_check | 1/2 | No load/capacity analysis for the new outbound calls: three cached reachability probes plus a KV round-trip now inside the `/api/generate-story` hot path. |
| probe_correctness | 2/2 | PR #322 caught and fixed a real probe/startup-behavior mismatch (Gemini-first probe vs. Anthropic-first story chain) with a regression test. |
| oncall_readiness | 1/2 | Runbook updated with the new response shape and alert semantics, but no evidence of an actual on-call briefing beyond the doc. |
| abort_criteria | 0/2 | No automatic-rollback/abort trigger wired to any alert threshold. |

**Blocking:** `abort_criteria`. Verdict: **GO-WITH-CONDITIONS**.

## Lens 3 — AppSec (9/10)

| Criterion | Score | Evidence |
|---|---|---|
| access_control | 2/2 | No new/changed endpoints; `/api/health`, `/api/ai-providers`, `/api/metrics` were already unauthenticated GETs (`server/routes.ts` `requiresAuthGate` unmodified) and new response fields don't change the auth surface. `/api/tts` and `/api/generate-story` keep existing `requireAuth`/rate-limit gates. |
| dependency_risk | 1/2 | No new npm dependencies — all new code uses built-in `fetch`/`crypto` and the already-present `@sentry/node`; no CVE scan output present to confirm existing deps. |
| secrets_exposure | 2/2 | Verified via grep: `ELEVENLABS_API_KEY`/`CLOUDFLARE_API_TOKEN`/AI keys only ever appear in outbound header values, never logged or returned in any response body. New `.env.example` R2 vars are empty placeholders. |
| injection_surface | 2/2 | Only new "user input" reaching an external system is the idempotency key — a SHA-256 hash of the sorted request body (`IdempotencyCache.keyFromBody`), not raw text. |
| config_defaults | 2/2 | `KV_ENABLED` defaults false until all three Cloudflare vars are set; no new CORS/bucket/debug defaults; `CLOUDFLARE_R2_*` vars documented as not yet wired to any code path. |

**Blocking:** none. Override rule (auto NO-GO on `access_control`=0 or `secrets_exposure`=0) not triggered. Verdict: **GO**.

## Lens 4 — Test Verification (8/10)

| Criterion | Score | Evidence |
|---|---|---|
| diff_coverage | 2/2 | Every changed/new file has matching tests: `alerting.test.ts`, `health-checks.test.ts`, `kv.test.ts` (new); `idempotency.test.ts`, `rate-limit.test.ts` (extended); `routes/health.test.ts`, `routes/story.kv-idempotency.test.ts` (new). |
| failure_path_coverage | 2/2 | Explicit failure tests: KV fetch reject → fallback, probe timeout → `reachable:false`, generation failure → no KV write, alert cooldown suppression. |
| smoke_test_plan | 1/2 | Runbook documents the new response shape as a manual checklist; no scripted/automated post-deploy smoke test referencing the new fields. |
| regression_surface | 2/2 | `server/kv.ts` extracted from the already-shipped `rate-limit.ts` specifically to avoid duplicating logic for the new idempotency consumer; `rate-limit.test.ts` re-verified the extraction was behavior-preserving. |
| test_integrity | 1/2 | PR #322 documents a found-and-fixed test-integrity bug (a static import froze `KV_ENABLED` before env vars were set, which would have silently left the KV path untested). Full suite execution was not run in this review session (no `node_modules` installed) — marked "cannot verify" rather than scored clean. |

**Blocking:** none. Verdict: **GO**.

---

## Synthesis

**Agreement across lenses:**
- Release Management (`rollback_plan`) and Reliability (`abort_criteria`) both independently flag the same underlying gap from different angles: alerts fire, but nothing acts on them automatically, and there's no estimated rollback time.
- Release Management (`comms_plan`, `rollback_plan`) and Test Verification (`smoke_test_plan`) both note that verification for this release lives in documentation updates, not in an executed or scripted check.

**Conflicts:** none — no lens's evidence contradicts another's. The appsec override rule was checked and did not trigger.

**Final verdict: GO-WITH-CONDITIONS.** No lens failed outright and the appsec override did not trigger; the two blocking items are process gaps (communication, automated abort action), not defects in the shipped code.

### Blocking items

| Cause | Fix | Retry |
|---|---|---|
| No stakeholder communication evidence for this deploy | Post a deploy notice (what changed, what to watch on `/api/health`) before merging future reliability-sprint-style changes | Confirm a comms artifact exists at or before the next such merge |
| `server/alerting.ts` fires Sentry alerts with no automated rollback/abort action | Wire at least one concrete automated response (e.g. trip a feature flag or reduce the load-shedding ceiling) to the 5xx-critical / TTS-critical alert paths | Add a regression test asserting the auto-response fires at the critical threshold |

```json
{
  "lenses": {
    "release_management": {"score": 8, "blocking": ["comms_plan"], "verdict": "GO-WITH-CONDITIONS"},
    "reliability": {"score": 7, "blocking": ["abort_criteria"], "verdict": "GO-WITH-CONDITIONS"},
    "appsec": {"score": 9, "blocking": [], "verdict": "GO"},
    "test_verification": {"score": 8, "blocking": [], "verdict": "GO"}
  },
  "agreement_map": [
    "release_management + reliability: no automatic rollback/abort action tied to alerting",
    "release_management + test_verification: verification relies on doc/runbook updates rather than executed/scripted checks"
  ],
  "conflict_map": [],
  "final_verdict": "GO-WITH-CONDITIONS",
  "blocking_items": [
    {
      "cause": "No evidence of stakeholder notification for this deploy",
      "fix": "Post a deploy notice covering what changed and what to monitor on /api/health before merging future reliability changes",
      "retry": "Confirm a comms artifact exists at or before the next such merge"
    },
    {
      "cause": "Alerting (server/alerting.ts) has no automated abort/rollback action wired to critical thresholds",
      "fix": "Wire at least one concrete automated response (feature flag trip or load-shedding adjustment) to the 5xx-critical and TTS-critical alert paths",
      "retry": "Add a regression test asserting the auto-response fires at the critical threshold"
    }
  ]
}
```
