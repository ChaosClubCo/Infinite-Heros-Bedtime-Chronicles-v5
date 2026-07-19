# Development Roadmap

**Last Updated:** 2026-07-19 (R3 completion reconciliation + documentation consolidation)

Items are scored using Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

Scale: H = 8, M = 5, S = 3, L = 1 for Value/Criticality/Risk. S = 2, M = 5, L = 8 for Size.

## Completed

| Item | Category | Date |
|:---|:---|:---|
| Reconstruct, validate, and compile release deliverables bundle (v1) | Release Engineering | 2026-07-19 |
| Align Vercel serverless execution timeout configuration (60s -> 300s) | Infrastructure | 2026-07-17 |
| Synchronize best practice documentation with actual implementations | Docs | 2026-07-17 |
| Cloudflare R2 TTS-audio cache (M1 TTS-cache half) | Infrastructure | 2026-07-15 |
| Remove dead text chat routes (routes.ts, routes.test.ts) | Code Quality | 2026-07-14 |
| Secure Gemini API Key URL leakage in pingGemini() | Security | 2026-07-14 |
| Extend health checks live probes to OpenAI/OpenRouter | Reliability | 2026-07-14 |
| Add integration tests for request-finish alerting + TTS metrics | Testing | 2026-07-14 |
| Refresh testing coverage numbers in documentation | Docs | 2026-07-14 |
| M1 (idempotency half) — KV-backed idempotency cache | Infrastructure | 2026-07-12 |
| M2 — Live health checks | Reliability | 2026-07-12 |
| M3 — Wire alerting thresholds | Observability | 2026-07-12 |
| Doc/code audit | Docs | 2026-07-12 |
| Add Supabase Auth (bearer-token JWT middleware, optional/gated, 503 in production when unconfigured) | Feature/Security | 2026-07-06 |
| Voice-chat IDOR fix — ownership checks on all conversation reads/writes | Security | 2026-07-06 |
| Parent-controls PIN brute-force lockout (5 attempts → 30s lockout) | Security | 2026-07-06 |
| Production-readiness re-audit + HIGH remediations | Security/Reliability | 2026-06-18 |
| Pre-baked hero portraits + illustrated onboarding flow + 50 story seeds (#245) | Feature | 2026-06-19 |
| Story playback cleanup + stale-closure fix in app/story.tsx (#245) | Code Quality | 2026-06-19 |
| Refactor badge system into lib/badges.ts; fix vocab_5 & all_heroes bugs (#247) | Bug Fix | 2026-06-19 |
| Custom hero storage + Trophies screen progress UI (#247) | Feature | 2026-06-19 |
| Complete server/routes.ts migration | Code Quality | 2026-06-13 |
| Provision Supabase production database | Infrastructure | 2026-06-13 |
| Add Sentry error tracking | Observability | 2026-06-13 |
| Add Cloudflare KV persistent rate limiting | Infrastructure | 2026-06-13 |
| Build voice chat mobile UI screen | Feature | 2026-06-11 |
| Refactor app/story.tsx | Code Quality | 2026-06-11 |
| Add AI provider test coverage | Testing | 2026-06-11 |
| COPPA parental-consent gate + privacy policy | Compliance | 2026-06-11 |
| Fix CI lint toolchain (ESLint 10 -> 9) | CI | 2026-06-11 |
| Patch shell-quote critical CVE | Security | 2026-06-11 |
| Fix all_heroes badge | Bug Fix | 2026-06-11 |
| Fix AI streaming model field | Bug Fix | 2026-06-11 |
| Fix suggest-settings JSON re-parse | Bug Fix | 2026-06-11 |
| Upgrade to Expo SDK 55 | Tech Debt | 2026-04-24 |
| Add supertest + integration tests | Tech Debt | 2026-04-24 |
| Fix TypeScript errors | Bug Fix | 2026-04-07 |
| Upgrade drizzle-kit to v0.31.10 | Tech Debt | 2026-04-07 |
| Apply non-breaking npm audit fixes | Security | 2026-04-07 |
| Add Vitest test suite | Tech Debt | 2026-04-07 |
| Add markdown link checker to CI | Docs | 2026-04-07 |
| Complete documentation suite | Docs | 2026-03-27 |
| Wire read/unread story indicators into UI | Feature | 2026-03-25 |
| Wire story feedback/rating UI | Feature | 2026-03-25 |
| Reuse HeroCard.tsx in hero selection | Feature | 2026-03-25 |
| Add KeyboardAwareScrollView to input forms | Feature | 2026-03-25 |
| Unify dual settings systems | Bug Fix | 2026-03-13 |
| Add security headers | Security | 2026-03-13 |
| Wire up voice chat routes | Feature | 2026-03-13 |

---

## Backlog (Prioritized)

### High Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | EAS build & Play Store submission | 8 | 8 | 8 | 5 | 4.8 | eas.json configured; needs EAS secrets + `EXPO_TOKEN` (ChaosClubCo org CI) + AAB build; Android-only; see docs/operations/DEPLOYMENT.md |
| 2 | Verify M3 cloud sync end-to-end on a device | 5 | 5 | 8 | 3 | 6.0 | Built + unit-tested (all six entities) but flagged "NOT yet verified on a device" in CLAUDE.md; depends on Item 1 for an installable build; harness at scripts/verify-sync.ts |
| 3 | Resolve remaining npm audit vulnerabilities | 5 | 5 | 5 | 3 | 5.0 | 4 moderate vulnerabilities (esbuild, core-utils, esm-loader, drizzle-kit). 0 high/critical. Blocked on upstream updates |

### Low Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|:---|:---|:---|:---|:---|:---|:---|:---|
| 4 | Encrypt client-side AsyncStorage | 3 | 3 | 3 | 8 | 1.1 | Stored data is non-sensitive (story text, badges) |
| 5 | M4 — native Kotlin audio engine | 3 | 1 | 1 | 8 | 0.6 | Blocked/future: requires ejecting managed Expo + retrieving the archived Kotlin rewrite (archive/android-kotlin-rewrite/); see CLAUDE.md "Merge Provenance" |

---

## Dependencies

- Item 1 (EAS) requires all API keys set as EAS secrets (see docs/operations/EAS-SECRETS-CHECKLIST.md) plus an `EXPO_TOKEN` in the ChaosClubCo-org CI.
- Item 2 (M3 device-verify) depends on Item 1 for an installable Android build; run `scripts/verify-sync.ts` against it.
- Item 3 (npm audit) is blocked on upstream releasing fixes for the remaining moderate transitive chains.
- Item 5 (M4 native audio) is blocked on ejecting the managed Expo client + retrieving `archive/android-kotlin-rewrite/`.

---

## Known Audit Issues

`npm audit` reports **4 moderate, 0 high, 0 critical** vulnerabilities:
- Affected packages in dependency chains: `esbuild`, `core-utils`, `esm-loader`, `drizzle-kit`.
- All high-severity issues (previously in `tmp` and `undici`) have been resolved using `package.json` overrides.
- Remaining moderate alerts are transitive and blocked on upstream updates.

---

## Tracked TODOs in Code

No open `// TODO` comments found in source files as of last scan (2026-07-19).
