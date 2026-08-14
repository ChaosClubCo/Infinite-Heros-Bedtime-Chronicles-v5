<!-- Last verified: 2026-07-15 -->
<!-- Generated from codebase scan + docs/ROADMAP.md. Re-run scan to refresh TODO signals. -->
<!-- docs/ROADMAP.md is the actively-maintained backlog; this file lags behind it — reconcile against ROADMAP.md before trusting stale-looking rows. -->

# TODO.md — Prioritized Backlog

Items scored with Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

Scale: H = 8, M = 5, S = 3, L = 1 for Value/Criticality/Risk. S = 2, M = 5, L = 8 for Size.

---

## Ready (Backlog — Prioritized)

### High Priority

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 1 | EAS build & Play Store submission | Deployment | H | H | H | M | 4.8 | ready | eas.json + build-android.sh + docs/operations/DEPLOYMENT.md §3 all set; needs EAS secrets + AAB build |
| 2 | Resolve remaining npm audit vulnerabilities | Security | M | M | M | S | 5.0 | blocked | Updated 2026-07-15: the 2 high (`tmp`/`undici`) are resolved; 15 moderate remain (`esbuild`→`drizzle-kit`, `uuid`→`@expo/config-plugins`), both needing breaking `--force` bumps — see docs/ROADMAP.md and docs/archive/audits/AUDIT-NEXT-SPRINT-2026-07-15.md |

### Deployment Control — from `docs/archive/audits/AUDIT-DEPLOYMENT-TOPOLOGY-2026-08-13.md`

Production had no enforced deploy path and no working release gate. Full findings, evidence, and the
unaudited surface are in that audit; these are the actions.

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| D1 | Rotate the Vercel deploy hook URL | Security | H | H | H | S | 12.0 | ready | It is a **capability URL** — anyone holding it can deploy production, unauthenticated. It sat in plaintext in webhook `645778760`'s Payload URL field and has been pasted into an AI transcript. Regenerate in Vercel, then store only as an Actions **repository** secret |
| D2 | Enable branch protection on `main` | Process | H | H | H | S | 12.0 | blocked | Blocked on D3 (cannot require checks while CI is red). Root cause of ungated Dependabot merges — `auto-merge.yml` does not wait for CI because GitHub auto-merge only holds for *required* checks. Three rollout traps documented in the audit §5 |
| D3 | Fix CI — `Expo Compatibility and Web Build` | CI | H | H | M | S | 10.5 | ready | `npx expo install --fix` → `npm install` → `npm run expo:check` must exit 0. Commit `package.json` + `package-lock.json` together or the next `npm ci` fails `EUSAGE`. Restores `@sentry/react-native ~7.11.0`, `react-native-gesture-handler ~2.30.0` |
| D4 | Enumerate every webhook / GitHub App surface | Security | M | H | H | S | 10.5 | ready | At least one **unidentified** sender can fire the production deploy hook. Org-level hooks and App hooks never appear in repo settings — check `/settings/hooks`, `/organizations/ChaosClubCo/settings/hooks`, `/settings/installations` |
| D5 | Verify `verify-release-provenance.mjs` is not a no-op | Security | H | M | H | S | 10.5 | completed | Resolved 2026-08-14: switched to path.resolve and fileURLToPath for cross-platform/percent-encoding proof CLI detection |
| D6 | Confirm the Vercel plan tier | Deployment | M | M | S | S | 6.5 | ready | Gates whether the deploy-hook indirection is needed at all. Evidence says the Hobby commit-author check is not firing (`dpl_78oUZ…`, a dependabot-authored Git-triggered production build, `READY`) |
| D7 | Add a `permissions:` block to `eas-build.yml` | Security | M | S | M | S | 6.5 | completed | Resolved 2026-08-14: added contents:read, pull-requests:write, issues:write |

### Low Priority

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 4 | Encrypt client-side AsyncStorage | Security | S | S | S | L | 1.1 | low-priority | Stored data is non-sensitive (story text, badges); not a current risk |
| 5 | M4 — native Kotlin audio engine | Feature | S | L | L | L | 0.6 | blocked | Requires ejecting managed Expo + archive/android-kotlin-rewrite/; see CLAUDE.md Merge Provenance |

---

## Completed

