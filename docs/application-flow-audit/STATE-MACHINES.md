# State Machines

Six state machines, each derived from source (not inferred from UI screenshots). Diagram
renderings live in the numbered `.mmd` files; this document is the authoritative state/event/
guard/transition table each diagram is drawn from.

## 1. COPPA consent + parent-gate (`lib/launch-gate.ts`, `lib/consent-record.ts`, `lib/ConsentContext.tsx`, `app/parental-consent.tsx`)

| State | Event | Guard | Transition | Side effect |
|---|---|---|---|---|
| `Loading` | app cold start | — | → `Unconsented` or `Consented` | `runStorageMigrations()` runs first |
| `Unconsented` | navigate to `/parental-consent` | — | → `GateChallenge` | new random `a+b` arithmetic prompt generated |
| `GateChallenge` | wrong answer (attempt 1-2 of current tier) | — | stays `GateChallenge` | `wrongAttempts++`, new challenge |
| `GateChallenge` | wrong answer #3 of tier | `wrongAttempts >= 3` | → `GateLockedOut` | lockout = `30s * 2^(tier-1)`; `wrongAttempts` reset to 0, `tier++` |
| `GateLockedOut` | countdown reaches 0 | — | → `GateChallenge` | input re-enabled |
| `GateChallenge` | correct answer | — | → `GatePassed` | disclosures card revealed (5 `CONSENT_DISCLOSURES` bullets) |
| `GatePassed` | "I'm a parent… I agree" tap | — | → `Consented` | `recordParentConsent()` writes `{consented,consentedAt,version:CONSENT_VERSION,contentHash,locale,verificationMethod}` to AsyncStorage; `markConsented()` flips context; navigates back or replaces `/` |
| `Consented` | app relaunch | `getConsentGiven()` re-validates version + content-hash match every time | any mismatch → `Unconsented` | either a `CONSENT_VERSION` bump **or** an unversioned edit to disclosure copy forces every existing install back through the gate |
| any state | storage/crypto exception at any point | — | → `Unconsented` (fail-closed) | `ConsentContext`'s initial read `.catch(() => false)`; `resolveLaunchRoute`'s try/catch |

Two independent enforcement layers close the deep-link gap: (a) `app/index.tsx`/`launch-gate.ts`
at cold start, and (b) `app/_layout.tsx`'s `Stack.Protected guard={isConsented}` wrapping every
screen except `index`/`parental-consent`/`privacy`, fed by the same in-memory `isConsented` —
seeded once at mount, so a restored nav state or deep link can't mount a protected screen before
that read resolves.

## 2. Parent-controls PIN lockout (`lib/storage.ts`, `components/ParentControlsModal.tsx`)

Constants: `MAX_PIN_ATTEMPTS = 5`, `LOCKOUT_DURATION_MS = 30_000`.

| State | Event | Guard | Transition |
|---|---|---|---|
| `Unlocked(failedAttempts=n)` | wrong PIN | `n < 4` | `failedAttempts = n+1`, stays `Unlocked` |
| `Unlocked(failedAttempts=4)` | wrong PIN (5th) | `failedAttempts >= 5` | → `LockedOut`, `lockoutUntil = now+30s`, `failedAttempts` reset to 0 |
| `LockedOut` | `Date.now() < lockoutUntil` | — | stays `LockedOut` (checked via pure `isPinLockedOut()`) |
| `LockedOut` | `Date.now() >= lockoutUntil` | — | → `Unlocked(failedAttempts=0)` |
| `Unlocked` | correct PIN, not locked out | — | → `Unlocked(failedAttempts=0)`, `resetPinAttempts()` |

Entirely client-side, no server component. PIN is never stored in plaintext — only
`hashPin(pin, salt)` (SHA-256 via `expo-crypto`) + a random 16-byte salt.

## 3. Story creation → completion → badges → sync

