# Release Evidence Record

**Updated:** 2026-07-19  
**Release posture:** **NO GO**  
**Canonical ledger:** [Issue #376](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/issues/376)<br>
**Stabilization baseline:** `fb6938b98abdd6946332102dbaad08d9fcfdd71e`<br>
**Stabilization branch:** `agent/release-salvage-stabilization`<br>
**Frozen candidate:** Unavailable until this branch is independently reviewed and merged. GitHub branch/PR metadata is authoritative for the mutable head.

Issue #370, issue #355, PR #354, and evidence for earlier candidates remain historical. PR #354 was merged on 2026-07-16 before the requested external evidence was complete; that merge is code integration, not release approval. Because repository and provider state changed afterward, downstream evidence tied to earlier SHAs is **STALE** for the current release train.

## Current evidence ledger

| Control | Status | Candidate | Evidence / blocker |
|---|---|---|---|
| Canonical repository | PASS IN REPOSITORY / VERCEL LINK FIXED / MIRROR + REPLIT PENDING | discovery baseline | Private `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5` is canonical and `package.json` points to it. Vercel project linkage was verified. Replit linkage and public mirror archive still require external correction. |
| Controlled remediation | PENDING REVIEW | stabilization PR head | PR #377 now includes release-proof stabilization, serverless privacy publication, provider privacy routing, and evidence documents. Merge remains remediation delivery only. |
| Required repository gates | PENDING CURRENT HEAD | stabilization PR head | Exact-head CI must pass locked install, preflight, zero-warning lint, Vitest, jest-expo component tests, typecheck, high-severity audit, server build, Expo compatibility, and web export after the latest evidence/privacy commits. |
| Security scan | PENDING CURRENT HEAD | stabilization PR head | Exact-head Security Agent and CodeQL runs required after the latest commits. |
| Dependency stabilization | PENDING CURRENT HEAD | stabilization PR head | Release workflows block high/critical advisories. Exact-head audit and Expo compatibility artifacts remain required. |
| Privacy truth and consent attestation | PASS IN CODE / COUNSEL BLOCKED | stabilization PR head | Consent stores version 3, exact disclosure SHA-256, timestamp, locale, and parent-gate method. Current engineering review is in `PRIVACY_COPPA_REVIEW_2026-07-19.md`. Free-text PI, provider evidence, VPC determination, Sentry, and named counsel approval remain open. |
| Provider agreements/configuration | BLOCKED | stabilization PR head | `PROVIDER_AGREEMENTS_AND_CONFIGURATION_EVIDENCE.md` records the actual chain and public terms. No account-specific accepted DPA/configuration evidence was found. OpenRouter requests now require ZDR and deny collecting endpoints, but dashboard/endpoint evidence remains required. |
| Apple/Google disclosures | DRAFTED / NOT SUBMITTED | stabilization PR head | Proposed answers and required exports are in `APPLE_GOOGLE_DATA_DISCLOSURE_PACKET.md`. Authorized console submission and acceptance evidence are absent. |
| Account deletion and receipt | DATABASE PASS / DEPLOYED APP + DEVICE PENDING | stabilization PR head | Unit tests cover ordering/receipt failure modes. A rollback-only disposable Supabase PR-branch proof left 0 Auth users, sync records, conversations, and messages. See `DELETION_E2E_EVIDENCE_2026-07-19.md`. Authenticated endpoint, token revocation, and device storage proof remain required. |
| Authentication and authorization | PASS IN CODE / LIVE PENDING | stabilization PR head | Existing `/api` Supabase auth gates remain; deployed adversarial proof remains required. |
| Voice/audio containment | PASS IN CODE / PHYSICAL DEVICE PENDING | stabilization PR head | Client has no microphone permission/runtime route; observed preview reported Voice Chat false and TTS unavailable before later commits. Current-head server and exact native artifacts must be rerun. See `VOICE_CHAT_PHYSICAL_DEVICE_TEST_MATRIX.md`. |
| Live User A/User B isolation | STALE | `6dc92a5...` | Historical disposable-branch proof in #355 must be rerun against the final frozen candidate. |
| Database migration readiness | PREVIEW BRANCH HEALTHY / PRODUCTION HISTORY FAIL | stabilization PR head | Disposable PR #377 branch is active. Database deletion cascade proof passed there. Protected/default branch still reports migration-history failure and must be reconciled before production DDL. |
| Exact-SHA release workflow | PASS IN CODE / RUN PENDING | stabilization PR head | Workflow requires exact SHA, checkout verification, strict gates, received-alert evidence, manifests, and checksums. An authoritative post-merge run remains required. |
| Canonical deployment | MECHANISM VERIFIED / CONFIG CONTRADICTION / FROZEN-CANDIDATE RUN PENDING | main baseline, not frozen | Vercel metadata verifies canonical linkage. Vercel Node `24.x` conflicts with repository engines. Do not promote the stabilization candidate before review. |
| HTTPS health/privacy smoke | OLD HEALTH PASS / PRIVACY FIX IN REVIEW | mutable PR head | Previous production health smoke passed but `/privacy` failed from a serverless filesystem assumption. The branch now serves a bundled self-contained notice and tests it; exact-head preview and final production HTTP 200 evidence are pending. |
| EAS internal Android build | PENDING | TBD frozen candidate | Exact-candidate build ID, artifact URL, checksum, profile, and timestamp required. |
| Physical-device matrix | PENDING | TBD frozen candidate | Android minimum/current and current iOS evidence required, including Voice containment and deletion cleanup. |
| Alert delivery | PENDING | TBD frozen candidate | Finalization requires a received-notification evidence URL; event send alone is insufficient. |
| Backup restore | PENDING | TBD frozen candidate | Disposable restore target, timing, row/schema checks, isolation rerun, and cleanup proof required. |
| Rollback drill | PENDING | TBD frozen candidate | Prior/candidate deployment IDs, timing, post-rollback identity, smoke, compatibility, and recovery time required. |
| Privacy/legal/provider approval | BLOCKED | TBD frozen candidate | Named human approval and authoritative provider/store records are required. |
| Public mirror archive | FAIL | N/A | Live repository metadata for `Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main` remains `archived: false`; a repository-level archive action and metadata recheck are required. |
| Final release decision | PENDING | TBD frozen candidate | **NO GO retained. No release approval has been issued.** |

## Physical-device matrix

| Platform | Device/OS | Artifact checksum | Fresh/upgrade install | Consent | Core flow | Offline/reconnect | Isolation | Delete + receipt | Accessibility | Disabled features | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Android | Minimum supported |  |  |  |  |  |  |  |  |  | PENDING |
| Android | Current target |  |  |  |  |  |  |  |  |  | PENDING |
| iOS | Current supported |  |  |  |  |  |  |  |  |  | PENDING |

## Evidence acceptance rule

A row receives release credit only when it contains the exact frozen candidate, authoritative source, direct accessible evidence, timestamp, operator identity, sanitized result, checksum/attestation where applicable, and independent review with no contradiction against live state.

A merge delivers remediation only. It is not release approval. Any later code, dependency, workflow, migration, privacy-copy, build, provider, or runtime configuration change creates a new candidate and invalidates downstream evidence.
