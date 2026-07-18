#!/usr/bin/env bash
# Manual production deploy to Vercel with explicit release-SHA wiring.
#
# vercel.json cannot interpolate shell variables (Vercel treats "$VAR" in JSON
# as a literal string), and VERCEL_GIT_COMMIT_SHA is only auto-injected when
# the Vercel project's Git connection is healthy. This script passes the SHA
# explicitly as a Vercel CLI argument so /api/health's `releaseSha`
# (server/routes/health.ts, precedence APP_RELEASE_SHA first) is deterministic
# for the vercel-deploy.yml / release-proof.yml verification gates.
#
# Usage: npm run deploy:vercel   (requires `vercel login` once beforehand)
set -euo pipefail

if ! command -v vercel >/dev/null 2>&1; then
  echo "error: vercel CLI not found. Install with: npm i -g vercel" >&2
  exit 1
fi

if ! release_sha="$(git rev-parse HEAD 2>/dev/null)"; then
  echo "error: not inside a git repository (cannot resolve release SHA)" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "warning: working tree is dirty — deploying HEAD SHA ${release_sha}, but the upload will include uncommitted changes." >&2
fi

echo "Deploying to production with APP_RELEASE_SHA=${release_sha}"
exec vercel --prod --env APP_RELEASE_SHA="${release_sha}" "$@"
