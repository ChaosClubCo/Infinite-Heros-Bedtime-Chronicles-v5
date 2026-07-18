const RELEASE_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

/**
 * Return the deployment's source revision when the runtime exposes one.
 *
 * Provider-specific variables are read in precedence order so operators can
 * override an incorrect provider value with APP_RELEASE_SHA. Returning null is
 * intentional: local/dev builds must not invent a release identity, and release
 * proof must fail when the deployed candidate cannot be independently matched.
 */
export function getReleaseSha(): string | null {
  const value = process.env.APP_RELEASE_SHA
    || process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.GITHUB_SHA;

  return value && RELEASE_SHA_PATTERN.test(value) ? value.toLowerCase() : null;
}
