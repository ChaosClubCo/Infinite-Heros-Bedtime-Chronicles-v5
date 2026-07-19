<!-- Last verified: 2026-07-19 -->
<!-- docs/ROADMAP.md is the actively-maintained backlog; this file is in sync with it. -->

# TODO.md — Prioritized Backlog

Items scored with Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

Scale: H = 8, M = 5, S = 3, L = 1 for Value/Criticality/Risk. S = 2, M = 5, L = 8 for Size.

---

## Ready (Backlog — Prioritized)

### High Priority

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | EAS build & Play Store submission | Deployment | H | H | H | M | 4.8 | ready | eas.json + build-android.sh + DEPLOYMENT.md all set; needs EAS secrets + `EXPO_TOKEN` (ChaosClubCo) + AAB build |
| 2 | Verify M3 cloud sync end-to-end on a device | Reliability | M | M | H | S | 6.0 | ready | Built + unit-tested but "NOT yet verified on a device" (CLAUDE.md); needs an installable build (Item 1); harness scripts/verify-sync.ts |
| 3 | Resolve remaining npm audit vulnerabilities | Security | M | M | M | S | 5.0 | blocked | 4 moderate vulnerabilities (esbuild, core-utils, esm-loader, drizzle-kit). 0 high/critical. Blocked on upstream updates |

### Low Priority

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 4 | Encrypt client-side AsyncStorage | Security | S | S | S | L | 1.1 | low-priority | Stored data is non-sensitive (story text, badges); not a current risk |
| 5 | M4 — native Kotlin audio engine | Feature | S | L | L | L | 0.6 | blocked | Requires ejecting managed Expo + archive/android-kotlin-rewrite/; see CLAUDE.md Merge Provenance |

---

## Completed

