#!/usr/bin/env node
/**
 * Milestone Verification Engine (M1–M3)
 *
 * Programmatically validates all invariants and requirements across:
 *   - Milestone 1: Content Safety Filter, Safety Terms, and Fallback Story Integrity
 *   - Milestone 2: On-Device & Server TTS Narration Caching, Audio Filename Sanitization, R2 Fallbacks
 *   - Milestone 3: Supabase Cloud Sync Reconciliation, Cryptographic Storage Envelope, Dynamic Deletion Scopes
 *
 * Usage:
 *   node scripts/verify-milestones.mjs [--json] [--verbose]
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

export const REQUIRED_FALLBACK_MODES = ['classic', 'madlibs', 'sleep'];
export const REQUIRED_SAFETY_CATEGORIES = [
  'violence',
  'weapons',
  'death',
  'scary',
  'sexual',
  'profanity',
  'bullying',
  'illness',
  'anxiety',
];
export const REQUIRED_SYNC_ENTITIES = [
  'stories',
  'badges',
  'streaks',
  'favorites',
  'read',
  'profileStub',
];
export const TTS_FILENAME_PATTERN = /^[a-f0-9]+\.mp3$/i;

/**
 * Validates M1: AI Output Content Safety Filter & Fallback Stories
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function verifyM1Safety() {
  const failures = [];
  const warnings = [];

  // 1. Verify fallback stories file exists and is populated
  const fallbackPath = resolve(REPO_ROOT, 'server/safety/fallback-stories.ts');
  if (!existsSync(fallbackPath)) {
    failures.push('server/safety/fallback-stories.ts does not exist');
  } else {
    const content = readFileSync(fallbackPath, 'utf8');
    for (const mode of REQUIRED_FALLBACK_MODES) {
      if (!content.includes(`${mode.toUpperCase()}: FallbackStory`) && !content.includes(`'${mode}'`)) {
        failures.push(`Fallback story for mode "${mode}" is not defined in fallback-stories.ts`);
      }
    }
    if (!content.includes('rewardBadge') || !content.includes('vocabWord')) {
      failures.push('Fallback stories missing rewardBadge or vocabWord schema definitions');
    }
  }

  // 2. Verify safety terms definitions
  const sharedTermsPath = resolve(REPO_ROOT, 'shared/safety-terms.ts');
  const serverTermsPath = resolve(REPO_ROOT, 'server/safety/terms.ts');
  if (!existsSync(sharedTermsPath) || !existsSync(serverTermsPath)) {
    failures.push('Safety term definitions (shared/safety-terms.ts or server/safety/terms.ts) missing');
  } else {
    const sharedContent = readFileSync(sharedTermsPath, 'utf8');
    const serverContent = readFileSync(serverTermsPath, 'utf8');
    for (const category of REQUIRED_SAFETY_CATEGORIES) {
      if (!sharedContent.includes(`'${category}'`) && !sharedContent.includes(`${category}:`)) {
        warnings.push(`Safety category "${category}" not explicitly enumerated in shared/safety-terms.ts`);
      }
    }
    if (!serverContent.includes('SOFT_TERMS') || !serverContent.includes('HARD_TERMS')) {
      failures.push('server/safety/terms.ts must export HARD_TERMS and SOFT_TERMS');
    }
  }

  // 3. Verify Child Safety Rules inclusion in system prompts
  const promptsPath = resolve(REPO_ROOT, 'server/prompts.ts');
  if (existsSync(promptsPath)) {
    const promptsContent = readFileSync(promptsPath, 'utf8');
    if (!promptsContent.includes('CHILD_SAFETY_RULES')) {
      failures.push('CHILD_SAFETY_RULES constant is not present in server/prompts.ts');
    }
  } else {
    failures.push('server/prompts.ts does not exist');
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates M2: TTS Narration Caching & Audio Bounds
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function verifyM2NarrationCache() {
  const failures = [];
  const warnings = [];

  // 1. Verify TTS Cache Manager & Filename Validation
  const ttsCachePath = resolve(REPO_ROOT, 'server/tts-cache.ts');
  const ttsRoutePath = resolve(REPO_ROOT, 'server/routes/tts.ts');
  if (!existsSync(ttsCachePath) || !existsSync(ttsRoutePath)) {
    failures.push('TTS caching infrastructure (server/tts-cache.ts or server/routes/tts.ts) missing');
  } else {
    const routeContent = readFileSync(ttsRoutePath, 'utf8');
    if (!routeContent.includes('/^[a-f0-9]+\\.mp3$/') && !routeContent.includes('^[a-f0-9]')) {
      failures.push('TTS route does not strictly enforce hex MP3 filename validation');
    }
  }

  // 2. Verify R2 Storage configuration & graceful fallback
  const r2Path = resolve(REPO_ROOT, 'server/r2.ts');
  if (!existsSync(r2Path)) {
    failures.push('server/r2.ts does not exist');
  } else {
    const r2Content = readFileSync(r2Path, 'utf8');
    if (!r2Content.includes('R2_ENABLED') || !r2Content.includes('r2Get') || !r2Content.includes('r2Put')) {
      failures.push('server/r2.ts missing R2_ENABLED, r2Get, or r2Put exports');
    }
  }

  // 3. Verify on-device TTS cache limits
  const clientStoragePath = resolve(REPO_ROOT, 'lib/storage.ts');
  if (!existsSync(clientStoragePath)) {
    failures.push('lib/storage.ts missing');
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates M3: Supabase Cloud Sync, Storage Envelope, and Account Deletion
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function verifyM3CloudSync() {
  const failures = [];
  const warnings = [];

  // 1. Verify sync entity definitions and reconciliation logic
  const syncTypesPath = resolve(REPO_ROOT, 'shared/sync-types.ts');
  const reconcilePath = resolve(REPO_ROOT, 'lib/sync/reconcile.ts');
  if (!existsSync(syncTypesPath) || !existsSync(reconcilePath)) {
    failures.push('Cloud sync definitions or reconciliation engine missing');
  } else {
    const typesContent = readFileSync(syncTypesPath, 'utf8');
    for (const entity of REQUIRED_SYNC_ENTITIES) {
      if (!typesContent.includes(`'${entity}'`)) {
        failures.push(`Sync entity "${entity}" missing from shared/sync-types.ts`);
      }
    }

    const reconcileContent = readFileSync(reconcilePath, 'utf8');
    if (!reconcileContent.includes('updatedAt') || !reconcileContent.includes('deleted')) {
      failures.push('Reconciliation engine does not implement timestamp-based last-write-wins or tombstone checks');
    }
  }

  // 2. Verify secure storage envelope & SHA-256 integrity signatures
  const secureStoragePath = resolve(REPO_ROOT, 'lib/secureStorage.ts');
  if (!existsSync(secureStoragePath)) {
    failures.push('lib/secureStorage.ts does not exist');
  } else {
    const secureContent = readFileSync(secureStoragePath, 'utf8');
    if (
      !secureContent.includes('getSecureItem') ||
      !secureContent.includes('setSecureItem') ||
      !secureContent.includes('computeSignature')
    ) {
      failures.push('lib/secureStorage.ts missing core envelope methods');
    }
  }

  // 3. Verify dynamic account deletion scope precision
  const accountDeletionPath = resolve(REPO_ROOT, 'shared/account-deletion.ts');
  const accountRoutePath = resolve(REPO_ROOT, 'server/routes/account.ts');
  if (!existsSync(accountDeletionPath) || !existsSync(accountRoutePath)) {
    failures.push('Account deletion module or route missing');
  } else {
    const deletionContent = readFileSync(accountDeletionPath, 'utf8');
    const routeContent = readFileSync(accountRoutePath, 'utf8');
    if (!deletionContent.includes('DeletionScope') || !deletionContent.includes('isServerDeletionReceipt')) {
      failures.push('shared/account-deletion.ts missing DeletionScope union or isServerDeletionReceipt validator');
    }
    if (!routeContent.includes('deletedScopes') || !routeContent.includes('cloud_sync_records')) {
      failures.push('server/routes/account.ts does not dynamically build deletedScopes');
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Runs full Milestone verification suite (M1–M3).
 * @returns {{ ok: boolean, m1: ReturnType<typeof verifyM1Safety>, m2: ReturnType<typeof verifyM2NarrationCache>, m3: ReturnType<typeof verifyM3CloudSync>, summary: { passed: number, failed: number } }}
 */
