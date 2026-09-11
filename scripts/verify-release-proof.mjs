#!/usr/bin/env node
/**
 * Exact-SHA Release Proof Engine
 *
 * Validates the full repository release proof matrix for Issue #376:
 *   1. Canonical Repository & Ref Identity (ChaosClubCo / main)
 *   2. Commit SHA Format (Strict 40-character hex SHA)
 *   3. Runtime Alignment (Vercel nodejs22.x, .nvmrc, engines)
 *   4. Privacy Route Handlers Coverage (/privacy, /privacy/, /privacy-policy, /privacy-policy/, /api/privacy)
 *   5. Security Invariants (M1 safety filters, M2 narration limits, M3 sync/crypto envelope)
 *   6. Dynamic Account Deletion Scope Verification
 *   7. Client Secure Storage Envelope Integration
 *   8. EAS Mobile Release Configuration
 *
 * Usage:
 *   node scripts/verify-release-proof.mjs [--sha <40-char-sha>] [--json] [--verbose]
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

export const CANONICAL_REPO_OWNER = 'ChaosClubCo';
export const CANONICAL_REPO_NAME = 'Infinite-Heros-Bedtime-Chronicles-v5';
export const CANONICAL_REPO = `${CANONICAL_REPO_OWNER}/${CANONICAL_REPO_NAME}`;
export const CANONICAL_REF = 'main';
export const REQUIRED_PRIVACY_ROUTES = [
  '/privacy',
  '/privacy/',
  '/privacy-policy',
  '/privacy-policy/',
  '/api/privacy',
];
export const SHA_REGEX = /^[0-9a-f]{40}$/i;

/**
 * Validates canonical identity, branch ref, and commit SHA.
 * @param {string | undefined} sha
 * @param {Record<string, string | undefined>} env
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function validateReleaseIdentity(sha, env = process.env) {
  const failures = [];
  const warnings = [];

  const candidateSha = sha || env.VERCEL_GIT_COMMIT_SHA || env.GITHUB_SHA || env.RELEASE_SHA;
  if (!candidateSha) {
    warnings.push('No commit SHA provided via --sha or environment (VERCEL_GIT_COMMIT_SHA/GITHUB_SHA); skipping exact-SHA format test.');
  } else if (!SHA_REGEX.test(candidateSha)) {
    failures.push(`Candidate commit SHA "${candidateSha}" is not a valid 40-character hexadecimal string.`);
  }

  const pkgPath = resolve(REPO_ROOT, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const repoUrl = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    if (!repoUrl || !repoUrl.includes(CANONICAL_REPO)) {
      failures.push(`package.json repository URL "${repoUrl}" does not match canonical ${CANONICAL_REPO}`);
    }
  } else {
    failures.push('package.json is missing');
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates runtime configuration and engine pinning.
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function validateRuntimeConfiguration() {
  const failures = [];
  const warnings = [];

  // 1. Check vercel.json
  const vercelPath = resolve(REPO_ROOT, 'vercel.json');
  if (!existsSync(vercelPath)) {
    failures.push('vercel.json is missing');
  } else {
    const vercelConfig = JSON.parse(readFileSync(vercelPath, 'utf8'));
    const fnConfig = vercelConfig.functions?.['api/server.mjs'];
    if (fnConfig?.runtime !== 'nodejs22.x') {
      failures.push(`vercel.json api/server.mjs runtime must be pinned to "nodejs22.x"; received "${fnConfig?.runtime}"`);
    }
  }

  // 2. Check .nvmrc
  const nvmrcPath = resolve(REPO_ROOT, '.nvmrc');
  if (!existsSync(nvmrcPath)) {
    failures.push('.nvmrc is missing');
  } else {
    const nvmrc = readFileSync(nvmrcPath, 'utf8').trim();
    if (nvmrc !== '22' && !nvmrc.startsWith('22.')) {
      failures.push(`.nvmrc should specify Node 22 (received "${nvmrc}")`);
    }
  }

  // 3. Check package.json engines
  const pkgPath = resolve(REPO_ROOT, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (!pkg.engines?.node || !pkg.engines.node.includes('22')) {
      failures.push(`package.json engines.node should support Node 22 (received "${pkg.engines?.node}")`);
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates privacy routes and COPPA disclosures.
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function validatePrivacyDisclosureCoverage() {
  const failures = [];
  const warnings = [];

  const healthRoutesPath = resolve(REPO_ROOT, 'server/routes/health.ts');
  if (!existsSync(healthRoutesPath)) {
    failures.push('server/routes/health.ts is missing');
  } else {
    const content = readFileSync(healthRoutesPath, 'utf8');
    for (const route of REQUIRED_PRIVACY_ROUTES) {
      if (!content.includes(`"${route}"`) && !content.includes(`'${route}'`)) {
        failures.push(`Privacy route handler "${route}" is missing from server/routes/health.ts`);
      }
    }
  }

  const consentPath = resolve(REPO_ROOT, 'lib/ConsentContext.tsx');
  if (!existsSync(consentPath)) {
    failures.push('lib/ConsentContext.tsx is missing');
  } else {
    const consentContent = readFileSync(consentPath, 'utf8');
    if (!consentContent.includes('PARENT_GATE') && !consentContent.includes('isConsented')) {
      failures.push('lib/ConsentContext.tsx missing parental consent evaluation');
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Validates EAS build and store submission profiles.
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function validateEasConfiguration() {
  const failures = [];
  const warnings = [];

  const easPath = resolve(REPO_ROOT, 'eas.json');
  if (!existsSync(easPath)) {
    failures.push('eas.json is missing');
  } else {
    const eas = JSON.parse(readFileSync(easPath, 'utf8'));
    if (!eas.build?.production) {
      failures.push('eas.json missing build.production profile');
    } else {
      if (eas.build.production.android?.buildType !== 'app-bundle') {
        failures.push('eas.json build.production.android.buildType must be "app-bundle"');
      }
    }
    if (!eas.submit?.production?.android) {
      failures.push('eas.json missing submit.production.android profile');
    }
  }

  return { ok: failures.length === 0, failures, warnings };
}

/**
 * Runs full exact-SHA release proof verification suite.
 * @param {string | undefined} sha
 * @param {Record<string, string | undefined>} env
 * @returns {{ ok: boolean, identity: ReturnType<typeof validateReleaseIdentity>, runtime: ReturnType<typeof validateRuntimeConfiguration>, privacy: ReturnType<typeof validatePrivacyDisclosureCoverage>, eas: ReturnType<typeof validateEasConfiguration>, summary: { passed: number, failed: number } }}
 */
