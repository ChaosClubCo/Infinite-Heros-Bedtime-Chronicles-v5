# Release Quality Lenses — Reliability Sprint (PR #321 + #322)

<!-- Last verified: 2026-07-12 -->

Four-lens quality review of the "Reliability sprint" release — commit `d176618`
(PR #321, live health checks / wired alerting / KV-backed idempotency) plus its
immediate follow-up commit `429fffd` (PR #322, review-finding fixes). Scope is
pinned to `429fffd`, not current `main` HEAD: two later `main` commits
(`29bac28`, `59e0b3b`) landed before this review closed, but they're
unrelated docs/build-config changes outside the reliability sprint and are
out of scope here. Each lens was scored independently from the diff, commit
messages, and current source — no lens's finding was used to justify
another's score.

<!-- 2026-07-12 addendum: several evidence rows below were corrected and
re-scored after cross-review (CodeRabbit/Copilot/Codex) surfaced factual
gaps against the actual source. See the inline notes and the new
"Follow-up items" section. -->

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

## Lens 2 — Reliability (6/12)

| Criterion | Score | Evidence |
|---|---|---|
| observability_coverage | 2/2 | New paths fully instrumented: `pingAnthropic`/`pingGemini`/`pingElevenLabs` → `getLiveStatus()`; `recordTTS()` wired into both TTS routes; breaker state exposed via `getBreakerStatuses()`. |
| error_budget_impact | 1/2 | `server/alerting.ts` explicitly documents its own limitation (lifetime-cumulative counters, not a rolling window; 5xx alert diluted across all `/api/*` routes) — labeled, not resolved. |
| capacity_check | 1/2 | Corrected: the three reachability probes (`pingAnthropic`/`pingGemini`/`pingElevenLabs`) never run in the `/api/generate-story` hot path — `getLiveStatus()` is only called from `/api/health` (`server/routes/health.ts`), is cache-backed (45s TTL), and even there picks at most one AI probe plus the TTS probe, never all three. The actual hot-path addition is the KV idempotency round-trip (`idempotencyCache.getResolved`/`setResolved` in `server/routes/story.ts`), which has no load/capacity analysis of its own. |
| probe_correctness | 1/2 | PR #322 caught and fixed a real probe/startup-behavior mismatch (Gemini-first probe vs. Anthropic-first story chain) with a regression test — that specific fix is solid. But `LIVE_PROBE_PROVIDERS` (`server/routes/health.ts`) still only lists `anthropic` and `gemini`; a deployment configured with only OpenAI or an OpenRouter-backed provider (both valid per `validateEnvironment()` and the story fallback chain) gets `aiProvidersLive: {reachable: null}` forever even though story generation works — the same class of probe/reality mismatch PR #322 was meant to close, just for a different provider set. |
| oncall_readiness | 1/2 | Runbook updated with the new response shape and alert semantics, but no evidence of an actual on-call briefing beyond the doc. |
| abort_criteria | 0/2 | No automatic-rollback/abort trigger wired to any alert threshold. |

**Blocking:** `abort_criteria`. Verdict: **GO-WITH-CONDITIONS**.

## Lens 3 — AppSec (7/10)

| Criterion | Score | Evidence |
|---|---|---|
| access_control | 2/2 | No new/changed endpoints; `/api/health`, `/api/ai-providers`, `/api/metrics` were already unauthenticated GETs (`server/routes.ts` `requiresAuthGate` unmodified) and `requireAuth`/rate-limit gates on `/api/tts` and `/api/generate-story` are untouched. Corrected framing: this release does newly expose operational state (breaker open/closed status, AI/TTS live-reachability) on those already-unauthenticated GETs — no auth-surface regression, but worth noting as a (low-severity) increase in what an anonymous caller can learn about backend health. |
| dependency_risk | 1/2 | No new npm dependencies — all new code uses built-in `fetch`/`crypto` and the already-present `@sentry/node`; no CVE scan output present to confirm existing deps. |
| secrets_exposure | 1/2 | Corrected: the grep check missed that the new `pingGemini()` probe (`server/ai/providers/gemini.ts`) builds its request as `${baseUrl}/v1beta/models?key=${apiKey}` — the Gemini API key travels in the URL query string, not a header, on every health-check probe cycle. Query-string secrets are more exposure-prone than header values (proxy/CDN access logs, browser history semantics, referrer leakage patterns) even though this is a server-to-server call. `ELEVENLABS_API_KEY`/`CLOUDFLARE_API_TOKEN`/other AI keys are still header-only and never logged or returned in a response body. |
| injection_surface | 1/2 | Corrected: this is not just the idempotency key. On a successful generation with `KV_ENABLED`, `server/routes/story.ts` calls `idempotencyCache.setResolved(key, story)`, which writes the full generated story body — derived from child-provided fields (`heroName`, `childName`, `sidekick`, `problem`, `customPrompt`) — to Cloudflare KV (`IdempotencyCache.setResolved` → `kvSet`), not just a SHA-256 hash. Cloudflare KV was already in use for rate-limiting, so it isn't a new third-party system, but child-derived story content reaching it is a new data class that the original evidence didn't account for; worth a data-retention/COPPA-scope check against `docs/COPPA-COMPLIANCE.md`. |
| config_defaults | 2/2 | `KV_ENABLED` defaults false until all three Cloudflare vars are set; no new CORS/bucket/debug defaults; `CLOUDFLARE_R2_*` vars documented as not yet wired to any code path. |

**Blocking:** none — neither `access_control` nor `secrets_exposure` scored 0/2, so the auto-NO-GO override still doesn't trigger. Verdict: **GO-WITH-CONDITIONS** (downgraded from GO after the `secrets_exposure`/`injection_surface` corrections above; see follow-ups).

## Lens 4 — Test Verification (7/10)

| Criterion | Score | Evidence |
|---|---|---|
| diff_coverage | 1/2 | Corrected/scoped: within reliability-sprint PRs `#321`/`#322`, most changed/new *logic* files have matching tests (`alerting.test.ts`, `health-checks.test.ts`, `kv.test.ts` new; `idempotency.test.ts`, `rate-limit.test.ts` extended; `routes/health.test.ts`, `routes/story.kv-idempotency.test.ts` new) — but two wiring sites aren't integration-covered: `server/index.ts`'s `checkAlertThresholds()` call on the request-finish hook (every 20th response) is never asserted to actually fire from a live request, only unit-tested in isolation (`alerting.test.ts`), and `server/routes/tts.ts`'s `recordTTS()` calls aren't asserted from a TTS route test, only from `metrics.test.ts` directly. The original "every changed/new file has matching tests" claim also implicitly covered this doc PR's own Markdown file, which has none by definition — scope is now stated explicitly. |
| failure_path_coverage | 2/2 | Explicit failure tests: KV fetch reject → fallback, probe timeout → `reachable:false`, generation failure → no KV write, alert cooldown suppression. |
| smoke_test_plan | 1/2 | Runbook documents the new response shape as a manual checklist; no scripted/automated post-deploy smoke test referencing the new fields. |
| regression_surface | 2/2 | `server/kv.ts` extracted from the already-shipped `rate-limit.ts` specifically to avoid duplicating logic for the new idempotency consumer; `rate-limit.test.ts` re-verified the extraction was behavior-preserving. |
| test_integrity | 2/2 | PR #322 documents a found-and-fixed test-integrity bug (a static import froze `KV_ENABLED` before env vars were set, which would have silently left the KV path untested). Updated: the full suite was actually run for this review (`npm run typecheck`, `npm run lint`, `npm test` after `npm install`) — 0 typecheck errors, 0 lint warnings, 56/56 test files and 1140/1140 tests passing. Previously marked "cannot verify" for lack of `node_modules`; now verified clean. |

**Blocking:** none. Verdict: **GO**.

---

## Synthesis

**Agreement across lenses:**
- Release Management (`rollback_plan`) and Reliability (`abort_criteria`) are related but **distinct** gaps, not the same one restated: `rollback_plan` is about the *manual* rollback path being under-specified (no time estimate, no callout that `server/kv.ts` entries outlive a code revert), while `abort_criteria` is about the total *absence* of any automated response to a firing alert. Both point at "nothing happens automatically when things go wrong," but from different mechanisms (rollback tooling vs. alert-triggered action) — correcting the earlier framing, which conflated them as one gap seen from two angles.
- Release Management (`comms_plan`, `rollback_plan`) and Test Verification (`smoke_test_plan`) both note that verification for this release lives in documentation updates, not in an executed or scripted check.

**Conflicts:** none — no lens's evidence contradicts another's. The appsec override rule was checked and did not trigger.

**Final verdict: GO-WITH-CONDITIONS.** No lens failed outright and the appsec override did not trigger; the blocking items remain process gaps (communication, automated abort action), not defects in the shipped code. The appsec and test-verification corrections above surfaced additional non-blocking follow-ups (see below) that should be tracked even though they don't change the release gate.

### Blocking items

| Cause | Fix | Retry |
|---|---|---|
| No stakeholder communication evidence for this deploy | Post a deploy notice (what changed, what to watch on `/api/health`) before merging future reliability-sprint-style changes | Confirm a comms artifact exists at or before the next such merge |
| `server/alerting.ts` fires Sentry alerts with no automated rollback/abort action | Wire at least one concrete automated response (e.g. trip a feature flag or reduce the load-shedding ceiling) to the 5xx-critical / TTS-critical alert paths | Add a regression test asserting the auto-response fires at the critical threshold |

### Follow-up items (non-blocking)

Surfaced by cross-review (CodeRabbit/Copilot/Codex) against actual source; none hit a 0/2 override threshold, but all are real gaps worth tracking.

| Cause | Fix | Retry |
|---|---|---|
| `pingGemini()` sends the Gemini API key in the request URL query string (`?key=...`) instead of a header | Switch to the `x-goog-api-key` header (supported by the Gemini REST API) to keep all provider keys out of URLs/logs | Re-grep for `?key=` / query-string secrets across `server/ai/providers/*` |
| `LIVE_PROBE_PROVIDERS` only covers Anthropic and Gemini, so OpenAI-only/OpenRouter-only deployments always see `aiProvidersLive: {reachable: null}` even when story generation works | Extend the live-probe list to cover every provider in the story fallback chain, or explicitly document the gap in `docs/API.md` | Add a test asserting a probe exists for each configured `story`-chain provider |
| Cloudflare KV now stores full generated story bodies (derived from child-provided fields), not just an idempotency hash, when `KV_ENABLED` | Confirm the KV TTL and data handling for this new data class against `docs/COPPA-COMPLIANCE.md`; document if intentional | Add a note to `docs/COPPA-COMPLIANCE.md` covering KV-stored story content |
| `checkAlertThresholds()` (`server/index.ts`) and `recordTTS()` (`server/routes/tts.ts`) wiring is unit-tested in isolation but not asserted to fire from a live request/route | Add a thin integration test per wiring site (e.g. assert the request-finish hook invokes `checkAlertThresholds` every 20th response; assert a TTS route call increments the recorded metric) | Re-run `npm test` and confirm the new assertions exist and pass |

```json
{
  "lenses": {
    "release_management": {"score": 8, "blocking": ["comms_plan"], "verdict": "GO-WITH-CONDITIONS"},
    "reliability": {"score": 6, "blocking": ["abort_criteria"], "verdict": "GO-WITH-CONDITIONS"},
    "appsec": {"score": 7, "blocking": [], "verdict": "GO-WITH-CONDITIONS"},
    "test_verification": {"score": 7, "blocking": [], "verdict": "GO"}
  },
  "agreement_map": [
    "release_management + reliability: related but distinct gaps — rollback_plan (manual rollback under-specified) vs. abort_criteria (no automated alert response) — not the same gap restated",
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
  ],
  "follow_up_items": [
    {
      "cause": "pingGemini() puts the Gemini API key in the URL query string instead of a header",
      "fix": "Use the x-goog-api-key header instead of ?key=... in server/ai/providers/gemini.ts",
      "retry": "Grep for ?key= / query-string secrets across server/ai/providers/*"
    },
    {
      "cause": "LIVE_PROBE_PROVIDERS omits OpenAI/OpenRouter, so those-only deployments never get a live AI probe",
      "fix": "Extend LIVE_PROBE_PROVIDERS to cover every provider in the story fallback chain",
      "retry": "Add a test asserting a probe exists per configured story-chain provider"
    },
    {
      "cause": "Cloudflare KV now stores full generated story bodies (child-derived content), not just a hash",
      "fix": "Confirm KV TTL/data handling for this data class against docs/COPPA-COMPLIANCE.md",
      "retry": "Add a note to docs/COPPA-COMPLIANCE.md covering KV-stored story content"
    },
    {
      "cause": "checkAlertThresholds() and recordTTS() wiring is unit-tested but not integration-tested from a live request",
      "fix": "Add a thin integration test per wiring site",
      "retry": "Re-run npm test and confirm the new assertions exist and pass"
    }
  ]
}
```
