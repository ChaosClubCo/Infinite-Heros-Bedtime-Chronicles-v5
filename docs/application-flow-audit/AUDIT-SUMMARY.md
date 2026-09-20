# Audit Summary

TL;DR: The application's core loop (consent → create → play → complete → badge → optional cloud
sync) is well-built and, at the unit level, well-tested. This audit found **7 confirmed
cross-file lifecycle defects** that unit tests structurally can't catch (each function involved
is individually correct), the most significant being that **the offline interaction sync queue
has never worked in production** — it 404s on every drain attempt because the server endpoint it
targets was documented but never implemented. It also found that both of the repository's own
`CLAUDE.md` files have drifted meaningfully from source (stale directory paths, a described-as-
live persistence tier that doesn't exist, an undocumented production-gating compliance layer).

## 1. Master application map

See `01-master-application-flow.mmd` for the diagram. In prose: Actor (anonymous /
anonymous-Supabase / signed-in parent) → Entry (cold start, deep link, reconnect) → Expo Router
route → UI state → action → `requireAuth` + AI-provider-compliance gate → Express handler →
validation/safety-guard/rate-limit/idempotency → downstream (AI router, ElevenLabs, Sora,
Supabase, Postgres) → response → client state (AsyncStorage/React Query) → next UI state. This is
a **single-tenant-per-account, ownership-based system with no RBAC** — every authorization check
found is "does this row belong to `req.user.uid`," never a role check.

## 2. Auth map

See `03-authentication-flow.mmd` and `AUTHORIZATION-MATRIX.md`. Supabase is the sole identity
provider; `requireAuth` is a single global gate (not scattered per-route), and its behavior is
exhaustively tested (`server/auth.test.ts`). Two independent COPPA-consent enforcement layers
exist (cold-start `resolveLaunchRoute()` and the always-mounted `Stack.Protected` guard) and both
fail closed on any error. The first layer is thoroughly tested (`lib/launch-gate.test.ts`); the
second layer's own reactive state is now also tested (`ConsentContext.test.tsx`, new in this
PR), though that test covers the context's state machine, not `Stack.Protected`'s navigator-level
enforcement itself — see `TEST-GAPS.md` for the precise scope. Authorization is ownership-based
throughout; no
IDOR, missing ownership check, or client-only server guard was found.

## 3. API / data map

See `05-api-data-flow.mmd` and `API-INVENTORY.md`. Story generation, media generation, and TTS
are fully wired end to end with a real child-safety moderation pipeline. **Two entire server
subsystems (voice chat, realtime media) are production-complete and tested but have zero client
UI wiring** — significant unused surface area, not a bug per se, but worth a product decision on
whether to ship the UI, remove the server code, or leave it staged. The cloud-sync engine
(`lib/sync/*`) correctly implements last-write-wins reconciliation with tombstone propagation —
also thoroughly tested — but has two real trigger-timing gaps (FLOW-BREAK-004, FLOW-BREAK-005).

## 4. Broken-flow map

See `10-broken-flow-overlay.mmd` and `FLOW-BREAKS.md` for the full register. Summary table:

| ID | Severity | One-line summary |
|---|---|---|
| FLOW-BREAK-001 | P0 | Offline interaction queue's server endpoint was never implemented — never drains |
| FLOW-BREAK-002 | P1 | `/story-seeds` has no `Stack.Screen` registration — COPPA-guard coverage unverified |
| FLOW-BREAK-003 | P1 | Completing a story can silently create two saved records, inflating badge counts |
| FLOW-BREAK-004 | P2 | Deletions aren't pushed synchronously — resurrection race across synced devices |
| FLOW-BREAK-005 | P2 | Deleting a story orphans its favorite/read-tracking entries |
| FLOW-BREAK-006 | P3 | Account deletion isn't fully transactional across Postgres + Supabase Auth |
| FLOW-BREAK-007 | P2 | `/voice-chat` is orphaned; contradicts both `CLAUDE.md` files' reachability claim |

## 5. Flow coverage %

Of the 26 traced edges in `FLOW-COVERAGE.md`, counting each row's `Status` column exactly once:
**14/26 (54%) VERIFIED_WORKING**, **6/26 (23%) VERIFIED_BROKEN**, **1/26 (4%) PARTIALLY_WORKING**,
**2/26 (8%) ORPHANED**, **1/26 (4%) SPEC_UNKNOWN**, **2/26 (8%) SECURITY_CONCERN** (informational).
These six figures sum to 26/100%. (An earlier draft of this line double-counted and misstated
these totals — corrected after review; see `FLOW-COVERAGE.md`'s "Coverage summary" for the
row-by-row count.) This is a **traced-edge**
sample focused on the highest-risk paths (auth, consent, destructive actions, data lifecycle,
API surface) — not a literal enumeration of every possible transition, per the audit's own
"practical equivalence-class coverage over exhaustive enumeration" instruction.

## 6. Verified broken transitions

The 6 `VERIFIED_BROKEN` rows in `FLOW-COVERAGE.md`, correctly mapped (an earlier draft mispaired
these — corrected after review):

