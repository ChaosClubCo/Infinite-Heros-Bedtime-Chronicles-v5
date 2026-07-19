import { describe, expect, it } from 'vitest';
import {
  evaluateProvenance,
  CANONICAL_REPO,
  CANONICAL_REPO_OWNER,
  CANONICAL_REPO_NAME,
  // eslint-disable-next-line import/no-relative-packages -- authoritative rule module lives with deploy scripts
} from '../scripts/verify-release-provenance.mjs';

const FULL_SHA = 'abcdef0123456789abcdef0123456789abcdef01';

describe('vercel-build phase', () => {
  it('allows local development where Vercel variables are legitimately absent', () => {
    const result = evaluateProvenance({}, 'vercel-build');
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('allows canonical-repository builds', () => {
    const result = evaluateProvenance({
      VERCEL: '1',
      VERCEL_GIT_REPO_OWNER: CANONICAL_REPO_OWNER,
      VERCEL_GIT_REPO_SLUG: CANONICAL_REPO_NAME,
    }, 'vercel-build');
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('is case-insensitive on the repository identity', () => {
    const result = evaluateProvenance({
      VERCEL: '1',
      VERCEL_GIT_REPO_OWNER: CANONICAL_REPO_OWNER.toUpperCase(),
      VERCEL_GIT_REPO_SLUG: CANONICAL_REPO_NAME.toLowerCase(),
    }, 'vercel-build');
    expect(result.ok).toBe(true);
  });

  it('fails a build triggered from a mirror repository', () => {
    const result = evaluateProvenance({
      VERCEL: '1',
      VERCEL_GIT_REPO_OWNER: 'Krosebrook',
      VERCEL_GIT_REPO_SLUG: 'Infinite-Heros-Bedtime-Chronicles-v5-main',
    }, 'vercel-build');
    expect(result.ok).toBe(false);
    expect(result.failures[0]).toContain('Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main');
  });

  it('fails when only one half of the repository identity matches', () => {
    const result = evaluateProvenance({
      VERCEL: '1',
      VERCEL_GIT_REPO_OWNER: CANONICAL_REPO_OWNER,
      VERCEL_GIT_REPO_SLUG: 'some-other-repo',
    }, 'vercel-build');
    expect(result.ok).toBe(false);
  });

  it('allows CLI uploads without git metadata but records the warning', () => {
    const result = evaluateProvenance({ VERCEL: '1' }, 'vercel-build');
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w: string) => w.includes('APP_RELEASE_SHA'))).toBe(true);
  });
});

describe('release-gate phase', () => {
  it('passes when native SHA and expected SHA match on the canonical repo', () => {
    const result = evaluateProvenance({
      EXPECTED_RELEASE_SHA: FULL_SHA,
      DEPLOYED_RELEASE_SHA: FULL_SHA,
      DEPLOYED_RELEASE_REPO: CANONICAL_REPO,
    }, 'release-gate');
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('fails on a mismatched SHA', () => {
    const result = evaluateProvenance({
      EXPECTED_RELEASE_SHA: FULL_SHA,
      DEPLOYED_RELEASE_SHA: FULL_SHA.replace('a', 'b'),
      DEPLOYED_RELEASE_REPO: CANONICAL_REPO,
    }, 'release-gate');
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('does not match expected');
  });

  it('fails when the deployed SHA is absent during a release-gated check', () => {
    const result = evaluateProvenance({
      EXPECTED_RELEASE_SHA: FULL_SHA,
      DEPLOYED_RELEASE_REPO: CANONICAL_REPO,
    }, 'release-gate');
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('releaseSha is absent');
  });

  it('fails when the expected SHA is missing or abbreviated', () => {
    expect(evaluateProvenance({ DEPLOYED_RELEASE_SHA: FULL_SHA }, 'release-gate').ok).toBe(false);
    expect(evaluateProvenance({
      EXPECTED_RELEASE_SHA: FULL_SHA.slice(0, 7),
      DEPLOYED_RELEASE_SHA: FULL_SHA,
    }, 'release-gate').ok).toBe(false);
  });

  it('fails when the deployment reports mirror repository metadata', () => {
    const result = evaluateProvenance({
      EXPECTED_RELEASE_SHA: FULL_SHA,
      DEPLOYED_RELEASE_SHA: FULL_SHA,
      DEPLOYED_RELEASE_REPO: 'Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main',
    }, 'release-gate');
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('is not the canonical');
  });

  it('passes with a warning when releaseRepo is not reported (CLI fallback deploys)', () => {
    const result = evaluateProvenance({
      EXPECTED_RELEASE_SHA: FULL_SHA,
      DEPLOYED_RELEASE_SHA: FULL_SHA,
    }, 'release-gate');
    expect(result.ok).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('unknown phase', () => {
  it('fails closed', () => {
    expect(evaluateProvenance({}, 'nonsense' as never).ok).toBe(false);
  });
});
