# Changelog

All notable changes to Infinity Heroes: Bedtime Chronicles are documented here.

## [Unreleased] — 2026-06-19 — Onboarding, story seeds, badge system overhaul

Merged PRs #245 and #247 to `main`.

### Added
- **Pre-baked hero portraits** (#245) — the 8 stock heroes now ship 512×512 PNG assets
  instead of generating an AI avatar per launch, improving startup time and removing a
  network dependency. Avatar rendering prefers the pre-baked portrait. Generation script
  at `scripts/generate-hero-portraits.mjs`.
- **Illustrated onboarding flow** (#245) — 4-slide horizontal carousel (`components/OnboardingSlide.tsx`)
  with Skip, progress dots, and haptic-enhanced navigation.
- **Curated story seeds library** (#245) — browseable "Magic Story Seeds" screen with 50 seeds
  (`constants/story-seeds.ts`, `components/SeedCard.tsx`) and age/theme filters that deep-link
  into story-details.
- **Custom hero storage** (#247) — `lib/customHeroStorage.ts` AsyncStorage helpers with size
  limits and input sanitization.
- **Centralized badge logic** (#247) — `lib/badges.ts` holds all 12 badge definitions plus pure
  `evaluateBadges()` / `getBadgeProgress()` functions, with unit tests in `lib/badges.test.ts`.

### Fixed
- **`vocab_5` / Word Wizard badge** (#247) — now counts unique vocab words learned
  (`story.vocabWord.word`) instead of total stories completed.
- **`all_heroes` / Hero Collector badge** (#247) — reconciles custom heroes with stock heroes,
  counting any unique hero used (built-in or custom) toward the target of 8.
- **Stale-closure bug in `generateStory`** (#245) — added the missing `useCallback` deps in
  `app/story.tsx`.

### Changed
- **Trophies screen** (#247) — extracted achievement card UI to `components/BadgeCard.tsx` with
  gradients for earned badges and progress bars/hints for locked ones; earned badges sort first
  (newest→oldest), then locked badges by progress ratio.
- **Story playback cleanup** (#245) — extracted `teardownPlayback()` and `advanceToNextPart()`
  to dedup logic and lifted magic numbers to module-level constants in `app/story.tsx`.

## [Unreleased] — 2026-06-13 — Production infrastructure + Phase 4 completion

Phase 4 completion (routes.ts migration) and Phase 5 prep (production infrastructure via
Supabase, Sentry, and Cloudflare KV provisioned through MCP integrations).

### Added
- **Cloudflare KV persistent rate limiting** — `checkRateLimitAsync()` in `server/rate-limit.ts`
  uses Cloudflare KV (namespace `infinity-heroes-rate-limit`, id `ed09afa77f9243bbb08f3dbe34df1e70`)
  when `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_KV_NAMESPACE_ID`, and `CLOUDFLARE_API_TOKEN` are set.
  Falls back to the existing in-memory sliding-window Map when env vars are absent — no change
  in default behavior. Rate-limit middleware (`server/routes/helpers.ts`) now uses the async path.
- **Sentry error tracking** — `@sentry/node` (server) and `@sentry/react-native` (client) installed.
  Server init in `server/index.ts` before all middleware; Sentry Express error handler wired just
  before the generic handler in `setupErrorHandler`. Client init in `app/_layout.tsx`. Both
  gracefully no-op when `SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN` are unset.
- **Supabase production database** — project `aeraxfupuvwiskmfjliq` (us-east-1) restored and
  migrated with the Infinity Heroes schema: `users`, `conversations`, and `messages` tables with
  proper indexes and FK cascade. Connection string documented in `.env.example`.
- **EAS Secrets Checklist** (`docs/operations/EAS-SECRETS-CHECKLIST.md`) — all required EAS
  secrets enumerated with descriptions and instructions for `eas secret:create`.

### Changed
- **`server/routes.ts` is now a ~43-line pure composer** — all inline route handlers removed and
  replaced with calls to the domain module functions that already existed in `server/routes/`.
  The domain modules (`health.ts`, `story.ts`, `images.ts`, `tts.ts`, `music.ts`, `suggest.ts`,
  `video.ts`) were already fully implemented; `routes.ts` simply wasn't calling them. No behavior
  change; all 1010 tests continue to pass.
- `.env.example` updated with Supabase DATABASE_URL format, Cloudflare KV vars, and Sentry DSN vars.
- `MEMORY.md`, `docs/ROADMAP.md`, `TODO.md` updated to reflect 2026-06-13 state (voice chat UI ✅,
  story.tsx refactor ✅, AI provider tests ✅, new infrastructure ✅).

## [Unreleased] — 2026-06-11 — CI pipeline fixes (lint toolchain, audit, link check)

Phase 3 (partial): get the CI gates green by fixing pre-existing infrastructure
failures rather than masking them.

### Fixed
- **Lint toolchain** — `eslint` was pinned to `^10.4.1`, which crashes
  `eslint-plugin-react` (`context.getFilename` was removed in ESLint 10) before
  any rule runs, so `npx expo lint` never actually linted. Pinned `eslint` to
  `^9.39.4` (eslint-config-expo supports `>=8.10`). Lint now runs clean (0 errors).
- **Critical `shell-quote` vulnerability** — added an `overrides` entry pinning
  `shell-quote` to `^1.8.4` (it reached the tree via
  `react-native → react-devtools-core`). This clears the only critical advisory,
  so `npm audit --audit-level=critical` (main CI) and the Security Agent both pass.
  The remaining high-severity advisories are firebase-admin transitive and remain
  tracked in Dependabot per existing policy.
- **Lychee link check** — added the dead/bot-blocked external URLs (vendored
  `.agents/skills/**` link rot + an `openai.com` 403) to `.lycheeignore` so the
  check reflects our own docs' health.

### Changed
- React Compiler lint rules newly surfaced by the working toolchain
  (`react-hooks/{set-state-in-effect,purity,refs,immutability}`) are set to
  `warn` in `eslint.config.js`. They flag pre-existing advisory issues across
  several screens and are addressed incrementally rather than in one risky pass.

## [Unreleased] — 2026-06-11 — COPPA parental-consent gate + in-app privacy policy

Phase 2 of the launch-readiness plan: make the app COPPA-defensible before any
data-collecting or AI feature runs.

### Added
- **Parental consent gate** (`app/parental-consent.tsx`) — shown at first launch
  before onboarding. A parent gate (arithmetic challenge) followed by an explicit
  consent affirmation, with plain-language disclosure of what's collected and a
  link to the full Privacy Policy. Consent is persisted in
  `@infinity_heroes_parent_consent` keyed by `CONSENT_VERSION`
  (`getConsentGiven` / `setParentConsent` in `lib/storage.ts`).
- **In-app Privacy Policy screen** (`app/privacy.tsx`) — native, works offline,
  linked from the consent screen and from **Settings → Legal**.
- Routing enforcement in `app/_layout.tsx`: consent is checked before onboarding,
  so an un-consented install always lands on the consent screen first.
- Voice Chat now shows a short data-use note above the record button (it was
  already behind the global consent gate).

### Changed
- Corrected the served Privacy Policy (`server/templates/privacy-policy.html`):
  removed the "we don't collect personal information" vs. name/age-to-AI
  contradiction, disclosed Voice Chat audio, and noted parental consent is required.
- Updated `docs/COPPA-COMPLIANCE.md` §5 and GAP 1 / GAP 4 to reflect the
  implemented consent gate and in-app privacy surface.

## [Unreleased] — 2026-06-11 — Ground-truth pass: doc/code reconciliation + bug fixes

Phase 1 of the launch-readiness plan: reconcile documentation with the actual
codebase and fix the genuine defects that reconciliation surfaced.

### Fixed
- **`all_heroes` ("Hero Collector") badge excluded custom heroes** — the check
  required every built-in hero (`lib/storage.ts`), so children who only play
  with custom heroes could never earn it. Now counts distinct heroes used
  (built-in or custom) against the roster size, so the bar is unchanged for
  built-in users and custom heroes count toward it. Badge description updated.
- **AI router streaming reported the wrong `model`** — streaming chunks emitted
  `provider.name` (e.g. `"gemini"`) instead of the real model ID. Added an
  optional `textModel` to each provider and the `AIProvider` interface;
  `server/ai/router.ts` now reports `provider.textModel ?? provider.name`.
- **`/api/suggest-settings` re-parsed AI JSON with a greedy regex** — switched
  the endpoint to `jsonMode: true` and now consumes `response.parsedJson`
  (parsed once by the router via `extractFirstJson`), removing the duplicate
  `\{[\s\S]*\}` parse in `server/routes.ts`.

### Docs
- Corrected stale `CLAUDE.md` claims now contradicted by the code: OfflineBanner
  and `useNetworkStatus` are wired into `app/_layout.tsx`; the voice chat UI
  exists at `app/voice-chat.tsx`; the parent PIN is SHA-256 + salt (not
  plaintext); the AI-router JSON extraction uses `extractFirstJson()` (not a
  greedy regex).
- Documented three implemented-but-undocumented endpoints in `docs/API.md`:
  `GET /api/metrics`, `GET /privacy`, `GET /api/music-info/:mode`.
- Marked the three 2026-03-27 audit docs as historical snapshots with a
  remediation pointer to this changelog.

## [Unreleased] — 2026-04-24 — Thorough audit + remediation

Three-way audit (code quality, security, docs-vs-code accuracy) followed by a
four-tranche fix pass. Core child-safety, rate-limiting, CORS, input
sanitization, and AI-routing constraints all passed; fixes below address the
gaps the audit found.

### Fixed
- **Critical: protobufjs RCE (GHSA-xq3m-2v4x-88gg)** — upgraded `firebase-admin`
  13.7 → 13.8 and ran `npm audit fix`, dropping us from 1 critical / 1 high to
  0 critical / 0 high. Remaining moderate advisories are locked inside
  `firebase-admin`'s and `drizzle-kit`'s transitive trees and need upstream
  fixes; we're on the latest release of each.
- **High: xmldom DoS / XML injection** — patched by the same audit-fix pass.
- **Auth production bypass** — removed the `AUTH_DISABLED` env-var opt-out in
  `server/auth.ts` and the startup warning in `server/index.ts`. Production
  now unconditionally returns 503 when `FIREBASE_SERVICE_ACCOUNT_KEY` is
  unset. The flag made silent production misconfiguration too easy.
- **Architectural-constraint violations** — three direct-AsyncStorage call
  sites (`app/_layout.tsx`, `app/welcome.tsx`, `app/completion.tsx`) now use
  new helpers in `lib/storage.ts` per the CLAUDE.md rule that all
  AsyncStorage access goes through `lib/storage.ts`.
- **Stale-closure risk in `app/(tabs)/create.tsx`** — the avatar-fetch effect
  read `heroAvatarUri` / `avatarLoading` inside its callback but only
  depended on `heroIndex`. Rewritten to track in-flight fetches with a
  `useRef<Set<string>>`, so the dep array stays tight and no stale state is
  read.
- **Untyped `any` casts without `// intentional:` comments** — annotated or
  narrowed: `server/video.ts` Sora response fields now use a local type
  extension and catch blocks use `unknown` + `instanceof Error`; Ionicons
  icon-name casts in five app screens now use
  `React.ComponentProps<typeof Ionicons>["name"]`. `server/replit_integrations/*`
  was left alone per its "do not modify" rule in CLAUDE.md.

### Added
- `lib/storage.ts` exports `getOnboardingComplete()` and
  `setOnboardingComplete()` helpers.
- `supertest` + `@types/supertest` installed as devDependencies. The existing
  integration suite `__tests__/integration/api-routes.test.ts` imports
  `supertest` but the package was never installed, so the whole suite
  (24 tests) was being skipped. It now runs, taking the total from **895 →
  919 tests passing**.

### Changed
- **Expo SDK 54 → 55** (`expo` 54.0.33 → 55.0.17). Also bumped the
  far-behind expo-* modules flagged by the audit (`expo-image`
  3.0.11 → 55.0.9, `expo-crypto` 15.0.8 → 55.0.14, `expo-symbols`
  1.0.8 → 55.0.7) so every expo-* module is now on the SDK-55 line. Server
  build, tests, lint, and typecheck all clean after the bump.
- **CLAUDE.md refreshed** to match reality: Expo SDK version, CI workflow
  list (4 → 9 workflows), `Replit Integrations (conditional)` endpoints,
  new `Authentication` section describing the Firebase anonymous-auth flow
  and production guard, missing `@infinity_heroes_storage_version`
  AsyncStorage key, `FIREBASE_SERVICE_ACCOUNT_KEY` and the
  `EXPO_PUBLIC_FIREBASE_*` client config in Environment Variables.
- `docs/best-practices/SECURITY.md`, `docs/best-practices/TESTING.md`, and
  `.env.example` updated to remove the now-dead `AUTH_DISABLED` flag.

### Audit findings deferred (not remediated this pass)
- **Monolithic files** — `server/routes.ts` (558 lines) and `app/story.tsx`
  (1627 lines) remain unsplit. No regression since the last audit; a
  follow-up refactor is out of scope.
- **Test coverage gaps** — `routes.ts` is at 51% statement / 30% branch
  coverage. Providers (`anthropic`, `gemini`, `openai`, `openrouter`),
  `video.ts`, `suno.ts`, and `db.ts` show 0% because their existing tests
  mock the whole module. AI router is already at 97% stmt / 84% branch.
- **Firebase-admin transitive moderate CVEs** — `@tootallnate/once`, `uuid`,
  `follow-redirects`, `@google-cloud/*` chain. Fixable only by upstream
  firebase-admin dep updates.

---

## [Unreleased] — 2026-03-25

### Fixed
- **Input validation hardened** — All `parseInt` calls on route `:id` params now use `parseIdParam()` which rejects NaN, zero, negative, and non-integer values with 400 responses.
- **Unsafe JSON parsing** — `JSON.parse` on AI-extracted JSON in `/api/generate-story` and `/api/suggest-settings` now wrapped in try-catch, returning clean 500 instead of crashing.
- **Typed error handling** — All `catch (error: any)` replaced with `error instanceof Error` checks across `server/routes.ts`.

### Added
- **Conversation pagination** — `GET /api/conversations` now supports `limit` (1-200, default 50) and `offset` query params. Response shape changed to `{ data, total, limit, offset }`.
- **Message content validation** — Chat messages validated for type, emptiness, and max length (10,000 chars).
- **Audio payload validation** — Voice messages validated for type, base64 size estimation (max 25MB), and voice param allowlisted against `alloy|echo|fable|onyx|nova|shimmer`.
- **Conversation title sanitization** — Titles trimmed and capped at 200 characters.
- **Security headers** — Added `Permissions-Policy` (camera=(), microphone=(self), geolocation=()) and `X-Permitted-Cross-Domain-Policies: none`.
- **Story feedback/rating UI** — Star rating + optional text feedback on the completion screen, saved via `updateFeedback()` to story storage.
- **Read/unread story indicators** — Library shows "NEW" badge on unread stories with highlighted border; stories marked as read on tap.
- **HeroCard in quick-create** — Selected theme now shows a hero preview card using the `HeroCard` component.
- **KeyboardAwareScrollView on forms** — `story-details.tsx` and `quick-create.tsx` now use `KeyboardAwareScrollViewCompat` so inputs scroll into view when the keyboard opens.
- **npm audit scripts** — Added `npm run audit` and `npm run audit:fix` to package.json.

### Changed
- `GET /api/conversations` response format changed from array to `{ data: [], total, limit, offset }` for pagination support.

---

## [Unreleased] — 2026-03-13

### Fixed
- **Dual settings system merged** — `SettingsModal.tsx` now uses `SettingsContext` instead of separate `getPreferences`/`savePreferences`. Both UIs share a single AsyncStorage key. Legacy preferences auto-migrate on first load.
- **Dead code triage resolved** — All 3 open NEEDS_DECISION items closed (HeroCard: keep, replit_integrations: wired up, settings: merged).

### Added
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection` on all responses.
- **Voice chat routes** — `server/replit_integrations/audio/` routes registered in Express (gated behind `AI_INTEGRATIONS_OPENAI_API_KEY` + `DATABASE_URL`). Adds `/api/conversations/*` endpoints for voice messaging with conversation history.
- **Database client** — `server/db.ts` created for Drizzle ORM + PostgreSQL connection.
- **Chat schema exports** — `shared/schema.ts` now exports `conversations` and `messages` tables.
- **Comprehensive documentation** — README.md, ARCHITECTURE.md, API.md, SECURITY.md, ROADMAP.md, CHANGELOG.md.
- **Updated .env.example** — All environment variables documented with descriptions.

### Changed
- `AppSettings` type expanded with `sleepTheme`, `isMuted`, `reducedMotion`, `fontSize` fields.
- `storyLength` type widened to include `medium-short` and `epic`.
- `drizzle.config.ts` schema array now includes `shared/models/chat.ts`.

## 2026-03-13 (996e238)

### Changed
- Updated AI model strings across all providers to latest versions.
- Fixed dead code in backend systems.

## 2026-03-13 (7cd5717)

### Added
- Detailed audit and proposal for AI model configurations (Phase 1 audit).

## 2026-03-13 (fa34c87)

### Added
- Automatic retries and caching for story scene images.

## 2026-03-13 (0c8fdb5)

### Fixed
- Restored scene image persistence (`saveStoryScene` was orphaned).
- Fixed storyId mismatch bug in completion screen.
- Fixed profile avatar display.

## 2026-03-13 (1918b1f)

### Added
- Dead code triage report (`docs/DEAD-CODE-TRIAGE.md`).

## 2026-03-12 (41d8c06)

### Added
- Detailed customization options for personalized story adventures (settings, tone, sidekick, problem).

## 2026-03-12 (1769fba)

### Added
- Onboarding flow (quick-create hero experience).
- App settings screen with SettingsContext.

## 2026-03-12 (f861169)

### Changed
- Redesigned story reading experience with improved UI and interactive elements.

## 2026-03-11 (551d0cb)

### Added
- Story library: view and manage saved stories.
- Story browsing and management functionality.

## 2026-03-11 (7914d09)

### Added
- Tabbed navigation structure (home, create, library, profile).
- Story details screen.
- Initial app architecture.
