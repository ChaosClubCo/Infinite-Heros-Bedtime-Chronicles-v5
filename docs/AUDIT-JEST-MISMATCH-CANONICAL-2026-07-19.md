# Canonical-Repo Audit: Jest 29/30 Mismatch & External-Report Verification (2026-07-19)

## Purpose & Provenance

Two external reports made claims about this codebase:

1. **Mirror audit** — an exact-SHA static audit of the public mirror
   `Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main` @ `7473e76bfbb09c841214a2a9458d24c4fd8767e2`,
   which concluded NO-GO and directed that the audit be repeated against this canonical
   repository with execution evidence, applying "only the Jest 29 alignment and lint cleanup" here.
2. **Ecosystem Diagnostic Map** (2026-07-17) — claimed 2 CRITICAL and 3 POOR components
   in this codebase, with no supporting evidence attached.

This document records the exact-SHA verification of both reports against the **canonical**
repository, with actual command execution (the mirror audit was static-only).

## Repository Identity

| Field | Value |
|---|---|
| Repository | `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5` (canonical) |
| Branch | `claude/jest-mismatch-mirror-audit-k7tn6h` |
| Audited SHA | `fb63d80f6062d3d6b8ad6024929e4e8b875c0f44` |
| Audit date | 2026-07-18/19 |
| Toolchain used | Node v22.22.2 (`.nvmrc` = 22), npm 11.18.0 (via `npx npm@11`, matching CI's npm@11 install) |

## Claims Check 1 — Mirror-Audit Findings vs Canonical State

| # | Mirror finding (at mirror SHA `7473e76`) | Canonical state (at `fb63d80`) | Verdict |
|---|---|---|---|
| 1 | Jest 29 runtime (`jest`/`babel-jest` 29.7.0, not direct deps) coexisting with `@types/jest@30.0.0`, `expect@30.4.1`, `pretty-format@30.4.1` | `jest ^29.7.0`, `babel-jest ^29.7.0`, `@types/jest 29.5.14` are **direct devDependencies** (`package.json`); `expect` resolves **29.7.0**. The mirror audit's prescribed remediation is already in place here. | **Already fixed** |
| 2 | Residual 30.x formatter exposure to Jest 29 tests | Top-level `pretty-format@30.4.1` + `jest-diff@30.4.1` + `jest-matcher-utils@30.4.1` are required by `@testing-library/react-native@14.0.1` (`^30.4.1` ranges). All Jest 29 packages resolve their own nested `pretty-format@29.7.0` / `jest-matcher-utils@29.7.0`. Runtime-verified benign: full Jest suite passes (see Execution Evidence). | **Benign by design** |
| 3 | Stale `react-hooks/set-state-in-effect` suppressions in `app/voice-chat.tsx` and `app/story.tsx` | `app/voice-chat.tsx` contains **zero** eslint-disable comments. `app/story.tsx` has exactly one suppression (`react-hooks/exhaustive-deps`, line 253, intentional mount-only effect). No `set-state-in-effect` suppression exists anywhere in the repo — the rule itself is absent (`eslint-plugin-react-hooks@5.2.0`; the rule ships in the v6 line). Strict lint (`--max-warnings=0`) passes with 0 warnings. | **Not present** |
| 4 | Suspected invalid job-level `if: ${{ secrets.VERCEL_DEPLOY_HOOK }}` | Not present. `.github/workflows/vercel-deploy.yml` maps `secrets.VERCEL_DEPLOY_HOOK_URL` into env, presence-checks it in a `check-hook` step, and gates later steps on the step output. | **Not present** |
| 5 | `publish.yml` ungated (`npm publish` on release creation with no quality gates) | **Confirmed here too** — prior to this PR, `publish.yml` ran checkout → setup-node → `npm ci` → `npm publish` with no lint/test/typecheck/build gating. **Fixed in this PR.** | **Confirmed → fixed** |
| 6 | Lockfile root manifest matches package.json; lockfileVersion 3 | Same here: lockfileVersion 3; `npm install --package-lock-only --ignore-scripts` (npm 11) produces **zero diff**. | **Confirmed clean** |
| 7 | `undici` override `^6.27.0` present | Override present in `package.json`, but **no package in the current tree resolves `undici` at all** (only `undici-types@8.3.0`, a transitive `@types/*` dep). The override is currently inert. No change made (harmless; may re-apply if a future dep pulls undici). | **Inert** |

### Version-table discrepancies (mirror audit / stale docs vs actual)

The mirror audit's dependency table — and parts of `CLAUDE.md` / `.claude/CLAUDE.md` — do not
match this repo's resolved tree. Actual resolutions at the audited SHA (from `npm ls`):

| Package | Mirror audit said | Canonical actual |
|---|---|---|
| typescript | `~6.0.3` → 6.0.3 | `~5.9.2` → **5.9.3** |
| react-native | 0.86.0 | **0.83.6** |
| expo | 55.0.27 | **55.0.28** |
| @types/jest | ^30.0.0 → 30.0.0 | **29.5.14** (pinned) |
| expect | 30.4.1 | **29.7.0** |
| jest-expo | 56.0.5 | **55.0.20** |
| @sentry/cli | 3.6.0 | **2.58.4** |
| eslint-config-expo | (n/a) | **55.0.1** (CLAUDE.md says ~57 — stale) |

> **Doc-maintenance note:** `CLAUDE.md` (RN 0.86, eslint 10.6 + eslint-config-expo ~57) and
> `.claude/CLAUDE.md` are stale on these versions relative to this branch. Not corrected in
> this PR to keep scope minimal; flagged for the next doc-reconciliation pass.

## Claims Check 2 — Ecosystem Diagnostic Map (2026-07-17)

All five claimed statuses were verified against code. **None are substantiated.**

| # | Component | Claimed | Verdict | Evidence |
|---|---|---|---|---|
| 1 | `/api/health` endpoint | CRITICAL | **Not substantiated** | `server/routes/health.ts:40-61` is fully synchronous, never awaits network calls (`getLiveStatus` in `server/health-checks.ts:28-51` returns cached state; background probe has `.catch().finally()`), always returns 200 `status:"ok"`, is not auth-gated (`server/routes.ts:27-31`), and routes correctly on Vercel (`vercel.json` rewrite → `api/server.mjs` → `server_dist`). |
| 2 | `release-proof.yml` workflow | CRITICAL | **Not substantiated** | Valid YAML; coherent job graph (`validate-candidate` → parallel evidence jobs → `evidence-manifest` → `report-results`); every referenced script exists (`scripts/npm-ci-retry.sh`, all npm scripts at `package.json:20-34`); secrets are presence-checked (`test -n`) before use. Heavy jobs intentionally gate on a `[run-release-proof]` commit-message marker. |
| 3 | `app/settings.tsx` | POOR | **Not substantiated** | All imports resolve; every handler wired; delete-all-data orders cloud purge before local wipe (`app/settings.tsx:180-183`) with partial-failure handling; no TODO/FIXME markers. |
| 4 | AsyncStorage (`lib/storage.ts`) | POOR | **Not substantiated** | Every read path wraps `JSON.parse` in try/catch with sane defaults; keys are distinct `@infinity_heroes_*` constants; `@react-native-async-storage/async-storage@2.2.0` consistent between manifest and lockfile. Minor note only: whole-blob read-modify-write mutators (e.g. `saveStory`, `toggleFavorite`) are last-write-wins under concurrent writes — inherent to the pattern, not a failure in this single-user app. |
| 5 | Vercel deploy configuration | POOR | **Not substantiated** | `vercel.json` install/build commands reference existing scripts; `includeFiles` covers `server_dist`, `static-build`, `assets`, `server/templates` (needed by `/privacy`); rewrite target matches the single function entry `api/server.mjs`; `DEPLOY.md` accurately documents the current setup. |

**One item flagged for one-time human confirmation** (repo-wide, not specific to any flagged
component): all 12 workflows uniformly pin `actions/checkout@v7`, `actions/setup-node@v6`,
`actions/upload-artifact@v7`, `actions/github-script@v7`. These resolve or fail uniformly across
the fleet; a single green CI run (including this PR's) demonstrates they resolve.

## Execution Evidence (at SHA `fb63d80`)

| Command | Result |
|---|---|
| `node --version` / `npm --version` | v22.22.2 / 11.18.0 (via `npx npm@11`; matches CI toolchain) |
| `npm ci` | ✅ exit 0 (fresh install, no prior `node_modules`) |
| `npm ls jest babel-jest jest-expo @types/jest expect pretty-format expo react-native typescript undici` | ✅ exit 0 — no invalid/missing peers; resolutions in tables above |
| `npm install --package-lock-only --ignore-scripts` + `git diff --exit-code -- package-lock.json` | ✅ zero drift |
| `npm run lint -- --max-warnings=0` | ✅ exit 0 — **0 errors, 0 warnings** (flag forwards through `expo lint`) |
| `npm test` (Vitest) | ✅ exit 0 — 74 files, **1295/1295 tests pass** |
| `npm run test:components` (Jest 29) | ✅ exit 0 — 7 suites, **42/42 tests pass** |
| `npm run typecheck` (`tsc --noEmit`) | ✅ exit 0 |
| `npm run preflight` | ⚠️ exit 1 without `CI` set (missing AI provider key in the audit sandbox is a hard failure in deploy context); ✅ **exit 0 with `CI=true`** — `scripts/preflight.js:139-143` intentionally downgrades absent env keys to a warning in CI. All code-level checks (Node version, lockfile format, patches) pass either way. |
| `npm run server:build` | ✅ exit 0 — `server_dist/index.js` 97.1 KB |

`npm audit fix --force` was not run; no dependency versions were changed.

## Changes Made in This PR

1. **`.github/workflows/publish.yml`** — quality gates added before `npm publish`
   (previously it published on release creation with no checks): node from `.nvmrc`,
   `npm@11`, `scripts/npm-ci-retry.sh`, then preflight → lint → vitest → jest component
   tests → typecheck → server build → publish. (GitHub Actions sets `CI=true`, under which
   preflight treats absent provider keys as warnings — see Execution Evidence.)
2. **`.github/workflows/ci.yml`** — added `npm run test:components` to the `lint-and-test`
   job. The Jest component suite — the exact surface of the audited 29/30 mismatch — was
   previously not executed by any CI workflow (`ci.yml` ran only Vitest; `release-proof.yml`'s
   gate block also omitted it).
3. **`docs/CHANGELOG.md`** — correction note on the entry claiming
   `react-hooks/{set-state-in-effect,purity,refs,immutability}` are set to `warn` in
   `eslint.config.js`. The actual config sets no react-hooks rules, and the installed
   `eslint-plugin-react-hooks@5.2.0` predates those rules.
4. **This document.**

No `package.json` / `package-lock.json` changes: the Jest 29 alignment the mirror audit
prescribed already exists here, and every verification command confirms it works.

## Out of Scope (recorded as recommendations)

- **Mirror repository actions** — archiving `Krosebrook/…-v5-main` on GitHub and disabling its
  deploy/publish triggers must happen in that repository (outside this session's access).
  Until then its written mirror policy and executable workflows remain contradictory.
- **Exact-SHA deploy evidence in `vercel-deploy.yml`** — the deploy hook + fixed 60 s sleep +
  single HTTP-200 health check cannot prove *which* commit Vercel deployed. Capturing the
  Vercel deployment ID/SHA and polling deployment state is future hardening
  (`release-proof.yml` already covers part of this for release candidates).
- **Doc reconciliation** — refresh the stale version tables in `CLAUDE.md` /
  `.claude/CLAUDE.md` (see discrepancy table above).
- **AsyncStorage write serialization** — optional: serialize whole-blob mutators through a
  simple in-process queue if concurrent-write loss is ever observed in practice.
