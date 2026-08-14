#!/usr/bin/env node
/**
 * Expo SDK 55 → 57 Upgrade Readiness Verification Engine
 *
 * Programmatically validates that all prerequisite conditions, architecture configurations,
 * dependency matrices, and migration specifications are met prior to executing the SDK 57 upgrade.
 *
 * Usage:
 *   node scripts/verify-expo57-readiness.mjs [--json] [--verbose]
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

export const REQUIRED_SPEC_SECTIONS = [
  'Platform & Dependency Compatibility Matrix',
  'Breaking Changes & Deprecation Analysis',
  'Phased 5-Step Execution Runbook',
  'Rollback & Contingency Strategy',
];

export const REQUIRED_MODERN_MODULES = [
  'expo-audio',
  'expo-image',
  'expo-router',
  'react-native-reanimated',
  'react-native-safe-area-context',
  'react-native-screens',
];

/**
 * Validates Node engine and serverless runtime alignment.
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function verifyEngineReadiness() {
  const failures = [];
  const warnings = [];

  const pkgPath = resolve(REPO_ROOT, 'package.json');
  if (!existsSync(pkgPath)) {
    failures.push('package.json missing');
    return { ok: false, failures, warnings };
  }

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    failures.push(`Failed to parse package.json: ${err.message}`);
    return { ok: false, failures, warnings };
  }

  const nodeEngine = pkg.engines?.node;
  if (!nodeEngine || (!nodeEngine.includes('22') && !nodeEngine.includes('20'))) {
    failures.push(`package.json engines.node must support Node 22; received "${nodeEngine}"`);
  }

  const vercelPath = resolve(REPO_ROOT, 'vercel.json');
  if (existsSync(vercelPath)) {
    try {
      const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'));
      const apiFunction = vercel.functions?.['api/server.mjs'];
      if (apiFunction?.runtime !== 'nodejs22.x') {
        failures.push(`vercel.json api/server.mjs runtime must be "nodejs22.x"; received "${apiFunction?.runtime}"`);
      }
    } catch (err) {
      failures.push(`Failed to parse vercel.json: ${err.message}`);
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates app and build configuration integrity.
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function verifyConfigReadiness() {
  const failures = [];
  const warnings = [];

  const appJsonPath = resolve(REPO_ROOT, 'app.json');
  if (!existsSync(appJsonPath)) {
    failures.push('app.json missing');
  } else {
    try {
      const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));
      if (!appJson.expo?.name || !appJson.expo?.slug) {
        failures.push('app.json missing required expo name/slug');
      }
      if (appJson.expo?.android?.package !== 'com.infinityheroes.bedtime') {
        failures.push('app.json expo.android.package mismatch');
      }
    } catch (err) {
      failures.push(`Failed to parse app.json: ${err.message}`);
    }
  }

  const easJsonPath = resolve(REPO_ROOT, 'eas.json');
  if (!existsSync(easJsonPath)) {
    failures.push('eas.json missing');
  } else {
    try {
      const easJson = JSON.parse(readFileSync(easJsonPath, 'utf8'));
      if (!easJson.build?.preview || !easJson.build?.production) {
        failures.push('eas.json missing preview or production build profiles');
      }
    } catch (err) {
      failures.push(`Failed to parse eas.json: ${err.message}`);
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates module dependencies and dependabot ignore rules.
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function verifyModuleReadiness() {
  const failures = [];
  const warnings = [];

  const pkgPath = resolve(REPO_ROOT, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const mod of REQUIRED_MODERN_MODULES) {
      if (!allDeps[mod]) {
        failures.push(`Required modern native module "${mod}" is not present in package.json`);
      }
    }
  }

  const dependabotPath = resolve(REPO_ROOT, '.github/dependabot.yml');
  if (!existsSync(dependabotPath)) {
    failures.push('.github/dependabot.yml missing');
  } else {
    const dependabotContent = readFileSync(dependabotPath, 'utf8');
    if (!dependabotContent.includes('dependency-name: "expo"') || !dependabotContent.includes('dependency-name: "expo-*"')) {
      failures.push('.github/dependabot.yml must ignore semver-major updates for expo/expo-* to prevent uncoordinated drift');
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates that the upgrade specification document exists and contains required sections.
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function verifySpecReadiness() {
  const failures = [];
  const warnings = [];

  const specPath = resolve(REPO_ROOT, 'docs/operations/EXPO-57-UPGRADE-SPEC.md');
  if (!existsSync(specPath)) {
    failures.push('docs/operations/EXPO-57-UPGRADE-SPEC.md missing');
  } else {
    const content = readFileSync(specPath, 'utf8');
    for (const section of REQUIRED_SPEC_SECTIONS) {
      if (!content.includes(section)) {
        failures.push(`Upgrade specification missing required section: "${section}"`);
      }
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Executes full Expo SDK 57 Upgrade Readiness Verification Suite.
 * @returns {{ ok: boolean, engine: ReturnType<typeof verifyEngineReadiness>, config: ReturnType<typeof verifyConfigReadiness>, modules: ReturnType<typeof verifyModuleReadiness>, spec: ReturnType<typeof verifySpecReadiness>, summary: { passed: number, failed: number } }}
 */
export function runExpo57ReadinessVerification() {
  const engine = verifyEngineReadiness();
  const config = verifyConfigReadiness();
  const modules = verifyModuleReadiness();
  const spec = verifySpecReadiness();

  const allResults = [engine, config, modules, spec];
  const passed = allResults.filter((r) => r.ok).length;
  const failed = allResults.filter((r) => !r.ok).length;

  return {
    ok: failed === 0,
    engine,
    config,
    modules,
    spec,
    summary: { passed, failed },
  };
}

// Direct CLI execution runner
if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  const isJson = process.argv.includes('--json');
  const isVerbose = process.argv.includes('--verbose');
  const result = runExpo57ReadinessVerification();

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  console.log('=== Expo SDK 55 → 57 Upgrade Readiness Engine ===\n');

  console.log(`[1] Engine & Runtime Alignment:       ${result.engine.ok ? 'PASS' : 'FAIL'}`);
  if (!result.engine.ok || isVerbose) {
    result.engine.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.engine.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[2] App & Build Configuration:        ${result.config.ok ? 'PASS' : 'FAIL'}`);
  if (!result.config.ok || isVerbose) {
    result.config.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.config.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[3] Native Modules & Ignore Rules:    ${result.modules.ok ? 'PASS' : 'FAIL'}`);
  if (!result.modules.ok || isVerbose) {
    result.modules.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.modules.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[4] Upgrade Specification Completeness: ${result.spec.ok ? 'PASS' : 'FAIL'}`);
  if (!result.spec.ok || isVerbose) {
    result.spec.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.spec.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`\nResult: ${result.summary.passed}/4 readiness gates passed.`);
  process.exit(result.ok ? 0 : 1);
}