| State | Event | Transition | Side effect / file |
|---|---|---|---|
| `Wizard(input)` | user submits (story-details / quick-create / madlibs / sleep-setup) | → `Generating` | `router.push("/story", params)` |
| `Generating` | `POST /api/generate-story` resolves | → `Playing` | `app/story.tsx` composes `useSceneGeneration`, `useStoryAudio`, `useVideoGeneration`, `useBackgroundMusic`, `useSleepTimer`, `useAutoAdvance`, `useLoadingMessages` |
| `Generating` | request fails | → `Wizard(input)` or error UI (not traced further in this pass) | |
| `Playing` | user reaches the end | → `Completing` | `router.push("/completion", {storyJson,...})` |
| `Completing` (mount effect) | — | → `Completed` | in order: `updateStreak()` → `saveStoryWithProfile()` (auto-save #1) → per-scene `saveStoryScene()` → `markStoryRead()` → `queueInteraction("story_completion")` (offline queue — **currently never drains**, see `FLOW-BREAKS.md` FLOW-BREAK-001) → `checkAndAwardBadges()` → `void runSync()` (M3 cloud engine, best-effort) |
| `Completed` | user taps "Save to Memory Jar" | independent `saveStory()` call (auto-save #2) | **Creates a second, independently-id'd `CachedStory` record for the same story** — see `FLOW-BREAKS.md` FLOW-BREAK-003 (double-save inflates story-count badges) |
| `Completed` | `router.dismissAll()` | → back to `(tabs)` | |

## 4. Cloud-sync engine (`lib/sync/*`, `components/SyncManager.tsx`)

| State | Event | Guard | Transition |
|---|---|---|---|
| `Idle` | app open / foreground / reconnect / sign-in (any of `[cloudSyncEnabled, isOnline, consentOk, user?.id]` changes) | `enabled && consentOk && session exists` | → `Syncing` |
| `Idle` | same triggers | gate fails (disabled, offline, unconsented, or no session) | stays `Idle` (no-op) |
| `Syncing` | per entity (stories/badges/streaks/favorites/read/profileStub): pull local+remote in parallel → `reconcile()` | higher `updatedAt` wins; **exact-tie → deletion wins** (safer default for a kids' app) | push-first-then-apply-local ordering, so a local-write failure doesn't lose outbound changes |
| `Syncing` | any entity's push/pull throws | — | that entity's error isolated into `syncAll()`'s `errors[]`; other entities still sync |
| `Syncing` | all entities settle | — | → `Idle` |
| any | concurrent trigger while `Syncing` | `inFlightSync` promise | coalesces into the same run rather than racing on AsyncStorage |
| `Idle` | "delete all data" flow | — | → `Purging` → `DELETE /api/account` → on success, `clearAllData()` + `signOut()`; on failure, **local data is deliberately preserved** so retry stays possible |

**Known lifecycle gaps** (see `FLOW-BREAKS.md` for full detail): a local delete (story or
profile) only stamps a tombstone — it does not call `runSync()` immediately, so a device that
goes offline/closes before the next trigger can let another synced device's last-write-wins
reconcile **resurrect** the "deleted" record (FLOW-BREAK-004). `deleteStory()` also never cleans
up the deleted story's id from `FAVORITES_KEY`/`READ_STORIES_KEY` or their sync-meta sidecar
entries, leaving orphaned favorite/read markers that keep re-propagating between devices
(FLOW-BREAK-005).

## 5. Offline interaction queue (`lib/sync-queue.ts`, `lib/useSyncOffline.ts`)

| State | Event | Transition |
|---|---|---|
| `Idle` | `queueInteraction(type, storyId)` (like/unlike/story_completion) | → item added to `@infinity_heroes_offline_queue`; like/unlike dedupe as a mutually-exclusive toggle |
| `Idle` | network `isOnline` flips false→true | → `Draining` (after a 1.5s cosmetic delay) |
| `Draining` | `POST api/sync/interactions` | **This endpoint does not exist server-side** (confirmed via `git log -S`, never implemented beyond documentation) → every attempt gets a 404 → `apiRequest` throws → caught, returns `false` | → `Idle`, queue **not cleared**, items accumulate indefinitely |

This state machine currently has **no reachable success transition** — see `FLOW-BREAKS.md`
FLOW-BREAK-001.

## 6. Story-generation safety guard (`server/safety/story-guard.ts`)

| State | Event | Transition |
|---|---|---|
| `Generated` | `moderateStory()` clean | → `Served` |
| `Generated` | `moderateStory()` blocks (HARD term, or SOFT term + LLM classifier confirms) | → `Regenerating` (exactly once, via `buildStricterSystemPrompt()` at lower temperature) |
| `Generated` | LLM classifier layer throws/unavailable | fails toward "safe" — → `Served` (never blocks on a moderation-provider outage alone) |
| `Regenerating` | re-moderation clean | → `Served` (`outcome:'regenerated'`) |
| `Regenerating` | re-moderation still unsafe, or the regenerate call itself throws | → `Fallback` (`outcome:'fallback'`, serves a pre-written known-safe story) |

The child never sees flagged text or a raw error in any branch. All three terminal outcomes are
metrics-recorded. This machine is thoroughly tested (`server/safety/story-guard.test.ts`) — see
`TEST-GAPS.md`.
