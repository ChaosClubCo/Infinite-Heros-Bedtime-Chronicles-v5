<!-- Last verified: 2026-06-13 -->
<!-- Generated from codebase scan + docs/ROADMAP.md. Re-run scan to refresh TODO signals. -->

# TODO.md — Prioritized Backlog

Items scored with Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

Scale: H = 8, M = 5, S = 3, L = 1 for Value/Criticality/Risk. S = 2, M = 5, L = 8 for Size.

---

## Ready (Backlog — Prioritized)

### High Priority

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 1 | EAS build & Play Store submission | Deployment | H | H | H | M | 4.8 | ready | eas.json + build-android.sh + PLAY_STORE_DEPLOYMENT.md all set; needs EAS secrets + AAB build |
| 2 | Resolve remaining npm audit vulnerabilities | Security | M | M | M | S | 5.0 | blocked | 2 high in firebase-admin transitive chain (blocked on upstream); CI at --audit-level=critical |

### Low Priority

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 3 | Add authentication (anonymous sessions) | Feature | M | S | M | H | 1.6 | low-priority | Only needed if API cost abuse becomes a concern; significant architecture change |
| 4 | Encrypt client-side AsyncStorage | Security | S | S | S | L | 9.0 | low-priority | Stored data is non-sensitive (story text, badges); not a current risk |

---

## Completed

| Item | Category | Completed | Notes |
|------|----------|-----------|-------|
| Complete server/routes.ts migration | Code Quality | 2026-06-13 | Removed all inline handlers; routes.ts is now ~43-line pure composer; all logic in server/routes/*.ts domain modules |
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
