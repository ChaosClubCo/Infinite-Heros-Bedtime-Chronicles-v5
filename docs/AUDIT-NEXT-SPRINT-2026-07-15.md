# Audit & Next-Sprint Proposal — 2026-07-15

Fresh audit of the canonical repo plus a live cross-repo check of the two sibling
repos (`krosebrook/bedtime_chronicles-v2`, `krosebrook/infinite-heros-bedtime-chronicles-v5-main`)
named in the Merge Provenance. All findings below were verified against a live
`npm ci` + `npm run typecheck` / `lint` / `test` / `test:coverage` / `npm audit` pass
in this repo, plus the GitHub API for the other two repos (their live state, not
a locally cached checkout — see finding 4).

## Headline: the codebase itself is healthy

- `npm run typecheck` — clean, 0 errors.
- `npm run lint` — clean, 0 warnings.
- `npm test` — **1280/1280 tests passing across 70 files** (docs still cite the
  2026-06-11 baseline of 1010 tests / 41 files — stale, see finding 5).
- `npm run test:coverage` — 72.49% statements / 67.78% branches / 75.25% functions
  overall (docs still cite ~59%/55% — stale, also finding 5). Note CI does **not**
  gate on this: `.github/workflows/ci.yml` runs `npm test`, not `npm run test:coverage`,
  so the "does not meet 80% branch threshold" exit code some may remember from local
  runs has never been a merge blocker.
- `npm audit` — **15 moderate, 0 high, 0 critical** (docs still cite 42 advisories
  including 2 high in `tmp`/`undici` — those are gone now, presumably fixed via the
  steady stream of Dependabot merges; also stale, finding 5). Remaining 15 are two
  transitive chains: `esbuild` (via `@esbuild-kit/*` → `drizzle-kit`) and `uuid` (via
  `@expo/config-plugins` → `expo-splash-screen`/`@expo/cli`). Both have `--force` fixes
  available but each is a breaking major bump (drizzle-kit 0.31→0.18, i.e. a downgrade;
  expo-splash-screen major bump) — not a blind-apply, needs its own scoped pass.
- No open PRs exist yet against `claude/next-sprint-audit-09d8qx` in any of the three
  repos as of this audit.

So this is not a "the codebase is in trouble" audit. The real findings are about
**verification gaps on recently-shipped work** and **the cross-repo merge being
half-finished**, both of which are more valuable to fix now (fresh in context) than
to let go stale.

## Findings

### 1. `server/auth.ts` — the entire Supabase auth boundary has zero real test execution (HIGH)

`server/auth.comprehensive.test.ts` (215 lines, the file coverage tools count against
`server/auth.ts`) **never imports `server/auth.ts`**. It re-implements fragments of the
middleware's logic inline as literals and asserts against those literals — e.g.:

```ts
it('rejects "Bearer " with no token', () => {
  const authHeader = 'Bearer ';
  const token = authHeader.slice(7);
  expect(token).toBe('');
});
```

This passes regardless of what `requireAuth()` actually does. Separately, the
integration suite (`__tests__/integration/api-routes.test.ts`) mocks `requireAuth`
outright (`vi.fn((req, res, next) => ...)`), so the real function never runs there
either. Coverage confirms it: `server/auth.ts` is **4.08% statements / 0% branches**.

This means the following real, security-relevant branches in `requireAuth()` have
never been exercised by any test:
- The production fail-closed 503 gate when Supabase isn't configured.
- The dev-mode anonymous-IP fallback.
- The 4096-char token-length DoS guard.
- Supabase `getUser()` returning a 401/403 (→ 401 "invalid token") vs. any other
  status or a network throw (→ 503 "retryable", per the comment explaining why that
  distinction exists).

For a children's app whose entire optional-auth security model hinges on this one
file, a placebo test suite is arguably worse than no test suite — it shows green and
implies coverage that isn't there.