| Item | Category | Completed | Notes |
|:---|:---|:---|:---|
| Reconstruct, validate, and compile release deliverables bundle (v1) | Release Engineering | 2026-07-19 | Verified strict typecheck, ESLint, and all 1347 tests; built Express server bundle; exported static web build; generated manifest, reports, and complete release bundle ZIP. |
| Align Vercel serverless execution timeout configuration (60s -> 300s) | Infrastructure | 2026-07-17 | Raised execution timeout in vercel.json. |
| Synchronize best practice documentation with actual implementations | Docs | 2026-07-17 | Reconciled CLAUDE.md, etc. |
| Cloudflare R2 TTS-audio cache (M1 TTS-cache half) | Infrastructure | 2026-07-15 | server/r2.ts (S3-compatible client), wired into tts.ts behind writeWithLock; /tmp fallback; gated on R2_ENABLED. |
| Remove dead text chat routes (routes.ts, routes.test.ts) | Code Quality | 2026-07-14 | Removed dead routes file and its test file, and disabled it in chat/index.ts. |
| Secure Gemini API Key URL leakage in pingGemini() | Security | 2026-07-14 | Pass API key in x-goog-api-key header instead of query string. |
| Extend health checks live probes to OpenAI/OpenRouter | Reliability | 2026-07-14 | Wired up OpenAI and OpenRouter pings to /api/health LIVE_PROBE_PROVIDERS. |
| Add integration tests for request-finish alerting + TTS metrics | Testing | 2026-07-14 | Created server/index.integration.test.ts to test middleware and route integrations. |
| Refresh testing coverage numbers in documentation | Docs | 2026-07-14 | Updated code coverage metrics to 1347 passing tests. |
| M1 (idempotency half) — KV-backed idempotency cache | Infrastructure | 2026-07-12 | dedup story gen across serverless invocations. |
| M2 — Live health checks | Reliability | 2026-07-12 | circuit breaker status + cached probes on /api/health. |
| M3 — Wire alerting thresholds | Observability | 2026-07-12 | Sentry alerts on rate breaches. |
| Doc/code audit | Docs | 2026-07-12 | Reconciled CLAUDE.md, docs/API.md structures. |
| Add Supabase Auth (bearer-token JWT middleware) | Feature/Security | 2026-07-06 | Optional, gated on keys; 503 in production when unconfigured. |
| Fix voice-chat IDOR | Security | 2026-07-06 | Ownership checks on conversations. |
| Parent-controls PIN brute-force lockout | Security | 2026-07-06 | 5 failed attempts -> 30s lockout. |
| Production-readiness re-audit + HIGH remediations | Security/Reliability | 2026-06-18 | retry 4xx, crash handlers, cost guards. |
| Pre-baked hero portraits + illustrated onboarding flow + 50 story seeds (#245) | Feature | 2026-06-19 | Added hero portraits assets and seeds. |
| Story playback cleanup + stale-closure fix in app/story.tsx (#245) | Code Quality | 2026-06-19 | Refactored story screen. |
| Refactor badge system into lib/badges.ts; fix vocab_5 & all_heroes bugs (#247) | Bug Fix | 2026-06-19 | central badge helper. |
| Custom hero storage + Trophies screen progress UI (#247) | Feature | 2026-06-19 | grid + profile persistence. |
| Complete server/routes.ts migration | Code Quality | 2026-06-13 | Removed inline handlers; routes composer. |
| Provision Supabase production database | Infrastructure | 2026-06-13 | conversations + messages tables migrated. |
| Add Sentry error tracking | Observability | 2026-06-13 | node + react-native tracking. |
| Add Cloudflare KV persistent rate limiting | Infrastructure | 2026-06-13 | rate limit checks via KV. |
| Build voice chat mobile UI screen | Feature | 2026-06-11 | app/voice-chat.tsx. |
| Refactor app/story.tsx | Code Quality | 2026-06-11 | composition shell + hooks. |
| Add AI provider test coverage | Testing | 2026-06-11 | tests for all 4 providers. |
| COPPA parental-consent gate + privacy policy | Compliance | 2026-06-11 | gates and policy screens. |
| Fix CI lint toolchain (ESLint 10 -> 9) | CI | 2026-06-11 | Pinned ESLint and updated config. |
| Patch shell-quote critical CVE | Security | 2026-06-11 | Overrode dependency to clear vulnerability. |
| Fix all_heroes badge | Bug Fix | 2026-06-11 | Count custom heroes toward badge progress. |
| Fix AI streaming model field | Bug Fix | 2026-06-11 | Emits model ID instead of provider name. |
| Fix suggest-settings JSON re-parse | Bug Fix | 2026-06-11 | Reuses pre-parsed JSON. |
| Upgrade to Expo SDK 55 | Tech Debt | 2026-04-24 | Upgraded expo and verified native modules. |
| Add supertest + integration tests | Tech Debt | 2026-04-24 | Integrated route-level testing. |
| Fix TypeScript errors | Bug Fix | 2026-04-07 | Resolved tsc errors. |
| Upgrade drizzle-kit to v0.31.10 | Tech Debt | 2026-04-07 | Pinned package. |
| Apply non-breaking npm audit fixes | Security | 2026-04-07 | Reduced audit alerts. |
| Add Vitest test suite | Tech Debt | 2026-04-07 | Configured framework. |
| Add markdown link checker to CI | Docs | 2026-04-07 | Configured lychee. |
| Complete documentation suite | Docs | 2026-03-27 | Initial guides created. |
| Wire read/unread story indicators into UI | Feature | 2026-03-25 | UI library badges. |
| Wire story feedback/rating UI | Feature | 2026-03-25 | completion screen ratings. |
| Reuse HeroCard.tsx in hero selection | Feature | 2026-03-25 | hero selections screen. |
| Add KeyboardAwareScrollView to input forms | Feature | 2026-03-25 | fields wrap on focus. |
| Unify dual settings systems | Bug Fix | 2026-03-13 | storage contexts sync. |
| Add security headers | Security | 2026-03-13 | added headers. |
| Wire up voice chat routes | Feature | 2026-03-13 | Backend active. |

---

## TODOs Found in Code

No open `// TODO` comments found in source files as of last scan (2026-07-19).
