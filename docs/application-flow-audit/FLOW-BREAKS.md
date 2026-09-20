# Flow Break Register

Every entry here is grounded in source evidence gathered during this audit (2026-09-20). None are
assumptions. IDs are stable and not in severity order (FLOW-BREAK-008 was added after a review
pass corrected two severity misjudgments — see below); use this index for true severity order:

| Rank | ID | Severity | One-line summary |
|---|---|---|---|
| 1 | FLOW-BREAK-008 | **P0** | Consent disclosure says the child's name never leaves the device; story-generation prompts include it when provided |
| 2 | FLOW-BREAK-001 | P1 | Offline interaction queue's server endpoint was never implemented |
| 3 | FLOW-BREAK-002 | P1 | `/story-seeds` has no `Stack.Screen` registration |
| 4 | FLOW-BREAK-003 | P1 | Completing a story can create two saved records |
| 5 | FLOW-BREAK-005 | P2 | Deleting a story orphans its favorite/read-tracking entries |
| 6 | FLOW-BREAK-007 | P2 | `/voice-chat` is orphaned; contradicts documentation |
| 7 | FLOW-BREAK-004 | P3 | Deletions propagate to other synced devices only on the next sync trigger (corrected — see below; not a resurrection bug) |
| 8 | FLOW-BREAK-006 | P3 | Account deletion isn't fully transactional |

---

## FLOW-BREAK-001 — Offline interaction queue has never worked

