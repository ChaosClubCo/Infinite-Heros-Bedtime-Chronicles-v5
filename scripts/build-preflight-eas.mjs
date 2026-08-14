#!/usr/bin/env node
/**
 * EAS Mobile Build & Play Store Preflight Verification Engine
 *
 * Validates:
 *   1. app.json Configuration & Child Safety Permissions (zero microphone/camera, blocked RECORD_AUDIO)
 *   2. Required App Asset Icons & Splash Screens on disk
 *   3. eas.json Build Profiles (production AAB app-bundle, submit tracks)
 *   4. Client Secret Separation (no backend API secrets exposed via EXPO_PUBLIC_*)
 *
 * Usage:
 *   node scripts/build-preflight-eas.mjs [--json] [--verbose]
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

export const FORBIDDEN_CLIENT_PERMISSIONS = [
  'android.permission.RECORD_AUDIO',
  'android.permission.CAMERA',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.READ_CONTACTS',
];

export const FORBIDDEN_EXPO_PUBLIC_SECRET_PATTERNS = [
  /EXPO_PUBLIC_.*API_KEY/i,
  /EXPO_PUBLIC_.*SECRET/i,
  /EXPO_PUBLIC_.*TOKEN/i,
  /EXPO_PUBLIC_DATABASE_URL/i,
  /EXPO_PUBLIC_ANTHROPIC/i,
  /EXPO_PUBLIC_ELEVENLABS/i,
  /EXPO_PUBLIC_OPENAI/i,
  /EXPO_PUBLIC_GEMINI/i,
];

// Anon keys and public endpoints are permitted
export const ALLOWED_EXPO_PUBLIC_VARS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_SENTRY_DSN',
  'EXPO_PUBLIC_ENV',
];

/**
 * Validates app.json configuration, bundle IDs, and child permissions.
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function validateAppJson() {
  const failures = [];
  const warnings = [];

  const appJsonPath = resolve(REPO_ROOT, 'app.json');
  if (!existsSync(appJsonPath)) {
    failures.push('app.json does not exist');
    return { ok: false, failures, warnings };
  }

  let appJson;
  try {
    appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));
  } catch (err) {
    failures.push(`Failed to parse app.json: ${err.message}`);
    return { ok: false, failures, warnings };
  }

  const expo = appJson.expo;
  if (!expo) {
    failures.push('app.json missing root "expo" key');
    return { ok: false, failures, warnings };
  }

  if (!expo.name) failures.push('app.json missing expo.name');
  if (!expo.slug) failures.push('app.json missing expo.slug');
  if (!expo.version) failures.push('app.json missing expo.version');

  // Package identifiers
  if (expo.android?.package !== 'com.infinityheroes.bedtime') {
    failures.push(`app.json expo.android.package must be "com.infinityheroes.bedtime"; received "${expo.android?.package}"`);
  }
  if (expo.ios?.bundleIdentifier !== 'com.infinityheroes.bedtime') {
    failures.push(`app.json expo.ios.bundleIdentifier must be "com.infinityheroes.bedtime"; received "${expo.ios?.bundleIdentifier}"`);
  }

  // Child safety: ensure no microphone/camera permissions
  const declaredPermissions = expo.android?.permissions ?? [];
  for (const forbidden of FORBIDDEN_CLIENT_PERMISSIONS) {
    if (declaredPermissions.includes(forbidden)) {
      failures.push(`app.json declares forbidden child permission "${forbidden}"`);
    }
  }

  // Ensure RECORD_AUDIO is blocked explicitly
  const blocked = expo.android?.blockedPermissions ?? [];
  if (!blocked.includes('android.permission.RECORD_AUDIO')) {
    failures.push('app.json expo.android.blockedPermissions must include "android.permission.RECORD_AUDIO"');
  }

  // Verify asset files exist on disk
  const assetsToCheck = [
    expo.icon,
    expo.splash?.image,
    expo.android?.adaptiveIcon?.foregroundImage,
    expo.android?.adaptiveIcon?.backgroundImage,
    expo.web?.favicon,
  ].filter(Boolean);

  for (const assetRelPath of assetsToCheck) {
    const assetFullPath = resolve(REPO_ROOT, assetRelPath);
    if (!existsSync(assetFullPath)) {
      failures.push(`Referenced asset does not exist on disk: "${assetRelPath}"`);
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates eas.json build and submit configurations.
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function validateEasJson() {
  const failures = [];
  const warnings = [];

  const easJsonPath = resolve(REPO_ROOT, 'eas.json');
  if (!existsSync(easJsonPath)) {
    failures.push('eas.json does not exist');
    return { ok: false, failures, warnings };
  }

  let easJson;
  try {
    easJson = JSON.parse(readFileSync(easJsonPath, 'utf8'));
  } catch (err) {
    failures.push(`Failed to parse eas.json: ${err.message}`);
    return { ok: false, failures, warnings };
  }

  const build = easJson.build;
  if (!build?.development || !build?.preview || !build?.production) {
    failures.push('eas.json missing required build profiles: development, preview, production');
  }

  // Production Android MUST be app-bundle (AAB) for Google Play Store
  if (build?.production?.android?.buildType !== 'app-bundle') {
    failures.push(`eas.json production.android.buildType must be "app-bundle"; received "${build?.production?.android?.buildType}"`);
  }

  // Submit profile check
  if (!easJson.submit?.production?.android) {
    failures.push('eas.json missing submit.production.android submission profile');
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates environment variable separation (prevent secret leakage to client).
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function validateClientSecretsSeparation() {
  const failures = [];
  const warnings = [];

  const envExamplePath = resolve(REPO_ROOT, '.env.example');
  if (existsSync(envExamplePath)) {
    const lines = readFileSync(envExamplePath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const key = trimmed.split('=')[0]?.trim();
      if (key?.startsWith('EXPO_PUBLIC_')) {
        // Check if this is an allowed public variable
        if (!ALLOWED_EXPO_PUBLIC_VARS.includes(key)) {
          for (const pattern of FORBIDDEN_EXPO_PUBLIC_SECRET_PATTERNS) {
            if (pattern.test(key)) {
              failures.push(`Sensitive backend key inappropriately exposed with EXPO_PUBLIC_ prefix: "${key}"`);
            }
          }
        }
      }
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Runs full EAS Mobile Preflight Suite.
 * @returns {{ ok: boolean, appJson: ReturnType<typeof validateAppJson>, easJson: ReturnType<typeof validateEasJson>, secrets: ReturnType<typeof validateClientSecretsSeparation>, summary: { passed: number, failed: number } }}
 */
