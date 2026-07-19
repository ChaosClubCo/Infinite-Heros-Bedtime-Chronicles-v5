#!/usr/bin/env node
/**
 * Authoritative release-provenance validation.
 *
 * The Vercel project was once connected to a public docs-only mirror
 * (Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main), which produced
 * production deployments whose git metadata never identified a canonical
 * commit (see docs/production-readiness/VERCEL_RELINK_2026-07-19.md). This
 * module is the single place where "which repository may deploy, and does the
 * deployed SHA match the expected one" is decided. Workflows and the Vercel
 * build both call the CLI entry; tests import evaluateProvenance directly.
 *
 * Phases:
 *   vercel-build  — runs at the start of the Vercel buildCommand. Fails the
 *                   build when the deployment's git metadata names any
 *                   repository other than the canonical one, so a mirror can
 *                   never produce a deployable artifact. Deployments without
 *                   git metadata (e.g. `vercel --prod` CLI uploads via
 *                   scripts/deploy-vercel.sh) are allowed with a warning —
 *                   that path supplies APP_RELEASE_SHA explicitly and remains
 *                   the documented fallback. Local runs (VERCEL unset) always
 *                   pass.
 *   release-gate  — runs in release workflows against a deployed /api/health
 *                   response. Strict: the expected SHA must be present and
 *                   match the deployed SHA, and when the deployment reports
 *                   its source repository it must be the canonical one.
 */

export const CANONICAL_REPO_OWNER = "ChaosClubCo";
export const CANONICAL_REPO_NAME = "Infinite-Heros-Bedtime-Chronicles-v5";
export const CANONICAL_REPO = `${CANONICAL_REPO_OWNER}/${CANONICAL_REPO_NAME}`;

const FULL_SHA_PATTERN = /^[0-9a-f]{40}$/i;

/**
 * Evaluate provenance rules for a phase against an env-shaped input.
 * Pure — reads nothing from process.env, so tests can exercise every branch.
 *
 * @param {Record<string, string | undefined>} env
 *   vercel-build reads: VERCEL, VERCEL_GIT_REPO_OWNER, VERCEL_GIT_REPO_SLUG
 *   release-gate reads: EXPECTED_RELEASE_SHA, DEPLOYED_RELEASE_SHA,
 *                       DEPLOYED_RELEASE_REPO
 * @param {"vercel-build" | "release-gate"} phase
 * @returns {{ ok: boolean, failures: string[], warnings: string[] }}
 */
export function evaluateProvenance(env, phase) {
  const failures = [];
  const warnings = [];

  if (phase === "vercel-build") {
    const owner = env.VERCEL_GIT_REPO_OWNER;
    const slug = env.VERCEL_GIT_REPO_SLUG;
    if (!env.VERCEL) {
      warnings.push("Not a Vercel build (VERCEL unset); provenance rules do not apply locally.");
    } else if (owner || slug) {
      if ((owner ?? "").toLowerCase() !== CANONICAL_REPO_OWNER.toLowerCase()
        || (slug ?? "").toLowerCase() !== CANONICAL_REPO_NAME.toLowerCase()) {
        failures.push(
          `Deployment source repository "${owner ?? "?"}/${slug ?? "?"}" is not the canonical `
          + `${CANONICAL_REPO}. Mirror or fork repositories must never deploy this project.`,
        );
      }
    } else {
      warnings.push(
        "No git metadata on this deployment (CLI upload). Allowed as the documented "
        + "explicit-SHA fallback path (scripts/deploy-vercel.sh sets APP_RELEASE_SHA).",
      );
    }
    return { ok: failures.length === 0, failures, warnings };
  }

  if (phase === "release-gate") {
    const expected = (env.EXPECTED_RELEASE_SHA ?? "").toLowerCase();
    const deployed = (env.DEPLOYED_RELEASE_SHA ?? "").toLowerCase();
    const deployedRepo = env.DEPLOYED_RELEASE_REPO ?? "";

    if (!FULL_SHA_PATTERN.test(expected)) {
      failures.push("EXPECTED_RELEASE_SHA is missing or not a full 40-hex commit SHA.");
    }
    if (!deployed) {
      failures.push("Deployed releaseSha is absent; a release-gated deployment must expose its exact SHA.");
    } else if (expected && FULL_SHA_PATTERN.test(expected) && deployed !== expected) {
      failures.push(`Deployed releaseSha ${deployed} does not match expected ${expected}.`);
    }
    if (deployedRepo && deployedRepo.toLowerCase() !== CANONICAL_REPO.toLowerCase()) {
      failures.push(
        `Deployed releaseRepo "${deployedRepo}" is not the canonical ${CANONICAL_REPO}.`,
      );
    } else if (!deployedRepo) {
      warnings.push(
        "Deployment does not report releaseRepo (pre-relink build or CLI upload); "
        + "repository identity was not independently confirmed.",
      );
    }
    return { ok: failures.length === 0, failures, warnings };
  }

  return { ok: false, failures: [`Unknown provenance phase "${phase}".`], warnings };
}

const isCliEntry = process.argv[1]
  && import.meta.url === new URL(`file://${process.argv[1]}`).href;

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
