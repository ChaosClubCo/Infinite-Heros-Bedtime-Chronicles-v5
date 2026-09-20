# Flow Break Register

Every entry here is grounded in source evidence gathered during this audit (2026-09-20). None are
assumptions. Ranked most-severe first.

---

## FLOW-BREAK-001 — Offline interaction queue has never worked

- **SEVERITY**: P0
- **CATEGORY**: API, DATA, ASYNC
- **SOURCE STATE**: `Idle` (offline queue, `lib/sync-queue.ts`)
- **ACTION**: Device reconnects to the network after queuing a like/unlike/story-completion
  interaction while offline
- **EXPECTED TRANSITION**: `useSyncOffline()` drains the queue via `POST /api/sync/interactions`,
  which (per both `CLAUDE.md` files and `docs/API.md`) "logs and echoes" each interaction
- **ACTUAL RESULT**: The route does not exist. `apiRequest` receives Express's default 404,
  throws, is caught by `syncOfflineInteractions()`'s try/catch, and returns `false`. The queue is
  never cleared.
- **REPRODUCTION STEPS**: (1) Go offline. (2) Favorite a story or complete one. (3) Reconnect.
  (4) Observe: no network request to `/api/sync/interactions` succeeds (server returns 404); the
  item remains in `@infinity_heroes_offline_queue` indefinitely.
- **ROOT CAUSE (confirmed, not inferred)**: `git log -S "sync/interactions"` shows the string was
  only ever introduced into documentation (commit `b862bb4`'s own diff to `server/routes.ts`
  registers only health/story/images/tts/music/suggest/video — never a sync module). No
  `SyncInteractionSchema` exists anywhere in `server/validation.ts` or the repo.
- **CODE LOCATION**: `lib/sync-queue.ts` (client, calls the missing route);
  `lib/useSyncOffline.ts` (drain trigger); absence confirmed in `server/routes.ts` and
  `server/validation.ts`.
- **SECURITY IMPACT**: None directly — no data leak, just silent data loss for this one
  interaction-event channel.
- **USER IMPACT**: Low-to-moderate. The state this queue tracks (favorites, read status, story
  completion) is **also** tracked redundantly by the M3 cloud-sync engine (`lib/sync/*`), which
  does work — so a user who enables cloud sync doesn't lose this data. A user who relies solely on
  offline-queue semantics (sync disabled) sees no functional consequence today because nothing
  currently reads the queue back out for anything user-visible; the failure is invisible unless
  someone inspects logs or the queue's growing storage footprint.
- **PROPOSED FIX**: Either (a) implement `POST /api/sync/interactions` per the documented
  contract (add a `SyncInteractionSchema` to `server/validation.ts`, a route module, and register
  it in `server/routes.ts`), or (b) if the M3 cloud-sync engine has fully superseded this queue's
  purpose, remove the client-side queue/hook and correct both `CLAUDE.md` files and
  `docs/API.md`. This is a product decision (build vs. deprecate), not a one-line fix — flagging
  for a maintainer rather than picking a side.
- **REQUIRED TEST**: An integration test asserting the actual HTTP behavior of
  `POST /api/sync/interactions` once a fix direction is chosen (either "route exists and
  processes the documented schema" or "route intentionally removed, client no longer calls it").
- **VERIFICATION STATUS**: CONFIRMED via static source read + `git log -S` (independently
  corroborated by two research passes) + architecture review. Not fixed in this PR (see README.md
  "Scope").

---

## FLOW-BREAK-002 — `/story-seeds` route has no `Stack.Screen` registration

- **SEVERITY**: P1
- **CATEGORY**: ROUTING, SECURITY (potential)
- **SOURCE STATE**: `/(tabs)` home
- **ACTION**: User taps into the story-seed gallery (`router.push("/story-seeds")` from
  `app/(tabs)/index.tsx`)
- **EXPECTED TRANSITION**: Screen renders inside the same `Stack.Protected guard={isConsented}`
  block as every other post-consent screen, with an explicit presentation option like its
  siblings.
- **ACTUAL RESULT**: `app/story-seeds.tsx` exists and is navigated to, but `app/_layout.tsx` has
  no `<Stack.Screen name="story-seeds">` entry anywhere — not inside, not outside the
  `Stack.Protected` block. Expo Router auto-registers file-based routes even without an explicit
  `<Stack.Screen>`, so the screen likely still renders (this audit did not find evidence it's
  unreachable), but two things are unverified from static reading alone: (a) whether an
  unregistered screen still inherits `Stack.Protected` guard coverage from its position in the
  file tree, and (b) it gets none of the per-screen presentation overrides (slide/fade/modal) its
  siblings have.
- **REPRODUCTION STEPS**: Read `app/_layout.tsx` lines registering `Stack.Screen` entries; note
  `story-seeds` is absent from both the protected and unprotected lists, while every other file
  under `app/` that's navigated to has an entry.
- **ROOT CAUSE**: Likely an omitted registration when the screen was added — consistent with it
  being one of the newer screens per the project structure doc.
- **CODE LOCATION**: `app/_layout.tsx`; `app/story-seeds.tsx`.
- **SECURITY IMPACT**: Potential COPPA-guard gap if Expo Router's default screen options do not
  inherit the enclosing `Stack.Protected` block's guard for an unregistered screen — this needs a
  maintainer decision or a runtime test with Expo Router's own testing utilities (not currently
  set up in this repo) to resolve definitively, not a docs fix.