| Row | Maps to |
|---|---|
| F-09 (double story-save) | FLOW-BREAK-003 |
| F-11 (offline sync queue 404s) | FLOW-BREAK-001 |
| F-13 (delete not pushed synchronously) | FLOW-BREAK-004 |
| F-14 (favorites/read orphaned on delete) | FLOW-BREAK-005 |
| F-19 (401 silent-fail) | `SECURITY_CONCERN-1` (informational — not a numbered `FLOW-BREAK`) |
| F-23 (R2 tier doesn't exist) | doc-drift item (not a numbered `FLOW-BREAK`) |

`FLOW-BREAK-007` (orphaned `/voice-chat`) is represented in the coverage matrix by F-06/F-24,
tagged `ORPHANED` rather than `VERIFIED_BROKEN` — it has no row of its own in the six above.
Likewise `FLOW-BREAK-002` (`/story-seeds` registration) maps to F-05 (`SPEC_UNKNOWN`) and
`FLOW-BREAK-006` (account-deletion non-atomicity) maps to F-16 (`PARTIALLY_WORKING`) — not every
confirmed break is tagged `VERIFIED_BROKEN`; several are more precisely `SPEC_UNKNOWN`,
`PARTIALLY_WORKING`, or `ORPHANED` depending on what was actually observed.

## 7. Security-sensitive transitions

Three items, all `SECURITY_CONCERN` (informational — none rise to a confirmed exploitable
vulnerability in this pass):
1. No client-side 401 recovery UX (generic thrown/swallowed error, no re-auth prompt).
2. Anonymous Supabase JWTs satisfy `requireAuth` everywhere except account deletion — intentional,
   but a future endpoint could mis-assume "authenticated" means "real parent."
3. Dev-mode IP-anonymous auth-bypass blast radius depends on `NODE_ENV` being correct at every
   deploy target — not independently verified against actual deploy configuration (`UNKNOWN`).

## 8. Untested transitions

Per `TEST-GAPS.md`: `/story-seeds` Stack.Screen registration behavior (requires Expo Router
navigator-testing infra this repo doesn't have set up), the double-save bug, the favorites/
read-orphan-on-delete bug, the delete-trigger-timing gap (partially covered via the pure
`reconcile()` function, not the trigger itself), `POST /api/sync/interactions` (can't be tested —
doesn't exist), and account-deletion's partial-failure interleaving. Each has an explicit
justification in `TEST-GAPS.md`, not a silent skip.

## 9. Orphaned / unreachable states

`/voice-chat` (orphaned — zero in-app nav, intentional disabled-feature placeholder) and the
entire voice-chat + realtime-media server subsystems (9 endpoints, production-complete, zero
client callers), plus 6 smaller orphaned read-only endpoints (`/api/metrics`,
`/api/ai-providers`, `/api/voices`, `/api/video-available`, `/api/music-info/:mode`,
`/api/generate-story-stream`). None are "broken" — they're either intentionally staged/disabled
or genuinely unused surface area worth a product decision.

## 10. Top root causes

1. **Documentation and implementation diverged silently over time**, in both directions — a
   documented feature (`/api/sync/interactions`) that was never built, and a built feature
   (`server/compliance.ts`, the real server directory structure) that was never documented. This
   is the root cause behind FLOW-BREAK-001 and the entire doc-drift list.
2. **No single-responsibility "this story is done" event.** Story completion triggers four
   independent, uncoordinated side effects (auto-save, manual save, offline-queue enqueue,
   cloud-sync push) with no shared idempotency key — root cause of FLOW-BREAK-003 and part of why
   FLOW-BREAK-001's queue and the M3 sync engine silently overlap without a dedup contract.
3. **Deletion is treated as "cheaper" than creation/completion**, so it doesn't get the same
   "push now" treatment saves get — root cause of FLOW-BREAK-004 and FLOW-BREAK-005.
4. **No cross-system transaction pattern** for the one place two backends are touched in sequence
   (Postgres + Supabase Auth in account deletion) — root cause of FLOW-BREAK-006.

## 11. Tests added

- `__tests__/components/ConsentContext.test.tsx` — 6 new tests covering the `Stack.Protected`
  guard's reactive state (initial load, fail-closed on error, `markConsented`/`markUnconsented`),
  the one gap the test-evidence research pass named explicitly by file-not-existing.
- Fixed `.nvmrc` (missing) and two `.env.example` comment lines, which took
  `__tests__/release/toolchain-and-env-setup.test.ts` from "1 file errors before any assertion
  runs" to fully passing (4/4 assertions).
- Full suite validated green end-to-end after these changes: `typecheck` clean, `lint` clean,
  vitest **78/78 files, 864/864 tests**, jest **9/9 suites, 60/60 tests**.

## 12. Remaining evidence gaps

- **No live/production/dynamic testing was performed** (no deployment access, no browser session
  against a running instance, no test credentials) — this audit is entirely static-analysis- and
  existing-test-execution-grounded. Multi-device sync races (FLOW-BREAK-004), the account-
  deletion partial-failure interleaving (FLOW-BREAK-006), and the exact runtime behavior of an
  unregistered Expo Router screen under a `Stack.Protected` sibling (FLOW-BREAK-002) are all
  identified from code-path reading, not reproduced live.
- **Deploy-time `NODE_ENV` configuration was not verified** against actual Vercel/Cloudflare
  deploy targets — SECURITY_CONCERN-3's blast radius assessment depends on this being correct and
  wasn't independently confirmed.
- **The `src/` Vite app received lighter scrutiny** than the Expo client, consistent with its
  confirmed lack of functional server dependency, but a full flow audit of its own 8 internal
  views (state-switched, no router) was out of this pass's primary focus.
- **An interactive flow-explorer artifact was not produced** — the 10 static Mermaid diagrams
  plus the coverage/break tables were judged to deliver the required evidence-backed transition
  matrix; a filterable interactive explorer (pan/zoom/filter-by-actor/subsystem/status) can be
  built as a follow-up Claude Artifact on request, but wasn't assumed as in-scope for a repo-
  committed audit deliverable.