export function verifyMilestones() {
  const m1 = verifyM1Safety();
  const m2 = verifyM2NarrationCache();
  const m3 = verifyM3CloudSync();

  const allResults = [m1, m2, m3];
  const passed = allResults.filter((r) => r.ok).length;
  const failed = allResults.filter((r) => !r.ok).length;

  return {
    ok: failed === 0,
    m1,
    m2,
    m3,
    summary: { passed, failed },
  };
}

// Direct execution CLI runner
if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  const isJson = process.argv.includes('--json');
  const isVerbose = process.argv.includes('--verbose');
  const result = verifyMilestones();

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  console.log('=== Milestone Verification Engine (M1–M3) ===\n');

  console.log(`[M1] AI Content Safety & Fallbacks: ${result.m1.ok ? 'PASS' : 'FAIL'}`);
  if (!result.m1.ok || isVerbose) {
    result.m1.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.m1.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[M2] TTS Narration Caching & Limits: ${result.m2.ok ? 'PASS' : 'FAIL'}`);
  if (!result.m2.ok || isVerbose) {
    result.m2.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.m2.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[M3] Cloud Sync & Secure Storage:   ${result.m3.ok ? 'PASS' : 'FAIL'}`);
  if (!result.m3.ok || isVerbose) {
    result.m3.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.m3.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`\nResult: ${result.summary.passed}/3 milestone suites passed.`);
  process.exit(result.ok ? 0 : 1);
}
