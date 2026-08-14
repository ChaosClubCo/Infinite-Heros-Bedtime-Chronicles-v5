const RELEASE_SHA_PATTERN = /^[0-9a-f]{40}$/i;

/**
 * Return the deployment's exact source revision when the runtime exposes one.
 *
 * Prefer provider-native variables first. APP_RELEASE_SHA stays as a fallback
 * for non-provider runtimes where no native git metadata exists. This avoids a
 * stale APP_RELEASE_SHA override masking the actual deployed Vercel commit and
 * breaking release attestation.
 *
 * Short or malformed revisions return null because release attestation must
 * never publish an ambiguous candidate identifier.
 */
export function getReleaseSha(): string | null {
  const value = process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.GITHUB_SHA;

  if (value && RELEASE_SHA_PATTERN.test(value)) {
    return value.toLowerCase();
  }

  const fallback = process.env.APP_RELEASE_SHA;
  return fallback && RELEASE_SHA_PATTERN.test(fallback) ? fallback.toLowerCase() : null;
}

/**
 * Return the deployment's source repository as "owner/name" when the runtime
 * exposes it (Vercel sets VERCEL_GIT_REPO_OWNER/SLUG on git-integration
 * deployments). Null locally and on CLI uploads. Release gates use this to
 * detect deployments built from a mirror instead of the canonical repository
 * (see scripts/verify-release-provenance.mjs, the authoritative rule module).
 */
export function getReleaseRepo(): string | null {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;
  return owner && slug ? `${owner}/${slug}` : null;
}

/**
 * Return the git ref (branch) the deployment was built from, when exposed.
 */
export function getReleaseRef(): string | null {
  return process.env.VERCEL_GIT_COMMIT_REF || null;
}

/**
 * Require an exact candidate before a destructive, receipt-producing action.
 * This prevents data deletion from completing when the service cannot issue an
 * independently matchable exact-candidate receipt.
 */
export function requireReleaseSha(): string {
  const releaseSha = getReleaseSha();
  if (!releaseSha) {
    throw new Error('Exact release candidate metadata is unavailable');
  }
  return releaseSha;
}
