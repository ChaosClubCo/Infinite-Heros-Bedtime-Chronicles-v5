#!/usr/bin/env bash
set -euo pipefail

node scripts/verify-release-provenance.mjs --phase vercel-build
node scripts/audit-gate.mjs
npm run server:build
npx expo export --platform web --output-dir static-build
node scripts/verify-vercel-runtime-assets.mjs --require-build-artifacts