**Fix:** replace (or add alongside, then delete) `auth.comprehensive.test.ts` with a
suite that actually imports `requireAuth`/`isAuthEnabled` and mocks
`@supabase/supabase-js`'s `createClient` to drive each branch above.

### 2. Cloud sync (M3) — the fix landed, the promised verification doc didn't (HIGH)

Commit `0e31e77` (2026-07-13, 2 days before this audit) fixed a genuinely serious
latent bug: `<SyncManager />` was imported in `app/_layout.tsx` but never mounted, so
the durable Supabase state sync (`lib/sync/*`) only ever ran after a story completed —
never on app open, foreground, or reconnect, since the M1–M3 merge. The commit message
says "Still needs on-device verification (see `docs/VERIFICATION-M1-M3.md`)" — **that
file does not exist anywhere in the repo.** It was referenced but never committed.

Current blast radius is low (`cloudSyncEnabled` defaults `false`, so no current user is
affected), but this is the freshest and most structurally fragile subsystem in the app
(six entity adapters, last-write-wins reconciliation, tombstones, a profile-stub
merge strategy) and it shipped with a bug serious enough to make it a no-op for its
first ~2 weeks without anyone noticing at the mount layer. It deserves an actual
verification pass before it's ever toggled on for a real parent.

**Fix:** author the missing `docs/VERIFICATION-M1-M3.md` as a real checklist and
execute it — at minimum an on-device (or Detox/e2e) pass confirming `SyncManager`
fires on open/foreground/reconnect, `runSync()` no-ops when the setting is off, and a
full opt-in round-trip against `sync_records` for all six entity types.

### 3. `krosebrook/infinite-heros-bedtime-chronicles-v5-main` never actually converged, and its CI is broken (MEDIUM)

This repo's own `.claude/CLAUDE.md` (in this repo) and this repo's `CLAUDE.md` both
state the 2026-07-13 merge left `v5-main` with "no application source ... contributed
nothing beyond receiving the merged tree so all three repos converge on identical
content." **That is not true of the live repo.** Checked directly against the GitHub
API (not a local checkout — the sandbox's local clone of that repo is a
session-start snapshot and does not reflect live pushes):

- `v5-main`'s `main` branch (`06690a97`, live HEAD as of this audit) is still the
  **pre-merge** codebase: Firebase Admin auth (not Supabase), Expo SDK 54 / RN 0.85,
  plaintext parent-controls PIN, `server/routes.ts` as one 550-line file, no
  content-safety guard, no cloud sync, no COPPA consent screen.
- Its most recent CI run (`29221776371`, 2026-07-13) **failed**: the "Verify
  package-lock.json is in sync with package.json" step fails before lint/test/
  typecheck/audit even run — they're all skipped as a result. This is the exact
  lockfile-drift failure mode this repo's own `.claude/CLAUDE.md` already flags as a
  recurring risk ("`npm ci` has failed twice now...").

`bedtime_chronicles-v2`, by contrast, genuinely did get the convergence PR (#3,
"Merge planning: adopt canonical v5 super-version tree") — but see finding 4, it's
only a partial convergence.

**Fix:** regenerate `v5-main`'s `package-lock.json` to unblock CI visibility, then run
it through the same convergence process `v2` went through in PR #3.

### 4. `bedtime_chronicles-v2` converged its docs but not its code (MEDIUM)

`v2`'s PR #3 copied this repo's `CLAUDE.md` wholesale — it now describes the
content-safety guard, on-device TTS cache, and cloud-sync engine as present. But
diffing the actual file trees (`git ls-tree` on both repos' current `main`/audit
branch) shows **19 files never made it over**, including:

- `server/safety/*` (`content-safety.ts`, `story-guard.ts`, `fallback-stories.ts`,
  `terms.ts`) and `shared/safety-terms.ts` — the entire AI-output child-safety
  moderation layer this repo's Known Gotchas describes as "AI OUTPUT safety is now
  enforced, not just prompt-side."
