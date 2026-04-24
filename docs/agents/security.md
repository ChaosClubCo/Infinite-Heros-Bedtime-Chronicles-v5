# Security Agent

## What it does
- Runs `agents/security/index.js` to execute dependency audit checks (`npm audit --omit=dev --audit-level=high`) and scan for common hardcoded secret patterns.
- Runs CodeQL analysis for JavaScript/TypeScript in a separate isolated job.
- Uploads `agents/security/security-report.json` as a workflow artifact for auditability.

## When it runs
- Pull requests targeting `main` or `develop`
- Pushes to `main` or `develop`
- Weekly on Monday at 05:00 UTC
- Manual `workflow_dispatch`

## How to disable or override
- Disable workflow in GitHub Actions UI or remove `.github/workflows/agent-security.yml`.
- Tune agent behavior in `agents/security/.agentrc.json`:
  - `auditLevel`
  - `ignoreDirectories`
  - `secretPatterns`

## How to debug failures
1. Open the failed **Agent - Security** run.
2. Download `security-agent-report` artifact.
3. Inspect:
   - `audit.passed` and vulnerability counts
   - `secretScan.findings`
4. Re-run locally:
   ```bash
   npm ci
   node agents/security/index.js --output agents/security/security-report.json
   ```
