# Risk Register and Release Plan

**Baseline:** `0e31e776b4c4817e3d67b174fd9177791a2c5238`  
**Assessment date:** 2026-07-15  
**Release recommendation:** **NO GO**

## Purpose

Provide an assignable risk/debt register, explicit release blockers, phased remediation plan, roadmap, and release-manager checklist.

## Severity Definitions

| Severity | Meaning |
|---|---|
| Critical | Child-safety harm, materially misleading/unlawful data handling, broad compromise, or complete release invalidation |
| High | Likely major availability, security, privacy, cost, or governance failure |
| Medium | Material risk that may be temporarily accepted with documented controls |
| Low | Improvement with limited immediate release impact |

# Risk Register

| ID | Risk | Severity | Likelihood | Impact | Owner | Mitigation | Status |
|---|---|---:|---:|---|---|---|---|
| R-001 | Consent/privacy copy contradicts accounts, cloud sync, and transcript persistence | Critical | High | Invalid notice/consent, legal/store exposure | Product + Privacy + Security | Implement target data model; legal review; rewrite; re-consent | Open |
| R-002 | Audio Voice Chat lacks mandatory child-safe system prompt/history cap/output guard | Critical | High | Unsafe child-facing response | AI Safety + Backend | Disable; unify chat policy; moderate/evaluate | Open |
| R-003 | Delete-all omits chat rows and Supabase identity | Critical | High | Parental deletion incomplete | Backend + Auth + Privacy | Orchestrated remote deletion and tests | Open |
| R-004 | Child/provider contractual and retention posture unverified | Critical | Medium | COPPA/provider policy violation | Legal + Product | Data minimization or approved DPAs/consent | Manual validation |
| R-005 | CI checks not visible/enforced on current main | High | Medium | Regressions reach release | Release Engineering | Enable/repair Actions; require named checks | Open |
| R-006 | Rate limiter is non-atomic and fails open on KV read errors | High | High | Cost/quota abuse | Platform + Security | Atomic limiter, local fallback, budgets | Open |
| R-007 | Health always returns 200/`ok`; diagnostics public | High | High | False-positive uptime, information disclosure | SRE + Security | Split liveness/readiness/internal telemetry | Open |
| R-008 | Cloud Run post-fix production revision not proven | High | Medium | Undetected deployment failure | DevOps | Deploy exact SHA; smoke; alert; rollback | Validation pending |
| R-009 | Real-device/EAS/store behavior not proven | High | High | Mobile release failure | Mobile QA + Release | Internal-track device matrix | Open |
| R-010 | Child name/age can be sent to providers | High | High | Child PI processing | Product + Privacy | Remove for first release | Open |
| R-011 | Voice transcripts retained without TTL | High | High | Long-lived child conversational data | Backend + DB | No-retention/short TTL and purge | Open |
| R-012 | PostgreSQL TLS verification weak | High | Medium | MITM/server identity risk | Platform | Trusted CA verification | Open |
| R-013 | Chat indexes/constraints/migration history incomplete | Medium | High with growth | Slow queries/data quality | Database | Versioned migration | Open |
| R-014 | Domain/origin/deployment-target inconsistency | High | Medium | Auth/CORS/deep-link failures | Architecture + DevOps | Canonical environment matrix | Open |
| R-015 | No verified backup/restore | High | Medium | Irrecoverable data loss | DB + SRE | PITR and restore drill | Manual validation |
| R-016 | No verified SLO/on-call/alert delivery | High | High | Incidents unowned/undetected | SRE + Leadership | Assign ownership and drill | Open |
| R-017 | Large base64 audio request | High | Medium | Memory DoS | Backend + Security | Streaming/multipart and edge limits | Open |
| R-018 | Story output moderation does not cover audio/images | High | Medium | Unsafe non-story output | AI Safety | Shared multimodal safety policy/evals | Open |
| R-019 | Two sync mechanisms overlap | Medium | Medium | Duplicate/out-of-order updates | Mobile + Backend | Contract tests/idempotency/ownership | Open |
| R-020 | AsyncStorage can hold large story/image data | High | Medium | Device failures | Mobile | File storage, quotas, cleanup | Open |
| R-021 | Repository/license/asset rights unresolved | High | Medium | Distribution ambiguity | Legal + Leadership | License and asset inventory | Open |
| R-022 | Provider/model deprecation | Medium | High | Generation outage | AI Platform | Model registry and synthetics | Open |
| R-023 | Documentation drift | High | High | False release assurance | Tech Writing + Owners | Generated inventories and claim checks | Open |

