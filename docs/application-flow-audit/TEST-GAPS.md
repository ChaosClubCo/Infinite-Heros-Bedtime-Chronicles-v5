# Test Gaps

This is executed evidence, not a guess: every command below was actually run in this
environment on 2026-09-20 (Node v22.22.2, npm 10.9.7 — satisfies `engines.node` in
`package.json`).

## Baseline (before this audit's changes)

| Command | Exit code | Result |
|---|---|---|
| `npm install` | 0 | Success — 1919 packages, 1m54s. `node_modules`/`package-lock.json` were both absent beforehand (see `AUDIT-SUMMARY.md` for why a regenerated lockfile was **not** committed). |
| `npm run typecheck` | 0 | Clean |
| `npm run lint` | 0 | Clean |
| `npm test` (vitest) | **1** | 77 files passed, **1 file errored before any assertion ran** (`ENOENT: .nvmrc`); 860/860 individual tests that did run, passed |
| `npm run test:components` (jest) | 0 | 8 suites, 54 tests, all passed |

## Fixes applied in this PR (both narrowly-scoped, zero behavioral/product risk)

1. **Added `.nvmrc` (content: `22`).** Three other places in the repo already assumed this file
   exists and pins Node 22.x: `.github/workflows/eas-build.yml` (`node-version-file: '.nvmrc'`),
   `package.json`'s `engines.node`, and `scripts/verify-release-proof.mjs`'s own
   `validateRuntimeConfiguration()`. This was a missing pinning file, not a behavior decision —
   the same class of gap as the repo's already-documented missing-`package-lock.json` problem.