- **SEVERITY**: P1 (downgraded from an initial P0 — see note below)
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
  "Scope"). **Severity note**: an earlier draft of this register rated this P0. A review pass
  correctly pointed out that its own USER IMPACT paragraph above ("no current user-visible
  consumer... the failure is invisible") is inconsistent with a release-blocking P0 — downgraded
  to P1. The genuinely P0-severity finding in this register is FLOW-BREAK-008.

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

## FLOW-BREAK-004 — Deletions only propagate to other synced devices on the next sync trigger

- **SEVERITY**: P3 (corrected — see note below; an earlier draft of this register mischaracterized
  this as a "resurrection" bug and rated it P2)
- **CATEGORY**: DATA, ASYNC
- **SOURCE STATE**: `Active` (signed-in, cloud sync enabled, multi-device)
- **ACTION**: User deletes a story (or profile) on Device A, then Device A goes offline/closes
  before the next sync trigger fires
- **EXPECTED TRANSITION**: The deletion should be pushed promptly, not wait for an unrelated
  trigger.
- **ACTUAL RESULT**: `deleteStory()`/`deleteProfile()` write a local tombstone but do not call
  `runSync()` immediately — the push waits for the next incidental trigger (app open, foreground,
  reconnect, sign-in, or the next story completion). This is a **latency/UX** gap, not a data-loss
  one: **CORRECTED** — a review pass verified `stampEntityTombstone()` (`lib/storage.ts`) stamps
  the tombstone with `updatedAt = Date.now()` (a fresh, current timestamp) by default, and
  `reconcile()`'s rule is strictly higher-`updatedAt`-wins with deletion winning on an exact tie.
  A freshly-created tombstone will beat an older, untouched live record on another device once it
  does sync — **it cannot be "resurrected" by a stale copy the way the original draft of this
  entry claimed.** The only way a delete's outcome could be overridden is a genuinely *newer* edit
  made on the other device after the delete — which is correct last-write-wins conflict
  resolution, not a bug.
- **REPRODUCTION STEPS**: Requires two synced devices/sessions and precise timing to observe the
  delay — not reproduced live in this pass (see "Safety / Mutation Policy" in the audit's scope).
  The corrected claim (delay, not resurrection) follows directly from reading
  `stampEntityTombstone()`'s default argument and `reconcile()`'s tie-break rule, both cited above.
- **ROOT CAUSE**: Local mutation and cloud-sync trigger are decoupled by design (sync is
  best-effort/lazy), and deletions specifically have no "push this tombstone now" fast path the
  way, e.g., completion does (`runSync()` is called explicitly after a story save, but not after a
  delete).
- **CODE LOCATION**: `app/(tabs)/library.tsx` (`handleDelete`), `lib/ProfileContext.tsx`
  (`removeProfile`), `lib/storage.ts` (`deleteStory`, `deleteProfile`, `stampEntityTombstone`),
  `lib/sync/reconcile.ts` (`wins()`).
- **SECURITY IMPACT**: None.
- **USER IMPACT**: Low — a parent who deletes something on one device and immediately checks
  another device before the deleting device's next sync trigger fires will see a brief delay, not
  a permanent inconsistency or data resurrection.
- **PROPOSED FIX**: Call `runSync()` (or a targeted single-entity push) immediately after
  `deleteStory`/`deleteProfile`, purely to reduce cross-device propagation latency — not required
  for correctness, since the eventual sync resolves correctly on its own.
- **REQUIRED TEST**: A `lib/sync/engine.test.ts`-style test asserting a delete triggers an
  outbound push in the same tick (a latency improvement to verify), and — separately, as
  regression protection for the corrected claim above — a `reconcile.test.ts` case asserting a
  freshly-stamped tombstone beats an older live remote record regardless of arrival order (this
  general tie-break behavior is already covered by `reconcile.comprehensive.test.ts`; a case named
  specifically for this scenario would make the "no resurrection" property explicit).
- **VERIFICATION STATUS**: CONFIRMED — but as a latency gap, not the resurrection defect originally
  claimed. Not fixed in this PR.

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
- **PROPOSED FIX**: **Corrected** — an earlier draft of this entry suggested reordering the deletes
  so the Supabase identity delete (which cascades `sync_records`) happens first. A review pass
  correctly rejected that: the *current* ordering (Postgres chat history first, identity second) is
  what preserves retry-ability — if identity deletion happened first and then the Postgres step
  failed, the parent could no longer authenticate at all to retry `DELETE /api/account`, potentially
  orphaning their voice-chat history permanently with no path to clean it up. Keep the current
  ordering. Instead, address the non-atomicity with a durable saga/background reconciliation job
  (detect an account whose Postgres data was deleted but whose Supabase identity deletion never
  completed, and safely retry or reconcile it), or another compensating-transaction design that
  preserves the current retry-safety property rather than trading it away.
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

## FLOW-BREAK-008 — Consent disclosure says the child's name never leaves the device; it does

- **SEVERITY**: P0
- **CATEGORY**: SECURITY, DATA (child-privacy/COPPA-disclosure compliance)
- **SOURCE STATE**: Parent has passed the COPPA gate and reviewed `CONSENT_DISCLOSURES`
  (`lib/consent-record.ts`), whose first bullet states: *"Child profile name and age stay on this
  device. The server accepts older client fields for compatibility but discards those values
  before story or suggestion prompts are built for AI providers."*
- **ACTION**: Parent or child fills in a child's name in the story-creation flow
  (`app/story-details.tsx`, `app/quick-create.tsx` — both pre-fill from `activeProfile?.name` and
  let it be edited) and generates a story or asks for suggestions.
- **EXPECTED TRANSITION**: Per the disclosure the parent explicitly agreed to, the child's name is
  **discarded server-side** before any prompt reaches an AI provider.
- **ACTUAL RESULT**: It is not discarded. `server/routes/story.ts` destructures `childName`
  directly from the validated request body and passes it straight into `getStoryUserPrompt(...)`.
  `server/prompts.ts` then does exactly the opposite of "discard":
  ```
  if (childName) {
    prompt += `\nThe story is being told for a child named "${childName}" — weave their name
    naturally into the narrative when it feels right.`;
  }
  ```
  This prompt is sent verbatim to whichever external AI provider is next in the fallback chain
  (Anthropic, Gemini, OpenAI, or an OpenRouter-hosted model) — the child's name leaves the device
  and leaves INTINC's/the app's own infrastructure entirely, reaching a third-party AI vendor. The
  same `childName` field is also accepted (and, per the same code pattern, likely used the same
  way) by `POST /api/suggest-settings` (`server/routes/suggest.ts`), which builds an explicit
  `nameContext` string from it. The resulting story TEXT (now containing the child's name) is then
  a normal `CachedStory` and is itself eligible for the M3 cloud-sync engine if the parent has
  opted in — so the name can also reach Supabase, not just the AI vendor.
- **REPRODUCTION STEPS**: (1) Read `lib/consent-record.ts`'s `CONSENT_DISCLOSURES[0]` text. (2) Read
  `server/validation.ts`'s `childName: optTruncated(50)` / `optTruncated(30)` field definitions —
  accepted and validated, not rejected. (3) Read `server/routes/story.ts:80,97` and
  `server/routes/suggest.ts:14,25` — `childName` flows straight from the request body into the
  prompt builder with no stripping step anywhere in between. (4) Read `server/prompts.ts:193-194`
  — the line that inserts the name into the prompt text.
- **ROOT CAUSE**: The consent-disclosure copy in `lib/consent-record.ts` was written to describe an
  intended/assumed privacy behavior ("the server discards \[name/age\] before... prompts are
  built"), but no corresponding server-side stripping code was ever implemented in
  `server/routes/story.ts` / `server/routes/suggest.ts` / `server/prompts.ts`. This is the same
  "documentation and implementation diverged silently" root cause as FLOW-BREAK-001, but on a
  parent-facing legal disclosure instead of an internal doc — materially more serious, since a
  parent's COPPA consent decision is based on this specific claim being true.
- **CODE LOCATION**: `lib/consent-record.ts` (`CONSENT_DISCLOSURES[0]`), `server/routes/story.ts`
  (lines ~80, ~97, ~141, ~148), `server/routes/suggest.ts` (lines ~14, ~25), `server/prompts.ts`
  (lines ~185, ~193-194), `server/validation.ts` (lines ~69, ~115).
- **SECURITY IMPACT**: A real privacy/compliance discrepancy for a children's app: a specific,
  named, parent-facing privacy claim (used to obtain COPPA parental consent) does not match actual
  server behavior. The child's given name is transmitted to third-party AI providers (and
  potentially stored in Supabase via cloud sync) despite an explicit written assurance to the
  contrary. This is not a theoretical risk — it is confirmed, reachable via the ordinary story-
  creation flow, and requires no attacker or edge case to trigger.
- **USER IMPACT**: Every parent who filled in their child's real name (rather than leaving it
  blank or using a nickname) and who read and relied on this specific disclosure has had their
  child's name sent to a third party against the stated privacy practice. Impact scales with how
  many users actually enter a real name — not measured in this audit (no production telemetry
  access), so treat this as a compliance/trust issue independent of usage volume.
- **PROPOSED FIX**: This is a product/legal decision between two directions, not a pick-one code
  fix this audit should make unilaterally: (a) make the code match the promise — strip/omit
  `childName` server-side before any prompt is built for an AI provider (in `server/prompts.ts` or
  earlier in the route handlers), restoring the disclosed behavior; or (b) if sending the name to
  the AI provider for personalization is the actually-intended product behavior, correct the
  `CONSENT_DISCLOSURES` text to accurately describe it, bump `CONSENT_VERSION` so every existing
  installed user is re-prompted under the corrected disclosure (per the existing consent
  re-validation mechanism in `lib/consent-record.ts`), and consider whether that changes anything
  about the third-party AI providers' own data-handling terms this app relies on. Given the COPPA
  context, this should get human (and likely legal) review before either path ships — flagging
  per this repo's own `AGENTS.md` escalation rule ("a security vulnerability is discovered in
  existing code — open an issue; don't silently patch").
- **REQUIRED TEST**: Once a fix direction is chosen: either an integration test asserting
  `childName` never appears in the constructed prompt/request sent to any AI provider (direction
  a), or a `consent-record.test.ts` case asserting the bumped `CONSENT_VERSION` forces
  re-consent and the disclosure text accurately states the name is sent (direction b).
- **VERIFICATION STATUS**: CONFIRMED via direct source read of the full chain (disclosure text →
  request validation → route handler → prompt builder). Not fixed in this PR — a human/product/
  legal decision, not a docs-only or one-line fix.

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