export function runEasPreflight() {
  const appJson = validateAppJson();
  const easJson = validateEasJson();
  const secrets = validateClientSecretsSeparation();

  const allResults = [appJson, easJson, secrets];
  const passed = allResults.filter((r) => r.ok).length;
  const failed = allResults.filter((r) => !r.ok).length;

  return {
    ok: failed === 0,
    appJson,
    easJson,
    secrets,
    summary: { passed, failed },
  };
}

// Direct CLI Runner
if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  const isJson = process.argv.includes('--json');
  const isVerbose = process.argv.includes('--verbose');
  const result = runEasPreflight();

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  console.log('=== EAS Mobile Build & Play Store Preflight ===\n');

  console.log(`[1] app.json & Child Permissions:    ${result.appJson.ok ? 'PASS' : 'FAIL'}`);
  if (!result.appJson.ok || isVerbose) {
    result.appJson.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.appJson.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[2] eas.json & Release Profiles:     ${result.easJson.ok ? 'PASS' : 'FAIL'}`);
  if (!result.easJson.ok || isVerbose) {
    result.easJson.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.easJson.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[3] Client Secret Separation:        ${result.secrets.ok ? 'PASS' : 'FAIL'}`);
  if (!result.secrets.ok || isVerbose) {
    result.secrets.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.secrets.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`\nResult: ${result.summary.passed}/3 preflight gates passed.`);
  process.exit(result.ok ? 0 : 1);
}
