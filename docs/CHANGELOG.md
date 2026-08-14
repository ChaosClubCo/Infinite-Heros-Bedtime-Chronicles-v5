# Changelog

All notable changes to Infinity Heroes: Bedtime Chronicles are documented here.

## [Unreleased] — 2026-08-14 — Release Gate Provenance & Deployment Security Hardening

### Added
- **22-Suite Comprehensive Test Suite Expansion** — Added 22 focused test suites covering all core layers: server privacy policy, database client, fallback stories, shared sync types, chat database models, custom hero storage, design tokens (colors, timing, themes), story seeds & heroes, route context & helpers, image generation routes, scene handoff, destructive action confirmations, sync error reporters, loading messages, safety terms, TTS cache eviction, sync validation, and runbook specification integrity.
- **Security Audit Gate Engine & Automated Test Suite** — Refactored `scripts/audit-gate.mjs` with modular export architecture, implemented comprehensive unit test suite `server/audit-gate.test.ts` verifying fail-closed gating on unlisted high/critical CVEs and time-bounded allowlist expiry, and updated `docs/operations/DEPENDENCY-AUDIT-REMEDIATION.md`.
- **Expo SDK 55 → 57 Upgrade Specification & Readiness Engine** — Authored complete technical upgrade specification `docs/operations/EXPO-57-UPGRADE-SPEC.md` covering platform version matrices, Bridgeless/TurboModule architecture requirements, and 5-phase migration runbooks; implemented automated preflight engine `scripts/verify-expo57-readiness.mjs` and unit test suite `server/verify-expo57-readiness.test.ts`; exposed `npm run verify:expo57-readiness`.
- **Mirror Archival Verification Engine & Test Suite** — Implemented `scripts/verify-mirror-archival.mjs` and test suite `server/verify-mirror-archival.test.ts` validating canonical origin enforcement, archival runbook completeness, and fail-closed release blocking on legacy mirror refs; exposed `npm run verify:mirror`.
- **Cloud Sync Isolation & Multi-Tenant Evidence** — Authored `docs/operations/CLOUD-SYNC-ISOLATION-EVIDENCE.md` detailing PostgreSQL RLS user isolation proofs, zero-PII `profileStub` mapping, binary asset stripping, and disposable branch testing runbooks.
- **Exact-SHA Release Proof Ledger (Issue #376)** — Authored `docs/operations/RELEASE-PROOF-LEDGER-376.md` documenting the complete 18-point verification matrix for release approval and candidate freezing.
- **Play Store Submission & Families Compliance Manual** — Authored `docs/operations/PLAY-STORE-SUBMISSION-CHECKLIST.md` and integrated preflight checks into `scripts/build-android.sh` to enforce zero-microphone permissions and secret separation before EAS builds.
- **Exact-SHA Release Proof Engine** — Implemented `scripts/verify-release-proof.mjs` and unit test suite `server/verify-release-proof.test.ts` validating the 18-point release evidence matrix (canonical repository identity, strict 40-character commit SHAs, runtime nodejs22.x alignment, privacy route coverage, and EAS profiles); exposed `npm run verify:release-proof`.
- **EAS Mobile Build & Play Store Preflight Engine** — Implemented `scripts/build-preflight-eas.mjs` and test suite `server/build-preflight-eas.test.ts` validating `app.json` package identifiers, zero-microphone child safety permissions, adaptive icon asset presence, production AAB build profiles, and client secret separation; exposed `npm run preflight:eas`.
- **Dependency Vulnerability & Transitive Remediation Analysis** — Created `docs/operations/DEPENDENCY-AUDIT-REMEDIATION.md` documenting the 0-high/0-critical production security profile, audit gate allowlist lifecycles, and risk analysis of transitive build-time tooling.
- **Milestone Verification Engine (M1–M3)** — Implemented `scripts/verify-milestones.mjs` and test suite `server/verify-milestones.test.ts` to programmatically validate M1 safety guardrails and fallback templates, M2 narration cache constraints and R2 fallback resilience, and M3 cloud sync reconciliation and secure cryptographic envelopes; exposed `npm run verify:milestones`.
- **Legacy Mirror Archival & Decommissioning Runbook** — Authored `docs/operations/MIRROR-ARCHIVAL-RUNBOOK.md` detailing step-by-step procedures for repository parity verification, workflow neutralization, secret purging, and archival of `Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main`.
- **Webhook Ingress & Surface Security Audit** — Authored `docs/operations/WEBHOOK-SURFACE-AUDIT.md` documenting inbound GitHub webhook raw-body parsing, timing-safe HMAC-SHA256 signature checks, Vercel deploy hook isolation, and database cascade deletion triggers.
- **Account Deletion Dynamic Scope Resolution** — Refactored `server/routes/account.ts` and `shared/account-deletion.ts` to dynamically construct and validate `deletedScopes` (`['cloud_sync_records', 'parent_auth_identity']`, plus `'voice_chat_history'` when `DATABASE_URL` is active and PostgreSQL transcripts are purged), ensuring verification receipts accurately reflect data stores. Added unit test suite `shared/account-deletion.test.ts`.
- **Sync Verification Test Harness & CLI Script** — Normalized `scripts/verify-sync.ts` with standard relative imports and exported verification engine, added test suite `server/verify-sync.test.ts`, and exposed `npm run verify:sync`.
- **Client Secure Storage Integration Helpers** — Added `saveSecureParentControls` and `getSecureParentControls` to `lib/storage.ts` with transparent fallback to AsyncStorage and comprehensive tests in `lib/storage.test.ts`.
- **Test Coverage & Suite Architecture Manual** — Created `docs/TEST-COVERAGE-ANALYSIS.md` documenting the full 1,453 test suite matrix (1,401 Vitest unit/integration/release tests across 83 files + 52 Jest-Expo component tests across 8 files), subsystem breakdown, CI gates, and coverage threshold enforcement.
- **Client Secure Storage Envelope** — Added `lib/secureStorage.ts` and `lib/secureStorage.test.ts` providing tamper-evident cryptographic envelopes with SHA-256 integrity signatures, salt generation, and reversible masking for client secrets.
- **Cloud Sync Reconciliation Comprehensive Suite** — Added `lib/sync/reconcile.comprehensive.test.ts` testing multi-entity edge cases, timestamp tie-breakers, idempotency, and clock skew resilience.
- **Google Play Store Compliance & Submission Manual** — Created `docs/operations/GOOGLE-PLAY-STORE-REQUIREMENTS.md` covering Designed for Families policies, COPPA declarations, Data Safety questionnaire answers, in-app/web account deletion paths, and AAB store assets.
- **Privacy Policy Multi-Route Handlers** — Registered handlers for `/privacy`, `/privacy/`, `/privacy-policy`, `/privacy-policy/`, and `/api/privacy` in `server/routes/health.ts` to ensure consistent delivery across all reverse proxies and trailing slash variations.
- **Vercel Serverless Runtime Pinning** — Added `"runtime": "nodejs22.x"` to `vercel.json` to lock production serverless function execution to Node 22 matching `.nvmrc` and `package.json` engines.

### Changed
- **Operational Runbooks Reconciliation** — Updated `docs/runbooks/rollback.md`, `docs/runbooks/deploy.md`, and `docs/runbooks/incident-response.md` to reflect Vercel serverless and EAS Build as canonical deployment paths, replacing legacy references to Replit.

### Fixed
- **Release Provenance Gate CLI Entry Detection** — Refactored `scripts/verify-release-provenance.mjs` to use `path.resolve` and `fileURLToPath` for reliable entry-point detection across Windows/POSIX environments and percent-encoded paths.
- **Vercel Deploy Hook Preflight Fix** — Removed dangling `needs: check-secret` reference from `.github/workflows/vercel-deploy.yml` to prevent silent workflow skips when secrets are missing.
- **EAS Build Workflow Permissions** — Added explicit `permissions:` block (`contents: read`, `pull-requests: write`, `issues: write`) to `.github/workflows/eas-build.yml`.
- **EAS Secrets Documentation** — Reconciled `docs/operations/EAS-SECRETS-CHECKLIST.md` and `docs/operations/DEPLOYMENT.md` to clearly distinguish client-only build parameters (`EXPO_PUBLIC_*`) from backend-only secrets.

## [Unreleased] — 2026-08-13 — Expo SDK 55 Dependency Realignment

### Fixed
- **`expo:check` CI failure** — `@sentry/react-native` and `react-native-gesture-handler` had drifted above Expo SDK 55's supported range via unreviewed Dependabot major-version bumps (#406, #407), which undid the deliberate SDK 55 alignment landed two days earlier in #408. Re-pinned both to Expo's expected ranges (`@sentry/react-native` `~7.11.0`, `react-native-gesture-handler` `~2.30.0`) and added both packages to `.github/dependabot.yml`'s major-version `ignore` list, alongside `expo`/`expo-*`/`drizzle-orm`, so this can't silently regress again.

## [Unreleased] — 2026-07-27 — Test Suite Audit & Documentation Reconciliation

### Added
- **Test Suite Audit** — Executed and verified 100% pass rate across all test suites: **1401 Vitest tests** across 83 test files (`server/`, `lib/`, `shared/`, `__tests__/`) and **52 Jest component tests** across 8 test files (`__tests__/components/`), totaling **1453 passing tests** across 91 test files.
- **Documentation Reconciliation** — Updated `GEMINI.md`, `README.md`, and `docs/best-practices/TESTING.md` to remove outdated "no automated test suite" notices and accurately document execution commands (`npm test`, `npm run test:components`) and test counts.

## [Unreleased] — 2026-07-14 — Cloud Sync (Milestone 3), API Probes, and Reliability Overhaul

### Added
- **Cloud Sync Engine (Milestone 3)** — Optional, parent-opt-in cloud backup/continuity of kid data (stories, favorites, settings, badges, streaks, profile stubs) to a Supabase Postgres backend.
  - Core mapping, reconciliation (`reconcile.ts`), and push/pull engines in `lib/sync/`.
  - Offline sync queue (`lib/sync-queue.ts` / `SyncOfflineContext.tsx`) to queue updates when network is lost.
  - `SyncManager.tsx` UI overlay to display sync state, trigger retries, and display sync errors.
  - Row-Level Security policies restricting sync access to the owner (`auth.uid() = user_id`) and account deletion cascade to wipe synced data.
- **OpenAI & OpenRouter Health Probes** — Extended the server `/api/health` endpoints to perform active HTTP/JSON status checks against OpenAI (`pingOpenAI`) and OpenRouter (`pingOpenRouter`) API status endpoints, completing the fallback chain visibility.
- **Sync Verification Utility** — Added `scripts/verify-sync.ts` to perform end-to-end sync engine reconciliation audits.
- **Alerting & TTS Metrics Integration Tests** — Created [index.integration.test.ts](../server/index.integration.test.ts) to verify middleware alertness threshold checks and TTS metrics recording.

### Fixed
- **Gemini API Key Leakage** — Secured `pingGemini()` to pass the API key in the `x-goog-api-key` header rather than exposing it as a query parameter.
- **API routes schema cleanups** — Corrected TypeScript exclusions and configuration setups to avoid script paths polluting compile-time output.

### Changed
- **Dead Code Cleanup** — Deleted the unused text-chat routes file (`routes.ts`) and its tests (`routes.test.ts`) from the `chat/` replit integrations directory, maintaining only the active voice-chat endpoints.
- **Refreshed Test Coverage** — Re-ran code coverage analysis, showing **1294 passing tests** across **70 test files**.

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
  *[Corrected 2026-08-12: Sentry capture is via explicit `Sentry.captureException()` calls in the
  error handler and process-event listeners, not a Sentry Express handler middleware — see
  server/index.ts.]*
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
  *[Correction 2026-07-19: this change is not present in the current config —
  `eslint.config.js` sets no react-hooks rules, and the installed
  `eslint-plugin-react-hooks` 5.x predates these rules (they ship in the v6
  line). Strict lint (`--max-warnings=0`) passes with zero warnings regardless;
  see `docs/archive/audits/AUDIT-JEST-MISMATCH-CANONICAL-2026-07-19.md`.]*

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