| Item | Category | Completed | Notes |
|------|----------|-----------|-------|
| Add permissions block to eas-build.yml (D7) | Security | 2026-08-14 | Hardened eas-build.yml workflow with explicit permissions |
| Fix release provenance CLI entry detection (D5) | Security | 2026-08-14 | Fixed verify-release-provenance.mjs to use fileURLToPath + path.resolve |
| Support all privacy policy route variants & /api/privacy | Compliance | 2026-08-14 | Added /privacy, /privacy/, /privacy-policy, /privacy-policy/, /api/privacy handlers |
| Lock Vercel serverless runtime to nodejs22.x | Reliability | 2026-08-14 | Added runtime nodejs22.x to vercel.json api/server.mjs config |
| Fix vercel-deploy.yml missing check-secret dependency | CI/CD | 2026-08-14 | Removed invalid needs/if on trigger-vercel-deploy to fail loudly if secret is missing |
| Real auth test suite for server/auth.ts | Testing/Security | 2026-07-24 | Created server/auth.test.ts with 100% branch coverage; deleted legacy placebo file |
| Verification checklist automated updates | Quality | 2026-07-24 | Updated docs/VERIFICATION-M1-M3.md automated gate execution metrics |
| Cloudflare R2 TTS-audio cache (M1 TTS-cache half) | Infrastructure | 2026-07-15 | server/r2.ts (S3-compatible @aws-sdk/client-s3), wired into server/routes/tts.ts behind writeWithLock; /tmp fallback; gated on R2_ENABLED |
| Remove dead text chat routes (routes.ts, routes.test.ts) | Code Quality | 2026-07-14 | Removed dead routes file and its test file, and disabled it in chat/index.ts |
| Secure Gemini API Key URL leakage in pingGemini() | Security | 2026-07-14 | Pass API key in x-goog-api-key header instead of query string |
| Extend health checks live probes to OpenAI/OpenRouter | Reliability | 2026-07-14 | Wired up OpenAI and OpenRouter pings to /api/health LIVE_PROBE_PROVIDERS |
| Add integration tests for request-finish alerting + TTS metrics | Testing | 2026-07-14 | Created server/index.integration.test.ts to test middleware and route integrations |
| Refresh docs/TEST-COVERAGE-ANALYSIS.md coverage numbers | Docs | 2026-07-14 | Updated code coverage metrics to 1294 passing tests |
| Add Supabase Auth (bearer-token JWT middleware) | Feature/Security | 2026-07-06 | Optional, gated on SUPABASE_SERVICE_ROLE_KEY + Supabase URL; 503 in production when unconfigured |
| Fix voice-chat IDOR | Security | 2026-07-06 | Ownership (userId) checks added on all conversation reads/writes in server/replit_integrations/audio/routes.ts |
| Parent-controls PIN brute-force lockout | Security | 2026-07-06 | 5 failed attempts → 30s lockout; lib/storage.ts + components/ParentControlsModal.tsx |
| Complete server/routes.ts migration | Code Quality | 2026-06-13 | Removed all inline handlers; routes.ts is now ~70-line pure composer (grew since as github-webhook route was added); all logic in server/routes/*.ts domain modules |
| Provision Supabase production database | Infrastructure | 2026-06-13 | Project aeraxfupuvwiskmfjliq (us-east-1); conversations + messages tables migrated |
| Add Sentry error tracking | Observability | 2026-06-13 | @sentry/node (server) + @sentry/react-native (client); graceful no-op when DSN unset |
| Add Cloudflare KV persistent rate limiting | Infrastructure | 2026-06-13 | Namespace ed09afa77f9243bbb08f3dbe34df1e70; checkRateLimitAsync() used by middleware; falls back to in-memory |
| Build voice chat mobile UI screen | Feature | 2026-06-11 | app/voice-chat.tsx (672 lines); expo-av recording; SSE streaming; reached from profile tab |
| Refactor app/story.tsx | Code Quality | 2026-06-11 | 386-line composition shell; logic in lib/use*.ts hooks; presentational pieces in components/Story* |
| Add AI provider test coverage | Testing | 2026-06-11 | server/ai/providers/*.test.ts for all 4 providers |
| COPPA parental-consent gate + privacy policy | Compliance | 2026-06-11 | app/parental-consent.tsx + app/privacy.tsx; routing gate in _layout.tsx |
| Fix CI lint toolchain (ESLint 10 → 9) | CI | 2026-06-11 | eslint pinned to ^9.39.4; lint now runs clean |
| Patch shell-quote critical CVE | Security | 2026-06-11 | Added package.json overrides; clears only critical advisory |
| Fix all_heroes badge | Bug Fix | 2026-06-11 | Now counts custom heroes toward Hero Collector badge |
| Fix AI streaming model field | Bug Fix | 2026-06-11 | Reports textModel instead of provider.name |
| Fix suggest-settings JSON re-parse | Bug Fix | 2026-06-11 | Uses parsedJson from router instead of re-parsing |
| Upgrade to Expo SDK 55 | Tech Debt | 2026-04-24 | expo 55.0.17; removed expo-asset patch requirement |
| Add supertest + integration tests | Tech Debt | 2026-04-24 | 895 → 1010 tests |
| Fix TypeScript errors | Bug Fix | 2026-04-07 | `npm run typecheck` exits clean |
| Upgrade drizzle-kit to v0.31.10 | Security/Tech Debt | 2026-04-07 | Fixes moderate esbuild vulnerability |
| Apply non-breaking npm audit fixes | Security | 2026-04-07 | 18 → 14 vulns |
| Add Vitest test suite | Tech Debt | 2026-04-07 | Now 1010 tests across 41 files |
| Add markdown link checker to CI | Documentation | 2026-04-07 | lycheeverse/lychee-action |
| Complete documentation suite | Documentation | 2026-03-27 | CONTRIBUTING/CLAUDE/GEMINI/AGENTS/MEMORY/CONVENTIONS/GLOSSARY/ADRs/runbooks |
| Wire read/unread story indicators into UI | Feature | 2026-03-25 | getReadStories/markStoryRead wired into library + completion screens |
| Wire story feedback/rating UI | Feature | 2026-03-25 | Emoji reactions on completion screen; calls updateFeedback |
| Reuse HeroCard.tsx in hero selection | Feature | 2026-03-25 | HeroCard grid in app/(tabs)/create.tsx |
| Add KeyboardAwareScrollView to input forms | Feature | 2026-03-25 | Wired in story-details.tsx, sleep-setup.tsx, quick-create.tsx |
| Unify dual settings systems | Bug Fix | 2026-03-13 | SettingsModal now uses SettingsContext |
| Add security headers | Security | 2026-03-13 | X-Content-Type-Options, X-Frame-Options, etc. |
| Wire up voice chat routes | Feature | 2026-03-13 | Backend functional |

---

## TODOs Found in Code

No open `// TODO` comments found in source files as of last scan (2026-06-13).
