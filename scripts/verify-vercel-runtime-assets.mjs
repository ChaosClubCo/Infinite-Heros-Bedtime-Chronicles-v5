#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERCEL_FUNCTION_ENTRY = 'api/server.mjs';
export const REQUIRED_INCLUDE_FILES =
  '{server_dist/**,static-build/**,assets/**,server/templates/**,app.json}';
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

  if (typeof config?.buildCommand !== 'string') {
    errors.push('buildCommand must be a string');
  } else {
    if (!config.buildCommand.includes('expo export --platform web --output-dir static-build')) {
      errors.push('buildCommand must export the Expo web app to static-build');
    }
    if (!config.buildCommand.includes('verify:vercel-runtime-assets')) {
      errors.push('buildCommand must verify runtime assets after generating them');
    }
  }

  const catchAllRewrite = config?.rewrites?.find(
    (rewrite) => rewrite?.source === '/(.*)' && rewrite?.destination === '/api/server',
  );
  if (!catchAllRewrite) {
    errors.push('Missing catch-all rewrite to /api/server');
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
      requireBuildArtifacts ? ' and generated runtime artifacts' : ''}`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main();
}
