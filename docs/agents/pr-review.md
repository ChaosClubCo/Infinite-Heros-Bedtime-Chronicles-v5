# PR Review Agent

## What it does
- Runs `agents/pr-review/index.js` to summarize PR complexity and touched files.
- Flags high-risk file paths (`server/routes.ts`, `shared/schema.ts`, workflow files, dependency manifests, patches).
- Publishes a single updatable PR comment with marker `<!-- pr-review-agent -->`.
- Uploads JSON + markdown artifacts for auditing and debugging.

## When it runs
- Pull request events (`opened`, `synchronize`, `reopened`, `ready_for_review`) for `main`/`develop`
- Manual `workflow_dispatch`

## How to disable or override
- Disable workflow in GitHub Actions UI or remove `.github/workflows/agent-pr-review.yml`.
- Update `agents/pr-review/.agentrc.json` to adjust:
  - `highRiskPaths`
  - `largePrThreshold`
  - `commentMarker`

## How to debug failures
1. Open the failed **Agent - PR Review** run.
2. Download `pr-review-agent-report` artifact.
3. Verify selected base/head SHAs and generated risk classification.
4. Re-run locally:
   ```bash
   node agents/pr-review/index.js --base <base_sha> --head <head_sha>
   ```
