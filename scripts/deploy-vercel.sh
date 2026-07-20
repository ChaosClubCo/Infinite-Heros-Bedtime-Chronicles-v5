#!/usr/bin/env bash
# Manual production deployments are intentionally disabled.
#
# Production must be deployed from the canonical GitHub repository's `main`
# branch through `.github/workflows/vercel-deploy.yml` and the configured Vercel
# deploy hook. That path provides immutable repository, branch, and commit
# metadata. A `vercel --prod` upload can include uncommitted files and cannot
# prove that the deployed artifact matches a reviewed Git commit.
set -euo pipefail

cat >&2 <<'EOF'
error: manual Vercel production deployment is disabled.

Use the controlled deployment path:
  1. Merge reviewed changes into canonical `main`.
  2. Let `.github/workflows/vercel-deploy.yml` invoke the configured deploy hook.
  3. Require `/api/health` to report the exact full SHA, canonical repository,
     and `main` release ref before accepting the deployment.

Do not run `vercel --prod` for this project.
EOF

exit 1