# Technical Debt Register

| Priority | Debt | Effort | Impact | Recommendation |
|---|---|---:|---|---|
| P0 | Consent/privacy/account/deletion reconciliation | L | Critical | Treat as product/security program |
| P0 | Audio Voice Chat policy redesign | L | Critical | Disable until complete |
| P0 | Current-main CI and branch protection | S-M | High | Required merge gate |
| P0 | Production/device release evidence | M | High | Repeatable evidence bundle |
| P1 | Atomic rate limiting + hard cost budgets | M | High | Managed atomic primitive |
| P1 | Chat migration/index/TLS/retention | M | High | Versioned database hardening |
| P1 | Liveness/readiness/metrics/SLO redesign | M | High | Durable observability |
| P1 | Canonical domain/deployment topology | M | High | One supported matrix |
| P1 | Unified chat service/policy | M-L | Critical | One path for text/audio |
| P2 | OpenAPI generation + contract tests | M | Medium | Generate from Zod |
| P2 | Durable object storage for generated media | M-L | Medium | Blob/CDN |
| P2 | Mobile E2E/accessibility/device lab | M-L | High | Maestro/Detox + physical devices |
| P2 | SBOM, license, SAST, secret-history scan | M | Medium | CI security jobs |
| P2 | Storage quotas/migrations | M | High | File system + lifecycle |
| P3 | Queue for video/background work | L | Medium | Only after feature approval |
| P3 | Central audited feature flags | M | Medium | Progressive rollout/kill switch |

# Release Blockers

## Critical

### B-C01 — Parent notice and consent are not truthful

**Evidence:** `app/privacy.tsx`, `app/parental-consent.tsx`, `lib/AuthContext.tsx`, cloud sync, chat/audio routes.  
**Impact:** parents cannot make an informed decision; release/legal/store risk.  
**Resolution:** approve target data map, fix implementation/copy, bump consent version, re-consent, and test every disclosure.

### B-C02 — Audio Voice Chat safety is incomplete

**Evidence:** `server/replit_integrations/audio/routes.ts`; compare with safer `chat/routes.ts`.  
**Impact:** child receives uncapped, unguarded audio-model output based on persisted transcripts.  
**Resolution:** disable; unified policy service; mandatory system guard; capped context; sanitization; output moderation; red-team/evals.

### B-C03 — Complete remote deletion/account deletion is absent

**Evidence:** settings flow purges sync + local + sign-out, but no chat bulk delete or auth-user delete.  
**Impact:** parental deletion does not cover all retained data.  
**Resolution:** re-authenticated orchestration and audit-tested deletion.

### B-C04 — Child/provider compliance evidence is missing

**Evidence:** provider integrations and optional child-name/age/audio transmission.  
**Impact:** COPPA/provider/app-store exposure.  
**Resolution:** remove child PI for first release or complete legal/provider controls.

## High

- B-H01: Current-main CI and branch protection not proven.
- B-H02: Cloud Run/Vercel/EAS/store/device validation missing.
- B-H03: Atomic limiter and hard account/day cost limits missing.
- B-H04: Strict readiness/alert delivery/SLOs missing.
- B-H05: Chat TLS/indexes/constraints/retention unresolved.
- B-H06: Canonical domains, CORS, deep links, and redirects unresolved.
- B-H07: Backup/restore and rollback drill unverified.
- B-H08: Detailed diagnostics are public.
- B-H09: Cloud sync and deletion not device-E2E validated.
- B-H10: Dependency/license/secret/security scan evidence missing.

## Closed or Downgraded Since Initial Audit

| Former blocker | Current state |
|---|---|
| Cloud Run buildpack launches Expo dev server | **Code fixed and merged**; deployment validation remains High |
| Story safety only prompt-side | **Closed for story text** via server guard/regenerate/fallback + client fail-safe |
| No durable idempotency option | **Mitigated** with KV-backed idempotency; KV semantics still need operational validation |
| No live provider health | **Mitigated** with cached Anthropic/Gemini/ElevenLabs probes; readiness semantics remain weak |
| Delete-all only local | **Partially mitigated** by cloud-sync purge; chat/auth deletion remains Critical |
| Cloud sync implementation inert | **Code fixed** by mounting SyncManager and reconnect trigger; device validation remains High |

# Recommended Release Strategy