- `lib/sync/*` (six files + tests), `components/SyncManager.tsx`,
  `lib/SyncOfflineContext.tsx`, `shared/sync-types.ts`,
  `supabase/migrations/0001_sync_tables.sql` — the whole M3 cloud-sync engine.
- `lib/tts-cache.ts`, `lib/narration.ts` — the on-device narration cache.

So `v2`'s own `CLAUDE.md` currently claims an output-side content-safety guard exists
in a tree where it does not. That's the finding that matters most here: it's not just
missing features, it's **documentation asserting a safety control is present when
it isn't**, in a children's app repo.

**Fix:** either port the 19 files (mirroring what's already proven to work in the
canonical repo) or, if `v2` is intentionally being left behind pending a full
convergence, correct its `CLAUDE.md` to stop claiming shipped features it doesn't have
until that convergence happens.

### 5. Stale numbers across `docs/ROADMAP.md`, `TODO.md`, `docs/TEST-COVERAGE-ANALYSIS.md` (LOW)

Not a defect, just drift — captured here so the roadmap update below can fix it in
one pass rather than three separate reconciliation commits:

| Metric | Docs currently say | Actual (this audit, 2026-07-15) |
|---|---|---|
| Tests | 1010 tests / 41 files (2026-06-11 baseline) | **1280 tests / 70 files**, all passing |
| Coverage | ~59% stmt / ~55% branch | **72.49% stmt / 67.78% branch** |
| `npm audit` | 42 advisories: 2 high, 40 moderate | **15 moderate, 0 high, 0 critical** |
| TODO.md item #2 | "2 high in tmp/undici... blocked" | Resolved — no longer true |

## Proposed next sprint

Ordered by WSJF `(Value + Criticality + Risk) / Size`, same scale as `docs/ROADMAP.md`
(H=8, M=5, S=3, L=1 for Value/Criticality/Risk; S=2, M=5, L=8 for Size).

| # | Item | Value | Crit. | Risk | Size | WSJF | Repo |
|---|------|-------|-------|------|------|------|------|
| 1 | Real tests for `server/auth.ts` (delete the placebo suite, drive `requireAuth` through `createClient` mocks for every branch: prod-missing-config 503, dev anonymous fallback, missing/oversized/malformed bearer, 401/403 vs. other-status vs. thrown network error) | 8 | 5 | 8 | S (2) | **10.5** | canonical |
| 2 | Write the missing `docs/VERIFICATION-M1-M3.md` and execute it — on-device or e2e pass confirming SyncManager triggers (open/foreground/reconnect), the off-by-default no-op, and a full six-entity opt-in sync round-trip | 5 | 5 | 5 | S (2) | **7.5** | canonical |
| 3 | Fix `v5-main` CI (regenerate `package-lock.json`) so lint/test/typecheck/audit run again, then run it through the same convergence PR `v2` got | 5 | 3 | 5 | M (5) | 2.6 | v5-main |
| 4 | Port the 19 missing M1–M3 files into `v2` so its code matches its own docs (or correct the docs to stop over-claiming) | 8 | 5 | 8 | M (5) | 4.2 | v2 |
| 5 | Refresh stale test/coverage/audit numbers in `docs/ROADMAP.md`, `TODO.md`, `docs/TEST-COVERAGE-ANALYSIS.md` | 3 | 1 | 2 | S (2) | 3.0 | canonical |

Carried forward unchanged from the existing backlog (still genuinely blocked on a
human provisioning step, not on agent work): EAS secrets + Play Store submission,
TTS cache → Cloudflare R2 migration (needs a bucket + token provisioned first), and
the remaining 15 moderate `npm audit` findings (both fixes are breaking-change
`--force` bumps that deserve their own dependency-upgrade pass rather than a blind
apply here).

Not recommended for this sprint: the Expo SDK 55→57 gap. It's real (most of the
remaining moderate audit findings trace back to it) but a two-major jump on
Expo/Expo Router has a track record of multi-day breakage in this project's own
CHANGELOG — it deserves a dedicated upgrade sprint with its own test pass, not a slot
alongside the above.
