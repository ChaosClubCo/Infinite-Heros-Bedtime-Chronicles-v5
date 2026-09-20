# Application Flow Audit — Infinity Heroes: Bedtime Chronicles v5

Reverse-engineered, evidence-grounded flow model of this application: every route, API endpoint,
auth/authorization boundary, and data-lifecycle path this pass could verify against source,
static analysis, and the repository's own automated test suites — plus the broken, orphaned, and
undocumented edges that surfaced along the way. Generated 2026-09-20.

## Scope and method (read this before the findings)

This audit was produced **without a live deployment, browser session against production, or test
credentials** for this environment. Rather than fabricate dynamic UI-testing results that weren't
actually performed, this audit is **static-analysis-grounded**: every claim is backed by either
(a) reading source directly (file:line evidence throughout), (b) running the repository's actual
`typecheck`/`lint`/`vitest`/`jest` commands and reporting the real output, or (c) `git log`
archaeology to settle contested claims (e.g., whether an endpoint was ever actually implemented).
Where a flow genuinely requires live/dynamic testing this environment couldn't perform (browser
interaction, multi-device sync races, production API probing), it's marked `UNTESTED` or
`UNKNOWN` with an explicit justification — never silently assumed to be working.

**Assuming**, per this scope:
1. "Testing" a flow means either an automated test that actually ran and passed/failed, or a
   documented static-analysis conclusion with cited file:line evidence — not a simulated click-
   through.
2. Findings that require a **product or behavior decision** (e.g., should `/story-seeds` get a
   `Stack.Screen` registration, should the offline sync-queue be implemented or removed) are
   documented with a proposed fix but **not unilaterally implemented** in this PR — consistent
   with how this repo's own `CLAUDE.md` already treats its one other unresolved
   contradiction (the archived-vs-live Android/Kotlin tree) as "needs a maintainer decision, not
   a docs fix."
3. Two exceptions were made to fix, not just document: a missing `.nvmrc` and two missing
   `.env.example` comment lines. Both are purely additive/documentary, zero behavioral risk, and
   were already expected by three other places in the repo (CI workflow, `package.json` engines,
   a release-verification script) — see `TEST-GAPS.md` for the full reasoning.
4. Both frontend stacks (`app/` Expo Router, `src/` Vite) are covered, but the Vite app receives
   lighter treatment since it's confirmed to have no functional dependency on the Express server
   this audit otherwise focuses on (see `ROUTE-INVENTORY.md`).

## Method

1. **Inventory** — five parallel research passes over source: routes/navigation, API endpoints,
   auth/session/authorization, data lifecycle/sync, and actually-executed test evidence.
2. **Model** — state machines built from what the code does, not what the docs claim (both
   `CLAUDE.md` files were treated as a starting hypothesis to verify, not ground truth — several
   claims in them turned out to be stale; see `API-INVENTORY.md`'s discrepancy list).
3. **Visualize** — 10 focused Mermaid diagrams (master overview + 9 drill-downs), not one
   mega-diagram.
4. **Break register + coverage matrix** — every confirmed defect and every traced edge, ranked.
5. **Test** — ran the real test suites, added one targeted new test file for a gap the evidence
   named explicitly, and fixed two zero-risk missing-file issues that were masking one test file's
   real assertions.
6. **Reconcile** — every doc-vs-code discrepancy found is called out explicitly, not silently
   corrected in the diagrams.

## Contents

| File | What it covers |
|---|---|
| `01-master-application-flow.mmd` | Top-level actor → entry → route → auth → API → response cycle |
| `02-user-flow-map.mmd` | Onboarding, story creation/play, library/replay, parent-controls journeys |
| `03-authentication-flow.mmd` | Supabase identity lifecycle (anonymous/signed-in), `requireAuth` |
| `04-authorization-flow.mmd` | Ownership-based authorization (no RBAC exists), COPPA client gate vs. server gates |
| `05-api-data-flow.mmd` | Endpoint groups, safety-guard pipeline, the one confirmed broken API edge |
| `06-route-navigation-map.mmd` | Full Expo Router graph, with the two routing anomalies flagged |
| `07-account-lifecycle.mmd` | Anonymous → signed-in → delete-all-data / account-deletion cascade |
| `08-background-jobs-webhooks.mmd` | GitHub webhook, sync triggers, TTS cache, realtime-media (unwired) |
| `09-error-recovery-flow.mmd` | Circuit breakers/retry/safety-guard recovery vs. the two silent-failure gaps |
| `10-broken-flow-overlay.mmd` | Every confirmed break/security-concern/doc-drift item, in one place |
| `ROUTE-INVENTORY.md` | Full route table for both frontend stacks |
| `API-INVENTORY.md` | Full endpoint table + documentation-discrepancy list |
| `AUTHORIZATION-MATRIX.md` | Resource × action matrix (reflects the actual no-RBAC, ownership-based model) |
| `STATE-MACHINES.md` | Six state machines with state/event/guard/transition tables |
| `FLOW-COVERAGE.md` | 27-row traced-edge matrix with status and evidence |
| `FLOW-BREAKS.md` | 8 confirmed defects, full severity/repro/root-cause/fix register |
| `TEST-GAPS.md` | Real executed test evidence, gap analysis, what this audit added and why |
| `AUDIT-SUMMARY.md` | Final 12-point deliverable summary |

## Diagram legend

Every diagram uses the same four-color convention: **green = VERIFIED_WORKING**,
**red = VERIFIED_BROKEN**, **gray = UNTESTED/ORPHANED**, **orange = SECURITY_CONCERN**,
**dashed gray = SPEC_UNKNOWN**.

## What this PR changed in the application itself

Two zero-behavior-risk fixes plus a required CI fix (see `TEST-GAPS.md` for full justification):
`.nvmrc` (missing Node-version pin), two comment lines in `.env.example`, one new test file
(`__tests__/components/ConsentContext.test.tsx`), and a regenerated `package-lock.json` (the repo
had none; CI's `npm ci` cannot run without one — see the PR's comment history for why this took
three attempts to get right). No route, API, or business-logic behavior was changed. The 8
confirmed application-behavior defects in `FLOW-BREAKS.md` — including FLOW-BREAK-008, a real
mismatch between the parent-facing consent disclosure and what the server actually does with a
child's name — are documented with proposed fixes but intentionally not implemented here; several
require a product or legal decision this audit isn't positioned to make unilaterally.