## Approach A — Recommended: Reduced-Scope Beta

Ship core stories, hero creation, illustrations, narration, local library/progress, consent, and parent controls. Cloud backup may remain off by default for a controlled parent cohort after device validation. Disable audio Voice Chat and Video. Remove child name/age from provider-bound requests.

**Recommendation:** adopt this approach.

## Approach B — Full Feature Launch

Includes accounts, cloud backup, audio Voice Chat, Video, and child personalization through providers. This requires the longest privacy/legal/safety/operations program and is not currently viable.

## Approach C — Internal Technical Preview

Employee/owner-only testing with synthetic personas, non-child data, restricted credentials, and no public store listing. Useful while critical work proceeds.

# Phased Release Plan

## Phase 0 — Release Freeze and Scope Control

- [ ] Set production `FEATURE_VOICE_CHAT_ENABLED=false`.
- [ ] Set production `FEATURE_VIDEO_ENABLED=false`.
- [ ] Keep content safety enabled; prevent production override without approval.
- [ ] Decide whether child name/age are removed from all server calls.
- [ ] Select canonical production web/API target.
- [ ] Name owners for privacy, safety, release, operations, and incident response.

## Phase 1 — Critical Remediation

### Privacy, Consent, and Lifecycle

- [ ] Produce a field-level data map and retention schedule.
- [ ] Rewrite in-app and web privacy/consent copy from actual behavior.
- [ ] Add parent-account disclosure, cloud-backup disclosure, transcript disclosure.
- [ ] Bump consent version and test re-consent.
- [ ] Implement bulk conversation deletion for current user.
- [ ] Implement Supabase account deletion with re-authentication.
- [ ] Make deletion idempotent and generate an operator-visible receipt.
- [ ] Complete counsel/provider/store review.

### Audio Safety

- [ ] Route audio transcript through shared sanitization.
- [ ] Prepend non-overridable child-safe system policy.
- [ ] Cap history by message count and token budget.
- [ ] Moderate transcript and assistant output.
- [ ] Add safe fallback, timeouts, aborts, and child-friendly errors.
- [ ] Build adversarial and age-appropriateness evaluation suite.
- [ ] Decide default transcript retention (recommended: none or very short).

### Security/Platform

- [ ] Replace rate limiter with atomic implementation.
- [ ] Add per-user/day generation and cost budgets.
- [ ] Fix PostgreSQL certificate verification.
- [ ] Add chat indexes, constraints, FK strategy, and retention migration.
- [ ] Protect metrics/provider diagnostics.

## Phase 2 — Enforced Quality Gate

- [ ] Ensure GitHub Actions runs on every PR and `main`.
- [ ] Require lockfile, install, lint, typecheck, unit/integration, audit, server build, web build.
- [ ] Add privacy-copy/data-map consistency test.
- [ ] Add OpenAPI/contract tests.
- [ ] Add cross-user RLS/chat isolation tests.
- [ ] Add deletion lifecycle tests.
- [ ] Add safety eval thresholds as a required check.
- [ ] Add SBOM, dependency, license, secret, SAST, and artifact provenance.

## Phase 3 — Production Operations

- [ ] Deploy exact release candidate to chosen target.
- [ ] Validate boot, static app, auth, generation, safety fallback, TTS, deletion.
- [ ] Configure Sentry releases, PII filters, alert routes, owners.
- [ ] Add external uptime and synthetic safe-story generation.
- [ ] Define SLOs/error budgets and dashboards.
- [ ] Verify Supabase RLS, backups, PITR, restore.
- [ ] Execute rollback, provider-outage, and deletion-failure drills.
- [ ] Document secret rotation and emergency kill switches.

## Phase 4 — Mobile Beta

- [ ] Build EAS internal-track artifacts from signed release commit.
- [ ] Test clean install, upgrade, offline, reconnect, background/foreground.
- [ ] Test consent, account, cloud sync, tombstone delete, purge, and account isolation.
- [ ] Run accessibility/device matrix on low-end Android and target iOS.
- [ ] Validate store privacy/data-safety declarations against implementation.
- [ ] Stage rollout with stop criteria and rollback plan.

# Roadmap

## Immediate / 0–14 Days

Critical privacy, deletion, audio disablement, CI repair, canonical deployment, and production evidence ownership.

## 30 Days

Atomic limiter/budgets, database hardening, liveness/readiness split, protected telemetry, OpenAPI/contracts, deployed smoke, device beta, backup/restore.

