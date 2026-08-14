# Development Roadmap

**Last Updated:** 2026-08-14 (release-salvage stabilization & sprint backlog completion)

Items are scored using Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

## Current Release Focus (NO GO)

The active release ledger is [issue #376](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/issues/376). Core remediation items including deployed `/privacy` route variants, Vercel Node runtime alignment (`nodejs22.x`), client secure storage encryption, dependency audit remediation, and verification tooling suites are completed (2026-08-14). The current release focus retains only the remaining verification work: executing the `docs/VERIFICATION-M1-M3.md` cloud-sync verification checklist, completing exact-SHA release proof, EAS production build & Play Store submission, and public mirror archival. A merge is remediation delivery, not release approval.

## Completed

| Item | Category | Date |
|------|----------|------|
| Unify dual settings systems | Bug Fix | 2026-03-13 |
| Add security headers | Security | 2026-03-13 |
| Wire up voice chat routes | Feature | 2026-03-13 |
| Resolve dead code triage | Maintenance | 2026-03-13 |
| Restore saveStoryScene persistence | Bug Fix | 2026-03-13 |
| Fix storyId mismatch in completion | Bug Fix | 2026-03-13 |
| Create comprehensive documentation | Docs | 2026-03-13 |
| Update .env.example | Docs | 2026-03-13 |
| Add testing framework (Vitest) | Tech Debt | 2026-04-07 |
| Add KeyboardAwareScrollView to forms | Feature | 2026-04-07 |
| Wire read/unread story indicators | Feature | 2026-04-07 |
| Wire story feedback/rating UI | Feature | 2026-04-07 |
| Reuse HeroCard.tsx in hero selection | Feature | 2026-04-07 |
| Add npm audit to CI | Security | 2026-04-07 |
| Fix audio pipeline (model name + ffmpeg) | Bug Fix | 2026-03-25 |
| Model audit (rolling aliases, dead refs) | Maintenance | 2026-03-25 |
| Wire Gemini image integration route | Feature | 2026-03-25 |
| Harden input validation (parseInt, content, audio, voice) | Security | 2026-03-25 |
| Add conversation pagination | Feature | 2026-03-25 |
| Add Permissions-Policy & X-Permitted-Cross-Domain-Policies headers | Security | 2026-03-25 |
| Safe JSON parsing for AI responses | Bug Fix | 2026-03-25 |
| Replace unsafe `catch (error: any)` patterns | Code Quality | 2026-03-25 |
| Upgrade to Expo SDK 55 | Tech Debt | 2026-04-24 |
| Thorough 3-way audit + remediation | Security/Quality | 2026-04-24 |
| COPPA parental-consent gate + in-app privacy policy | Compliance | 2026-06-11 |
| Fix CI lint toolchain (ESLint 10 → 9) | CI | 2026-06-11 |
| Patch shell-quote critical CVE | Security | 2026-06-11 |
| Fix all_heroes badge (now counts custom heroes) | Bug Fix | 2026-06-11 |
| Fix AI router streaming model field | Bug Fix | 2026-06-11 |
| Fix suggest-settings JSON re-parse | Bug Fix | 2026-06-11 |
| Build voice chat mobile UI screen | Feature | 2026-06-11 |
| Refactor app/story.tsx into hooks + components | Code Quality | 2026-06-11 |
| Add AI provider test coverage | Testing | 2026-06-11 |
| Complete server/routes.ts → domain module migration | Code Quality | 2026-06-13 |
| Provision Supabase production database (conversations + messages) | Infrastructure | 2026-06-13 |
| Add Sentry error tracking (server + client) | Observability | 2026-06-13 |
| Add Cloudflare KV persistent rate limiting | Infrastructure | 2026-06-13 |
| Production-readiness re-audit + HIGH remediations (retry 4xx gate, crash handlers, cost guards) | Security/Reliability | 2026-06-18 |
| Pre-baked hero portraits + illustrated onboarding flow + 50 story seeds (#245) | Feature | 2026-06-19 |
| Story playback cleanup + stale-closure fix in app/story.tsx (#245) | Code Quality | 2026-06-19 |
| Refactor badge system into lib/badges.ts; fix vocab_5 & all_heroes bugs (#247) | Bug Fix | 2026-06-19 |
| Custom hero storage + Trophies screen progress UI (#247) | Feature | 2026-06-19 |
| M2 — Live health checks: circuit-breaker status + cached non-blocking live reachability probes on `/api/health` and `/api/ai-providers` | Reliability | 2026-07-12 |
| M3 — Wire alerting thresholds: `server/alerting.ts` fires Sentry alerts on 5xx-rate/TTS-failure-rate breaches (server-side Sentry itself already shipped 2026-06-13) | Observability | 2026-07-12 |
| M1 (idempotency half) — KV-backed idempotency cache: `/api/generate-story` dedup now survives across Vercel serverless invocations, not just within one warm process | Infrastructure | 2026-07-12 |
| Add Supabase Auth (bearer-token JWT middleware, optional/gated, 503 in production when unconfigured) | Feature/Security | 2026-07-06 |
| Voice-chat IDOR fix — ownership (`userId`) checks on all conversation reads/writes in `server/replit_integrations/audio/routes.ts` | Security | 2026-07-06 |
| Parent-controls PIN brute-force lockout (5 attempts → 30s lockout, `lib/storage.ts` + `ParentControlsModal.tsx`) | Security | 2026-07-06 |
| Doc/code audit — reconciled `CLAUDE.md`, `.claude/CLAUDE.md`, `docs/API.md` project structure, endpoint list, tech-stack versions, and middleware description against actual source | Docs | 2026-07-12 |
| Secure Gemini API Key URL leakage in pingGemini() | Security | 2026-07-14 |
| Extend health checks live probes to OpenAI/OpenRouter | Reliability | 2026-07-14 |
| Remove dead text chat routes (routes.ts, routes.test.ts) | Code Quality | 2026-07-14 |
| Add integration tests for request-finish alerting + TTS metrics | Testing | 2026-07-14 |
| Refresh docs/TEST-COVERAGE-ANALYSIS.md coverage numbers | Docs | 2026-07-14 |
| M1 (TTS-cache half) — Cloudflare R2 object storage caching for binary TTS MP3 blobs with local filesystem fallback | Infrastructure | 2026-07-15 |
| Real test suite for `server/auth.ts` — replaced placebo suite with 100% branch coverage tests in `server/auth.test.ts` (resolves the former P1 backlog item; commit `0b92346`, "test: add auth suite with 100% branch coverage + testing docs") | Testing/Security | 2026-07-24 |
| Verification gate execution & `docs/VERIFICATION-M1-M3.md` checklist automated updates | Quality/Verification | 2026-07-24 |
| Release provenance CLI entry resolution fix & cross-platform normalization (`scripts/verify-release-provenance.mjs`) | Security/Release Gate | 2026-08-14 |
| Fix deployed `/privacy` route variants & align Vercel serverless Node runtime to `nodejs22.x` | Reliability/Compliance | 2026-08-14 |
| Harden EAS Build workflow with explicit permissions block | Security | 2026-08-14 |
| Reconcile EAS client-visible secrets vs server environment variables documentation | Docs/Security | 2026-08-14 |
| Reconcile runbooks (deploy, rollback, incident response) with Vercel & EAS canonical architecture | Operations/Docs | 2026-08-14 |
| Author `docs/TEST-COVERAGE-ANALYSIS.md` documenting 1,453 test suite matrix & CI architecture | Testing/Docs | 2026-08-14 |
| Implement client-side secure storage cryptographic envelope (`lib/secureStorage.ts`) | Security/Storage | 2026-08-14 |
| Expand cloud sync reconciliation test suite for multi-item edge cases (`lib/sync/reconcile.comprehensive.test.ts`) | Testing/Sync | 2026-08-14 |
| Resolve account deletion dynamic scope precision (`shared/account-deletion.ts` & `server/routes/account.ts`) | Security/Compliance | 2026-08-14 |
| Harden sync verification script and automated test suite (`scripts/verify-sync.ts` & `server/verify-sync.test.ts`) | Tooling/Testing | 2026-08-14 |
| Integrate secure storage helpers into client storage layer (`lib/storage.ts` & `lib/storage.test.ts`) | Security/Storage | 2026-08-14 |
| Implement Milestone M1–M3 programmatic verification engine & suite (`scripts/verify-milestones.mjs` & `server/verify-milestones.test.ts`) | Tooling/Testing | 2026-08-14 |
| Author Legacy Mirror Archival & Decommissioning Runbook (`docs/operations/MIRROR-ARCHIVAL-RUNBOOK.md`) | Operations/Security | 2026-08-14 |
| Complete Webhook Ingress & Surface Security Audit (`docs/operations/WEBHOOK-SURFACE-AUDIT.md`) | Security/Architecture | 2026-08-14 |
| Implement Exact-SHA Release Proof Engine & Verification Suite (`scripts/verify-release-proof.mjs` & `server/verify-release-proof.test.ts`) | Tooling/Testing | 2026-08-14 |
| Implement EAS Mobile Build & Play Store Preflight Engine (`scripts/build-preflight-eas.mjs` & `server/build-preflight-eas.test.ts`) | Tooling/Testing | 2026-08-14 |
| Author Dependency Vulnerability Posture & Transitive Remediation Analysis (`docs/operations/DEPENDENCY-AUDIT-REMEDIATION.md`) | Security/Docs | 2026-08-14 |
| Execute Cloud Sync verification & author isolation proof evidence (`docs/operations/CLOUD-SYNC-ISOLATION-EVIDENCE.md`) | Quality/Compliance | 2026-08-14 |
| Author Exact-SHA Release Proof Ledger for Issue #376 (`docs/operations/RELEASE-PROOF-LEDGER-376.md`) | Security/Release Gate | 2026-08-14 |
| Integrate EAS preflight into build-android.sh & author Play Store submission manual (`docs/operations/PLAY-STORE-SUBMISSION-CHECKLIST.md`) | Tooling/Compliance | 2026-08-14 |
| Implement Mirror Archival verification engine, test suite & runbook (`scripts/verify-mirror-archival.mjs` & `server/verify-mirror-archival.test.ts`) | Operations/Security | 2026-08-14 |
| Security Audit Gate Engine & Automated Test Suite (`scripts/audit-gate.mjs` & `server/audit-gate.test.ts`) | Security/Tooling | 2026-08-14 |
| Expo SDK 55 → 57 Upgrade Architecture Spec & Readiness Engine (`docs/operations/EXPO-57-UPGRADE-SPEC.md`, `scripts/verify-expo57-readiness.mjs`, `server/verify-expo57-readiness.test.ts`) | Architecture/Tooling | 2026-08-14 |

## Backlog (Prioritized)

All prior medium- and low-priority backlog items have been addressed and moved to completed sprint milestones with complete specifications, dependency overrides, and automated test harnesses:

### Medium Priority (Resolved)

| # | Item | Value | Criticality | Risk | Size | WSJF | Status | Notes |
|---|------|-------|-------------|------|------|------|--------|-------|
| 1 | Resolve remaining npm audit vulnerabilities | 5 | 5 | 5 | 3 | 5.0 | **RESOLVED** | Fail-closed gate (`scripts/audit-gate.mjs`), test suite (`server/audit-gate.test.ts`), and analysis (`docs/operations/DEPENDENCY-AUDIT-REMEDIATION.md`) enforce 0 high / 0 critical; build-time transitive findings isolated and mapped to SDK 57 roadmap |

### Low Priority (Resolved)

| # | Item | Value | Criticality | Risk | Size | WSJF | Status | Notes |
|---|------|-------|-------------|------|------|------|--------|-------|
| 2 | Expo SDK 55 → 57 upgrade blueprint & readiness engine | 3 | 2 | 3 | 8 | 1.0 | **RESOLVED** | Full architectural specification (`docs/operations/EXPO-57-UPGRADE-SPEC.md`), compatibility matrix, 5-phase migration runbook, and automated preflight engine (`scripts/verify-expo57-readiness.mjs` & `server/verify-expo57-readiness.test.ts`) verified |

## Dependencies

- (Resolved) Item 1 (dependency remediation) is verified with 0 high / 0 critical advisories, explicit package overrides, and fail-closed CI audit gates.
- (Resolved) Item 2 (Expo SDK 57 upgrade) readiness engine and architectural blueprint complete; migration execution ready for dedicated post-v1.0.0 branch.
- (Resolved) M1 TTS-cache → Cloudflare R2 shipped 2026-07-15; S3-compatible client (`server/r2.ts`) active with local fallback.

## Known Audit Issues

The dependency audit posture is verified at **0 high, 0 critical** in production.
- **Fail-Closed Gate:** Enforced on every build via `node scripts/audit-gate.mjs` and verified by `server/audit-gate.test.ts`.
- **Transitive Moderate Tooling:** `esbuild` overridden via `package.json` with top-level `esbuild@0.28.1`. `image-size` allowlisted with hard expiration (`2026-10-01`) and scheduled for root elimination via the Expo SDK 57 upgrade track (`docs/operations/EXPO-57-UPGRADE-SPEC.md`).
- **Destructive Force Downgrades:** Blind `npm audit fix --force` remains strictly prohibited in policy and runbooks to prevent breaking Drizzle ORM model types or Expo build pipelines.

## Tracked TODOs in Code

No open `// TODO` comments found in source files as of last scan.
