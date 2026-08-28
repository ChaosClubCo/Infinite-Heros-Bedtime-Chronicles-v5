# Public-v1 Expo Release Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a SHA-bound public-v1 release candidate using the existing Expo Android implementation, with deterministic CI/deployment evidence and no post-freeze feature work.

**Architecture:** Expo/EAS remains the canonical Android client with package `com.infinityheroes.bedtime`. The release branch preserves current `main` as history but restores the last beta-hardening tree, excluding the later standalone Compose project and other post-freeze features. Promotion remains fail-closed under `BetaAcceptancePolicy/v2` until BR-01 through BR-12 all have trusted exact-SHA PASS evidence.

**Tech Stack:** Expo SDK 55, React Native, TypeScript, Node 22.23.2, npm 11, Vitest, Jest/jest-expo, Express, EAS, Vercel, GitHub Actions.

**Spec:** `docs/BETA_READINESS_2026-08-22.md`, `docs/RELEASE_FREEZE_2026-08-24.md`, `docs/evidence/beta-acceptance-manifest.json`

## Global Constraints

- Public-v1 feature freeze remains active. No new user-facing features, provider integrations, experiments, schema expansion, or unrelated refactors.
- Canonical Android implementation for public-v1 is Expo/EAS using `com.infinityheroes.bedtime`.
- Mandatory BR-01 through BR-12 gates require PASS; FAIL, BLOCKED, and NOT_RUN block promotion.
- `promotionEnabled` remains false until trusted external/protected provenance is available.
- P0_OPEN and P1_OPEN must both equal 0 before promotion.
- Every verification result must bind to the exact candidate SHA it evaluates.

---

### Task 1: Restore the public-v1 Expo release tree

**Files:**
- Preserve from baseline: entire tree at `0d900464163647841a5af91cbaaf16105832885e`
- Exclude: root native Compose project introduced after the release freeze
- Create: `docs/superpowers/plans/2026-08-27-public-v1-release-repair.md`

**Interfaces:**
- Consumes: release-freeze policy and beta-hardening baseline.
- Produces: a release-only branch containing the approved Expo scope.

- [x] **Step 1: Confirm post-freeze drift exists**

Run: compare `0d900464163647841a5af91cbaaf16105832885e...main`.
Expected: Compose and other feature/tooling additions are present after the baseline.

- [x] **Step 2: Create an isolated release branch from current main**

Branch: `release/public-v1-expo-freeze-20260827`.

- [x] **Step 3: Restore the beta-hardening tree without rewriting history**

Create a commit whose parent is the then-current `main` SHA and whose tree is baseline tree `8e0990ee4e0635a6f508923de94cd2c06d88e8ec`.

- [x] **Step 4: Verify the Compose release project is absent**

Read `app/build.gradle.kts` on the release branch.
Expected: Not Found.

### Task 2: Repair deterministic npm installation

**Files:**
- Modify: `package-lock.json`
- Temporary create/remove: `.github/workflows/public-v1-lockfile-repair.yml`

**Interfaces:**
- Consumes: reviewed `package.json`, Node 22.23.2, npm 11.
- Produces: a synchronized npm lockfile usable by `npm ci`.

- [x] **Step 1: Reproduce RED from exact CI logs**

Expected failure: `npm ci` reports `Missing: @types/react-dom@19.2.5 from lock file`.

- [x] **Step 2: Validate the CI-generated candidate lockfile**

Expected: lockfileVersion 3, root `@types/react-dom` is `^19.2.5`, resolved package is `19.2.5`, JSON parses successfully.

- [ ] **Step 3: Regenerate lockfile in GitHub Actions under Node 22.23.2/npm 11**

Run in a temporary release-only workflow:

```bash
npm install --global npm@11
npm install --package-lock-only --ignore-scripts
npm ci
```

Expected: both lock generation and strict install exit 0.

- [ ] **Step 4: Commit only the generated lockfile and remove the temporary workflow**

Expected diff after cleanup: release tree plus synchronized `package-lock.json` and release-plan/evidence documentation only.

### Task 3: Execute the full static release gate

**Files:**
- Existing: `.github/workflows/ci.yml`
- Existing: `scripts/audit-gate.mjs`

**Interfaces:**
- Consumes: synchronized lockfile.
- Produces: BR-01/BR-02 supporting evidence for the exact candidate SHA.

