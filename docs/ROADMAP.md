# Development Roadmap

**Last Updated:** 2026-07-15 (audit + next-sprint pass — see `docs/AUDIT-NEXT-SPRINT-2026-07-15.md`)

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

## Backlog (Prioritized)

### High Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 1 | Real tests for `server/auth.ts` — the "comprehensive" suite never imports the module | 8 | 5 | 8 | 2 | 10.5 | `server/auth.comprehensive.test.ts` reimplements logic as inline literals instead of calling `requireAuth`; the integration suite mocks `requireAuth` out entirely. Coverage confirms 4.08% stmt / 0% branch on the app's entire Supabase-auth boundary. See `docs/AUDIT-NEXT-SPRINT-2026-07-15.md` finding 1 |
| 2 | Write and execute the missing `docs/VERIFICATION-M1-M3.md` cloud-sync verification checklist | 5 | 5 | 5 | 2 | 7.5 | Referenced by commit `0e31e77` ("Still needs on-device verification") but never committed. That commit fixed `SyncManager` never being mounted — cloud sync was a silent no-op since the M3 merge. Off by default (`cloudSyncEnabled: false`) so no current user impact, but needs verification before it's ever toggled on. See finding 2 |
| 3 | M1 (TTS-cache half) — Move `/tmp` TTS cache to Cloudflare R2 (or equivalent object storage) | 8 | 8 | 6 | 5 | 4.4 | Serverless gate: TTS cache is filesystem/`/tmp`, lost across cold starts → re-synth cost. Idempotency half of M1 already shipped 2026-07-12 (Cloudflare KV) — binary audio needs object storage (R2), not KV, and needs a human to provision the bucket/token first. See docs/ROADMAP.md M1 follow-up note in `server/tts-cache.ts` |
| 4 | EAS build & Play Store submission | 8 | 8 | 5 | 5 | 4.2 | eas.json configured; needs EAS secrets + AAB build; see docs/operations/PLAY_STORE_DEPLOYMENT.md |
| 5 | Port the 19 missing M1–M3 files (`server/safety/*`, `lib/sync/*`, `lib/tts-cache.ts`, `lib/narration.ts`, etc.) into `krosebrook/bedtime_chronicles-v2` | 8 | 5 | 8 | 5 | 4.2 | `v2`'s convergence PR (#3) copied a pre-M1–M3 `CLAUDE.md` snapshot and never got the corresponding source ported either. `v2` still only has the long-standing prompt-side `CHILD_SAFETY_RULES`, not the newer output-side re-check/regenerate/fallback guard this repo added — a real safety-posture gap, not a docs mismatch (corrected from an earlier draft of this item). See finding 4. Cross-repo item, tracked here since this repo owns the merge narrative |

### Medium Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 6 | Fix `krosebrook/infinite-heros-bedtime-chronicles-v5-main` CI (package-lock.json drift) and run it through the same convergence PR `v2` got | 5 | 3 | 5 | 5 | 2.6 | Live CI (run 29221776371, 2026-07-13) fails at the lockfile-sync check before lint/test/typecheck/audit run. The repo's `main` is still the pre-merge Firebase/Expo-54 codebase, contradicting the Merge Provenance claim that it "contributed nothing beyond receiving the merged tree." See finding 3 |
| 7 | Resolve remaining npm audit vulnerabilities | 5 | 5 | 5 | 3 | 5.0 | 15 moderate, 0 high, 0 critical as of 2026-07-15 (down from 42/2-high — the `tmp`/`undici` high-severity pair is already resolved, presumably via routine Dependabot merges). Remaining 15 are two transitive chains (`esbuild`→`drizzle-kit`, `uuid`→`@expo/config-plugins`); both `--force` fixes are breaking-change major bumps, not a blind-apply |

### Low Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 8 | Remove or wire up `server/replit_integrations/chat/routes.ts` | 2 | 1 | 2 | 2 | 2.5 | `registerChatRoutes()` implements a text-chat variant of `POST /api/conversations/:id/messages` but is never called from `server/routes.ts` — dead code flagged in the 2026-07-12 doc audit. Either delete it or register it behind a feature flag like the audio routes |
| 9 | Encrypt client-side AsyncStorage | 2 | 1 | 2 | 5 | 1.0 | Stored data is non-sensitive (story text, badges) |
| 10 | Refresh `docs/TEST-COVERAGE-ANALYSIS.md` coverage numbers | 3 | 1 | 2 | 2 | 3.0 | As of 2026-07-15: 1280 tests / 70 files passing (was 1010/41), 72.49% stmt / 67.78% branch coverage overall (was ~59%/55%). See `docs/AUDIT-NEXT-SPRINT-2026-07-15.md` finding 5 for the full table |
| 11 | Expo SDK 55 → 57 upgrade | 3 | 2 | 3 | 8 | 1.0 | Root cause of most remaining moderate npm-audit findings (`@expo/config*` chain). Not urgent — no actively-exploited CVE — but a two-major jump on Expo/Expo Router has a track record of multi-day breakage per `docs/CHANGELOG.md`; deserves its own dedicated upgrade sprint, not a slot alongside routine work |

## Dependencies

- Item 1 (M1 TTS-cache→R2) requires provisioning a new Cloudflare R2 bucket + scoped API token — an external action outside agent control. It reuses the KV-fallback pattern shipped for idempotency (`server/kv.ts`) but needs an R2-specific client since KV isn't suited to binary blobs; see the follow-up note in `server/tts-cache.ts`.
- Item 2 (EAS) requires all API keys to be set as EAS secrets (see docs/operations/EAS-SECRETS-CHECKLIST.md)
- Item 3 (audit) is blocked on upstream releasing fixes for the `tmp`/`undici` and `@expo/config*` transitive chains

## Known Audit Issues

`npm audit` as of 2026-07-15 reports **15 moderate, 0 high, 0 critical** (the 2026-06-19
baseline of 42 advisories including 2 high — `tmp`, `undici` — is resolved, presumably
via routine Dependabot merges since then; the "tighten to `--audit-level=high`" note below
can now happen):
- **Moderate:** two transitive chains — `esbuild` (via `@esbuild-kit/*` → `drizzle-kit`)
  and `uuid` (via `xcode`/`@expo/config-plugins` → `expo-splash-screen`/`@expo/cli`).
  Both have `npm audit fix --force` fixes available, but each is a breaking major bump
  (drizzle-kit 0.31→0.18 is a downgrade; expo-splash-screen jumps a major) — needs a
  scoped dependency-upgrade pass, not a blind `--force` apply.

CI uses `--audit-level=critical`. Now that the `tmp`/`undici` high-severity pair is
resolved, tighten to `--audit-level=high` — nothing currently outstanding is high or
critical, so this is a safe, immediate tightening.

## Tracked TODOs in Code

No open `// TODO` comments found in source files as of last scan (2026-06-19). Not
re-verified in the 2026-07-15 pass.
