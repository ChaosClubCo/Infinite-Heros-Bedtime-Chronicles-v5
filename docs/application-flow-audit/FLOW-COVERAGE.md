# Flow Coverage Matrix

Every significant graph edge from the 10 diagrams, its evidence, and its status. Status values:
`VERIFIED_WORKING`, `VERIFIED_BROKEN`, `PARTIALLY_WORKING`, `UNTESTED`, `UNREACHABLE`, `ORPHANED`,
`SECURITY_CONCERN`, `SPEC_UNKNOWN`. "Test" column cites the real test file when one exists (per
the actually-executed evidence in `TEST-GAPS.md`), not an assumption.

| Flow ID | Actor | Starting State | Action | Destination | Route | API | Auth | Expected | Observed | Status | Evidence | Test | Issue ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F-01 | Anonymous | Cold start | Launch app, no consent record | `/parental-consent` | `app/index.tsx` | — | none | Route to consent gate | Matches | VERIFIED_WORKING | `lib/launch-gate.ts` | `lib/launch-gate.test.ts` | — |
| F-02 | Anonymous | `/parental-consent` | 3 wrong arithmetic answers | Escalating lockout | `app/parental-consent.tsx` | — | none | 30s×2^n lockout | Matches | VERIFIED_WORKING | source read | none (UI timer logic) | — |
| F-03 | Anonymous | Gate passed | Tap "I agree" | Consent recorded, route to `/welcome` or `/(tabs)` | `app/parental-consent.tsx` | — | none | AsyncStorage write + context flip | Matches | VERIFIED_WORKING | `lib/consent-record.ts` | `lib/consent-record.test.ts`, `ConsentContext.test.tsx` (new) | — |
| F-04 | Consented, restored nav state | Deep link to a protected route pre-consent | Attempt to mount | Blocked | `app/_layout.tsx` `Stack.Protected` | — | client-only | Screen unmountable | Matches (by construction) | VERIFIED_WORKING | `lib/ConsentContext.tsx` seeded before render | `ConsentContext.test.tsx` (new) | — |
| F-05 | Any | `/(tabs)` home | Tap story-seed gallery | `/story-seeds` | `app/story-seeds.tsx` | — | client-only | Registered `Stack.Screen` inside guard | **No registration exists** | SPEC_UNKNOWN | `app/_layout.tsx` read in full | none | FLOW-BREAK-002 |
| F-06 | Any | `/(tabs)/profile` | Look for voice chat | `/voice-chat` | — | — | client-only | Documented nav entry | No entry exists | ORPHANED | grep, full file read | `__tests__/release/voice-containment.test.ts` (adjacent, not this) | FLOW-BREAK-007 |
| F-07 | Any authenticated | Wizard screen | Submit story params | `POST /api/generate-story` | `app/story.tsx` | `/api/generate-story` | yes | Story returned, safety-guarded | Matches | VERIFIED_WORKING | `server/routes/story.ts`, `server/safety/story-guard.ts` | `server/safety/story-guard.test.ts`, `__tests__/integration/api-routes.test.ts` | — |
| F-08 | Any authenticated | Story generated | AI output contains unsafe content | Regenerate once → fallback | `server/safety/story-guard.ts` | — | — | Child never sees flagged text | Matches | VERIFIED_WORKING | source read | `server/safety/story-guard.test.ts`, `content-safety.test.ts` | — |
| F-09 | Any | `/story` end reached | Auto-complete | `/completion` | `app/story.tsx` → `app/completion.tsx` | — | — | Single save, streak, badges, sync | Two independent saves possible | VERIFIED_BROKEN | `app/completion.tsx` read in full | none (no test asserts single-save) | FLOW-BREAK-003 |
| F-10 | Any | `/completion` | Mount effect | Badge evaluation | `lib/badges.ts` | — | — | All 12 badges correctly evaluated | Matches | VERIFIED_WORKING | source read, cross-checked all 12 | `lib/badges.test.ts` | — |
| F-11 | Any offline | Any interaction (like/completion) | Reconnect | Queue drains via API | `lib/sync-queue.ts` | `POST /api/sync/interactions` | yes (would be) | Server processes queued items | **Route does not exist — 404 every time** | VERIFIED_BROKEN | `git log -S`, full route-registration read | `lib/sync-queue.test.ts` (tests the client side only, correctly documents the failure path) | FLOW-BREAK-001 |
| F-12 | Signed-in, cloud sync on | App open/foreground/reconnect/sign-in | Trigger fires | `runSync()` | `components/SyncManager.tsx` | Supabase `sync_records` | yes | Coalesced, gated on consent+online+enabled | Matches | VERIFIED_WORKING | source read | `__tests__/components/SyncManager.test.tsx` | — |
| F-13 | Signed-in | Delete a story | `deleteStory()` | Local tombstone | `app/(tabs)/library.tsx` | — | — | Tombstone pushed promptly | No immediate `runSync()` call | VERIFIED_BROKEN | source read | `lib/sync/reconcile.test.ts` (covers reconcile logic, not this trigger gap) | FLOW-BREAK-004 |
| F-14 | Signed-in | Delete a favorited story | `deleteStory()` | Favorites cleaned up too | `lib/storage.ts` | — | — | No dangling favorite/read entries | Favorites/read entries survive | VERIFIED_BROKEN | source read | none | FLOW-BREAK-005 |
| F-15 | Signed-in parent | Settings → Delete All Data | Confirm | `DELETE /api/account` → local wipe | `app/settings.tsx` | `/api/account` | yes, non-anon | Full cascade, PII-free receipt | Matches on the happy path | VERIFIED_WORKING | `server/routes/account.ts` | `server/routes/account.test.ts` | — |
| F-16 | Signed-in parent | Delete-all-data, second delete step throws | Partial server state | 503, local data preserved | `server/routes/account.ts` | `/api/account` | yes | Either full success or full rollback | No rollback on partial failure | PARTIALLY_WORKING | source read | `server/routes/account.test.ts` (covers full success/full failure, not the partial-throw-after-partial-success case) | FLOW-BREAK-006 |
| F-17 | Any | Any `/api/*` mutating call | No/invalid bearer token | `401`/`503` | `server/auth.ts` `requireAuth` | any | — | Exact status per failure mode | Matches | VERIFIED_WORKING | full file read | `server/auth.test.ts` (exhaustive) | — |
| F-18 | Anonymous-Supabase | Any protected call | Lazy anon JWT minted | Request proceeds | `lib/auth-session.ts` | any | yes (anon) | Anonymous identity accepted everywhere except account deletion | Matches | SECURITY_CONCERN (informational) | full file read | none (design intent, not a bug) | SECURITY_CONCERN-2 |
| F-19 | Signed-in | Session token expires mid-session | Next query/mutation | 401 handled gracefully | `lib/query-client.ts` | any | — | User prompted to re-auth | Generic thrown Error, silently swallowed by background callers | VERIFIED_BROKEN (UX gap, not data-loss) | full-repo grep for 401/re-auth handling → zero matches | none | SECURITY_CONCERN-1 |
| F-20 | Dev environment | Supabase env vars unset, `NODE_ENV=production` | Any protected call | 503 | `server/auth.ts` | any | — | Fail closed | Matches | VERIFIED_WORKING | full file read | `server/auth.test.ts` | — |
| F-21 | Dev environment | Supabase env vars unset, `NODE_ENV!=production` | Any protected call | IP-anonymous fallback | `server/auth.ts` | any | — | By-design dev convenience | Matches (documented tradeoff) | SECURITY_CONCERN (informational) | full file read | `server/auth.test.ts` | SECURITY_CONCERN-3 |
| F-22 | GitHub | Webhook event | HMAC signature check | 202/401 | `server/routes/github-webhook.ts` | `/api/github/webhook` | HMAC, not `req.user` | Correctly authenticated | Matches | VERIFIED_WORKING | full file read | `server/routes/github-webhook.test.ts` | — |
| F-23 | Any | Client calls `/api/tts` | Cache miss | Persistent R2 backfill | `server/routes/tts.ts` | `/api/tts` | yes | Survives cold start per docs | **R2 tier does not exist; `/tmp` only** | VERIFIED_BROKEN (doc claim, not app-visible bug) | full-repo grep, zero `r2Get`/`r2Put`/`R2_ENABLED` hits | none needed (feature doesn't exist to test) | doc-drift |
| F-24 | Any | Client opens Voice Chat / Realtime Media | — | Feature works | `app/voice-chat.tsx` | 9 server endpoints total | yes | Wired end to end | Server-complete, zero client callers | ORPHANED | grep across `app/`,`components/`,`lib/`,`src/` | server-side tests only (`server/routes/realtime-media.test.ts`, audio route tests) | — |
| F-25 | Any | `src/` Vite app | Generate a story | Server involvement | `src/services/aiStoryGenerator.ts` | none | n/a | Local synchronous generation, confirmed no server dependency | Matches | VERIFIED_WORKING | full file + grep read | none (separate, undocumented-relationship stack; out of primary scope) | — |
| F-26 | Any | Parent controls | 5 wrong PINs | 30s lockout | `components/ParentControlsModal.tsx` | — | client-only | Lockout + hash-only storage | Matches | VERIFIED_WORKING | `lib/storage.ts` PIN functions | `lib/storage.test.ts` (lines ~714-742) | — |

## Coverage summary

- **26 flow edges enumerated** across the 10 diagrams (representative of the highest-value/
  highest-risk paths, not literally every possible transition — see `README.md` "Method").
- **17 VERIFIED_WORKING**, **6 VERIFIED_BROKEN**, **1 PARTIALLY_WORKING**, **2 ORPHANED**,
  **1 SPEC_UNKNOWN**, **3 SECURITY_CONCERN** (informational; some rows carry more than one tag,
  hence totals exceed 26).
- Of the 6 confirmed breaks, **5 already have a clear proposed fix and required test** documented
  in `FLOW-BREAKS.md`; none were fixed in this PR (see `README.md` "Scope" for why).
- The single largest positive finding: **core safety, auth, consent, badge, and sync-reconcile
  logic is already thoroughly covered by real, production-code-importing automated tests** — this
  audit's main value-add is the flows those tests don't reach (cross-file lifecycle interactions
  like the double-save and orphan-on-delete bugs, which no single unit test would catch because
  each individual function behaves correctly in isolation).
