<!-- Last verified: 2026-05-05 -->
<!-- Generated from codebase scan + docs/ROADMAP.md. Re-run scan to refresh TODO signals. -->

# TODO.md — Prioritized Backlog

Items scored with Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

Scale: H = 8, M = 5, S = 3, L = 1 for Value/Criticality/Risk. S = 2, M = 5, L = 8 for Size.

---

## In Progress

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 1 | Build voice chat mobile UI screen | Feature | H | M | M | L | 8.0 | in-progress | Backend routes in `server/replit_integrations/audio` are complete; needs Expo screen + expo-av recording |

---

## Ready (Backlog — Prioritized)

### Security / Infrastructure

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 2 | Add `npm audit` to CI | Security | M | M | H | S | 8.0 | ready | Adds automatic dependency vulnerability scanning to every push |
| 3 | Resolve remaining npm audit vulnerabilities | Security | M | M | M | S | 5.0 | blocked | 14 remaining vulns (8 low, 4 moderate, 2 high); highs are in firebase-admin/expo-asset deep deps — blocked on upstream |
| 4 | Add persistent rate limiting (Redis) | Infrastructure | M | S | M | L | 5.0 | low-priority | Current in-memory rate limiter resets on server restart; acceptable for single-instance deploy |

### Low Priority

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 5 | Add authentication (anonymous sessions) | Feature | M | S | M | H | 1.6 | low-priority | Only needed if API cost abuse becomes a concern; significant architecture change |
| 6 | Encrypt client-side AsyncStorage | Security | S | S | S | L | 9.0 | low-priority | Stored data is non-sensitive (story text, badges); not a current risk |

---

## Completed

| Item | Category | Completed | Notes |
|------|----------|-----------|-------|
| Upgrade to Expo SDK 55 | Tech Debt | 2026-04-24 | expo 54 → 55.0.17; expo-image/expo-crypto/expo-symbols all on SDK-55 line; removed need for `patches/expo-asset+12.0.12.patch` |
| Add supertest + @types/supertest as devDependencies | Tech Debt | 2026-04-24 | Enables integration suite; test count 895 → 919 |
| Three-way codebase audit + remediation pass | Security/Quality | 2026-04-24 | protobufjs CVE fixed, AUTH_DISABLED removed, AsyncStorage violations fixed, stale-closure fix in create.tsx |
| Fix TypeScript errors (8 errors: markStoryRead import, pRetry.AbortError, req.params types, drizzle-kit defineConfig) | Bug Fix | 2026-04-07 | `npm run typecheck` now exits clean |
| Upgrade drizzle-kit to v0.31.10 | Security/Tech Debt | 2026-04-07 | Fixes moderate esbuild vulnerability; resolves TS `defineConfig` error |
| Apply non-breaking npm audit fixes | Security | 2026-04-07 | 18 → 14 vulns; remaining require breaking upstream upgrades |
| Add Vitest test suite (142 tests) | Tech Debt | 2026-04-07 | 5 test files: lib/storage, lib/query-client, server/routes, server/ai/router, server/elevenlabs |
| Add markdown link checker to CI | Documentation | 2026-04-07 | `lycheeverse/lychee-action` at `.github/workflows/markdown-link-check.yml`; `.lycheeignore` configured |
| Complete documentation suite | Documentation | 2026-03-27 | CONTRIBUTING/CLAUDE/GEMINI/AGENTS/MEMORY/CONVENTIONS/GLOSSARY/ADRs/runbooks |
| Wire read/unread story indicators into UI | Feature | 2026-03-25 | `getReadStories`/`markStoryRead` wired into library screen + completion screen |
| Wire story feedback/rating UI | Feature | 2026-03-25 | Emoji reactions added to completion screen; calls `updateFeedback` in `lib/storage.ts` |
| Reuse `HeroCard.tsx` in hero selection | Feature | 2026-03-25 | `HeroCard` grid in `app/(tabs)/create.tsx` |
| Add `KeyboardAwareScrollView` to input forms | Feature | 2026-03-25 | Wired in `story-details.tsx`, `sleep-setup.tsx`, `quick-create.tsx` |
| Unify dual settings systems | Bug Fix | 2026-03-13 | SettingsModal now uses SettingsContext |
| Add security headers | Security | 2026-03-13 | X-Content-Type-Options, X-Frame-Options, etc. |
| Wire up voice chat routes | Feature | 2026-03-13 | Backend functional; UI pending |
| Resolve dead code triage | Maintenance | 2026-03-13 | HeroCard kept, settings merged, replit_integrations wired |
| Restore `saveStoryScene` persistence | Bug Fix | 2026-03-13 | Was orphaned; now called on completion |
| Fix storyId mismatch in completion screen | Bug Fix | 2026-03-13 | — |
| Create comprehensive documentation suite | Documentation | 2026-03-13 | README, ARCHITECTURE, API, SECURITY, ROADMAP, CHANGELOG |
| Update `.env.example` | Documentation | 2026-03-13 | All env vars documented |
| Add onboarding flow (welcome → quick-create) | Feature | 2026-03-12 | — |
| Add app settings screen + SettingsContext | Feature | 2026-03-12 | — |
| Redesign story reading experience | UX | 2026-03-12 | — |
| Add story library | Feature | 2026-03-11 | — |
| Add tabbed navigation (5 tabs) | Architecture | 2026-03-11 | Home, Library, Create, Saved, Profile |

---

## TODOs Found in Code

No open `// TODO` comments found in source files as of last scan (2026-05-05).
