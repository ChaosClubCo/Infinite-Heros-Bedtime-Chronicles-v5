# CLAUDE.md - Infinity Heroes: Bedtime Chronicles v5

## Merge Provenance

This codebase is the result of consolidating three sibling repos into one canonical
"super version" (2026-07-13):
- **`chaosclubco/infinite-heros-bedtime-chronicles-v5`** — this repo; the canonical base
  (clean, modular, most feature-complete of the three).
- **`krosebrook/bedtime_chronicles-v2`** — contributed one ported feature (the offline
  sync-queue, see below). Its repo also contained an actively-developed native
  Android/Kotlin rewrite (Jetpack Compose, Room DB) that was **archived, not carried
  forward** — Expo/React Native remains the sole canonical client. See
  `archive/android-kotlin-rewrite/README.md` for what it was and how to retrieve the
  full source (preserved on the `archive/android-kotlin-rewrite-2026-07-13` branch in
  that repo). Its Firebase auth was likewise not ported — Supabase auth (already in this
  repo) remains canonical.
  > ⚠️ **Unresolved as of 2026-09-08**: the `archive/android-kotlin-rewrite/` directory
  > this paragraph points to does **not exist** in the current tree (`git ls-files` has no
  > `archive/` path). Live, git-tracked Kotlin/Jetpack Compose source instead sits at
  > `app/src/main/java/...` — inside the Expo Router `app/` directory, where only route
  > files belong. This is either a lost archival step or a bad merge artifact; it has not
  > been resolved and needs a maintainer decision, not a docs fix. See "Known Gotchas."
- **`krosebrook/infinite-heros-bedtime-chronicles-v5-main`** — had no application source
  in its git history (only docs/config); contributed nothing beyond receiving the merged
  tree so all three repos converge on identical content.
- **Ported from v2:** the offline interaction sync-queue (`lib/sync-queue.ts`,
  `lib/useSyncOffline.ts`, `POST /api/sync/interactions`) — see the `lib/` and
  "Key API Endpoints" sections below.

## Project Overview

AI-powered interactive bedtime story app for children ages 3-9. Kids create custom superheroes and experience personalized, AI-generated adventures with illustrations, narration, and gamification. Full-stack mobile-first app using Expo (React Native) frontend with Express.js backend.

**Repository type:** Single full-stack app (Expo mobile + Express API server)
**Primary language:** TypeScript (strict)
**Package manager:** npm

## Tech Stack

