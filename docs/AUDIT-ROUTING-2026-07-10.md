# Routing Audit — Splash → App Flow (2026-07-10)

Deep audit of the Expo Router navigation graph starting from the splash screen,
plus the remediation applied on branch `claude/splash-routing-audit-jp6zj1`.
Line references are to the code **before** the fixes; the Remediation section
describes the code after.

## 1. Cold-start flow (before)

```
Module load: SplashScreen.preventAutoHideAsync()          app/_layout.tsx
      ▼
RootLayout mounts → useFonts (renders null until loaded)
      ▼ fonts loaded
useEffect:
  SplashScreen.hideAsync()          ← fired IMMEDIATELY (synchronously)
  Promise.all([getConsentGiven(), getOnboardingComplete()])   ← async
      ├─ !consented            → router.replace("/parental-consent")
      ├─ consented, !onboarded → router.replace("/welcome")
      ├─ both true             → no navigation at all
      └─ storage error         → router.replace("/parental-consent")
```

### Finding R1 — Splash hid before the routing decision resolved (COPPA flash)
`SplashScreen.hideAsync()` ran synchronously once fonts loaded, while the
consent/onboarding decision resolved asynchronously from AsyncStorage. In the
gap, the Stack rendered its default initial route — the **first declared**
screen, `(tabs)` — so an un-consented first launch briefly showed the
data-collecting Home tab before being replaced onto the consent gate.

### Finding R2 — No explicit root route
There was no `app/index.tsx` and no `initialRouteName`. The
"consented + onboarded" branch performed **no navigation**: the cold-start
landing screen was implicitly whatever `Stack.Screen` happened to be declared
first in `RootLayoutNav`. Reordering the declarations would silently change
the app's entry screen.

### Finding R3 — Gating logic duplicated in three files
The consent→onboarding→tabs decision lived in `app/_layout.tsx:140-146`, was
partially re-implemented in `app/parental-consent.tsx:67-68` (re-reading
onboarding to pick `/(tabs)` vs `/welcome`), and interacted with
`app/welcome.tsx` writing the onboarding flag.

## 2. Screen-level findings (before)

### Finding N1 — `quick-create` was a dead route with a broken param chain
Registered as a modal (`_layout.tsx:74-77`) and documented as the onboarding
hero-creation step, but **nothing navigated to it**. Its downstream params
were also broken:
- `quick-create.tsx:198` pushed `{ heroId }` to `/story-details`, which read
  only `storyId` — the chosen hero was silently ignored (fell back to
  `STORY_DATA["1"]`).
- `quick-create.tsx:113` passed `isFirstStory:"true"` and `customPrompt` to
  `/story`, but `story.tsx` declared neither: `customPrompt` was discarded,
  and `isFirstStory` was dropped before `/completion`, making
  `completion.tsx`'s `setOnboardingComplete()` branch unreachable dead code.
- The server's `StoryRequestSchema` had no `customPrompt` field, so even a
  forwarded value would have been stripped by Zod.

