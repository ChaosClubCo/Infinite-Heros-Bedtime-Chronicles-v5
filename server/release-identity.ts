const RELEASE_SHA_PATTERN = /^[0-9a-f]{40}$/i;

/**
 * Return the deployment's exact source revision when the runtime exposes one.
 *
 * Provider-specific variables are read in precedence order so operators can
 * override an incorrect provider value with APP_RELEASE_SHA. Short or malformed
 * revisions return null because release attestation must never publish an
 * ambiguous candidate identifier.
 */
export function getReleaseSha(): string | null {
  const value = process.env.APP_RELEASE_SHA
    || process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.GITHUB_SHA;

  return value && RELEASE_SHA_PATTERN.test(value) ? value.toLowerCase() : null;
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