- **Frontend (mobile — canonical client):** Expo SDK ~55, React Native (New Architecture), Expo Router ~55 (file-based routing, single root `app/_layout.tsx` — all navigation params via `useLocalSearchParams<T>()` generics; never use untyped string routes). Exact pins live in `package.json` and drift routinely via Dependabot — as of 2026-09-08: `expo` ~55.0.30, `react-native` 0.87.1, `expo-router` ~55.0.18, `react`/`react-dom` 19.2.8. Always treat `package.json` as authoritative over any version stated in prose (including in this file). An Expo SDK 55→57 upgrade is **spec'd but not executed** — see `docs/operations/EXPO-57-UPGRADE-SPEC.md` and `scripts/verify-expo57-readiness.mjs`; `package.json` still pins SDK 55.
- **Frontend (web — second, undocumented-relationship stack):** a separate Vite + React app lives under `src/` (`src/App.tsx`, `src/main.tsx`, `src/components/`, `src/data/`, `src/services/`), served by root `index.html` and driven by `npm run dev` / `npm run build` / `npm run preview` (vite / vite build / vite preview — distinct from `expo:dev` / `server:build`). It duplicates several component names from the Expo client (`HeroCard.tsx`, `StoryReader.tsx`, etc.) with independent implementations, and receives active feature commits in the same sprints as the Expo app (see `docs/CHANGELOG.md` 2026-08-22 / 2026-08-30 entries). **No document in this repo states whether `src/` is the new canonical web surface (replacing Expo's web export) or a separate/experimental product** — treat this as open until a maintainer clarifies; don't assume parity between the two component trees.
- **State:** TanStack React Query v5 (server state) + React Context (app settings, profiles)
- **Local Storage:** AsyncStorage for stories, profiles, badges, streaks, parent controls
- **Styling:** React Native StyleSheet + react-native-reanimated v4 for animations
- **Fonts:** Nunito (primary), Plus Jakarta Sans (UI), Bangers (display/titles)
- **Validation:** Zod v4
- **Backend:** Express.js v5, TypeScript, Node.js 20.19+ / 22.13+ (see `engines` in `package.json`)
- **Database:** PostgreSQL + Drizzle ORM v0.45 (voice chat features only)
- **Auth:** Supabase Auth (optional) — bearer-token (JWT) middleware gated on `SUPABASE_SERVICE_ROLE_KEY` + Supabase URL
- **AI:** Multi-provider router with per-task fallback chains, circuit breakers, retry with jitter, and timeouts (see `server/ai/router.ts`). Chains: `story`: Anthropic → Gemini → OpenAI → Meta-Llama → xAI → Mistral → Cohere; `suggestion`: Gemini-first chain
- **Observability:** pino structured logging, in-process metrics, load-shedding, idempotency cache, feature flags
- **TTS:** ElevenLabs API (eleven_multilingual_v2 model, MP3 44.1kHz/128kbps, 9 narrator voices)
- **Video:** OpenAI Sora 2 (optional)
- **Build:** esbuild (server), Metro (client), Babel with React Compiler
- **Android:** built via EAS (android-only build/submit profiles in `eas.json`; package `com.infinityheroes.bedtime`; SDK versions are managed by Expo defaults — not overridden in `app.json`)

## Project Structure

```
app/                    # Expo Router screens (file-based routing)
  _layout.tsx           # Root layout — providers: ErrorBoundary → QueryClient → Profile → Settings → Gesture → Keyboard
  index.tsx             # Launch gate ("/"): waits for lib/launch-gate.ts decision, then redirects (consent → welcome → tabs)
  (tabs)/               # Tab navigation (home, create, library, saved, profile)
    _layout.tsx          # Tab bar layout (5 tabs, 60px height + bottom inset)
    index.tsx / create.tsx / library.tsx / saved.tsx / profile.tsx  # The 5 tab screens
  story.tsx             # Story reading/playback composition shell (~440 lines; logic in lib/use* hooks, UI in components/Story*, fullScreen fade modal)
  story-details.tsx     # Story customization wizard (slide from right)
  story-seeds.tsx       # Browsable story-seed gallery (filter by theme + age; seeds in constants/story-seeds.ts, card UI in components/SeedCard.tsx)
  completion.tsx        # Post-story celebration + badge awarding (fullScreen fade modal)
  quick-create.tsx      # Fast onboarding hero creation (modal from bottom; opened after welcome's "Get Started")
  madlibs.tsx           # Mad Libs mode wizard (slide from right)
  sleep-setup.tsx       # Sleep mode setup (slide from right)
  settings.tsx          # App settings (slide from right)
  trophies.tsx          # Badge collection view (slide from right)
  voice-chat.tsx        # Voice chat UI (conversation list + hold-to-speak; reached from profile tab)
  parental-consent.tsx  # COPPA parental-consent gate (parent gate + consent; first-launch, before onboarding)
  privacy.tsx           # In-app Privacy Policy screen (native, offline; linked from consent + settings)
  welcome.tsx           # Onboarding splash (fade animation)
  src/main/java/...     # ⚠️ STRAY: live, git-tracked native Android/Kotlin (Jetpack Compose) source
                         #   sits here, inside the Expo Router app/ tree, where only route files
                         #   belong. Contradicts the "archived to archive/android-kotlin-rewrite/"
                         #   claim in "Merge Provenance" above — that archive/ directory does not
                         #   exist. Unresolved; do not delete or move without a maintainer decision.
src/                    # ⚠️ SEPARATE Vite + React web app — relationship to app/ above is UNDOCUMENTED
  App.tsx / main.tsx    # Vite entry (served by root index.html); npm run dev/build/preview drive this
  components/           # Own component tree (HeroCard.tsx, StoryReader.tsx, etc. — NOT the same files
                         #   as the Expo components/ below despite overlapping names)
  data/                 # avatars.ts, badges.ts, bedtimeAffirmations.ts, dreamThemes.ts,
                         #   featuredStories.ts, heroes.ts, madlibsTemplates.ts, storySeeds.ts, visualizerThemes.ts
  services/              # aiStoryGenerator.ts, audioNarration.ts, dreamIllustration.ts, offlineCacheService.ts
  integrations/audio/    # Voice recording/playback/streaming utilities (parallel to server/replit_integrations/audio)
  types.ts               # Web-app-local type definitions (not constants/types.ts)
components/             # Reusable React Native components (Expo client — see src/components/ above for
                         #   the web app's separate, differently-implemented components of similar names)
  ErrorBoundary.tsx     # Error boundary wrapper
  ErrorFallback.tsx     # Error fallback UI component
  HeroCard.tsx          # Hero template card (used in hero selection grid)
  BadgeCard.tsx         # Badge/trophy display card (trophies screen)
  OnboardingSlide.tsx   # Illustrated onboarding slide (welcome flow)
  SeedCard.tsx          # Story-seed card (story-seeds.tsx gallery)
  KeyboardAwareScrollViewCompat.tsx  # Cross-platform keyboard-aware scroll
  MemoryJar.tsx         # Story memory display
  OfflineBanner.tsx     # Offline state banner (wired into app/_layout.tsx via useNetworkStatus)
  ParentControlsModal.tsx  # Parent controls (PIN-protected, with lockout after failed attempts)
  ProfileModal.tsx      # Child profile management
  SettingsModal.tsx     # Settings overlay
  PulsingOrb.tsx        # Animated orb effect
  StarField.tsx         # Background star animation
  AnimatedView.tsx      # Reanimated wrapper around View
  ResponsiveContainer.tsx  # Responsive max-width container (useWindowDimensions)
  SyncManager.tsx       # Cloud-sync status trigger (mounted in app/_layout.tsx; see lib/sync/ below)
  StoryGeneratingView.tsx / StorySceneDisplay.tsx / StoryPlayerControls.tsx  # Story screen: generation view, scene image/video, player bar
  StoryTopBar.tsx / SleepTimerBar.tsx / StoryTextDisplay.tsx / StoryProgressBar.tsx / StoryChoices.tsx / ChoiceButton.tsx / FloatingParticle.tsx  # Story screen presentational pieces
constants/              # Types, hero templates, colors, timing
  types.ts              # Core TypeScript interfaces
  heroes.ts             # 8 pre-defined hero templates
  colors.ts             # Cosmic theme palette
  timing.ts             # Animation timing constants
  story-theme.ts        # Story-mode themes, voices, loading messages, speed rates + StoryMode/StoryState/StoryTheme types
  story-seeds.ts        # Browsable story-seed catalog (used by app/story-seeds.tsx)
lib/                    # Client utilities
  SettingsContext.tsx    # Unified settings provider (React Context)
  ProfileContext.tsx     # Child profile context
  AuthContext.tsx        # Supabase auth context (email/password; getIdToken() supplies the Bearer JWT)
  storage.ts            # AsyncStorage helpers
  storage.test.ts       # Storage unit tests
  storage.comprehensive.test.ts  # Extended storage test suite
  storage-migration.ts  # Versioned AsyncStorage migration runner (see Known Gotchas)
  storage-migration.test.ts      # Storage migration tests
  launch-gate.ts        # resolveLaunchRoute(): single source of truth for the cold-start consent/onboarding decision; also runs runStorageMigrations() first
  launch-gate.test.ts   # Launch-gate unit tests
  consent-record.ts     # CONSENT_VERSION/CONSENT_DISCLOSURES + COPPA parent-gate verification logic
  consent-record.test.ts  # Consent-record unit tests
  sync/                 # Cloud-sync engine (M3): reconcile.ts (pure last-write-wins + tombstones), mappers.ts (local⇄SyncRecord, strips base64 blobs), supabase-sync.ts (pull/push/purge on sync_records), engine.ts (syncEntity/syncAll via EntityAdapter), storage-adapters.ts (all six entity adapters), runSync.ts (gated runSync()/purgeCloudData()), report.ts (pluggable SyncErrorReporter, forwards sync failures to Sentry via app/_layout.tsx). Triggered by components/SyncManager.tsx (mounted in app/_layout.tsx; runs on app open, foreground, reconnect, and sign-in — `user?.id` is in the effect deps — then calls refreshProfiles() to merge profile stubs) + app/completion.tsx (after save). See supabase/migrations/20260713000817_0001_sync_tables.sql
  ConsentContext.tsx    # Reactive consent state driving the root layout's Stack.Protected guard
  scene-handoff.ts      # In-memory handoff of scene images from story → completion (too large for nav params)
  replay-params.ts      # buildStoryReplayParams(): shared /story replay params for all replay entry points
  replay-params.test.ts # Replay-params unit tests
  query-client.ts       # TanStack React Query config (staleTime: Infinity, retry: false)
  query-client.test.ts  # Query client unit tests
  useNetworkStatus.ts   # NetInfo hook returning { isConnected, isInternetReachable } (used by app/_layout.tsx to gate OfflineBanner)
  sync-queue.ts         # Offline interaction queue (like/unlike/story_completion) — ported from bedtime_chronicles-v2, see Merge Provenance
  useSyncOffline.ts     # Drains lib/sync-queue.ts on reconnect via POST /api/sync/interactions, invalidates stories/favorites/readStories queries
  SyncOfflineContext.tsx # Mounts useSyncOffline() once at app root (app/_layout.tsx); screens read status via useSyncOfflineStatus()
  sync-queue.test.ts    # Sync-queue unit tests
  badges.ts             # Centralized badge-award evaluation (see Badge System)
  badges.test.ts        # Badge logic unit tests
  customHeroStorage.ts  # AsyncStorage helpers for user-created custom heroes
  confirmDestructive.ts # Cross-platform confirm() wrapper for destructive actions (delete profile/story)
  useAutoAdvance.ts / useBackgroundMusic.ts / useLoadingMessages.ts / useSceneGeneration.ts / useSleepTimer.ts / useStoryAudio.ts / useVideoGeneration.ts  # Story-screen hooks extracted from app/story.tsx (not covered by Vitest — they import Expo native modules; exercised by the jest `test:components` suite instead)
server/                 # Express.js backend
  index.ts              # Server bootstrap, security middleware, CORS, graceful shutdown
  routes.ts             # Route composer: auth gate + registers domain modules, returns HTTP server (~105 lines)
  routes/               # Domain route modules (health, account, story, images, tts, music, suggest, video, github-webhook) + context.ts (singletons) + helpers.ts (rate-limit middleware, error/IP/cache-path helpers)
  auth.ts               # Supabase bearer-token (JWT) middleware (optional, lazy-init service-role client)
  validation.ts         # Zod request schemas + sanitizeString
  prompts.ts            # Story system/user prompt builders + CHILD_SAFETY_RULES
  rate-limit.ts         # Per-IP sliding-window rate limiter (in-memory Map with optional Cloudflare KV persistence)
  circuit-breaker.ts    # Circuit breaker for AI providers
  retry.ts              # Retry with jitter
  load-shedding.ts      # Active-request ceiling middleware
  idempotency.ts        # Idempotency cache (TTL 5 min, keyed by request hash; KV-backed for cross-invocation survival — see kv.ts)
  logger.ts             # pino structured logger
  metrics.ts            # In-process metrics (request/provider counters)
  feature-flags.ts      # Runtime feature flag resolver (incl. contentSafety* flags)
  tts-cache.ts          # TTS file cache with size + age limits (/tmp only — R2 backfill lives in the tts route, not here)
  r2.ts                 # Cloudflare R2 (S3-compatible, @aws-sdk/client-s3) client for persistent TTS-audio caching — r2Get/r2Put, gated on R2_ENABLED
  utils.ts              # toErrorMessage, classifyError, createErrorResponse
  alerting.ts           # Fires Sentry alerts on 5xx-rate / TTS-failure-rate threshold breaches
  health-checks.ts      # Background-refreshed, short-TTL live-reachability cache for /api/health, /api/ai-providers
  kv.ts                 # Cloudflare KV client wrapper (persistent rate-limit + idempotency; falls back to in-memory when unset)
  ai/                   # Multi-provider AI router
    index.ts            # Provider registration & status checking
    router.ts           # AIRouter class with fallback chain, circuit breakers, retry
    json.ts             # extractFirstJson (balanced-brace JSON scan) — shared by router + buffered SSE
    types.ts            # AI provider interface definitions
    cost.ts             # Per-provider token cost estimation
    providers/          # Gemini, OpenAI, Anthropic, OpenRouter
  elevenlabs.ts         # TTS voice definitions & generation
  suno.ts               # Background music serving
  video.ts              # Sora video generation
  storage.ts            # Server-side in-memory story cache (NOT the same as lib/storage.ts)
  db.ts                 # Drizzle ORM client
  replit_integrations/  # Audio, chat, image, batch modules (audio + image conditionally registered; chat/'s route module was removed in the 2026-07-14 Dead Code Cleanup — only index.ts and storage.ts remain)
  templates/            # HTML templates (landing page, privacy policy)
shared/                 # Shared between client & server
  schema.ts             # Drizzle ORM schema (users table, re-exports models/chat.ts)
  models/chat.ts        # Conversation & message tables
  safety-terms.ts       # Canonical HARD banned-term list + containsUnsafeContent() — one source of truth for the server moderator and the client render fail-safe
  sync-types.ts         # Cloud-sync transport contract (SyncRecord envelope, SyncEntity union) — dependency-free, shared by client + any Edge function
docs/                   # Project documentation
  ARCHITECTURE.md       # System design & data flow
  API.md                # API endpoint reference (28 endpoints: 22 always-registered + 6 conditional)
  SECURITY.md           # Unified security policy, OWASP assessment, and developer guide
  ROADMAP.md            # Development roadmap (WSJF-prioritized)
  CHANGELOG.md          # Version history
  COPPA-COMPLIANCE.md   # COPPA audit and privacy analysis
  BETA_TESTING.md       # Beta testing plan
  VERIFICATION-M1-M3.md # On-device/manual verification checklist for the safety + audio-cache + cloud-sync work
  GITHUB-CUSTOM-AGENTS.md    # GitHub Copilot custom agent configurations
  adr/                  # Architecture Decision Records (6 ADRs)
  agents/               # 15 files: 12 agent spec files + README + pr-review.md + security.md
  best-practices/       # Best-practice guides (ACCESSIBILITY, PERFORMANCE, TESTING)
  operations/           # DEPLOYMENT.md, EAS-SECRETS-CHECKLIST.md, OBSERVABILITY.md, SECRETS-ROTATION.md,
                         #   BRANCH-PROTECTION-SETUP.md, README.md, EXPO-57-UPGRADE-SPEC.md, RELEASE-PROOF-LEDGER-376.md,
                         #   PLAY-STORE-SUBMISSION-CHECKLIST.md, GOOGLE-PLAY-STORE-REQUIREMENTS.md,
                         #   CLOUD-SYNC-ISOLATION-EVIDENCE.md, MIRROR-ARCHIVAL-RUNBOOK.md, WEBHOOK-SURFACE-AUDIT.md,
                         #   DEPENDENCY-AUDIT-REMEDIATION.md (grown substantially since 2026-07; not exhaustively listed)
  runbooks/             # incident-response, database-migrations, provider-outage, rollback, monitoring-alerting, deployment-provenance, README.md
  evidence/, ai/, superpowers/, screenshots/  # newer subdirs (release-evidence manifests, AI-context docs,
                         #   and the Cloudflare-migration design spec under superpowers/specs/) — not individually inventoried here
  BETA_BLOCKERS_2026-08-22.md, BETA_READINESS_2026-08-22.md, RELEASE_FREEZE_2026-08-24.md,
  TEST-COVERAGE-ANALYSIS.md  # dated point-in-time snapshots — check each file's own date before trusting its figures
  SECURITY.md            # NOTE: root also has a near-empty SECURITY.md stub pointing here — see docs/SECURITY.md for the real policy
  archive/              # Consolidated historical records
    audits/             # Historical audit reports (AUDIT-*, COMPREHENSIVE-*, DEAD-CODE-*)
    plans/              # Historical maturity, hardening, and readiness plans
# api/                 — REMOVED (was the Vercel serverless entry point, api/server.mjs).
#                         Vercel repo-driven deploys are disabled (see DEPLOY.md). The Cloudflare
#                         Worker replacement (worker/index.ts, per the 2026-08-28 migration design)
#                         does not exist yet either — production deploy is currently BLOCKED/in-between.
scripts/                # Build scripts
  build.js              # Expo static build script
  build-android.sh      # Android build script
  preflight.js          # Pre-build environment / dependency checks
  generate-hero-portraits.mjs  # Pre-bakes hero portrait images (one-off/CI asset generation)
```

**Root-level docs and config** (not part of the app source tree):
- `AGENTS.md` — agent framework conventions
- `AGENT-COORDINATION.md` — path-ownership rules for concurrent multi-agent work (Claude Code + Antigravity edit the same tree)
- `CONTRIBUTING.md` — contribution guidelines
- `CONVENTIONS.md` — code conventions reference
- `DEPLOY.md` — deployment policy/runbook. **New Vercel repo-driven deploys are disabled** (`vercel.json` is a fail-closed tombstone with `git.deploymentEnabled=false`), but the **existing Vercel deployment still serves production** (`bedtime-chronicles.com`/`www.bedtime-chronicles.com`) — `DEPLOY.md` explicitly forbids detaching those domains or deleting the Vercel project until the Cloudflare gate passes. The canonical target going forward is Cloudflare Workers + Static Assets per `docs/superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md`, but **no Worker code exists in the repo yet** — so *new* revisions are blocked on both platforms, while the *current* revision keeps running on Vercel. EAS Build → Android is configured but currently can't complete in CI either (missing `package-lock.json` breaks its `npm ci` step, same as other workflows). Read `DEPLOY.md` directly before touching deploy anything; earlier prose elsewhere describing "Vercel/EAS" as canonical, or describing production as live on neither platform, is stale/wrong.
- `ARCHITECTURE.md` / `CHANGELOG.md` (root) — thin stub pointers to the canonical `docs/ARCHITECTURE.md` / `docs/CHANGELOG.md`; edit the `docs/` versions, not these
- `GEMINI.md` — Gemini-specific agent instructions
- `GLOSSARY.md` — project terminology
- `MEMORY.md` — persistent agent memory/context
- `TODO.md` — tracked work items
- `replit.md` — Replit-specific setup notes
- `agent-registry.json` — registered agent definitions
- `skills-lock.json` — locked agent skill versions
- `CLAUDE.md` — this file (primary AI agent instructions)

## Common Commands

```bash
# Development (parallel frontend + backend)
npm run server:dev          # Backend on port 5000 (tsx server/index.ts)
npm run expo:dev            # Frontend on port 8081 (Replit environment)
npx expo start              # Frontend (non-Replit)
# ⚠️ npm run dev is NOT "both at once" anymore — package.json now maps `dev` to `vite --host 0.0.0.0 --port 3000`
#    (the src/ web app, see "Frontend (web)" above). To run Expo + server together, run
#    `npm run dev:server` and `npm run dev:expo` in separate terminals — no single combined script exists.

# Build
npm run server:build        # esbuild → server_dist/index.js (CommonJS, minified)
npm run expo:static:build   # Expo static build (node scripts/build.js)

# Production
npm run server:prod         # NODE_ENV=production node server_dist/index.js

# Code Quality
npm run lint                # npx expo lint
npm run lint:fix            # npx expo lint --fix
npm run typecheck           # npx tsc --noEmit

# Testing
npm test                    # vitest run (single run) — server/lib pure units
npm run test:watch          # vitest (watch mode)
npm run test:coverage       # vitest run --coverage
npm run test:components      # jest (jest-expo + @testing-library/react-native) — RN component + Expo-native hook tests

# Database
npm run db:push             # Drizzle schema migration (needs DATABASE_URL)

# Web (secondary Vite/React stack under src/ — see Tech Stack / Project Structure)
npm run dev                  # ⚠️ NOT the Expo+server dev loop — this is `vite --host 0.0.0.0 --port 3000` (serves src/)
npm run build                # vite build (src/ → static web bundle)
npm run preview              # vite preview

# Release/provenance verification (added since mid-2026-07; not documented elsewhere in this file until now)
npm run verify:sync              # Validates lib/sync/reconcile + mapper correctness for cloud-sync entities
npm run verify:milestones        # Validates M1 (safety) / M2 (TTS cache) / M3 (Supabase sync) invariants together
npm run verify:release-proof     # CORRECTED 2026-09-08 (Codex review caught the original overclaim): its own header
                                  #   docstring lists 8 categories for Issue #376, but verifyReleaseProof() only actually
                                  #   runs 4 gates — identity (repo/ref), runtime/engine alignment, privacy-route coverage,
                                  #   and EAS config. It does NOT check M1-M3 safety/sync invariants, secure storage,
                                  #   account-deletion behavior, or rollback evidence despite the docstring listing them —
                                  #   don't treat a pass as proof of those. Not an "18-point matrix."
npm run generate:beta-readiness  # CORRECTED 2026-09-08: writes to `.release-evidence/beta-acceptance-manifest.json`
                                  #   (default --output), NOT docs/evidence/beta-acceptance-manifest.json — that path is
                                  #   the read-only --template it reads FROM. Don't archive/inspect the template as if it
                                  #   were the generated evidence.
npm run verify:beta-readiness    # Validates the generated .release-evidence/ manifest against the template's gates
npm run preflight:eas            # EAS/Android build preflight (child-safety permissions, icons, eas.json profiles).
                                  #   CORRECTED 2026-09-08: its secrets check (validateClientSecretsSeparation) only scans
                                  #   `.env.example` line-by-line for forbidden EXPO_PUBLIC_*-prefixed key NAMES — it does
                                  #   NOT scan tracked source files or values, so "no leaked secrets" overstates it.
npm run verify:mirror            # CORRECTED 2026-09-08: checks package.json's repo URL text + that the local archival
                                  #   runbook (docs/operations/MIRROR-ARCHIVAL-RUNBOOK.md) contains its required section
                                  #   headings — it never calls the GitHub API, so it cannot confirm the legacy mirror repo
                                  #   is actually archived. `docs/ROADMAP.md` still lists that archival as outstanding.
npm run verify:expo57-readiness  # Validates SDK 55→57 upgrade-spec readiness (upgrade itself is NOT yet executed)

# Verify (compile_applet standard — required before every PR)
npm run typecheck           # TypeScript type check (tsc --noEmit)
npm run lint                # Expo lint
npm test                    # Vitest unit tests
```

## Architecture

```
[Expo Mobile App] → HTTPS/JSON → [Express Server (port 5000, 0.0.0.0)]
                                    ├→ [Auth middleware] — Supabase bearer token / JWT (optional)
                                    ├→ [Rate limiter] — per-IP sliding window
                                    ├→ [Load shedding] — active-request ceiling
                                    ├→ [Idempotency cache] — 5-min dedup on POSTs
                                    ├→ [AI Router] → Anthropic → Gemini → OpenAI → OpenRouter (circuit-broken + retried)
                                    ├→ [Output safety] — moderateStory → regenerate once → known-safe fallback (server/safety/*)
                                    ├→ [ElevenLabs TTS] → /tmp/tts-cache (size + age bounded) → optional Cloudflare R2 persistent tier (survives cold starts); client also caches MP3s on-device (lib/tts-cache.ts)
                                    ├→ [PostgreSQL + Drizzle] (voice chat history)
                                    └→ [OpenAI Sora] (video generation)
```

### AI Provider Fallback Chain

**Text Generation:**
| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Anthropic | `claude-sonnet-4-6` |
| 2 | Gemini | `gemini-2.5-flash` |
| 3 | OpenAI | `gpt-4o-mini` |
| 4 | OpenRouter/Meta | `meta-llama/llama-4-scout-17b-16e-instruct` |
| 5 | OpenRouter/xAI | `x-ai/grok-3-mini` |
| 6 | OpenRouter/Mistral | `mistralai/mistral-small-3.1-24b-instruct` |
| 7 | OpenRouter/Cohere | `cohere/command-a-03-2025` |

Each provider is wrapped in a circuit breaker (5 failures → open → 60s reset) and retried with jitter (maxRetries: 1) before the router falls through to the next provider.

**Image Generation:**
| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Gemini | `gemini-2.5-flash-image` (with optional thinking budget) |
| 2 | OpenAI | `gpt-image-1` |

### Story Modes
- **Classic** — Adventure stories with choices
- **Mad Libs** — Silly stories with user-provided words
- **Sleep** — Calming, meditative stories for bedtime

### Story Duration Configuration
| Duration | Parts | Word Count |
|----------|-------|------------|
| short | 3 | 200-300 |
| medium-short | 4 | 350-450 |
| medium | 5 | 500-650 |
| long | 6 | 750-950 |
| epic | 7 | 1000-1300 |

## Key API Endpoints

**Story Generation:**
- `POST /api/generate-story` — Synchronous story generation (JSON)
- `POST /api/generate-story-stream` — Streaming story generation (SSE)
- `POST /api/generate-avatar` — Hero portrait image
- `POST /api/generate-scene` — Story scene illustration (random art style from 12 presets)
- `POST /api/suggest-settings` — AI-powered story recommendations

**Text-to-Speech:**
- `POST /api/tts` — Generate narration (max 5000 chars)
- `GET /api/tts-audio/:file` — Retrieve cached audio file
- `POST /api/tts-preview` — Voice preview for selection

**Configuration & Observability:**
- `GET /api/voices` — Available narrator voices for current mode
- `GET /api/music/:mode` — Background music track
- `GET /api/music-info/:mode` — Music track metadata
- `GET /api/health` — Server health check (AI/TTS availability, features, active requests)
- `GET /api/ai-providers` — Provider availability status
- `GET /api/metrics` — In-process metrics
- `GET /privacy` — Privacy policy HTML

**Sync:**
- `POST /api/sync/interactions` — Drain target for the client's offline interaction queue (`lib/sync-queue.ts`); currently logs/echoes each interaction, no backing datastore yet

**Video (optional):**
- `GET /api/video-available` — Whether video generation is configured
- `POST /api/generate-video` — Create video via Sora 2
- `GET /api/video-status/:id` — Check video job status
- `GET /api/video/:id` — Retrieve generated video

**Voice Chat (requires AI_INTEGRATIONS_OPENAI_API_KEY + DATABASE_URL + the `voiceChatEnabled` feature flag — registered by `registerAudioRoutes()` in `server/replit_integrations/audio/routes.ts`, see `server/routes.ts`):**
- `GET /api/conversations` — List conversations
- `POST /api/conversations` — Create new conversation
- `GET /api/conversations/:id` — Get conversation history
- `DELETE /api/conversations/:id` — Delete conversation
- `POST /api/conversations/:id/messages` — Send voice message in a conversation

**Image generation (conditional — requires AI_INTEGRATIONS_GEMINI_API_KEY, registered by `registerImageRoutes()`):**
- `POST /api/generate-image` — Replit-integration image generation route (distinct from `/api/generate-avatar` and `/api/generate-scene` above)

**Account:**
- `DELETE /api/account` — Permanently delete the authenticated user's account and cascade-delete their synced cloud data (`server/routes/account.ts`)

**GitHub Integration:**
- `POST /api/github/webhook` — GitHub webhook receiver, authenticated via `X-Hub-Signature-256` HMAC (not Supabase auth)

> `server/replit_integrations/chat/routes.ts` was removed in the 2026-07-14 Dead Code Cleanup (see `docs/CHANGELOG.md`) — it implemented a text-chat variant of `POST /api/conversations/:id/messages` but was never registered. Only `index.ts` and `storage.ts` remain in `server/replit_integrations/chat/`.

## Authentication

- The server uses Supabase Auth (`server/auth.ts`) for token verification: a lazy-init service-role client (`SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_URL`) validates the Bearer access token via `supabase.auth.getUser(token)`.
- Clients sign in with Supabase email/password (`lib/AuthContext.tsx`, gated on `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`) and send the session JWT as a `Bearer` header via `getIdToken()`.
- `requireAuth` middleware attaches `req.user = { uid, isAnonymous }` and 401s on a missing or invalid token.
- **Production guard:** when `NODE_ENV=production` and Supabase is not configured, every auth-gated route returns 503. There is no `AUTH_DISABLED` opt-out — it was removed in the 2026-04 audit.
- In dev (no `NODE_ENV=production`), auth is skipped and an anonymous `req.user` is assigned from the client IP.
- **`SUPABASE_SERVICE_ROLE_KEY` is server-only** — never read it into an `EXPO_PUBLIC_*` var or ship it in the client bundle.

## Code Conventions

### Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- React components: PascalCase
- Hooks: `use` prefix, camelCase (`useSettings`, `useProfileStore`)
- Constants: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config objects
- AsyncStorage keys: `@infinity_heroes_<descriptor>` pattern

### TypeScript
- Strict mode enabled — never use `any` without a `// intentional: <reason>` comment
- Path aliases: `@/*` (project root), `@shared/*` (shared folder)
- All API request/response shapes defined in `server/validation.ts` (Zod) or `shared/schema.ts`
- Component props typed inline as interfaces above the component
- Core interfaces in `constants/types.ts`: StoryPart, CachedStory, ChildProfile, EarnedBadge, ParentControls

### Styling
- Use `StyleSheet.create()` — no inline style objects except for dynamic values
- Color constants from `constants/colors.ts` — never hardcode color hex values
- Cosmic theme: primary `#05051e`, accent `#6366f1`, starlight `#E8E4F0`
- Glassmorphism: `rgba(255,255,255,0.03)` bg + `rgba(255,255,255,0.1)` border
- Dark UI by default (`userInterfaceStyle: "dark"` in app.json)
- Portrait orientation only
- Prefer `StyleSheet.absoluteFill` over `absoluteFillObject` (project convention)

### Error Handling
- Server (global handler): catch errors, sanitize via `sanitizeErrorMessage()` (strips newlines, truncates to 200 chars), return `{ error: string }` with appropriate HTTP status. Never leak stack traces.
- Route-level validation errors (e.g. Zod schema failures): return `{ error: "Human-readable message" }` directly from handler.
- Server errors should flow through `server/utils.ts` helpers (`toErrorMessage`, `classifyError`, `createErrorResponse`) so classification + logging stay consistent.
- Client: use React Error Boundaries for screen-level errors; show user-friendly message, not raw error
- AI calls: the AI router handles provider fallback, circuit breaking, and retry automatically; callers should still catch final failure

## Architecture Constraints

- **AI calls must go through `server/ai/index.ts`** — never call AI provider SDKs directly from routes
- **No AI keys on the client** — all provider keys are server-side environment variables only
- **Input sanitization is mandatory** — all user-provided string inputs must pass through `sanitizeString()` (`server/validation.ts`) before inclusion in AI prompts; default limit is 500 chars (higher limits for specific fields, e.g. `sceneText` uses 2000 chars)
- **Child safety system prompt** — the `CHILD_SAFETY_RULES` constant (`server/prompts.ts`) must be included in every story generation prompt. Never remove or bypass it
- **Rate limiting** — per-IP sliding window rate limiter (`server/rate-limit.ts`) protects all POST endpoints. Do not add endpoints that bypass it. When auth is enabled, `req.user.uid` is used instead of IP.
- **AsyncStorage** is the canonical client-side storage. Use helpers in `lib/storage.ts` rather than calling AsyncStorage directly
- **Settings** live exclusively in `SettingsContext` (`lib/SettingsContext.tsx`). Do not create parallel settings systems

## Security Rules

- Never commit secrets, API keys, or credentials. Use environment variables
- All server responses must use `sanitizeErrorMessage()` — never return raw error objects
- TTS filename serving: only files matching `/^[a-f0-9]+\.mp3$/` are served — do not relax this regex
- Video ID validation: only IDs matching `/^[a-f0-9]+$/` are accepted
- CORS allowed origins: Replit dev/prod domains, localhost (ports 5000/8081/19000-19006), `https://bedtime-chronicles.com`, `https://www.bedtime-chronicles.com`, Vercel preview URLs matching `infinite-hero*.vercel.app`, and `VERCEL_URL` env var — do not add wildcards
- Input truncation via `sanitizeString()` is mandatory before any prompt inclusion
- PIN storage: parent-controls PIN is stored as a SHA-256 hash with a per-install salt (`hashPin` / `generatePinSalt` in `lib/storage.ts`); the plaintext PIN is never persisted. Brute-force lockout: 5 failed attempts triggers a 30s lockout (`isPinLockedOut` / `recordFailedPinAttempt` / `resetPinAttempts` in `lib/storage.ts`, enforced in `components/ParentControlsModal.tsx`). See `docs/COPPA-COMPLIANCE.md` §6.

### Child Safety Rules (enforced in AI prompts)
- No violence, weapons, fighting, scary/horror elements
- No real-world brands, celebrities, or copyrighted characters
- No death, injury, illness, abandonment, or loss
- No bullying, meanness, exclusion, or anxiety-inducing language
- All choices lead to positive outcomes
- Focus on: courage, kindness, friendship, wonder, imagination, comfort

### Server Middleware Order
1. Environment validation (warns on missing providers)
2. Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
3. CORS (see allowed origins above, methods: GET/POST/PUT/DELETE/OPTIONS)
4. Body parsing (JSON + URL-encoded, 100KB limit)
5. Request logging (pino)
6. Load shedding (rejects if active-request ceiling exceeded)
7. Expo manifest routing + static file serving
8. Route registration (`requireAuth` applied to all non-GET `/api/*` methods plus `GET /api/conversations*`; rate limit + idempotency per domain module)
9. Global error handler (sanitizes messages)

## Common Tasks

### Add a new API endpoint
1. Add the route handler in the matching `server/routes/<domain>.ts` module (or create a new module exporting `registerXxxRoutes(app)` and call it from `server/routes.ts`)
2. Follow the existing pattern: validate input with a Zod schema in `server/validation.ts`, call logic, return JSON; use `sendRouteError` from `server/routes/helpers.ts` in catch blocks
3. Apply the `rateLimited()` middleware (`server/routes/helpers.ts`) if the endpoint calls external APIs
4. Consider idempotency for expensive writes (use `IdempotencyCache.keyFromBody`)
5. Document in `docs/API.md`
6. Update `README.md` endpoint table if it's a primary endpoint

### Add a new AI provider
1. Create `server/ai/providers/<name>.ts` mirroring the existing provider pattern
2. Add it to the fallback chain in `server/ai/index.ts`
3. Add the API key env var to `.env.example`
4. Update `docs/ARCHITECTURE.md` AI routing section

### Add a new screen
1. Create `app/<screen-name>.tsx` (Expo Router auto-registers it)
2. For tab screens, place under `app/(tabs)/`
3. Import styles from `constants/colors.ts`, wrap in `SafeAreaView`
4. Update `README.md` project structure if it's a significant screen

### Add a new AsyncStorage key
1. Add the helper functions in `lib/storage.ts`
2. Use the `@infinity_heroes_<descriptor>` key naming convention
3. Document the key and data shape in `lib/storage.ts` with a JSDoc comment

## Environment Variables

```
# AI Providers (via Replit integrations)
AI_INTEGRATIONS_GEMINI_API_KEY=
AI_INTEGRATIONS_OPENAI_API_KEY=
AI_INTEGRATIONS_OPENAI_BASE_URL=     # Replit OpenAI connector base URL (used by the voice-chat integration when set; no longer required for route registration)
AI_INTEGRATIONS_ANTHROPIC_API_KEY=
AI_INTEGRATIONS_OPENROUTER_API_KEY=
OPENAI_API_KEY=              # Direct key for video generation

# TTS & Database
ELEVENLABS_API_KEY=          # Optional: if set, used directly; otherwise falls back to Replit ElevenLabs connector
DATABASE_URL=                # PostgreSQL (required for voice chat only)

# Authentication (optional — Supabase)
SUPABASE_URL=                  # Server-side Supabase project URL (falls back to EXPO_PUBLIC_SUPABASE_URL)
SUPABASE_SERVICE_ROLE_KEY=     # Server-only; enables Supabase bearer-token auth on POST endpoints. If unset, auth is skipped in dev (req.user falls back to IP-based anonymous identity) and returns 503 in production.
EXPO_PUBLIC_SUPABASE_URL=      # Client: Supabase project URL (bundled — not a secret)
EXPO_PUBLIC_SUPABASE_ANON_KEY= # Client: Supabase anon key (bundled — not a secret)

# Server Config (optional)
PORT=5000                    # Default 5000
NODE_ENV=                    # development | production
RATE_LIMIT_WINDOW_MS=60000   # Default 60000ms
RATE_LIMIT_MAX=10            # Default 10 requests
TTS_CACHE_MAX_AGE_MS=86400000       # Default 24 hours
TTS_CACHE_MAX_SIZE_BYTES=524288000  # Default 500 MB

# Observability (optional)
EXPO_PUBLIC_SENTRY_DSN=      # Client-side Sentry (bundled into APK — not a secret)

# Cloudflare KV persistent rate limiting (optional — falls back to in-memory when absent)
CLOUDFLARE_ACCOUNT_ID=       # shared with the R2 config below
CLOUDFLARE_KV_NAMESPACE_ID=  # ed09afa77f9243bbb08f3dbe34df1e70
CLOUDFLARE_API_TOKEN=

# Cloudflare R2 persistent TTS-audio cache (optional — falls back to /tmp-only when absent)
# R2_ENABLED (server/r2.ts) requires ALL of: CLOUDFLARE_ACCOUNT_ID (above) + these three.
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=

# Replit-specific (auto-set)
REPLIT_DEV_DOMAIN=           # Dev server domain
REPLIT_DOMAINS=              # Production domains (comma-separated)
EXPO_PUBLIC_DOMAIN=          # Client API domain (set by dev script)
```

Minimum required: `AI_INTEGRATIONS_GEMINI_API_KEY`. Optional for full features: OpenAI, Anthropic, ElevenLabs, DATABASE_URL, Supabase auth vars, Cloudflare KV vars.

## Story Response Schema (AI must return)
```json
{
  "title": "3-6 word title",
  "parts": [{ "text": "2-4 paragraphs", "choices": ["A", "B", "C"], "partIndex": 0 }],
  "vocabWord": { "word": "...", "definition": "child-friendly definition" },
  "joke": "age-appropriate joke",
  "lesson": "gentle life lesson (1-2 sentences)",
  "tomorrowHook": "teaser for next adventure",
  "rewardBadge": { "emoji": "...", "title": "2-3 words", "description": "..." }
}
```

## Client Storage Keys (AsyncStorage)
- `@infinity_heroes_app_settings` — App settings JSON
- `@infinity_heroes_profiles` — Child profiles
- `@infinity_heroes_active_profile` — Currently selected profile
- `@infinity_heroes_stories` — Saved stories
- `@infinity_heroes_read` — Read story tracking
- `@infinity_heroes_badges` — Earned badges
- `@infinity_heroes_streaks` — Reading streaks
- `@infinity_heroes_parent_controls` — Parent controls (PIN stored as SHA-256 hash + salt, see Security Rules)
- `@infinity_heroes_favorites` — Favorite stories
- `@infinity_heroes_onboarding_complete` — Onboarding flag
- `@infinity_heroes_parent_consent` — COPPA parental-consent record (`{ consented, consentedAt, version }`; gated on `CONSENT_VERSION`)
- `@infinity_heroes_preferences` — Legacy key (auto-migrates to app_settings)
- `@infinity_heroes_settings_migrated` — Migration flag for legacy → new settings
- `@infinity_heroes_storage_version` — Storage-schema version tracked by `lib/storage-migration.ts`
- `@infinity_heroes_offline_queue` — Pending offline interaction queue (like/unlike/story_completion), drained by `lib/sync-queue.ts` on reconnect

## App Settings (defaults)
```typescript
{
  audioVolume: 80,           // 0-100
  audioSpeed: 1.0,
  narratorVoice: "moonbeam",
  autoPlay: false,
  storyLength: "medium",     // short | medium-short | medium | long | epic
  ageRange: "4-6",           // 2-4 | 4-6 | 6-8 | 8-10
  defaultTheme: "fantasy",
  autoGenerateImages: false,
  extendMode: false,
  autoPlayNext: false,
  textSize: "medium",        // small | medium | large
  librarySortOrder: "recent", // recent | alphabetical | theme
  showFavoritesOnly: false,
  autoSave: true,
  isMuted: false,
  reducedMotion: false,
  fontSize: "normal",        // normal | large
  sleepTheme: "Cloud Kingdom",
  cloudSyncEnabled: false     // M3 parent opt-in for cloud sync/backup (off by default)
}
```

## Narrator Voices (ElevenLabs)
**Sleep mode:** moonbeam (Laura), whisper (Sarah), stardust (Gigi)
**Classic mode:** captain (Charlotte), professor (Callum), aurora (Rachel)
**Fun mode:** giggles (Freya), blaze (Dave), ziggy (Matilda)

Sleep mode dynamically adjusts non-sleep voices: +stability, -style, no speaker boost.

## Content Themes
`courage` | `kindness` | `friendship` | `wonder` | `imagination` | `comfort`

## Hero Templates (8 pre-defined)
Nova (Guardian of Light), Coral (Heart of the Ocean), Orion (Star of Friendship), Luna (Dream Weaver), Nimbus (Brave Cloud), Bloom (Garden Keeper), Whistle (Night Train Conductor), Shade (Shadow Friend)

## Badge System (12 achievements)
| Badge | Condition |
|-------|-----------|
| First Adventure | Complete first story |
| Night Owl | Listen after 8 PM |
| Early Bird | Listen 5-10 AM |
| Hero Collector | Use every hero at least once |
| Silly Storyteller | Complete 3 Mad Libs stories |
| Dream Weaver | Complete 3 Sleep mode stories |
| Classic Champion | Complete 5 Classic stories |
| On Fire! | 3-day reading streak |
| Diamond Reader | 7-day reading streak |
| Bookworm | Complete 10 total stories |
| Story Legend | Complete 25 total stories |
| Word Wizard | Learn 5 vocabulary words |

Badge evaluation is centralized in `lib/badges.ts` (with tests in `lib/badges.test.ts`). The historical `vocab_5` and `all_heroes` logic bugs were fixed in PR #247 — see `docs/best-practices/TESTING.md` for remaining known hazards.

## Testing

**Frameworks:** two runners, split by what they can import —
- **Vitest v4** (+ @vitest/coverage-v8) for server + `lib/` pure units. `npm test` / `:watch` / `:coverage`.
- **Jest** (`jest-expo` + `@testing-library/react-native`) for RN component tests and the Expo-native-importing story hooks Vitest can't load. `npm run test:components`.

```bash
npm test                # vitest run (single run)
npm run test:watch      # vitest (watch mode)
npm run test:coverage   # vitest run --coverage
npm run test:components  # jest — RN components + Expo-native hooks
```

- File naming: `<module>.test.ts` alongside the source file (e.g., `server/rate-limit.test.ts`)
- Target: >=80% branch coverage for server utilities (enforced in `vitest.config.ts`)
- Mocks: mock all external API calls (Gemini, OpenAI, ElevenLabs)
- Test fixtures for AI responses live in `__tests__/` where present

## Development Notes

- **Testing:** Vitest v4 configured with coverage via @vitest/coverage-v8
- **CI/CD:** GitHub Actions, 15 workflows as of 2026-09-08 (`vercel-deploy.yml` and `auto-merge.yml` are **gone** — do not reference them): `ci.yml` — lint, test, typecheck, build on push/PR to main/develop; `eas-build.yml` — Expo EAS builds; `deployment-drift.yml` — scheduled check that production's `/api/health` `releaseSha` still matches canonical `main`; `publish.yml` — release publishing; `branch-cleanup.yml`, `stale.yml` — repo hygiene; `agent-pr-review.yml`, `agent-security.yml` — automated AI agent PR review and security scanning; `markdown-link-check.yml` — broken-link checker; and newer additions not yet fully reconciled into this doc — `archive-recovery-gate.yml` (runs a Vite `npm run build`), `exact-head-pr-proof.yml`, `main-governance-guard.yml`, `prod-story-e2e-once.yml`, `public-v1-eslint-autofix.yml`, `release-proof.yml`. No `cloudflare-deploy.yml` exists yet (consistent with no Worker code being present — see `DEPLOY.md`). Also supports Replit push-to-deploy.
- **New Vercel deploys are disabled, but the existing Vercel deployment is still what's live in production** — don't conflate the two. `api/server.mjs` (the old serverless handler) has been removed from the repo, and `vercel.json` is now a fail-closed tombstone (`git.deploymentEnabled: false`) that blocks *future* repo-driven deploys, but `DEPLOY.md` explicitly keeps the production domains attached to the current Vercel deployment until Cloudflare is proven. The production target going forward is Cloudflare Workers + Static Assets per `docs/superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md`, but that migration has **no Worker code in the repo yet** — read `DEPLOY.md` before touching either platform.
- **React Compiler** enabled via app.json experiments
- **New Architecture** (React Native) enabled
- **Typed Routes** enabled for Expo Router — all route params via `useLocalSearchParams<T>()` generics; never access params without type parameters
- **patch-package** used for dependency fixes (applied via postinstall)
- Database (PostgreSQL) only required for voice chat; core story functionality uses AsyncStorage only
- Server uses esbuild for production bundling to `server_dist/`
- Voice chat routes only registered when `AI_INTEGRATIONS_OPENAI_API_KEY` and `DATABASE_URL` are set and the `voiceChatEnabled` feature flag is on (`server/routes.ts`)
- React Query configured with `staleTime: Infinity`, `retry: false`, `refetchOnWindowFocus: false`
- TTS audio cached server-side at `/tmp/tts-cache` (max age + size), optionally backed by a persistent Cloudflare R2 tier (`server/r2.ts`, gated on `R2_ENABLED`), AND on-device by the client (`lib/tts-cache.ts`, expo-file-system) so replays are instant and work offline — see `lib/narration.ts` for the resolve-or-fetch flow
- 12 randomized art styles for scene illustrations (watercolor, cel-shaded, paper cutout, gouache, crayon, digital, retro storybook, ink wash, pastel, pop art, chalk, flat design)
- Runbooks for deploy, incident response, provider outage, and rollback live in `docs/runbooks/`

## Known Gotchas

- `app/story.tsx` is a ~440-line composition shell — playback/music/scene/video/timer logic lives in `lib/use*.ts` hooks and presentational pieces in `components/Story*`; mode constants in `constants/story-theme.ts`
- `server/routes.ts` is a ~105-line composer — handlers live in `server/routes/<domain>.ts` modules; shared singletons in `server/routes/context.ts`, request plumbing in `server/routes/helpers.ts`
- **`npm run dev` exists but is POSIX-only** — it runs `dev:server & dev:expo` with a shell `&`; on Windows run `npm run server:dev` and `npm run expo:dev` in separate terminals
- **Never use `./gradlew` or `gradlew`** — EAS Build manages Gradle internally; use `npx expo` or `eas` CLI commands instead
- **`expo:dev` requires Replit env vars** — outside Replit, use `npx expo start` directly
- AI router automatically falls back through providers, with circuit breakers and retry — check `server/ai/router.ts`
- **AI OUTPUT safety is now enforced, not just prompt-side.** `server/routes/story.ts` runs every generated story through `guardStory` (`server/safety/story-guard.ts`): `moderateStory` (`content-safety.ts`) → on a block, regenerate ONCE with `buildStricterSystemPrompt` → if still unsafe, serve a known-safe fallback (`fallback-stories.ts`). The child never sees flagged text or a raw error. Gated by `FEATURE_CONTENT_SAFETY_ENABLED` (default on). HARD terms live in `shared/safety-terms.ts` (shared with the client fail-safe in `components/StoryTextDisplay.tsx`); SOFT/contextual terms are server-only in `server/safety/terms.ts`. When safety is on, `/api/generate-story-stream` buffers-then-emits (a single `complete` event) instead of streaming raw tokens.
- **On-device TTS cache**: `lib/useStoryAudio.ts` no longer re-fetches narration every play — it calls `resolveNarrationUri` (`lib/narration.ts`), which returns a cached `file://` clip when present (offline-capable) or fetches + caches on a miss (`lib/tts-cache.ts`, keyed by md5 of `voice:mode:text` to mirror the server). Any FS/crypto failure degrades gracefully to streaming. `prefetchNarration()` is available to warm the next part but is not wired into the story screen yet.
- **Server-side TTS cache is three-tiered**: `/tmp/tts-cache` (fast, ephemeral) → optional **Cloudflare R2** (`server/r2.ts`, gated on `R2_ENABLED` = all four Cloudflare vars set) → generate. The R2 wiring lives in `server/routes/tts.ts`, NOT in `server/tts-cache.ts` (which stays `/tmp`-only by design): on a `/tmp` miss it tries `r2Get(fileName)` and writes the hit back to disk; on a full miss it generates, writes disk, and fire-and-forgets `r2Put()` to backfill R2. All disk writes go through an in-process `writeWithLock()` mutex (a `Map<filePath, Promise>`) so concurrent requests for the same clip don't race and truncate each other. When R2 is unset the tier is skipped and `/tmp` survives only until the next Vercel cold start.
- **Storage migrations are now wired**: `runStorageMigrations()` (`lib/storage-migration.ts`) runs at the start of `resolveLaunchRoute()` (`lib/launch-gate.ts`) — the earliest cold-start storage touch — so it was previously defined-but-never-called.
- **Cloud sync (M3) — OFF by default (`cloudSyncEnabled` setting, default false).** Decisions: parent opt-in, stories+gamification only (NO profile PII), last-write-wins, local-wipe→cloud-purge. Built + tested end-to-end (all six entities): schema+RLS (`supabase/migrations/20260713000817_0001_sync_tables.sql`, **applied to the Bedtime-chronicles Supabase project** `aeraxfupuvwiskmfjliq`), reconcile/mappers/engine/IO (`lib/sync/*`), adapters for **stories** (blob-preserving), **badges**, **streaks**, **favorites**/**read** (via a change-time sidecar `@infinity_heroes_sync_meta` stamped by `toggleFavorite`/`markStoryRead`), and **profileStub** (creates an editable placeholder profile for an unknown id so gamification anchors across devices — name/age never sync; `mergeSyncedProfileStubs`). Gated `runSync()`/`purgeCloudData()` (`lib/sync/runSync.ts`), opt-in **toggle** in `app/settings.tsx`, **triggers** (`components/SyncManager.tsx` — mounted in `_layout`, runs on open/foreground/reconnect/sign-in, then `refreshProfiles()` — + `app/completion.tsx` after-save), cloud-purge in "delete all data". Note: this is the durable Supabase *state* sync, distinct from the ported offline interaction *event* queue (`lib/sync-queue.ts` / `useSyncOffline`); they coexist by design and overlap on favorites/completions. **NOT yet verified on a device** — the toggle/triggers/placeholder behavior need an end-to-end pass. M4 (native Kotlin audio) remains gated on the V2 repo + ejecting managed Expo.
- ElevenLabs voices are hardcoded in `server/elevenlabs.ts` with specific voice IDs
- Expo Router (file-based routing, package major 55) — screen paths map to file paths in `app/`
- `postinstall` runs `patch-package || true` — currently a no-op (`patches/` was removed after the SDK 55 upgrade) but kept so future patches apply automatically
- Metro blocklist includes `.local/state/workflow-logs/**`
- Legacy `@infinity_heroes_preferences` key auto-migrates to `@infinity_heroes_app_settings`
- Server binds to `0.0.0.0` with `reusePort: true`
- JSON body limit is 100KB — large story payloads may need chunking
- **`lib/storage.ts` vs `server/storage.ts`** — client-side AsyncStorage helpers vs server-side in-memory story cache
- **`shared/schema.ts` vs `shared/models/chat.ts`** — schema.ts re-exports from models/chat.ts; both in drizzle.config.ts
- **`getReadStories` / `markStoryRead`** — wired into library screen (unread dot indicator) and completion screen (marks story read on completion)
- **`server/replit_integrations/`** — backend routes are functional and the voice chat UI exists at `app/voice-chat.tsx` (reachable from the profile tab)
- **Supabase auth is optional** — if `SUPABASE_SERVICE_ROLE_KEY` (+ Supabase URL) is unset, all POSTs in dev are treated as anonymous with IP-based rate-limit identity (production returns 503)
- **COPPA consent gate** — two layers: `app/index.tsx` (the "/" launch gate) resolves the cold-start route via `lib/launch-gate.ts` (`resolveLaunchRoute()`: consent before onboarding, fail-safe to consent), and `app/_layout.tsx` wraps every screen except `index`/`parental-consent`/`privacy` in `Stack.Protected` guarded by `lib/ConsentContext.tsx` — so deep links and restored navigation state can't mount protected screens un-consented either. Consent is keyed by `CONSENT_VERSION` (`constants/types.ts`) — bump it to re-prompt existing installs when privacy practices change
- **AI router JSON extraction** — `router.ts` uses `extractFirstJson()` (balanced-brace scan that skips string literals), not a greedy regex; callers consume `response.parsedJson` when `jsonMode` is set
- **Streaming model field** — `router.ts` reports the provider's `textModel` (the concrete model ID) on streaming chunks, falling back to `provider.name` only when `textModel` is unset
- **Offline sync-queue is best-effort, not durable** — `POST /api/sync/interactions` (see `lib/sync-queue.ts`) currently logs and echoes each interaction; nothing is persisted server-side yet. Don't assume synced interactions survive a server restart or are queryable later. Each item is Zod-validated (`SyncInteractionSchema` in `server/validation.ts`); malformed items come back `status: "rejected"` rather than crashing the batch or being marked processed. `useSyncOffline()` is mounted exactly once, in `app/_layout.tsx` via `lib/SyncOfflineContext.tsx` — screens read `useSyncOfflineStatus()` instead of calling the hook directly, so the reconnect drain can't run more than once concurrently.
- **New production deploys are blocked; the EXISTING Vercel origin still serves live traffic — these are not the same thing (corrected 2026-09-08, a Codex review caught the earlier version conflating them).** `DEPLOY.md` explicitly says: "do not detach the production domains from Vercel and do not delete the Vercel project until the Cloudflare provenance gate... passes" — `bedtime-chronicles.com` / `www.bedtime-chronicles.com` are still live on the Vercel deployment that predates the tombstone. What's actually blocked is *shipping a new revision*: `vercel.json`'s `git.deploymentEnabled=false` stops new repo-driven Vercel deploys, and the Cloudflare Worker replacement has no code in the repo yet, so there's nowhere to ship a new revision *to* either. Read `DEPLOY.md`'s "Current production state" and "Vercel retirement guard" sections before touching deploy anything — don't say production is "live on neither platform," and don't detach or delete the Vercel project.
- **`eas-build.yml` cannot currently complete a build.** It runs `actions/setup-node@v7` with npm caching then `npm ci`, same as every other CI job — and since `package-lock.json` doesn't exist in the repo (see the CI-red note in this repo's PR history / any recent `ci.yml` run), that step fails before EAS is even invoked. Don't call the EAS mobile deploy path "live" without that caveat; it's configured correctly but currently blocked by the same missing-lockfile issue as the rest of CI.
- **Two parallel, undocumented-relationship frontend stacks exist.** The Expo Router client (`app/`, `components/`, `lib/`, `constants/`) is the one this file documents throughout. A second, separate Vite + React web app also lives under `src/` (own `App.tsx`, `components/`, `data/`, `services/`), served by root `index.html` and `npm run dev`/`build`/`preview`. No doc states whether `src/` replaces Expo's web export or is a distinct product surface; both receive active feature commits in the same sprints. Don't assume a component under `src/components/` and a same-named one under `components/` are the same file or kept in sync.
- **`app/src/main/java/...` contains live, git-tracked native Android/Kotlin (Jetpack Compose) source** sitting inside the Expo Router `app/` tree, where only route files belong. This contradicts "Merge Provenance" above, which says the Kotlin rewrite was archived to `archive/android-kotlin-rewrite/` — that directory does not exist anywhere in this repo. Unresolved as of 2026-09-08; needs a maintainer decision (restore the archive, or accept the Kotlin source is live) rather than a docs-only fix. Do not delete `app/src/main/` assuming it's dead weight, and do not assume the "archived, not carried forward" claim is still true.
- **CORRECTION (2026-09-08, caught by a PR review bot after this file first shipped the claim below): `eslint-config-expo` is still pinned at `~55.0.1` — it was NOT actually bumped.** Commit `612da83` on `main`, titled `build(deps): bump eslint-config-expo from 55.0.1 to 57.0.2 (#464)` (2026-09-01), is an **empty commit** — `git show 612da83 --stat` touches zero files, and `package.json` has never shown `eslint-config-expo` at anything but `~55.0.1` in its history. The Dependabot PR title/description describe a bump that never landed in the diff (a Dependabot/CI oddity worth someone's attention, not a docs problem). The "do NOT bump eslint-config-expo to ~57" warning (added after the SDK-55 realignment in PR #354, to avoid an `eslint-plugin-react` `context.getFilename is not a function` crash) **still fully applies and has not been violated** — don't bump it.
- **Expo SDK 55→57 upgrade is spec'd, not executed.** `docs/operations/EXPO-57-UPGRADE-SPEC.md` and `scripts/verify-expo57-readiness.mjs` (`npm run verify:expo57-readiness`) exist to gate a future upgrade; `package.json` still pins SDK 55 (`expo` ~55.0.30). Don't assume SDK 57 is in effect just because the supporting infra exists.
- **`archive/android-kotlin-rewrite/`** — referenced by "Merge Provenance" above as a docs-only pointer to the archived native Android/Kotlin client, but **the directory does not exist in this repo** (confirmed via `git ls-files`). See the `app/src/main/java/...` gotcha above — treat the whole archival claim as unverified until a maintainer resolves it.

## Files/Directories — Do Not Modify Without Explicit Approval

- `patches/` (if present) — patch-package fixes; modifying breaks the postinstall step. Folder was removed after the SDK 55 upgrade but may return for future patches
- `server/replit_integrations/` — Replit-provided integration boilerplate; upstream updates may overwrite changes
- `shared/schema.ts` — database schema changes require coordinated migration; do not modify alone
- `.replit` — Replit workspace config; changes affect the dev environment for all contributors