- [ ] **Step 1: Run exact-head CI**

Required commands:

```bash
npm ci
npm run preflight
npm run lint -- --max-warnings=0
npm test
npm run test:components
node scripts/audit-gate.mjs
npm run typecheck
npm run server:build
npm run expo:check
npm run expo:build:ci
```

Expected: every command exits 0.

- [ ] **Step 2: Reject partial success**

Expected: if any required command is skipped or fails, BR-02 remains BLOCKED/FAIL.

### Task 4: Restore security/build/deployment gates

**Files:**
- Existing: `.github/workflows/agent-security.yml`
- Existing: `.github/workflows/eas-build.yml`
- Existing: `.github/workflows/vercel-deploy.yml`
- Existing: `.github/workflows/deployment-drift.yml`

**Interfaces:**
- Consumes: exact candidate SHA and repository/environment credentials.
- Produces: BR-03, BR-04, BR-05, BR-06 evidence where available.

- [ ] **Step 1: Run Agent Security against exact candidate**
Expected: PASS and exact SHA binding.

- [ ] **Step 2: Confirm CodeQL against exact candidate**
Expected: PASS and exact SHA binding.

- [ ] **Step 3: Confirm Markdown Link Check against exact candidate**
Expected: PASS and exact SHA binding.

- [ ] **Step 4: Build Expo Android through EAS**
Expected: authenticated EAS build completes and artifact identifies exact candidate.

- [ ] **Step 5: Run Vercel deployment and deployment-drift checks**
Expected: deployment health/provenance matches exact candidate; drift check exits 0.

### Task 5: Execute Android release acceptance

**Files:**
- Existing test/application surfaces only; no feature work.

**Interfaces:**
- Consumes: production-equivalent EAS Android artifact.
- Produces: BR-07 through BR-11 evidence.

- [ ] **Step 1: Install production-equivalent artifact on a physical Android target**
Expected: package `com.infinityheroes.bedtime` installs and launcher activity starts.

- [ ] **Step 2: Verify fresh-install consent and onboarding**
Expected: COPPA consent gate precedes onboarding and story creation.

- [ ] **Step 3: Verify primary story journeys**
Expected: Classic, Mad Libs, Sleep/narration and completion persistence operate without P0/P1 defects.

- [ ] **Step 4: Verify offline/reconnect exactly-once behavior**
Expected: queued interaction drains once after reconnect with no duplicate mutation.

- [ ] **Step 5: Verify account isolation and sign-out boundary**
Expected: account/profile data does not cross user boundaries and cloud behavior stops after sign-out.

- [ ] **Step 6: Verify Android accessibility critical path**
Expected: consent, story controls, and completion state are operable with screen reader and reduced-motion behavior is honored.

- [ ] **Step 7: Verify child-safety rendering boundary**
Expected: unsafe generated content does not reach child-facing rendering.

### Task 6: Rehearse rollback and generate release receipts

**Files:**
- Generate only through existing release evidence tooling under `.release-evidence/receipts/` at verification time.
- Existing policy: `docs/evidence/beta-acceptance-manifest.json`

**Interfaces:**
- Consumes: all exact-SHA workflow/device/deployment evidence.
- Produces: BR-01 through BR-12 receipt set and final promotion decision.

- [ ] **Step 1: Rehearse rollback against staging/internal release**
Expected: previous known-good server and Android version are identifiable and restoration succeeds.

- [ ] **Step 2: Generate SHA-bound receipts**
Expected: every mandatory BR-01 through BR-12 receipt contains the same candidate SHA, PASS status, execution timestamp, trusted provider, immutable URI/digest.

- [ ] **Step 3: Run release manifest generator/verifier**

```bash
npm run generate:beta-readiness
npm run verify:beta-readiness
```

Expected: verifier exits 0 without accepting candidate-generated evidence as trusted promotion proof.

- [ ] **Step 4: Evaluate the final promotion predicate**

```text
STATIC_AUTOMATION = PASS
SECURITY_PRIVACY = PASS
CRITICAL_JOURNEYS = PASS
DEPLOYMENT_PROVENANCE = PASS
ROLLBACK = PASS
P0_OPEN = 0
P1_OPEN = 0
```

Expected: promote only if every line is true and trusted provenance permits promotion; otherwise remain BLOCKED.
