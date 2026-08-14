#!/usr/bin/env node
/**
 * Authoritative release-provenance validation.
 *
 * Production deployments are allowed only when Vercel identifies a clean,
 * Git-backed build from the canonical repository's `main` branch at a full
 * 40-character commit SHA. Metadata-less CLI uploads are permitted only for
 * non-production previews; they can never produce a production artifact.
 *
 * Phases:
 *   vercel-build  — executes at the start of Vercel's build command. Production
 *                   fails closed unless repository, branch, and exact commit
 *                   metadata are present and canonical.
 *   release-gate  — validates a deployed `/api/health` response against the
 *                   exact expected SHA, canonical repository, and `main` ref.
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
 * @param {"vercel-build" | "release-gate"} phase
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function evaluateProvenance(env, phase) {
  const failures = [];
  const warnings = [];

  if (phase === "vercel-build") {
    if (!env.VERCEL) {
      warnings.push("Not a Vercel build (VERCEL unset); provenance rules do not apply locally.");
      return { ok: true, failures, warnings };
    }

    const isProduction = env.VERCEL_ENV === "production"
      || env.VERCEL_TARGET_ENV === "production";
    const owner = env.VERCEL_GIT_REPO_OWNER;
    const slug = env.VERCEL_GIT_REPO_SLUG;
    const ref = env.VERCEL_GIT_COMMIT_REF;
    const sha = env.VERCEL_GIT_COMMIT_SHA;

    if (!owner || !slug) {
      const message = "Vercel did not provide Git repository metadata. Production must be deployed through the canonical Git-backed workflow; metadata-less CLI uploads are forbidden.";
      if (isProduction) failures.push(message);
      else warnings.push(message);
    } else if (owner.toLowerCase() !== CANONICAL_REPO_OWNER.toLowerCase()
      || slug.toLowerCase() !== CANONICAL_REPO_NAME.toLowerCase()) {
      failures.push(
        `Deployment source repository "${owner}/${slug}" is not the canonical ${CANONICAL_REPO}.`,
      );
    }

    if (isProduction) {
      if (ref !== CANONICAL_PRODUCTION_REF) {
        failures.push(
          `Production deployment ref "${ref ?? "missing"}" is not ${CANONICAL_PRODUCTION_REF}. `
          + "Unmerged feature branches and CLI uploads cannot deploy to production.",
        );
      }
      if (!sha || !FULL_SHA_PATTERN.test(sha)) {
        failures.push("Production deployment is missing a full VERCEL_GIT_COMMIT_SHA.");
      }
    }

    return { ok: failures.length === 0, failures, warnings };
  }

  if (phase === "release-gate") {
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

  return { ok: false, failures: [`Unknown provenance phase "${phase}".`], warnings };
}

const isCliEntry = Boolean(
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isCliEntry) {
  const phaseArgIndex = process.argv.indexOf("--phase");
  const phase = phaseArgIndex !== -1 ? process.argv[phaseArgIndex + 1] : undefined;
  if (!phase) {
    console.error("Usage: verify-release-provenance.mjs --phase <vercel-build|release-gate>");
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
