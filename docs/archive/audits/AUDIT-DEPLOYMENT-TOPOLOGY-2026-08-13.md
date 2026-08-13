# Audit — Deployment Topology & Release Control

**Date:** 2026-08-13
**Scope:** Vercel deployment topology, the `Vercel Deploy Hook` release gate, GitHub webhook `645778760`, and the control system around production deploys.
**Trigger:** A GitHub webhook reported returning `403` on `POST /api/github/webhook`.
**Outcome:** The 403 was a five-week-old artifact against a URL that no longer existed. The real finding was that production had no enforced deploy path and no working release gate.

---

## 1. Current state

| | |
|---|---|
| `main` | `3561cab` |
| Production `releaseSha` | `3561cab` — **in sync** |
| Working deploy path | Vercel **native Git integration** |
| `Vercel Deploy Hook` workflow | Parses and runs, but **skips** — reports green while deploying nothing (PR #421 fixes) |
| `VERCEL_DEPLOY_HOOK_URL` | **Not visible to Actions** |
| Webhook `645778760` | Deactivated |
| `CI Pipeline` on `main` | **Red** — `Expo Compatibility and Web Build` |
| Branch protection on `main` | **None** |

### Merged during this session

| PR | Commit | What it did |
|---|---|---|
| #415 | `66d67ae` | Intended to skip the deploy job when the secret is unset. **Merged the broken commit** — job-level `if: ${{ secrets… }}`, which is invalid and made the workflow fail at parse time. The corrected `check-secret` version stayed unmerged on a second branch. |
| #417 | `5ab8158` | `deployment-drift.yml` + `docs/runbooks/deployment-provenance.md` |
| #418 | `36b54fe` | ADR-0007, `cancel-in-progress: true`, Hobby rationale marked unverified. Its message claims it reverted `git.deploymentEnabled` — **it did not**. |
| #420 | `3561cab` | Removed `git.deploymentEnabled` (restoring deploys), replaced the invalid `if:` with a `check-secret` preflight. **That preflight introduced the silent-green gate.** |

**Open:** #421 — fail loudly on a missing secret instead of skipping.
**Closed:** #416 — superseded; merging it would have re-broken production.

---

## 2. What was actually wrong

Four independent defects, discovered in this order. Each was masked by the one before it.

**a. The 403 was not real.** Delivery `17c1c010-7b5b-11f1-919c-3358006d3edc` is a UUIDv1 whose embedded timestamp decodes to **2026-07-09T05:57:39.601Z** — 3.7 days before the Vercel project existed and 35 days before the deploy hook was first used. GitHub retains ~3 days of deliveries, so the ID came from a July code comment, not a live reading. The webhook's URL and event set had both changed since. Likely origin: Cloudflare, by elimination.

**b. Two Vercel projects were bound to one repo.** Every commit deployed twice, 1–77 ms apart. `infinity-heroes` (`prj_4UNZ…`) is redundant; `infinite-heros-bedtime-chronicles-v5-main` (`prj_n2VB…`) is canonical.

**c. Webhook `645778760` pointed at the Vercel deploy hook, subscribed to pushes on _all_ branches, while the hook is pinned to `main`.** Every `dependabot/*` and `copilot/*` push forced a production rebuild and promotion of `main`. Confirmed empirically: production rebuilds fired **+2.00 s** and **+2.81 s** after pushes to unrelated branches, plus one from a branch-*creation* event.

**d. The release gate has never worked.** `vercel-deploy.yml` failed 6/6 over three days at 10–14 s each — too fast to reach its own 900 s verification poll — then, after #415, failed at 0 s from a parse error, then, after #420, went *green while skipping*. It has never once posted the hook or verified a release.

---

## 3. Gaps

Direct assessment. These are process, not code.

### 3.1 PRs are merged without reading the diff

**#415 merged the wrong commit.** The branch had two: the broken one and the fix. The broken one landed. Nobody noticed until the workflow started failing in zero seconds. This is the highest-consequence gap in the repo, because every other control depends on someone having looked.

### 3.2 Commit messages assert things the diff does not do

**#418's message says it reverted `git.deploymentEnabled`. The file still contained it.** That single discrepancy took production down — combined with #415's parse error, `main` had *no* deploy trigger at all for roughly 20 minutes and nobody was alerted. Once commit messages can't be trusted, every audit has to re-read every file, which is exactly what made this investigation take as long as it did.

### 3.3 An ADR was accepted and violated in the same commit

ADR-0007 states: *"Until prerequisite 1 is satisfied, the native Git integration must remain enabled (no `git.deploymentEnabled.main = false` in `vercel.json`)."* The commit that added the ADR set that exact flag. The ADR even predicts the failure in its own "Failure modes introduced" section. Writing a decision and breaking it simultaneously means the ADR is a document, not a control.

### 3.4 Every control is advisory

- `main` is unprotected — no required checks
- `BRANCH-PROTECTION-SETUP.md` has said **"Status: Manual configuration required"** since 2026-07-09
- `auto-merge.yml`'s `gh pr merge --auto` does **not** wait for CI, because GitHub auto-merge only holds for *required* checks. With none configured, Dependabot PRs merge on open with zero gating.
- **That is how the two breaking bumps landed.** The red CI is a downstream symptom of the missing branch protection, not an independent problem.

### 3.5 The one executable control validates the wrong property

`verify-release-provenance.mjs` checks the *build* (`VERCEL_GIT_COMMIT_REF=main`, 40-char SHA, canonical repo). A native Git-integration build satisfies all three. It was built to stop CLI uploads — which it does — and is structurally blind to a second automatic trigger, which is what actually happened.

### 3.6 Agent velocity exceeds verification

Dependabot, Copilot, Claude, and a human all committed to `main` during this session. Roughly **ten spurious production deployments** were generated. No human read the diffs. The bottleneck is not authoring; it is verification, and nothing currently enforces it.

---

## 4. Unknown unknowns

Unaudited surface. Ranked by what could hurt most.

### 4.1 The deploy-hook URL should be rotated — **do this**

`https://api.vercel.com/v1/integrations/deploy/prj_n2VB…/giYTKZnkXY` is a **capability URL**: anyone holding it can trigger a production deploy, with no authentication. It has been sitting in plaintext in a GitHub webhook Payload URL field (visible to any repo admin) and has been pasted into at least one AI chat transcript. Regenerate it in Vercel, then store the new one only as an Actions secret.

### 4.2 At least one unidentified sender can deploy production

Pushes to `main` produced **three** deploy-hook fires; non-`main` pushes produced one. Deactivating webhook `645778760` removes one. **At least one more remains and has never been identified.** Org-level webhooks fire for every repo and never appear in repo settings; GitHub App webhooks are invisible from both. Enumerate all three:

```
/settings/hooks
/organizations/ChaosClubCo/settings/hooks
/settings/installations
```

Until that is done, there is an **unaudited write path into production**. Three lists, about five
minutes, and it is closed — the only reason it stayed invisible this long is that two of the three
places cannot be seen from repository settings, so a repo-level check looks complete when it isn't.

### 4.3 The provenance gate may be a no-op

`verify-release-provenance.mjs` reportedly detects CLI entry via `import.meta.url === new URL(\`file://${process.argv[1]}\`).href`, which can diverge on percent-encoded paths. If it does, the script loads, runs **no checks**, and exits 0 — read as a pass by `set -e`. **Unverified**, but this is the repo's primary release security control. Test it directly.

### 4.4 `eas-build.yml` has no `permissions:` block

The only workflow of thirteen without one, so its `GITHUB_TOKEN` inherits the repository default while handling `secrets.EXPO_TOKEN`. If the default is write-all, that is a real exposure. Check **Settings → Actions → Workflow permissions**.

### 4.5 Vercel plan tier is still unverified

The entire deploy-hook architecture exists to work around the Hobby commit-author check. Evidence says the check is not firing (`dpl_78oUZ…` — a `dependabot[bot]`-authored Git-triggered production build, state `READY`). If the team is on Pro, the hook indirection is vestigial and could be deleted. **This gates the architecture decision and remains open.**

### 4.6 `/api/github/webhook` is a no-op of unknown reachability

The handler verifies HMAC, logs, returns `202` — and the "processing async/out-of-band" its own comment promises does not exist. Whether *anything* still calls it is unresolved. Cheap test: one unsigned POST. `500` = secret unset, dead by construction. `401` = deliberately wired.

### 4.7 Launch-gate debt

`DEPLOY.md` declares release posture **NO GO** pending a device matrix, deletion proof, restore/rollback drills, privacy/legal review, and app-store disclosure. Meanwhile production auto-deployed on every Dependabot push. Pre-launch that is survivable. For a COPPA-regulated children's app at launch it is not. Related: cloud sync (M3) is built but **never device-verified**.

### 4.8 Nobody owns this

ADR-0007's `Deciders` field reads `<!-- HUMAN INPUT REQUIRED -->`. Solo repo, multiple AI contributors, no human reviewer in the loop. Every gap in §3 traces back to this.

---

## 5. Next actions

**Do first — cheap, high leverage**

1. **Rotate the deploy hook** (§4.1), then set the new value under **Settings → Secrets and variables → Actions → _Repository secrets_**. An Environment secret or a Variable is not visible to `secrets.*` — that is why the current one isn't reaching the workflow.
2. **Merge #421.** Until then the release gate is green and deploying nothing.
3. **Enumerate all three webhook surfaces** (§4.2).

**Then — unblocks everything else**

4. Fix CI: `npx expo install --fix` → `npm install` → verify `npm run expo:check` exits 0 → commit `package.json` and `package-lock.json` **together** or the next `npm ci` fails `EUSAGE`. Restores `@sentry/react-native ~7.11.0` and `react-native-gesture-handler ~2.30.0`.
5. **Enable branch protection.** This is the root fix — it converts every existing control from advisory to binding and stops auto-merge from landing ungated bumps.

   Three traps on the way in:
   - `BRANCH-PROTECTION-SETUP.md` says to enter YAML job IDs. **Wrong** — GitHub matches the check-run *name* (the job's `name:`). The three strings it lists are already correct; only the explanation is wrong.
   - Do **not** require `Lychee`. `markdown-link-check.yml` has `paths:` filters on both triggers, so on a PR touching no markdown it never reports. A never-reported required check blocks forever — worse than a skipped one.
   - `build-server` and `expo-compatibility-build` both `needs: lint-and-test`, so they are *skipped* when lint fails, and **skipped counts as passing**. Require all four together or a red CI satisfies the gate.

**Then — architecture**

6. Verify the Vercel plan tier (§4.5). If Pro, delete `vercel-deploy.yml`, the hook, and the indirection; native Git integration plus branch protection is simpler and has one trigger by construction.
7. Disconnect Git on `infinity-heroes` — **disconnect, not delete**.
8. Only after a green run that reaches the health poll: re-apply `git.deploymentEnabled.main = false`, per ADR-0007 prerequisite 1.

---

## 6. Techniques worth keeping

Recorded in `docs/runbooks/deployment-provenance.md`.

- **Trigger attribution.** Vercel stamps `deployHookId` only on hook fires and `repoPushedAt` only on Git-integration deploys. Both patterns on one project = duplicate triggers. This is what finally separated the two mechanisms.
- **Timing attribution.** A hook fire ~1–3 s after a push is a webhook; ~20–40 s is an Actions runner, which must provision and check out first. A fire following a *non-`main`* push cannot be `vercel-deploy.yml`.
- **UUIDv1 delivery IDs carry a timestamp.** Decoding one dated the phantom 403 to five weeks earlier and ended the investigation. Validate any decoder against GitHub's published example `72d3162e-cc78-11e3-81ab-4c9367dc0958` → 2014-04-25.
- **Run duration is a diagnostic.** A `Vercel Deploy Hook` run under 20 s deployed nothing — a healthy run takes minutes because it polls. A **0-second** run listed by *file path* instead of `name:` is a parse failure.
- **`get_project.domains` omits custom domains.** It returned only `*.vercel.app` aliases and never listed `www.bedtime-chronicles.com`. Not authoritative — check Settings → Domains.
- **A skipped job counts as passing.** The single most dangerous fact in this document.

---

## 7. Assessment

The engineering here is more sophisticated than most projects this size — circuit breakers, provenance gates, exact-SHA verification, ADRs, runbooks, a COPPA consent gate with two independent layers. The problem is not capability.

The problem is that essentially none of it is **enforced**. The repo has extensive documentation of intent and almost no mechanism. `DEPLOY.md` describes a deployment policy that was never true. `BRANCH-PROTECTION-SETUP.md` describes protection that was never enabled. ADR-0007 was violated by its own commit. A commit message claimed a revert that did not happen. Meanwhile four contributors — three of them AI — merged to `main` faster than anyone verified what landed.

The highest-leverage action is not on the deployment path at all. It is **branch protection**. It converts every existing control from advisory to binding in one step, and it is the direct cause of the currently-red CI. With no required checks, `auto-merge.yml`'s `gh pr merge --auto` does not wait for anything — GitHub auto-merge only holds a PR for checks configured as *required*. That is how two breaking Dependabot majors landed on `main` ungated, and why CI is red today. Every other item in this audit is downstream of that one unset setting.

Second: **read the diff before merging.** #415 is the proof — the branch held two commits, the broken one and the fix, and the broken one landed while the fix sat one branch over. No amount of tooling substitutes for it.

---

## 8. Errors made during this investigation

Recorded because each wrong turn identifies a source that should not be trusted at face value. These were the investigation's own mistakes, not the repo's.

| Wrong conclusion | Why it was wrong | What not to trust |
|---|---|---|
| "`…-v5-main` is a stale duplicate — disconnect it" | Inferred from the project *name*. It is the canonical project. | A project or branch name as evidence of its role |
| "So `infinity-heroes` is canonical" | Corrected one inference with another | Any single-signal canonicality claim |
| "Neither project has a custom domain" | `get_project.domains` returns only `*.vercel.app` aliases and silently omits custom domains | `get_project.domains`, `get_deployment.alias` |
| "The 403 comes from the app's Supabase auth gate" | No global auth gate exists; the handler has no 403 path at all | An incident description inherited from earlier analysis |
| "The webhook is failing, so it deploys nothing" | It was succeeding, and was the *dominant* production trigger | Assuming a reported error is still current |
| "PR #415 is closed, so it was abandoned" | It was closed *because it merged*; this tooling exposes no `merged` flag | `state: closed` without checking merge status |
| "Production lags because of queue latency" | `main` had no working deploy trigger at all | A plausible explanation that was never measured |
| "A preflight job that skips on a missing secret is a safe fix" | A skipped job counts as **passing** — it produced a green gate that deployed and verified nothing (run `31750113790`, 9 s) | Any gate whose failure mode is a skip |

### The unifying pattern

**Every wrong turn came from trusting a stated value. Every breakthrough came from a measurement.**

| The claim said | The measurement said |
|---|---|
| The name says duplicate | The `deployHookId` stamp says canonical |
| The API says no custom domain | An HTTP request says otherwise |
| The commit message says reverted | The file still contains the flag |
| The ADR says Git integration must stay enabled | `vercel.json` had it disabled |
| The workflow says success | Its 9-second duration says skipped |
| The code comment says 403 | The UUIDv1 timestamp says five weeks earlier |

That asymmetry is the most portable lesson here. **When a claim and a measurement disagree in this repo, the measurement has won every single time** — and the same failure mode produced both the repo's gaps (§3) and the investigation's errors (§8). Documentation drifts; artifacts do not.

It is also why `deployment-drift.yml` earns its place. It replaces the *claim* that production runs canonical `main` with a measurement of whether it does, every fifteen minutes, independent of which mechanism deployed it or why.