## 90 Days

Unified multimodal chat policy, durable media, mature safety evals, centralized feature controls, SLO/error-budget practice, automated compliance evidence, performance/storage migration.

## Long Term

- Privacy-preserving local personalization.
- Queue-backed video/media jobs only if approved.
- Provider-independent model registry and synthetic qualification.
- Durable distributed observability.
- Formal threat model and recurring security/privacy reviews.
- Data export/portability and verified lifecycle automation.

# Release Manager Checklist

## Development

- [ ] Release SHA/tag recorded.
- [ ] No unresolved Critical/required High blockers.
- [ ] Feature flags match approved scope.
- [ ] Generated files and migrations reviewed.
- [ ] Version/changelog/release notes updated.

## QA

- [ ] Current-main CI green.
- [ ] Unit/integration/contract/safety tests green.
- [ ] Physical-device matrix complete.
- [ ] Offline/reconnect/sync/deletion tests complete.
- [ ] Accessibility acceptance complete.
- [ ] No live provider calls in unit tests.

## Security

- [ ] Dependency/SBOM/license/secret/SAST results reviewed.
- [ ] Auth and cross-account isolation verified.
- [ ] Rate/cost abuse tests passed.
- [ ] TLS and security headers validated.
- [ ] Metrics/provider diagnostics protected.
- [ ] Voice Chat disabled or independently approved.

## Privacy and Compliance

- [ ] Data map and retention schedule approved.
- [ ] Direct notice/privacy/consent copy matches behavior.
- [ ] Consent version bumped if required.
- [ ] Provider DPAs/retention/training settings recorded.
- [ ] Store declarations match implementation.
- [ ] Export/deletion workflow tested and timed.
- [ ] Privacy request mailbox/process staffed.

## Infrastructure

- [ ] Canonical target selected.
- [ ] Immutable environment inventory captured.
- [ ] Secrets present/rotated without exposure.
- [ ] DB migrations applied and verified.
- [ ] RLS, backups, restore, and retention verified.
- [ ] Domains/TLS/CORS/deep links validated.

## Operations

- [ ] Health/readiness/synthetic monitors green.
- [ ] Sentry/log dashboards and notifications tested.
- [ ] SLOs and stop-ship thresholds agreed.
- [ ] On-call/incident/privacy escalation assigned.
- [ ] Rollback and provider-outage drills completed.
- [ ] Cost budgets and alerts tested.

## Rollback

- [ ] Previous artifact/revision identified.
- [ ] DB changes backward-compatible or rollback planned.
- [ ] Feature kill switches verified.
- [ ] Store rollout halt/revert documented.
- [ ] Rollback smoke checklist executed.

## Post-Release Verification

- [ ] Auth and consent journey.
- [ ] Safe story generation and forced safety fallback.
- [ ] Narration/image behavior.
- [ ] No Voice Chat/Video exposure when disabled.
- [ ] Sync opt-in/isolation/purge for approved cohort.
- [ ] Telemetry/alerts/cost reporting.
- [ ] Delete-all/account deletion.
- [ ] Error rates/latency/cost within stop criteria.

# GO Decision Record

| Field | Required entry |
|---|---|
| Release commit/tag | |
| Environment/store track | |
| Scope/flags | |
| Critical blockers closed | |
| Accepted risks and approvers | |
| Privacy/legal approval | |
| Security approval | |
| QA approval | |
| Operations approval | |
| Rollback owner | |
| Decision | GO / GO WITH CONDITIONS / NO GO |
| Decision time | |

## Findings

The project can reach a safe reduced-scope beta without solving every long-term architecture item. It cannot safely launch while parent notices are false, audio policy diverges, remote deletion is incomplete, and release evidence is absent.

## Recommendations

Prioritize truthfulness and reversibility over feature completeness. Disable risky optional features, make every retained datum discoverable/deletable, and require reproducible evidence before promotion.

## Next Actions

Create owner-assigned issues for B-C01 through B-C04 and B-H01 through B-H10, linked to PR #352 and a release milestone.

## Claims Check

The Cloud Run code defect is closed; deployment validation is not. Story output safety is implemented; audio safety is not. Cloud-sync purge exists; full account/chat deletion does not.

## Version History

| Version | Date | Change |
|---|---|---|
| 1.1 | 2026-07-15 | Re-baselined risks, closed obsolete blockers, and updated release plan. |
| 1.0 | 2026-07-11 | Superseded initial register. |
