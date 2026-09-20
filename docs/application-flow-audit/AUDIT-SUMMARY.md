# Audit Summary

TL;DR: The application's core loop (consent → create → play → complete → badge → optional cloud
sync) is well-built and, at the unit level, well-tested. This audit found **8 confirmed
defects**, most of them cross-file lifecycle interactions that unit tests structurally can't
catch (each function involved is individually correct). The single most significant is
**FLOW-BREAK-008**: the parent-facing COPPA consent disclosure states the child's name never
leaves the device, but story-generation and suggestion prompts include it verbatim when supplied,
sending it to third-party AI providers — a real gap between a specific written privacy promise
and actual behavior, not a theoretical one. (An earlier draft of this audit rated **the offline
interaction sync queue never working in production** as the top/P0 finding; a review pass
correctly downgraded that to P1 — its own user-impact write-up describes no current user-visible
consequence, which doesn't square with a P0/release-blocker label — and surfaced FLOW-BREAK-008
as the finding that actually warrants it.) This audit also found that both of the repository's own
`CLAUDE.md` files have drifted meaningfully from source (stale directory paths, a described-as-
live persistence tier that doesn't exist, an undocumented production-gating compliance layer), and
this document itself went through one correction pass after external review caught real errors —
see the note at the end of each affected section below rather than treating this as a polished,
first-draft-correct output.

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
are fully wired end to end with a real child-safety moderation pipeline — but see FLOW-BREAK-008
above: the story-generation prompt path also does something its own consent disclosure says it
doesn't. **Two entire server subsystems (voice chat, realtime media) are tested and have zero
client UI wiring, but "production-complete" overstates voice chat specifically — corrected after
review**: `POST /api/conversations` and `POST /api/conversations/:id/messages` (the latter
accepting up to 25MB of audio and invoking paid OpenAI transcription/chat calls) have no
`rateLimited()` wrapper, per `API-INVENTORY.md`'s own table. Shipping this subsystem's UI without
first adding rate limiting would open a real abuse/cost path, not just a "add the UI" product
decision. Realtime media, by contrast, is both rate-limited and consent-checked
(`AUTHORIZATION-MATRIX.md`) — closer to actually production-ready. The cloud-sync engine
(`lib/sync/*`) correctly implements last-write-wins reconciliation with tombstone propagation —
also thoroughly tested — and has one real trigger-timing latency gap (FLOW-BREAK-004, corrected
after review to *not* be a data-loss/resurrection defect — see below) plus one real cleanup gap
(FLOW-BREAK-005).

## 4. Broken-flow map

See `10-broken-flow-overlay.mmd` and `FLOW-BREAKS.md` for the full register (which has a severity-
ordered index at the top — IDs below are stable/assigned-in-order, not severity-order). Summary
table, this time sorted by actual severity:

| ID | Severity | One-line summary |
|---|---|---|
| FLOW-BREAK-008 | **P0** | Consent disclosure says the child's name never leaves the device; story-generation prompts include it |
| FLOW-BREAK-001 | P1 | Offline interaction queue's server endpoint was never implemented — never drains (downgraded from an initial P0; see TL;DR) |
| FLOW-BREAK-002 | P1 | `/story-seeds` has no `Stack.Screen` registration — COPPA-guard coverage unverified |
| FLOW-BREAK-003 | P1 | Completing a story can silently create two saved records, inflating badge counts |
| FLOW-BREAK-005 | P2 | Deleting a story orphans its favorite/read-tracking entries |
| FLOW-BREAK-007 | P2 | `/voice-chat` is orphaned; contradicts both `CLAUDE.md` files' reachability claim |
| FLOW-BREAK-004 | P3 | Deletions only propagate to other synced devices on the next sync trigger — a latency gap, **not** the resurrection defect an earlier draft claimed (corrected after review; a fresh tombstone timestamp always beats a stale live copy) |
| FLOW-BREAK-006 | P3 | Account deletion isn't fully transactional across Postgres + Supabase Auth (proposed fix corrected after review — see `FLOW-BREAKS.md`, the original suggestion would have broken retry-safety) |

## 5. Flow coverage %

Of the 27 traced edges in `FLOW-COVERAGE.md` (26 originally, plus F-27 added for FLOW-BREAK-008),
counting each row's `Status` column exactly once: **14/27 (52%) VERIFIED_WORKING**,
**7/27 (26%) VERIFIED_BROKEN**, **1/27 (4%) PARTIALLY_WORKING**, **2/27 (7%) ORPHANED**,
**1/27 (4%) SPEC_UNKNOWN**, **2/27 (7%) SECURITY_CONCERN** (informational). These six figures sum
to 27/100%. (An earlier draft of this line double-counted and misstated these totals against a
26-row matrix — corrected after review; see `FLOW-COVERAGE.md`'s "Coverage summary" for the
row-by-row count.) This is a **traced-edge**
sample focused on the highest-risk paths (auth, consent, destructive actions, data lifecycle,
API surface) — not a literal enumeration of every possible transition, per the audit's own
"practical equivalence-class coverage over exhaustive enumeration" instruction.

## 6. Verified broken transitions

The 7 `VERIFIED_BROKEN` rows in `FLOW-COVERAGE.md`, correctly mapped (an earlier draft mispaired
these — corrected after review):

| Row | Maps to |
|---|---|
| F-09 (double story-save) | FLOW-BREAK-003 |
| F-11 (offline sync queue 404s) | FLOW-BREAK-001 |
| F-13 (delete not pushed synchronously) | FLOW-BREAK-004 — latency gap only, see the corrected write-up in `FLOW-BREAKS.md` |
| F-14 (favorites/read orphaned on delete) | FLOW-BREAK-005 |
| F-19 (401 silent-fail) | `SECURITY_CONCERN-1` (informational — not a numbered `FLOW-BREAK`) |
| F-23 (R2 tier doesn't exist) | doc-drift item (not a numbered `FLOW-BREAK`) |
| F-27 (child's name reaches AI providers despite the consent disclosure) | **FLOW-BREAK-008 — the most severe confirmed finding in this audit** |

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

These are informational design tradeoffs, distinct from FLOW-BREAK-008 (§4), which is a confirmed
defect — a specific written privacy claim that doesn't match server behavior — not a tradeoff.

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
   documented feature (`/api/sync/interactions`) that was never built, a built feature
   (`server/compliance.ts`, the real server directory structure) that was never documented, and —
   most seriously — a **parent-facing legal disclosure** (`CONSENT_DISCLOSURES[0]`: the child's
   name never leaves the device) that was never cross-checked against the prompt-building code
   that actually runs (FLOW-BREAK-008). This is the same root cause wearing three different hats;
   the third instance carries real compliance weight that the first two don't.
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
- **FLOW-BREAK-008 needs human — likely legal — review, not just an engineering fix.** This audit
  can confirm the code-vs-disclosure mismatch precisely, but cannot determine on its own whether
  the correct remedy is changing the code to match the promise, changing the promise (with a
  `CONSENT_VERSION` bump forcing re-consent) to match the code, or something else entirely (e.g. a
  provider-level data-processing agreement that already covers this and makes the current
  disclosure text merely imprecise rather than false) — that last possibility wasn't verified and
  is exactly the kind of external-agreement fact this audit's method (source + tests only) cannot
  see.
- **This document itself was reviewed and corrected once** (by Copilot's and Codex's automated PR
  review, both verified against source before accepting) — a second independent pass might still
  find more. Treat "reviewed once and corrected" as evidence of a good-faith, checked audit, not
  as proof of zero remaining errors.
