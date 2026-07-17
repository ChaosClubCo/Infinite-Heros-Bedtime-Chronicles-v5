# Verification Checklist — M1–M3 ("Super Version" branch `feat/ai-output-safety-filter`)

These changes were authored in a WSL shell where the Windows-built native toolchain
(vitest/jest/esbuild) can't run, so they were verified by **`tsc`, ESLint, real-module
logic smoke-tests, and unit tests** — but **not** run in the Expo app. This checklist
is the remaining human/device pass. Run the automated gates from **Windows PowerShell**.

## 0. Automated gates (Windows PowerShell, repo root)

- [ ] `npm run typecheck` — clean
- [ ] `npm run lint` — no new errors
- [ ] `npm test` — full Vitest suite green (server safety, sync, storage, etc.)
- [ ] `npm run test:components` — Jest client tests green (incl. `StoryTextDisplay` fail-safe)
- [ ] `npm run test:coverage` — server coverage ≥ threshold

---

## 1. M1 — AI output safety filter

- [ ] Generate a story in each mode (classic / madlibs / sleep). Clean stories pass through unchanged; no latency regression, no false blocks on a knight/adventure story.
- [ ] Force a block: temporarily make the AI return a story containing a HARD term (e.g. edit a test/mocked response, or set `FEATURE_CONTENT_SAFETY_STRICT=true` and use edgy input). Confirm the response is a **regenerated** or **fallback** story — never flagged text, never a raw error.
- [ ] `GET /api/metrics` → the `safety` bucket increments (`blocks`, `regenerations`, `fallbacks`, `byCategory`).
- [ ] Server logs show **category names only** — never the flagged story text.
- [ ] Client fail-safe: render `StoryTextDisplay` with unsafe text → shows the gentle placeholder, not the text.
- [ ] SSE path (only if `FEATURE_STREAMING_ENABLED` is used): with safety on, the stream emits a single `complete` event, not raw `chunk`s.

## 2. M2 — On-device narration cache

- [ ] Play narration for a story part → audio plays.
- [ ] Replay the same part → **instant** (served from the on-device cache, no network round-trip).
- [ ] Enable airplane mode, then replay a previously-played part → **still plays** (offline).
- [ ] Play many parts, then confirm the cache stays bounded (LRU eviction under `TTS_CACHE_MAX_BYTES`, 50 MB).
- [ ] A cache/crypto failure degrades to streaming (hard to force; covered by unit tests).
- [ ] (Deferred) Durable **R2** server cache is not built — server cache is still `/tmp` (ephemeral on serverless).

## 3. M3 — Supabase cloud sync (OFF by default)

Migration `0001_sync_tables.sql` is **already applied** to the `Bedtime-chronicles`
project (`aeraxfupuvwiskmfjliq`). Requires `EXPO_PUBLIC_SUPABASE_URL` +
`EXPO_PUBLIC_SUPABASE_ANON_KEY` configured for the client.

- [ ] With cloud sync **off** (default) and/or signed out: nothing syncs; Settings shows the "Sign in to back up…" hint and the toggle is disabled.
- [ ] Sign in (Supabase email/password), open **Settings → Cloud Backup**, toggle it **on** → a sync kicks off.
- [ ] In Supabase (table editor / SQL) confirm rows appear in `public.sync_records` for your `user_id` across entities (`stories`, `badges`, `streaks`, `favorites`, `read`, `profileStub`). RLS should scope them to your account.
- [ ] Trigger check: complete a new story → after-save sync pushes it; background/foreground the app → foreground sync runs.
- [ ] Second device / fresh install, same account, sync on → stories, badges, streaks pull down; a **placeholder profile** ("New Profile") appears for synced profiles — rename it (name/age never leave the device).
- [ ] Favorite a story on device A → after sync it's favorited on device B; un-favorite → the tombstone propagates (removed on B).
- [ ] Conflict: change the same story on two devices → newer `updatedAt` wins (last-write-wins).
- [ ] Deletion: Settings → **Delete All Data** → local wiped, cloud rows for your user purged (`sync_records` empty for your `user_id`), signed out.
- [ ] Account deletion purges everything server-side via the `auth.users` cascade.

### M3 known limits / staged
- Badges/streaks key on a per-install `profileId`; the placeholder-profile flow is the anchor. Cross-device continuity is bounded by the no-PII decision.
- On-device cache and sync are best-effort and never block the app.

---

## Milestone 4 (not started)
Native Kotlin audio bridge — gated on access to the V2 Android repo and ejecting from
managed Expo. Recommend only if M2's on-device caching proves insufficient for offline
narration.
