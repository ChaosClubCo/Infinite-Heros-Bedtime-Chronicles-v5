# Route Inventory

Evidence-grounded inventory of every route/screen in both frontend stacks, verified against
source on 2026-09-20. See `README.md` for scope and method.

## Expo Router client (`app/`) — canonical mobile/web client

All paths verified against `app/_layout.tsx` `Stack.Screen` registrations and a repo-wide grep
for `router.push`/`router.replace`/`<Link>`/`href=`.

| Route | File | Guard | Presentation | Entry points | Exit points | Typed params | Anomalies |
|---|---|---|---|---|---|---|---|
| `/` | `app/index.tsx` | unprotected | default | Cold start (always) | `<Redirect>` to `/parental-consent`, `/welcome`, or `/(tabs)` via `resolveLaunchRoute()` | none | — |
| `/parental-consent` | `app/parental-consent.tsx` | unprotected, `gestureEnabled:false` | fade | Launch-gate redirect when unconsented; `app/settings.tsx` (post delete-all-data, Legal link) | `router.back()`/`router.replace("/")` on success; `router.push("/privacy")` | none | — |
| `/privacy` | `app/privacy.tsx` | unprotected | slide_from_right | `app/parental-consent.tsx`; `app/settings.tsx` | `router.back()` | none | — |
| `/(tabs)` (index/create/library/saved/profile) | `app/(tabs)/*.tsx` | **protected** (`Stack.Protected guard={isConsented}`) | default | Launch-gate redirect (consented+onboarded); `app/welcome.tsx`; hero-not-found fallback from `app/story.tsx` | Pushes to `/settings`, `/story-seeds`, `/story-details`, `/story`, `/madlibs`, `/sleep-setup`, `/trophies`, tab-to-tab | none | Voice Chat is documented (both `CLAUDE.md` files) as "reachable from the profile tab" — **it is not**; `app/(tabs)/profile.tsx` only opens `ProfileModal`/`SettingsModal`/`ParentControlsModal`, never `/voice-chat` |
| `/welcome` | `app/welcome.tsx` | protected, `gestureEnabled:false` | fade | Launch-gate redirect only | `router.replace("/(tabs)")`; `router.push("/quick-create")` | none | Single entry point |
| `/quick-create` | `app/quick-create.tsx` | protected, modal | slide_from_bottom | `app/welcome.tsx` only | `router.back()`; `router.push("/story")`; `router.push("/story-details")` | none | Single entry point |
| `/settings` | `app/settings.tsx` | protected | slide_from_right | `app/(tabs)/index.tsx` | `router.back()`; `router.push("/privacy")`; `router.replace("/parental-consent")` after delete-all-data | none | — |
| `/story-details` | `app/story-details.tsx` | protected | slide_from_right | `app/quick-create.tsx`; `components/SeedCard.tsx`; `app/(tabs)/index.tsx` | `router.push("/story")` | `{storyId?, heroId?, setting?, tone?, sidekick?, problem?}` | — |
| `/madlibs` | `app/madlibs.tsx` | protected | slide_from_right | `app/(tabs)/create.tsx` | `router.push("/story")` | `{heroId,duration,voice,speed}` | — |
| `/sleep-setup` | `app/sleep-setup.tsx` | protected | slide_from_right | `app/(tabs)/create.tsx` | `router.push("/story")` | `{heroId,duration,voice,speed}` | — |
| `/story` | `app/story.tsx` | protected | fullScreenModal, fade | 6 entry points (create tab, madlibs, sleep-setup, story-details, quick-create, replay from home/library/saved) | `router.push("/completion")`; `router.dismissAll()`; hero-not-found fallback | `StoryRouteParams` (heroId, duration, voice, mode, madlibWords, soundscape, sleepTimer, speed, replayJson, setting, tone, childName, sidekick, problem, customPrompt?) | — |
| `/completion` | `app/completion.tsx` | protected | fullScreenModal, fade | `app/story.tsx` only | `router.dismissAll()` | `{heroId,mode,voice,speed,storyJson}` | — |
| `/trophies` | `app/trophies.tsx` | protected | slide_from_right | `app/(tabs)/create.tsx` | `router.back()` | none | — |
| `/voice-chat` | `app/voice-chat.tsx` | protected | slide_from_right | **none found anywhere in `app/`, `components/`, `lib/`** | `router.back()` | none | **ORPHANED.** Intentional static "unavailable" placeholder (per its own header comment and `CONSENT_DISCLOSURES` item 3 — voice chat is disabled pending review). Reachable only by raw deep link. Contradicts both `CLAUDE.md` files' claim of profile-tab reachability. |
| `/story-seeds` | `app/story-seeds.tsx` | **not registered at all** | none configured (inherits default) | `app/(tabs)/index.tsx` | `router.back()` | none | **ANOMALY.** File exists and is navigated to, but has no `<Stack.Screen name="story-seeds">` entry inside `app/_layout.tsx` — neither inside nor outside the `Stack.Protected` block. Expo Router auto-registers file-based routes even without an explicit entry, so it likely still renders, but it gets none of the per-screen presentation overrides the sibling screens have, and its `Stack.Protected` coverage is **UNKNOWN from static reading alone** — this needs either a maintainer fix (add the missing `Stack.Screen` registration inside the guard) or confirmation that Expo Router's protected-guard mechanism still covers an unregistered screen. See `FLOW-BREAKS.md` FLOW-BREAK-002. |

