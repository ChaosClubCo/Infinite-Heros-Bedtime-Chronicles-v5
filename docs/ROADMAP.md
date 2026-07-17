# Development Roadmap

**Last Updated:** 2026-07-17 (R3 completion reconciliation + backlog renumber)

Items are scored using Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

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
| Synchronize best practice documentation with actual implementations (Supabase, R2, test counts) | Docs | 2026-07-17 |
| Align Vercel serverless execution timeout configuration (60s -> 300s) | Infrastructure | 2026-07-17 |

## Backlog (Prioritized)

### High Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 1 | EAS build & Play Store submission | 8 | 8 | 5 | 5 | 4.2 | eas.json configured; needs EAS secrets + `EXPO_TOKEN` (ChaosClubCo org CI) + AAB build; Android-only; see docs/operations/PLAY_STORE_DEPLOYMENT.md |
| 2 | Verify M3 cloud sync end-to-end on a device | 5 | 5 | 8 | 3 | 6.0 | Built + unit-tested (all six entities) but flagged "NOT yet verified on a device" in CLAUDE.md; depends on Item 1 for an installable build; harness at scripts/verify-sync.ts |
| 3 | Resolve remaining npm audit vulnerabilities | 5 | 5 | 5 | 3 | 5.0 | 42 advisories (2 high: `tmp`, `undici`; 40 moderate, mostly `@expo/config*`); 0 critical. Blocked on upstream Expo/transitive fixes |

### Low Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 4 | Encrypt client-side AsyncStorage | 2 | 1 | 2 | 5 | 1.0 | Stored data is non-sensitive (story text, badges) |
| 5 | M4 — native Kotlin audio engine | 3 | 1 | 1 | 8 | 0.6 | Blocked/future: requires ejecting managed Expo + retrieving the archived Kotlin rewrite (archive/android-kotlin-rewrite/); see CLAUDE.md "Merge Provenance" |

## Dependencies

- Item 1 (EAS) requires all API keys set as EAS secrets (see docs/operations/EAS-SECRETS-CHECKLIST.md) plus an `EXPO_TOKEN` in the ChaosClubCo-org CI.
- Item 2 (M3 device-verify) depends on Item 1 for an installable Android build; run `scripts/verify-sync.ts` against it.
- Item 3 (npm audit) is blocked on upstream releasing fixes for the `tmp`/`undici` and `@expo/config*` transitive chains.
- Item 5 (M4 native audio) is blocked on ejecting the managed Expo client + retrieving `archive/android-kotlin-rewrite/`.
- (Resolved) M1 TTS-cache → Cloudflare R2 shipped 2026-07-15 (see Completed); the former bucket/token provisioning dependency is satisfied. R2 uses its own S3-compatible client (`server/r2.ts`) since KV isn't suited to binary blobs.

## Known Audit Issues

`npm audit` as of 2026-06-19 reports **42 advisories: 2 high, 40 moderate, 0 critical**:
- **High:** `tmp` (arbitrary file/dir write via symlink) and `undici` — both pulled in transitively.
- **Moderate:** mostly `@expo/config*` and related Expo tooling chains; tracked against Expo SDK updates.
- All are transitive; no direct-dependency fixes available yet. Tracked in Dependabot.

CI uses `--audit-level=critical`. Tighten to `--audit-level=high` once the `tmp`/`undici` chains resolve upstream.

## Tracked TODOs in Code

No open `// TODO` comments found in source files as of last scan (2026-06-19).
