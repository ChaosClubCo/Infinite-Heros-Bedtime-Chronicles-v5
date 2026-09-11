#!/usr/bin/env node
/**
 * Platform-neutral release-provenance validation.
 *
 * The deployed runtime must report the exact candidate SHA, canonical repository,
 * and canonical production ref. Hosting providers are responsible for binding
 * those values from immutable deployment metadata; this verifier does not trust
 * provider-specific environment variables.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CANONICAL_REPO_OWNER = "ChaosClubCo";
export const CANONICAL_REPO_NAME = "Infinite-Heros-Bedtime-Chronicles-v5";
export const CANONICAL_REPO = `${CANONICAL_REPO_OWNER}/${CANONICAL_REPO_NAME}`;
export const CANONICAL_PRODUCTION_REF = "main";

const FULL_SHA_PATTERN = /^[0-9a-f]{40}$/i;

/**
 * @param {Record<string, string | undefined>} env
 * @param {"release-gate"} phase
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function evaluateProvenance(env, phase) {
  const failures = [];
  const warnings = [];

  if (phase !== "release-gate") {
    return {
      ok: false,
      failures: [`Unknown provenance phase "${phase}".`],
      warnings,
    };
  }

  const expected = (env.EXPECTED_RELEASE_SHA ?? "").toLowerCase();
  const deployed = (env.DEPLOYED_RELEASE_SHA ?? "").toLowerCase();
  const deployedRepo = env.DEPLOYED_RELEASE_REPO ?? "";
  const deployedRef = env.DEPLOYED_RELEASE_REF ?? "";

  if (!FULL_SHA_PATTERN.test(expected)) {
    failures.push("EXPECTED_RELEASE_SHA is missing or not a full 40-hex commit SHA.");
  }
  if (!FULL_SHA_PATTERN.test(deployed)) {
    failures.push("Deployed releaseSha is absent or not a full 40-hex commit SHA.");
  } else if (FULL_SHA_PATTERN.test(expected) && deployed !== expected) {
    failures.push(`Deployed releaseSha ${deployed} does not match expected ${expected}.`);
  }

  if (!deployedRepo) {
    failures.push("Deployment does not report releaseRepo; canonical repository identity is required.");
  } else if (deployedRepo.toLowerCase() !== CANONICAL_REPO.toLowerCase()) {
    failures.push(`Deployed releaseRepo "${deployedRepo}" is not the canonical ${CANONICAL_REPO}.`);
  }

  if (!deployedRef) {
    failures.push("Deployment does not report releaseRef; the production branch cannot be verified.");
  } else if (deployedRef !== CANONICAL_PRODUCTION_REF) {
    failures.push(
      `Deployed releaseRef "${deployedRef}" is not the canonical production ref ${CANONICAL_PRODUCTION_REF}.`,
    );
  }

  return { ok: failures.length === 0, failures, warnings };
}

const isCliEntry = Boolean(
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isCliEntry) {
  const phaseArgIndex = process.argv.indexOf("--phase");
  const phase = phaseArgIndex !== -1 ? process.argv[phaseArgIndex + 1] : undefined;
  if (!phase) {
    console.error("Usage: verify-release-provenance.mjs --phase release-gate");
    process.exit(2);
  }
  const result = evaluateProvenance(process.env, phase);
  for (const warning of result.warnings) console.warn(`⚠️  ${warning}`);
  for (const failure of result.failures) console.error(`✖ ${failure}`);
  if (!result.ok) {
    console.error(`Release provenance check failed for phase "${phase}".`);
    process.exit(1);
  }
  console.log(`✓ Release provenance check passed for phase "${phase}".`);
}
