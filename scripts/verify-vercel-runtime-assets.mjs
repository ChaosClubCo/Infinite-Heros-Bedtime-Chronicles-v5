#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERCEL_FUNCTION_ENTRY = 'api/server.mjs';
export const VERCEL_BUILD_COMMAND = 'bash scripts/vercel-build.sh';
export const VERCEL_BUILD_SCRIPT = 'scripts/vercel-build.sh';
export const REQUIRED_INCLUDE_FILES =
  '{server_dist/**,static-build/**,assets/**,server/templates/**,app.json}';
export const REQUIRED_BUILD_SCRIPT_COMMANDS = [
  'node scripts/verify-release-provenance.mjs --phase vercel-build',
  'node scripts/audit-gate.mjs',
  'npm run server:build',
  'npx expo export --platform web --output-dir static-build',
  'node scripts/verify-vercel-runtime-assets.mjs --require-build-artifacts',
];
export const REQUIRED_BUILD_ARTIFACTS = [
  'server_dist/index.js',
  'static-build/index.html',
  'server/templates/landing-page.html',
  'app.json',
  'assets',
];

export function validateVercelConfig(config) {
  const errors = [];
  const functionConfig = config?.functions?.[VERCEL_FUNCTION_ENTRY];

  if (!functionConfig) {
    errors.push(`Missing functions.${VERCEL_FUNCTION_ENTRY} configuration`);
  } else if (functionConfig.includeFiles !== REQUIRED_INCLUDE_FILES) {
    errors.push(
      `functions.${VERCEL_FUNCTION_ENTRY}.includeFiles must be ${JSON.stringify(REQUIRED_INCLUDE_FILES)}; ` +
        `received ${JSON.stringify(functionConfig.includeFiles)}`,
    );
  }

  if (config?.buildCommand !== VERCEL_BUILD_COMMAND) {
    errors.push(
      `buildCommand must be ${JSON.stringify(VERCEL_BUILD_COMMAND)}; received ${JSON.stringify(config?.buildCommand)}`,
    );
  }

  const catchAllRewrite = config?.rewrites?.find(
    (rewrite) => rewrite?.source === '/(.*)' && rewrite?.destination === '/api/server',
  );
  if (!catchAllRewrite) {
    errors.push('Missing catch-all rewrite to /api/server');
  }

  return errors;
}

export function validateVercelBuildScript(scriptContent) {
  const errors = [];
  if (!scriptContent.includes('set -euo pipefail')) {
    errors.push(`${VERCEL_BUILD_SCRIPT} must fail closed with set -euo pipefail`);
  }

  for (const command of REQUIRED_BUILD_SCRIPT_COMMANDS) {
    if (!scriptContent.includes(command)) {
      errors.push(`${VERCEL_BUILD_SCRIPT} is missing required command: ${command}`);
    }
  }

  return errors;
}

export function findMissingBuildArtifacts(rootDirectory) {
  return REQUIRED_BUILD_ARTIFACTS.filter(
    (relativePath) => !existsSync(resolve(rootDirectory, relativePath)),
  );
}

export function verifyVercelRuntimeAssets({
  rootDirectory = process.cwd(),
  requireBuildArtifacts = false,
} = {}) {
  const configPath = resolve(rootDirectory, 'vercel.json');
  if (!existsSync(configPath)) {
    return ['vercel.json is missing'];
  }

  let config;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    return [`vercel.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`];
  }

  const errors = validateVercelConfig(config);
  const buildScriptPath = resolve(rootDirectory, VERCEL_BUILD_SCRIPT);
  if (!existsSync(buildScriptPath)) {
    errors.push(`${VERCEL_BUILD_SCRIPT} is missing`);
  } else {
    errors.push(...validateVercelBuildScript(readFileSync(buildScriptPath, 'utf8')));
  }

  if (requireBuildArtifacts) {
    for (const missingPath of findMissingBuildArtifacts(rootDirectory)) {
      errors.push(`Required Vercel runtime artifact is missing: ${missingPath}`);
    }
  }

  return errors;
}

function main() {
  const requireBuildArtifacts = process.argv.includes('--require-build-artifacts');
  const errors = verifyVercelRuntimeAssets({ requireBuildArtifacts });

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[vercel-runtime-assets] ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `[vercel-runtime-assets] verified Vercel bundle configuration${
      requireBuildArtifacts ? ' and generated runtime artifacts' : ''
    }`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main();
}