Stray native tree: `app/src/main/java/...` — 7 `.kt` files (Jetpack Compose Android rewrite), zero
`.tsx`/`.ts` files, confirmed via glob — cannot register as an Expo Router route. Its presence
inside the Router's `app/` directory is a separate, already-documented, unresolved
merge-provenance issue (see root `CLAUDE.md` "Known Gotchas") and is out of scope for this audit
beyond noting it doesn't affect routing.

### Launch-gate decision table (`lib/launch-gate.ts`)

`resolveLaunchRoute()` first runs `runStorageMigrations()` (idempotent AsyncStorage schema
migration), then:

| consented (`getConsentGiven()`) | onboarded | Result | Notes |
|---|---|---|---|
| false | any | `/parental-consent` | consent short-circuits onboarding check |
| true | false | `/welcome` | |
| true | true | `/(tabs)` | |
| any (storage/parse/hash throws) | any | `/parental-consent` | fail-safe |

### `Stack.Protected` guard trace

`isConsented` comes from `useConsent()` (`lib/ConsentContext.tsx`), seeded once at mount by
`getConsentGiven()` (fails closed to `false` on any error) and flipped live by
`markConsented()`/`markUnconsented()`. `isLoaded` gates the entire `RootLayoutNav` render, so no
screen mounts before the stored consent record has been read — this closes the deep-link /
restored-nav-state bypass.

- **Inside the guard**: `(tabs)`, `welcome`, `quick-create`, `settings`, `story-details`,
  `madlibs`, `sleep-setup`, `story`, `completion`, `trophies`, `voice-chat`.
- **Outside the guard**: `index`, `parental-consent`, `privacy`.
- **Registered nowhere**: `story-seeds` (see anomaly above).

### Orphaned / broken navigation edges

- **Broken (push target with no matching file)**: none found — every navigation string literal
  across `app/`, `components/`, `lib/` resolves to an existing file.
- **Orphaned (file exists, zero in-app navigation calls)**: `/voice-chat`.

## Vite web app (`src/`) — separate, undocumented-relationship stack

No router library — `src/App.tsx` is entirely state-switched (`currentTab` state selects one of
8 views: home, gallery, madlibs, create, library, saved, trophies, settings) plus modal booleans
for overlays (StoryReader, StoryDetailsModal, DreamJournalModal, WindDownModal,
GuidedBreathingModal, SleepSetupModal, VocabularySparkModal, OfflineToast). `src/main.tsx` has no
`BrowserRouter`/`react-router` import.

**Server contact — mostly refuted, not zero.** `src/services/*.ts` (including
`aiStoryGenerator.ts`, whose `generateCustomBedtimeStory()` is a local synchronous function) make
zero `fetch`/`axios` calls to the Express server. However:
- `src/context/SyncOfflineContext.tsx` fires a `fetch('/api/health', ...)` ping on mount, result
  and errors both discarded. It's live-mounted (`App.tsx` wraps `AppContent` in
  `SyncOfflineProvider`) but functionally inert — `vite.config.ts` defines no dev proxy to the
  Express server (port 5000 vs. Vite's port 3000), so this call has no real backend to reach in
  the local dev topology.
- `src/integrations/audio/useVoiceStream.ts` contains a real `POST fetch(...)` call but is
  imported nowhere else under `src/` — dead code.

**Conclusion**: the claim in both `CLAUDE.md` files that `src/` "does NOT sit on the Express
server" is correct in practical effect (no reachable code path from the running Vite app
functionally depends on `server/`), but not literally true of every string in the codebase — see
the two exceptions above.
