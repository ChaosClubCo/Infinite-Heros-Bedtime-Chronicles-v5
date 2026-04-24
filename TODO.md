<!-- Last verified: 2026-04-07 -->
<!-- Generated from codebase scan + docs/ROADMAP.md. Re-run scan to refresh TODO signals. -->

# TODO.md — Prioritized Backlog

Items scored with Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

Scale: H = 8, M = 5, S = 3, L = 1 for Value/Criticality/Risk. S = 2, M = 5, L = 8 for Size.

---

## In Progress

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 1 | Complete documentation suite | Documentation | H | H | H | S | 12.0 | complete | This file + CONTRIBUTING/CLAUDE/GEMINI/AGENTS/MEMORY/CONVENTIONS/GLOSSARY/ADRs/runbooks |

---

## Ready (Backlog — Prioritized)

### Features

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 2 | Build voice chat mobile UI screen | Feature | H | M | M | L | 8.0 | ready | Backend routes in `server/replit_integrations/audio` are complete; needs Expo screen + expo-av recording |
| 3 | Wire read/unread story indicators into UI | Feature | M | S | S | S | 5.5 | complete | `getReadStories`/`markStoryRead` wired into library screen + completion screen |
| 4 | Wire story feedback/rating UI | Feature | M | S | S | S | 5.5 | complete | Emoji reactions (😍/😊/🤔) added to completion screen; calls `updateFeedback` in `lib/storage.ts` |
| 5 | Reuse `HeroCard.tsx` in hero selection | Feature | S | S | S | S | 4.5 | complete | `HeroCard` grid replaces chip scroll in `app/(tabs)/create.tsx` |
| 6 | Add `KeyboardAwareScrollView` to input forms | Feature | M | M | S | S | 5.5 | complete | Already wired in `story-details.tsx`, `sleep-setup.tsx`, and `quick-create.tsx` |

### Tech Debt

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 7 | Upgrade to Expo SDK 55 | Tech Debt | M | M | M | M | 3.0 | blocked | Removes need for `patches/expo-asset+12.0.12.patch`; see `patches/expo-asset+12.0.12.patch:9` TODO |

### Security / Infrastructure

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 8 | Resolve remaining npm audit vulnerabilities | Security | M | M | M | S | 5.0 | blocked | 14 remaining vulns (8 low, 4 moderate, 2 high); highs are in firebase-admin/expo-asset deep deps — blocked on upstream |
| 9 | Add `npm audit` to CI | Security | M | M | H | S | 8.0 | ready | Adds automatic dependency vulnerability scanning to every push |
| 10 | Add markdown link checker to CI | Documentation | S | S | S | S | 4.5 | ready | Prevents broken internal doc links from going unnoticed; `lychee` or `markdown-link-check` |
| 11 | Add persistent rate limiting (Redis) | Infrastructure | M | S | M | L | 5.0 | low-priority | Current in-memory rate limiter resets on server restart; acceptable for single-instance deploy |

### Low Priority

| Priority | Item | Category | Business Value | Time Criticality | Risk/Opportunity | Job Size | WSJF | Status | Issue/Notes |
|----------|------|----------|---------------|-----------------|-----------------|----------|------|--------|-------------|
| 12 | Add authentication (anonymous sessions) | Feature | M | S | M | H | 1.6 | low-priority | Only needed if API cost abuse becomes a concern; significant architecture change |
| 13 | Encrypt client-side AsyncStorage | Security | S | S | S | L | 9.0 | low-priority | Stored data is non-sensitive (story text, badges); not a current risk |

---

## Completed

| Item | Category | Completed | Notes |
|------|----------|-----------|-------|
| Fix TypeScript errors (8 errors: markStoryRead import, pRetry.AbortError, req.params types, drizzle-kit defineConfig) | Bug Fix | 2026-04-07 | `npm run typecheck` now exits clean |
| Upgrade drizzle-kit to v0.31.10 | Security/Tech Debt | 2026-04-07 | Fixes moderate esbuild vulnerability; resolves TS `defineConfig` error |
| Apply non-breaking npm audit fixes | Security | 2026-04-07 | 18 → 14 vulns; remaining require breaking upstream upgrades |
| Add Vitest test suite (142 tests) | Tech Debt | 2026-04-07 | 5 test files: lib/storage, lib/query-client, server/routes, server/ai/router, server/elevenlabs |
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

| Location | TODO | Blocked By |
|----------|------|------------|
| `patches/expo-asset+12.0.12.patch:9` | Remove HTTPS dev server patch after upgrading to Expo SDK 55 | Expo SDK 55 upgrade (Item #8 above) |