- **USER IMPACT**: None currently observed (the screen is reachable); the risk is latent/unverified.
- **PROPOSED FIX**: Add an explicit `<Stack.Screen name="story-seeds" options={{...}}>` entry
  inside the `Stack.Protected` block, matching its siblings' pattern.
- **REQUIRED TEST**: A rendering-based test (using Expo Router's navigation testing utilities, not
  yet present in this repo's test setup) asserting `/story-seeds` is unmountable pre-consent, the
  same property `lib/launch-gate.test.ts` and the new `ConsentContext.test.tsx` verify for the
  gate's decision logic but not for the navigator's actual screen-registration behavior.
- **VERIFICATION STATUS**: CONFIRMED (registration is absent) / UNKNOWN (runtime guard coverage
  for the unregistered screen). Not fixed in this PR — this is a product/behavior decision, not a
  docs-only issue, consistent with how this repo's own `CLAUDE.md` already handles the analogous
  unresolved Android/Kotlin archive contradiction (flagged for a maintainer, not silently
  resolved).

---

## FLOW-BREAK-003 — Completing a story can create two independent saved records

- **SEVERITY**: P1
- **CATEGORY**: DATA, STATE
- **SOURCE STATE**: `/completion` screen, story just finished
- **ACTION**: The completion-mount effect auto-saves the story (`saveStoryWithProfile`); the user
  also taps the separate "Save to Memory Jar" button
- **EXPECTED TRANSITION**: One `CachedStory` record represents "this story the child just heard."
- **ACTUAL RESULT**: `app/completion.tsx`'s mount effect always calls `saveStoryWithProfile` once
  `storyData` is present. The "Save to Memory Jar" button (`handleSaveToJar`) calls a *separate*
  `saveStory` with an independently generated id. Both succeed independently, producing two
  `CachedStory` rows for what the user experiences as one story.
- **REPRODUCTION STEPS**: (1) Finish any story. (2) On the completion screen, tap "Save to Memory
  Jar." (3) Inspect `@infinity_heroes_stories` — two entries exist for the same session.
- **ROOT CAUSE**: The auto-save and the manual "save to jar" action were implemented as two
  independent code paths with no shared idempotency key or existence check.
- **CODE LOCATION**: `app/completion.tsx` (mount effect vs. `handleSaveToJar`); `lib/storage.ts`
  (`saveStoryWithProfile` vs. `saveStory`).
- **SECURITY IMPACT**: None.
- **USER IMPACT**: Badge/gamification correctness — `bookworm` (10 stories), `legend` (25
  stories), and mode-count badges (`classic-champion`, `dream-weaver`, `mad-libs-master`) all
  count raw `stories.length`, so this single user action can silently award progress the child
  didn't actually earn. For a children's app whose core loop is gamified reading, this directly
  undermines the badge system's integrity.
- **PROPOSED FIX**: Either make "Save to Memory Jar" a no-op/label-only affordance when the
  mount-effect auto-save already ran (track the auto-saved `storyId` in local component state and
  reuse it), or make the mount-effect save conditional on the user's explicit save action instead
  of automatic. Which behavior is intended is a product call, not something this audit should
  decide unilaterally.
- **REQUIRED TEST**: A test asserting that after a completion-screen mount + a "Save to Memory
  Jar" tap, exactly one `CachedStory` record exists for the session.
- **VERIFICATION STATUS**: CONFIRMED via static source read of both call sites. Not fixed in this
  PR (behavior-decision territory, out of this audit's stated scope).

---

## FLOW-BREAK-004 — Deleted stories/profiles can be resurrected by cloud sync

- **SEVERITY**: P2
- **CATEGORY**: DATA, ASYNC
- **SOURCE STATE**: `Active` (signed-in, cloud sync enabled, multi-device)
- **ACTION**: User deletes a story (or profile) on Device A, then Device A goes offline/closes
  before the next sync trigger fires
- **EXPECTED TRANSITION**: The deletion should eventually be reflected on every synced device.
- **ACTUAL RESULT**: `deleteStory()`/`deleteProfile()` write a local tombstone but do not call
  `runSync()`. If Device B syncs (or the deleting device's local tombstone ages out) before Device
  A's next sync trigger (app open/foreground/reconnect/sign-in/next-completion), `reconcile()`'s
  last-write-wins rule can let a still-live copy on Device B win and resurrect the "deleted"
  record.
- **REPRODUCTION STEPS**: Requires two synced devices/sessions and precise timing — documented as
  a real, confirmed code-path gap rather than reproduced live in this pass (see "Safety /
  Mutation Policy" in the audit's scope — this needs two real devices, not simulated here).
- **ROOT CAUSE**: Local mutation and cloud-sync trigger are decoupled by design (sync is
  best-effort/lazy), but deletions specifically have no "push this tombstone now" fast path the
  way, e.g., completion does (`runSync()` is called explicitly after a story save, but not after a
  delete).
- **CODE LOCATION**: `app/(tabs)/library.tsx` (`handleDelete`), `lib/ProfileContext.tsx`
  (`removeProfile`), `lib/storage.ts` (`deleteStory`, `deleteProfile`), `lib/sync/reconcile.ts`
  (`wins()`).
- **SECURITY IMPACT**: None (no cross-user leakage — this is within one account's own devices).
- **USER IMPACT**: A parent who deletes a story or profile on one device could see it reappear
  from another device — confusing and undermines trust in "delete" as a durable action.
- **PROPOSED FIX**: Call `runSync()` (or a targeted single-entity push) immediately after
  `deleteStory`/`deleteProfile`, not just after saves.
- **REQUIRED TEST**: A `lib/sync/engine.test.ts`-style test asserting a delete triggers an
  outbound push in the same tick, plus a `reconcile.test.ts` case for "local tombstone + stale
  local timestamp vs. remote live record with a newer `updatedAt`" (already partially covered —
  `reconcile.comprehensive.test.ts` tests tie-breaking and tombstone propagation in isolation, but
  not this specific "sync trigger was skipped" scenario).
- **VERIFICATION STATUS**: CONFIRMED (code path gap) via static source read, independently
  corroborated by the data-lifecycle research pass. Not fixed in this PR.

---

## FLOW-BREAK-005 — Deleting a story orphans its favorite/read-tracking entries

- **SEVERITY**: P2
- **CATEGORY**: DATA
- **SOURCE STATE**: Story exists, is favorited and/or marked read
- **ACTION**: User deletes the story
- **EXPECTED TRANSITION**: All records referencing that story id are cleaned up together.
- **ACTUAL RESULT**: `deleteStory()` touches only `STORIES_KEY` and the `stories` tombstone
  namespace. It never removes the id from `FAVORITES_KEY`/`READ_STORIES_KEY` or their independent
  `favorites`/`read` sync-meta sidecar entries — both of which are separate sync entities with no
  foreign-key tie to `stories`.
- **REPRODUCTION STEPS**: (1) Favorite a story. (2) Delete it. (3) Inspect
  `@infinity_heroes_favorites` — the deleted story's id remains.
- **ROOT CAUSE**: `favoritesAdapter`/`readAdapter` (`lib/sync/storage-adapters.ts`) model
  favorites/read status as independent presence-sets with no cascade-on-delete relationship to the
  `stories` entity.
- **CODE LOCATION**: `lib/storage.ts` (`deleteStory`), `lib/sync/storage-adapters.ts`.
- **SECURITY IMPACT**: None.
- **USER IMPACT**: Low directly (no UI currently seems to dereference a favorite/read id back into
  a now-missing story in a way that crashes — not independently verified either way in this pass),
  but it's a real dangling-reference bug that both accumulates locally forever and keeps
  re-propagating between devices via cloud sync.
- **PROPOSED FIX**: `deleteStory()` should also call the favorites/read cleanup (remove the id and
  stamp a tombstone in their sync-meta sidecar) as part of the same operation.
- **REQUIRED TEST**: A `lib/storage.test.ts` case asserting `deleteStory(id)` also removes `id`
  from `getFavorites()`/`getReadStories()`.
- **VERIFICATION STATUS**: CONFIRMED via static source read. Not fixed in this PR.

---

## FLOW-BREAK-006 — Account deletion is not fully transactional

- **SEVERITY**: P3
- **CATEGORY**: DATA, ERROR HANDLING
- **SOURCE STATE**: `DELETE /api/account` in progress
- **ACTION**: Postgres voice-chat history delete succeeds, then the Supabase Auth identity delete
  throws
- **EXPECTED TRANSITION**: Either both succeed or neither does.
- **ACTUAL RESULT**: The handler returns 503 (client correctly preserves local data, since no
  valid `ServerDeletionReceipt` was issued), but the already-deleted chat history is not restored
  — server state is left inconsistent (chat history gone, auth + `sync_records` still present).
- **REPRODUCTION STEPS**: Requires forcing the second Supabase Admin API call to fail after the
  first Postgres delete succeeds — not exercised live in this pass; identified via code-path
  reading of `server/routes/account.ts`, confirmed no compensating transaction/rollback exists.
- **ROOT CAUSE**: The two deletes are sequential API calls to two different systems (Postgres,
  Supabase Auth) with no distributed-transaction or saga/compensation pattern.
- **CODE LOCATION**: `server/routes/account.ts`.
- **SECURITY IMPACT**: None (no data exposure — just an inconsistent deletion state for the
  account being deleted).
- **USER IMPACT**: Low — the user sees a generic 503 and can retry; worst case, a retry may
  re-attempt the already-completed chat-history delete (should be idempotent/no-op) and then
  (hopefully) succeed on the identity delete.
- **PROPOSED FIX**: Order the deletes so the irreversible/cascading one (Supabase identity, which
  cascades `sync_records`) happens first, or wrap both in a saga that can detect and repair a
  partial state on retry.
- **REQUIRED TEST**: `server/routes/account.test.ts` already covers the general success/failure
  paths — add a case that forces the identity-delete to throw after a successful chat-history
  delete and asserts the response and that a retry is safe/idempotent.
- **VERIFICATION STATUS**: PLAUSIBLE (the non-atomicity is confirmed by reading the code; the
  precise user-visible consequence of a retry was not dynamically tested). Not fixed in this PR.

---

## FLOW-BREAK-007 — `/voice-chat` is orphaned and contradicts documentation

- **SEVERITY**: P2
- **CATEGORY**: ROUTING, UX
- **SOURCE STATE**: `/(tabs)/profile`
- **ACTION**: A user looks for voice chat where both `CLAUDE.md` files say it lives ("reachable
  from the profile tab")
- **EXPECTED TRANSITION**: Some UI element on the profile tab navigates to `/voice-chat`.
- **ACTUAL RESULT**: No such element exists. `app/(tabs)/profile.tsx` only opens
  `ProfileModal`/`SettingsModal`/`ParentControlsModal`. `/voice-chat` is reachable only via a raw
  deep link.
- **REPRODUCTION STEPS**: Read `app/(tabs)/profile.tsx` in full; grep the repo for `voice-chat`
  outside its own screen file — zero navigation call sites.
- **ROOT CAUSE**: The screen is an intentional static "Voice Chat is unavailable" placeholder
  (its own header comment confirms no mic/audio code is present, matching `CONSENT_DISCLOSURES`
  item 3: voice chat is disabled pending privacy/safety/provider review). The UI entry point was
  likely removed when the feature was disabled, but the doc line describing it as reachable was
  never updated.
- **CODE LOCATION**: `app/voice-chat.tsx`, `app/(tabs)/profile.tsx`, both `CLAUDE.md` files.
- **SECURITY IMPACT**: None — the screen does nothing.
- **USER IMPACT**: None functionally (nothing is missing from the user's perspective since the
  feature is genuinely disabled); this is purely a documentation-accuracy issue for engineers/AI
  agents relying on `CLAUDE.md`.
- **PROPOSED FIX**: Update both `CLAUDE.md` files' voice-chat descriptions to state it has no
  current in-app entry point, or restore a (disabled-state) entry point if the intent is to keep
  it discoverable.
- **REQUIRED TEST**: `__tests__/release/voice-containment.test.ts` already asserts no client
  audio/mic code leaked into this screen — that's the right kind of governance test; no test
  currently asserts navigational reachability (or intentional unreachability) either way.
- **VERIFICATION STATUS**: CONFIRMED. Not fixed in this PR (a one-line doc correction is
  reasonable but was left for a maintainer alongside the related FLOW-BREAK-002 doc-accuracy
  pass, to keep this PR's diff to the audit itself plus the two narrowly-scoped, zero-behavior-risk
  fixes described in `README.md`).

---

## Documentation-drift items (not flow breaks, but load-bearing for anyone trusting the docs)

These don't have user-facing consequences but materially affect anyone (human or AI agent) using
`CLAUDE.md`/`docs/API.md` as ground truth:

- `server/replit_integrations/` does not exist; real path is `server/integrations/`.
- `server/r2.ts` / the Cloudflare R2 persistent TTS-audio tier does not exist anywhere in source,
  despite being described as "live" in both `CLAUDE.md` files.
- CORS does not implement Vercel-preview-URL matching or `VERCEL_URL` handling, despite being
  documented as doing so.
- `server/compliance.ts` (a real, fail-closed, production-gating AI-provider-attestation check)
  is undocumented in both `CLAUDE.md` files.
- A startup log line still references `FIREBASE_SERVICE_ACCOUNT_KEY` though auth is Supabase-only.