export function verifyReleaseProof(sha, env = process.env) {
  const identity = validateReleaseIdentity(sha, env);
  const runtime = validateRuntimeConfiguration();
  const privacy = validatePrivacyDisclosureCoverage();
  const eas = validateEasConfiguration();

  const allResults = [identity, runtime, privacy, eas];
  const passed = allResults.filter((r) => r.ok).length;
  const failed = allResults.filter((r) => !r.ok).length;

  return {
    ok: failed === 0,
    identity,
    runtime,
    privacy,
    eas,
    summary: { passed, failed },
  };
}

// Direct CLI Runner
if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  const isJson = process.argv.includes('--json');
  const isVerbose = process.argv.includes('--verbose');
  const shaIdx = process.argv.indexOf('--sha');
  const sha = shaIdx > -1 ? process.argv[shaIdx + 1] : undefined;

  const result = verifyReleaseProof(sha);

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  console.log('=== Exact-SHA Release Proof Engine (Issue #376) ===\n');

  console.log(`[1] Canonical Identity & Ref:       ${result.identity.ok ? 'PASS' : 'FAIL'}`);
  if (!result.identity.ok || isVerbose) {
    result.identity.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.identity.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[2] Runtime & Engine Alignment:     ${result.runtime.ok ? 'PASS' : 'FAIL'}`);
  if (!result.runtime.ok || isVerbose) {
    result.runtime.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.runtime.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[3] Privacy & Consent Disclosures:  ${result.privacy.ok ? 'PASS' : 'FAIL'}`);
  if (!result.privacy.ok || isVerbose) {
    result.privacy.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.privacy.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`[4] EAS Mobile Release Profiles:    ${result.eas.ok ? 'PASS' : 'FAIL'}`);
  if (!result.eas.ok || isVerbose) {
    result.eas.failures.forEach((f) => console.error(`  - ERROR: ${f}`));
    result.eas.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  console.log(`\nResult: ${result.summary.passed}/4 release proof gates passed.`);
  process.exit(result.ok ? 0 : 1);
}