### Finding N2 — `router.back()` during render, no empty-stack guards
`madlibs.tsx:47` and `sleep-setup.tsx:60` called `router.back()` in the
component body (`if (!hero) { router.back(); return null; }`) — navigation as
a render side effect. No call site in the app used `router.canGoBack()`, so a
direct deep link into these screens (or `story.tsx`'s `!hero` fallback) could
pop an empty stack.

### Finding N3 — Large payloads serialized through navigation params
`story.tsx` passed `scenesJson` — **base64 image data URIs** — through route
params to `/completion`, bloating navigation state. Replay entry points passed
`replayJson` story blobs (bounded, story text only — acceptable), but with
inconsistent playback params.

### Finding N4 — Inconsistent navigation semantics
- `/story` entered via `push` from 8 call sites but `replace` from
  quick-create.
- `/parental-consent` entered via `replace` (launch gate, delete-everything)
  but `push` (Settings re-view); the pushed instance's consent handler then
  `replace`d to `/(tabs)`, blowing away the Settings stack.
- `MemoryJar` replay omitted `duration`/`voice`/`speed`, so the same story
  replayed with different narration than from library/saved.

## 3. What was healthy

- `story`/`completion` are `fullScreenModal`s and both exits use
  `router.dismissAll()` — the create funnel never accumulates stack frames.
- Contexts (`ProfileContext`, `SettingsContext`, `AuthContext`) trigger no
  navigation; routing decisions live in screens.
- Consent/welcome gates disable the back-swipe gesture.
- The failure path biases to the consent gate (correct for COPPA).

## 4. Remediation (this branch)

| Finding | Fix |
|---|---|
| R1, R2 | New `app/index.tsx` launch gate: explicit `/` route that renders nothing until the decision resolves, then `<Redirect>`s. `app/_layout.tsx` no longer navigates; it hides the splash only once the consent record is read. Additionally, every screen except `index`, `parental-consent`, and `privacy` sits inside a `Stack.Protected` guard driven by `lib/ConsentContext.tsx` — so deep links, web URLs, and restored navigation state (which never mount `index`) also cannot render a protected screen or fire its network requests until consent is granted. Revoking consent (Settings → Delete Everything) flips the guard and unmounts the whole protected stack. |
| R3 | New `lib/launch-gate.ts` — `resolveLaunchRoute()` is the single source of truth (consent → welcome → tabs, fail-safe to consent), used by `app/index.tsx` and `app/parental-consent.tsx`. Unit tests in `lib/launch-gate.test.ts`. |
| N1 | `quick-create` wired into onboarding: welcome's "Get Started" lands on `/(tabs)` then opens `/quick-create` on top. Its `/story` entry now uses `push` (consistent with all other entries), the dead `isFirstStory` chain was removed (welcome owns onboarding-completion), `story-details` accepts a `heroId` param, and `customPrompt` is threaded end-to-end (client param → `StoryRequestSchema` (`optTruncated(500)`) → `getStoryUserPrompt` via `sanitizePromptInput`, classic mode only). |
| N2 | `!hero` bailouts moved into `useEffect` with `router.canGoBack() ? back() : replace("/(tabs)")` in `madlibs`, `sleep-setup`, and `story`'s error fallback. |
| N3 | Scene images now cross via `lib/scene-handoff.ts` (in-memory, single-consumer take) instead of `scenesJson` params. `storyJson` (bounded story text) stays in params. |
| N4 | `lib/replay-params.ts#buildStoryReplayParams` used by all four replay entry points (home recents, library, saved, MemoryJar) so playback params are identical. `parental-consent`'s consent handler returns via `back()` when it was pushed (Settings re-view) and `replace(resolveLaunchRoute())` only on first launch. |

## 5. Cold-start flow (after)

```
Splash (kept up by preventAutoHideAsync)
      ▼ fonts loaded + consent record read (ConsentContext) → _layout hides splash
      ▼ Stack renders; screens other than index/parental-consent/privacy are
        inside <Stack.Protected guard={isConsented}> — un-consented deep links
        fall back to "/" = app/index.tsx
app/index.tsx renders null → resolveLaunchRoute()  (lib/launch-gate.ts)
      ├─ !consented            → <Redirect href="/parental-consent" />
      │        └─ consent → canGoBack ? back() : replace(resolveLaunchRoute())
      ├─ consented, !onboarded → <Redirect href="/welcome" />
      │        ├─ Skip        → replace /(tabs)
      │        └─ Get Started → replace /(tabs), push /quick-create (modal)
      │                             └─ Create → push /story
      ├─ both true             → <Redirect href="/(tabs)" />
      └─ storage error         → <Redirect href="/parental-consent" /> (fail-safe)

/story  ── complete ── push /completion (scenes via lib/scene-handoff)
   │                          │
 dismissAll ◄──────────── dismissAll  → back to /(tabs)
```

## 6. Known remaining debt (out of scope here)

- `replayJson` still carries the full story text through params; fine at
  current sizes, but a story-id + storage lookup would be cleaner.
- `story-details` still shows preset card copy (title/summary) when entered
  with only a `heroId`; the hero is honored but the card content is generic.
- Route strings remain literals; Expo Router typed routes validate them at
  typecheck time, but a shared route-constants module could tighten this
  further.
