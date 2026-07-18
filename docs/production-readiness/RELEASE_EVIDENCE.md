# Release Evidence Record

**Updated:** 2026-07-18  
**Release posture:** **NO GO**  
**Canonical ledger:** [Issue #370](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/issues/370)  
**Pre-remediation main:** `9dd95ecb9f4148754fed7be2d8b94685ec55fa6a`  
**Remediation branch:** `release/exact-sha-remediation-2026-07-18`  
**Current remediation head:** `fc507e688f1db00779160e9939395275303b3675`

The prior release evidence in issue #355 and earlier revisions of this file is historical evidence for candidate `6dc92a55c90594f9bc3602cbec6613a47875294d`. Because the repository changed afterward, that downstream evidence is **STALE** for the current release train.

## Current evidence ledger

| Control | Status | Candidate | Evidence / blocker |
|---|---|---|---|
| Canonical repository | PASS | `9dd95ec...` discovery baseline | Private `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`; public personal copy is non-canonical. |
| Controlled remediation | PENDING REVIEW | `fc507e6...` branch head | Voice containment, deletion receipt attestation, release identity, health/privacy cache control, and evidence-workflow hardening are on the remediation branch. |
| Required repository gates | PENDING | `fc507e6...` | A pull-request CI run must pass locked install, preflight, lint, Vitest, jest-expo component tests, typecheck, critical audit, server build, Expo compatibility, and web export. |
| Security scan | PENDING | `fc507e6...` | Exact remediation-head security workflow required. |
| Dependency stabilization | PENDING | `fc507e6...` | PR #369 was closed unmerged as an empty, superseded, failing change. The SDK 55 alignment already merged through PR #368; exact remediation-head Expo check remains required. |
| Privacy truth and consent attestation | FAIL | `fc507e6...` | Consent is versioned and timestamped, but the persisted record still lacks disclosure-content hash, locale, and verification method. This remains a release blocker rather than a partial unverified migration. |
| Account deletion and receipt | PASS IN CODE / LIVE PENDING | `fc507e6...` | Receipt v2 is PII-free, issued only after ordered server deletion, and includes the deployed release SHA or an honest null when runtime identity is unavailable. Live deployed deletion and post-deletion absence proof remain required. |
| Authentication and authorization | PASS IN CODE / LIVE PENDING | `fc507e6...` | Existing `/api` auth gates remain; deployed adversarial proof remains required. |
| Voice/audio containment | PASS IN CLIENT CODE / RUNTIME PENDING | `fc507e6...` | Client route is static and contains no microphone permission, recording, audio runtime, transcript fetch, or conversation/TTS request. Server feature flag and provider configuration must still be verified disabled in the deployed environment. |
| Live User A/User B isolation | STALE | `6dc92a5...` | Historical disposable-branch proof in #355 must be rerun against the final frozen candidate. |
| Database migration readiness | PENDING | TBD frozen candidate | Migration validation and disposable isolation proof required; no production mutation is authorized by this record. |
| Exact-SHA release workflow | PASS IN CODE / RUN PENDING | `fc507e6...` | Workflow requires exact SHA, immediately posts run ID/URL, verifies checkout, separates approval-gated reporting, uploads artifacts on failure, emits machine-readable manifests, and records SHA-256 checksums. An authoritative run is still required after merge/freeze. |
| Canonical deployment | BLOCKED | TBD frozen candidate | Vercel must be connected to the private canonical repository and expose the exact SHA through `/api/health`. |
| HTTPS health/privacy smoke | BLOCKED | TBD frozen candidate | Requires a canonical exact-SHA deployment. |
| EAS internal Android build | PENDING | TBD frozen candidate | Exact-candidate build ID, artifact URL, checksum, profile, and timestamp required. |
| Physical-device matrix | PENDING | TBD frozen candidate | Android minimum/current and current iOS evidence required. |
| Alert delivery | PENDING | TBD frozen candidate | Sentry event emission is not notification proof; event ID plus received destination evidence is required. |
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
