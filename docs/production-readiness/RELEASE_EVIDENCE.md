# Release Evidence Record

**Updated:** 2026-07-19  
**Release posture:** **NO GO**  
**Canonical ledger:** [Issue #376](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/issues/376)<br>
**Stabilization baseline:** `fb6938b98abdd6946332102dbaad08d9fcfdd71e`<br>
**Stabilization branch:** `agent/release-salvage-stabilization`<br>
**Frozen candidate:** Unavailable until this branch is independently reviewed and merged. GitHub branch/PR metadata is authoritative for the mutable head.

Issue #370, issue #355, and evidence for earlier candidates remain historical. Because repository and provider state changed afterward, that downstream evidence is **STALE** for the current release train.

## Current evidence ledger

| Control | Status | Candidate | Evidence / blocker |
|---|---|---|---|
| Canonical repository | PASS IN REPOSITORY / VERCEL LINK FIXED / MIRROR + REPLIT PENDING | discovery baseline | Private `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5` is canonical and `package.json` now points to it. 2026-07-19: Vercel project relinked to the canonical repo and verified (see `VERCEL_RELINK_2026-07-19.md`). Replit link and the public mirror still require external correction. |
| Controlled remediation | PENDING REVIEW | stabilization PR head | Narrow workflow, evidence, documentation, and migration-history stabilization is in progress. Merge remains remediation delivery only. |
| Required repository gates | PENDING | stabilization PR head | Exact-head CI must pass locked install, preflight, zero-warning lint, Vitest, jest-expo component tests, typecheck, high-severity audit, server build, Expo compatibility, and web export. |
| Security scan | PENDING | stabilization PR head | Exact-head Security Agent and CodeQL runs required. |
| Dependency stabilization | PENDING | stabilization PR head | Release workflows block high/critical advisories. Exact-head audit and Expo compatibility artifacts remain required. |
| Privacy truth and consent attestation | PASS IN CODE / HUMAN APPROVAL BLOCKED | stabilization PR head | Acceptance stores version 3, exact disclosure SHA-256, timestamp, locale, and arithmetic parent-gate method. Navigation and sync reject legacy/mismatched records. Public and in-app notices state Voice Chat is unavailable. External legal/provider/store approval remains a human gate. |
| Account deletion and receipt | PASS IN CODE / LIVE PENDING | stabilization PR head | Receipt v2 is PII-free, resolves an exact release SHA before destructive work, and returns no completed receipt on partial failure. Live deployed deletion and post-deletion absence proof remain required. |
| Authentication and authorization | PASS IN CODE / LIVE PENDING | stabilization PR head | Existing `/api` Supabase auth gates remain; deployed adversarial proof remains required. |
| Voice/audio containment | PASS IN CLIENT CODE / RUNTIME PENDING | stabilization PR head | Client route is static and contains no microphone permission, recording, audio runtime, transcript fetch, or conversation/TTS request. Server feature flag and provider configuration must still be verified disabled in the deployed environment. |
| Live User A/User B isolation | STALE | `6dc92a5...` | Historical disposable-branch proof in #355 must be rerun against the final frozen candidate. |
| Database migration readiness | FAIL / FIX IN REVIEW | stabilization PR head | Supabase branch logs report remote migration versions missing from the repository. Exact remote history filenames are reconciled and a forward RLS optimization is proposed; disposable preview-branch application and isolation proof are still required. No production DDL is authorized by this record. |
| Exact-SHA release workflow | PASS IN CODE / RUN PENDING | stabilization PR head | Workflow requires exact SHA, immediately posts run ID/URL, verifies checkout, enforces strict lint/high audit, requires received-alert evidence during finalization, uploads machine-readable manifests, and records SHA-256 checksums. An authoritative post-merge run is still required. |
| Canonical deployment | MECHANISM VERIFIED / CONFIG CONTRADICTION / FROZEN-CANDIDATE RUN PENDING | `main` @ `6d39ab93...` (not frozen) | Vercel metadata verifies canonical repository linkage and production deployment `dpl_6i2w8vTTKV5fcDSAspA6NZWqo6BU`. Vercel reports Node `24.x`, which conflicts with repository engines (`20.19` or `22.13` ranges). Do not change provider configuration or deploy the stabilization candidate before review. |
| HTTPS health/privacy smoke | HEALTH PASS / PRIVACY FAIL | `main` @ `6d39ab93...` (not frozen) | 2026-07-19: health smoke passed on the custom domain (200, `status: ok`, exact SHA). `/privacy` returned 404 — pre-existing serverless template-path defect on `main` (`server/templates` not found at `process.cwd()` in the Vercel function), previously masked by the domain-level 404. Requires its own fix, then rerun on the frozen candidate. |
| EAS internal Android build | PENDING | TBD frozen candidate | Exact-candidate build ID, artifact URL, checksum, profile, and timestamp required. |
| Physical-device matrix | PENDING | TBD frozen candidate | Android minimum/current and current iOS evidence required. |
| Alert delivery | PENDING | TBD frozen candidate | Finalization now requires a non-placeholder HTTPS received-notification evidence URL. Sentry event emission alone remains insufficient. |
| Backup restore | PENDING | TBD frozen candidate | Disposable restore target, timing, row/schema checks, isolation rerun, and cleanup proof required. |
| Rollback drill | PENDING | TBD frozen candidate | Prior/candidate deployment IDs, timing, exact post-rollback identity, smoke, compatibility, and recovery time required. |
| Privacy/legal/provider approval | BLOCKED | TBD frozen candidate | Human approval and authoritative provider/store declarations are required. |
| Public mirror archive | FAIL | N/A | `Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main` remains `archived: false`; a repository-level archive setting and metadata recheck are required. |
| Final release decision | PENDING | TBD frozen candidate | **NO GO retained. No release approval has been issued.** |

## Physical-device matrix

| Platform | Device/OS | Artifact checksum | Fresh/upgrade install | Consent | Core flow | Offline/reconnect | Isolation | Delete + receipt | Accessibility | Disabled features | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Android | Minimum supported |  |  |  |  |  |  |  |  |  | PENDING |
| Android | Current target |  |  |  |  |  |  |  |  |  | PENDING |
| iOS | Current supported |  |  |  |  |  |  |  |  |  | PENDING |

## Evidence acceptance rule

A row receives release credit only when it contains the exact frozen candidate, authoritative source, direct accessible evidence, timestamp, operator identity, sanitized result, checksum/attestation where applicable, and independent review with no contradiction against live state.

A merge delivers remediation only. It is not release approval. Any later code, dependency, workflow, migration, privacy-copy, build, provider, or runtime configuration change creates a new candidate and invalidates downstream evidence.
