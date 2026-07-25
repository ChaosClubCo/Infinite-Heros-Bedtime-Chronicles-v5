#!/usr/bin/env bash
set -euo pipefail

node scripts/verify-release-provenance.mjs --phase vercel-build
npm audit --audit-level=high --json
npm run server:build
npx expo export --platform web --output-dir static-build
node scripts/verify-vercel-runtime-assets.mjs --require-build-artifacts
