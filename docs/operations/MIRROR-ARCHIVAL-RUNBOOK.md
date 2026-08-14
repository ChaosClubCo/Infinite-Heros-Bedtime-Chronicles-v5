# Mirror Archival & Decommissioning Runbook

**Last Updated:** 2026-08-14  
**Target Repository:** `Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main`  
**Canonical Repository:** `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`  
**Status:** Ready for Execution  

This runbook defines the authoritative operational procedure to archive, neutralize, and decommission the legacy mirror repository to prevent split-brain pushes, duplicate CI/CD runs, and unauthenticated production deployments.

---

## 1. Context & Risk Analysis

The secondary repository (`Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main`) was historically used as an external fork/mirror.

### Identified Risks of an Active Unarchived Mirror
1. **Split-Brain Commits**: Contributors or automated tooling may push fixes or branches to the mirror, resulting in untracked divergent history.
2. **Duplicate/Conflicting CI Workflows**: Actions workflows running concurrently across both repositories waste build minutes and may produce duplicate notifications or artifacts.
3. **Secret Exposure & Dangling Tokens**: Secrets (e.g. EAS tokens, Vercel hooks) stored in mirror repository settings can drift out of compliance or leak credentials.
4. **Release Provenance Bypass**: Release provenance validation (`scripts/verify-release-provenance.mjs`) strictly requires `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`. Deployments originating from any other repository are rejected.

---

## 2. Pre-Archival Parity Verification Checklist

Before archiving, verify that all branches, tags, and commit objects are present in the canonical repository:

```bash
# 1. Fetch all refs from both remotes
git remote add canonical https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5.git || true
git remote add mirror https://github.com/Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main.git || true
git fetch --all --tags --prune

# 2. Compare main branch heads
CANONICAL_SHA=$(git rev-parse canonical/main)
MIRROR_SHA=$(git rev-parse mirror/main)

echo "Canonical main SHA: $CANONICAL_SHA"
echo "Mirror main SHA:    $MIRROR_SHA"

# 3. Verify no unmerged branches exist only on mirror
git log canonical/main..mirror/main --oneline
```

- [ ] All unique feature branches on the mirror have been merged or preserved in `archive/` refs in the canonical repository.
- [ ] All release tags exist on canonical.
- [ ] No open Pull Requests or Issues on the mirror require manual triage or migration.

---

## 3. Decommissioning Procedure

### Phase 1: Disable Automated Workflows & Triggers
1. Navigate to **`https://github.com/Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main/actions`**.
2. Click **Workflow settings** (or the ellipsis `...` next to each active workflow) and select **Disable workflow** for all workflows (`ci.yml`, `eas-build.yml`, `vercel-deploy.yml`, `auto-merge.yml`, `deployment-drift.yml`).
3. Under **Settings → Actions → General**, select **Disable Actions** to permanently stop workflow execution.

### Phase 2: Purge Webhooks & Service Integrations
1. Navigate to **Settings → Webhooks**.
2. Locate any webhooks pointing to Vercel deploy hooks or external endpoints (e.g., webhook `645778760`).
3. Click **Delete** on each webhook to eliminate outbound event traffic.
4. Under **Settings → Integrations → GitHub Apps**, remove any deploy or CI apps installed specifically on the mirror.

### Phase 3: Revoke Secrets & Deploy Keys
1. Navigate to **Settings → Secrets and variables → Actions**.
2. Delete all repository secrets:
   - `VERCEL_DEPLOY_HOOK_URL`
   - `EXPO_TOKEN`
   - `EAS_PROJECT_ID`
   - Any provider API keys (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.)
3. Under **Settings → Deploy keys**, delete all read/write deploy keys.

### Phase 4: Archive Repository (Read-Only)
1. Navigate to **Settings → General → Danger Zone**.
2. Click **Archive this repository**.
3. Read the confirmation dialog: archiving makes the repository read-only for all users, closes all open issues/PRs, and disables GitHub Discussions and Actions.
4. Enter the repository name to confirm and click **I understand the consequences, archive this repository**.

---

## 4. Post-Archival Verification

Run the following validation steps from your local environment:

1. **Push Test (Fail-Closed)**:
   ```bash
   git push mirror main
   # Expected output: remote: ERROR: Repository was archived so it is read-only.
   ```

2. **Metadata Verification**:
   Query GitHub API (or inspect UI) to confirm `archived: true`:
   ```bash
   curl -s https://api.github.com/repos/Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main | grep '"archived"'
   # Expected output: "archived": true
   ```

3. **Remote Configuration Cleanup**:
   Update local developer remotes to point exclusively to the canonical repository:
   ```bash
   git remote set-url origin https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5.git
   git remote remove mirror || true
   ```

---

## 5. Rollback / Unarchive Procedure

In the exceptional event that an unmerged commit must be recovered from the mirror:
1. Navigate to **Settings → General → Danger Zone**.
2. Click **Unarchive this repository**.
3. Create a patch or cherry-pick the required commits into the canonical repository.
4. Immediately re-archive the repository following Phase 4 above.