2. **Added two comment lines to `.env.example`** (a "Copy to .env" header comment, and a "legacy
   GEMINI_API_KEY fallback" annotation) — both purely documentary; no env var was added, removed,
   or renamed.

Fixing the `.nvmrc` `ENOENT` unmasked two more assertions in the *same* test file that had never
actually run before (the crash killed the whole file before they could execute) — both were the
`.env.example` comment-content gaps above, now also fixed. **This was not scope creep** in the
sense of touching app behavior: both fixes are additive, comment/pinning-only, and directly close
out the one previously-broken test file. No app logic, route, or API behavior changed.

## After (full suite, this PR's head)

| Command | Exit code | Result |
|---|---|---|
| `npm run typecheck` | 0 | Clean |
| `npm run lint` | 0 | Clean |
| `npm test` (vitest) | 0 | **78/78 files, 864/864 tests passed** |
| `npm run test:components` (jest) | 0 | **9/9 suites, 60/60 tests passed** (the +1 suite / +6 tests are the new `ConsentContext.test.tsx` added by this audit) |

## New test added by this audit: `__tests__/components/ConsentContext.test.tsx`

`lib/ConsentContext.tsx` is the reactive state backing `app/_layout.tsx`'s `Stack.Protected`
guard — the second of the two independent COPPA enforcement layers (the first,
`lib/launch-gate.ts`'s `resolveLaunchRoute()`, was already thoroughly tested in
`lib/launch-gate.test.ts`). The test-evidence research pass explicitly named this as the one gap
in an otherwise well-covered consent flow: *"I did not find a test for the second guard layer...
no `ConsentContext.test.ts`/`.tsx` file exists in the inventory."* Six new tests cover: initial
unloaded/unconsented state, flipping to consented on a valid stored record, staying unconsented
on a missing/invalid record, failing closed (not crashing, but staying unconsented) when the
storage read rejects, and both `markConsented`/`markUnconsented` in-memory transitions
(the exact mechanism `app/parental-consent.tsx` and `app/settings.tsx`'s delete-all-data flow
depend on).

**Scope of this coverage, precisely** (a review caught this being overstated in an earlier draft):
these tests verify `ConsentContext`'s own state machine — the *input* `Stack.Protected` reads.
They do not mount `app/_layout.tsx` or assert that `Stack.Protected` actually excludes a screen
from the navigator when `isConsented` is false; that navigator-level enforcement is a separate,
still-untested claim (see `FLOW-COVERAGE.md` F-04). The underlying mechanism is Expo Router's own
`Stack.Protected` primitive rather than custom app logic, which is why `FLOW-COVERAGE.md` still
marks that row `VERIFIED_WORKING` "by construction" — but that's a source-reading conclusion, not
something this test suite confirms.

## Gap findings (flows this audit traced, against what's actually tested)

| Flow | Has automated test? | Evidence |
|---|---|---|
| `requireAuth` middleware 401/503 behavior | **Yes — thorough** | `server/auth.test.ts` exercises dev-anonymous pass-through, prod fail-closed 503, malformed/oversized/missing token → 401, valid/invalid/anonymous token, and upstream 429/500/thrown-error → retryable 503 |
| COPPA consent gate — `lib/launch-gate.ts` decision logic | **Yes — thorough** | `lib/launch-gate.test.ts`: migration-first ordering, consent-before-onboarding priority, fail-safe-to-consent on any read failure |
| COPPA consent gate — `Stack.Protected` guard layer (`lib/ConsentContext.tsx`) | **Partial — added by this audit** | `__tests__/components/ConsentContext.test.tsx` (new, 6 tests, all passing) covers `ConsentContext`'s own reactive state (fail-closed load, `markConsented`/`markUnconsented`) — the input `Stack.Protected` reads. It does **not** mount `app/_layout.tsx` or assert that `Stack.Protected` actually excludes a screen from the navigator; that would need Expo Router navigator-testing utilities not currently set up in this repo. Narrowed after review feedback — see `FLOW-COVERAGE.md` F-04. |
| `/story-seeds` Stack.Screen registration (FLOW-BREAK-002) | **No — and intentionally not added here** | Would require Expo Router navigator-level testing utilities not currently set up in this repo, and the right assertion depends on a maintainer decision (register the screen vs. confirm current behavior is acceptable) this audit isn't positioned to make. Documented as an explicit untested justification, not silently skipped. |
| Double story-save on completion (FLOW-BREAK-003) | **No** | Would require asserting `app/completion.tsx`'s mount effect + `handleSaveToJar` produce exactly one record — not covered by any existing test, and not added here because fixing the underlying behavior first (a product decision) would be needed to know what the test should assert |
| Story deletion → favorites/read cleanup (FLOW-BREAK-005) | **No** | `lib/storage.test.ts` tests `deleteStory` and favorites independently, never their interaction |
| Delete-tombstone-not-pushed-synchronously race (FLOW-BREAK-004) | **Partial** | `lib/sync/reconcile.test.ts`/`reconcile.comprehensive.test.ts` thoroughly test the pure `reconcile()` function's tie-breaking and tombstone-propagation rules in isolation, but no test asserts the trigger gap itself (that `deleteStory` doesn't call `runSync()`) |
| Cloud-sync `reconcile.ts` last-write-wins logic | **Yes — thorough, plus a manual verification script** | `lib/sync/reconcile.test.ts` + `.comprehensive.test.ts` (local-only, remote-only, both-direction newer-wins, exact-tie deletion-wins, tombstone propagation, no-resurrection guard); separately `scripts/verify-sync.ts` (`npm run verify:sync`) is a real, non-trivial standalone verification script (not part of `npm test`'s count) |
| Offline sync-queue client-side drain logic | **Yes — thorough** | `lib/sync-queue.test.ts`: enqueue/dedupe/coalesce, drain success/server-failure/network-throw, concurrency lock |
| `POST /api/sync/interactions` server-side behavior (FLOW-BREAK-001) | **Cannot be tested — endpoint doesn't exist** | Explicit untested justification: no route exists to test against; a test would either assert a 404 (documenting brokenness as if intentional) or need to be written against a not-yet-built implementation. Tracked as FLOW-BREAK-001 instead. |
| Badge award logic vs. all 12 documented badges | **Yes — all 12 covered, including two historical regressions** | `lib/badges.test.ts` (355 lines): first-adventure, night-owl, early-bird, all-heroes (incl. custom-hero edge case), mad-libs-master, dream-weaver, classic-champion, story-streak-3/7, bookworm, legend, vocabulary-star (incl. duplicate-word dedup) |
| Parent-controls PIN lockout state machine (production code) | **Yes** | `lib/storage.test.ts` (~lines 714-742) tests the real `hashPin`/`generatePinSalt`/`recordFailedPinAttempt`/`isPinLockedOut`/`resetPinAttempts` functions directly, including the full 5-attempt→lockout→reset cycle |
| Story-generation safety-guard fallback path | **Yes — thorough, matches the documented pipeline exactly** | `server/safety/story-guard.test.ts`: clean-passthrough, regenerate-once-succeeds, regenerate-still-unsafe→fallback, regenerate-throws→fallback, never-more-than-one-regeneration, borderline-LLM-classifier branches |
| Account deletion — full success/full failure | **Yes** | `server/routes/account.test.ts` |
| Account deletion — partial failure after partial success (FLOW-BREAK-006) | **No** | Existing test covers the two clean outcomes, not the interleaved-failure case |
| `/api/generate-story-stream` SSE safety-buffering path | **No client-facing test needed** | Endpoint has no client caller (see `API-INVENTORY.md`) — server-side behavior itself is exercised indirectly via `guardStory`'s own tests, but the SSE-specific buffering wrapper in `server/routes/story.ts` has no dedicated test |

## Test-quality smell found (not a coverage gap, a false-confidence risk)

Two existing test files **reimplement the logic they claim to test locally** rather than
importing the real production functions, so a real regression in production code would not be
caught by them even though they pass:

- `__tests__/unit/parent-controls.test.ts` — reimplements toy `isPinValid`/`checkPin`/`adjustHour`
  functions instead of importing `lib/storage.ts`'s real PIN/lockout functions or
  `components/ParentControlsModal.tsx`. (The real functions **are** genuinely covered elsewhere,
  in `lib/storage.test.ts` — so there's no actual coverage gap here, just a misleadingly-named
  file that looks like it's testing production PIN logic and isn't.)
- `__tests__/unit/routes-utils.test.ts` — the file's own header comment admits it "directly
  replicate[s] the pure functions... without needing to import the full routes module" for
  `sanitizeString`, rate-limit logic, and the TTS filename regex, instead of importing
  `server/validation.ts`/`server/routes/helpers.ts` directly.

**Recommendation** (not acted on in this PR — editing existing, currently-passing test files
around their diagnostic reimplementation pattern is a judgment call for whoever owns test
strategy, not something to fold into an audit PR): re-point these two files' imports at the real
production functions where feasible, so a future refactor of `sanitizeString` or the PIN lockout
logic can't silently diverge from what these tests assert.

## Repository-wide test posture (informational)

The single biggest positive finding of this whole audit: **almost every individual function this
audit traced is already well-tested in isolation.** The confirmed breaks in `FLOW-BREAKS.md` are
not "untested code" — they are **cross-file lifecycle interactions** (two independently-correct
save functions called from the same screen; a delete that correctly tombstones one AsyncStorage
key but doesn't know about a sibling key) that no single unit test would catch, because each
individual function does exactly what its own test says it does. This is a common and important
distinction for a flow audit to surface: unit-test coverage percentage and flow correctness are
not the same measurement.
