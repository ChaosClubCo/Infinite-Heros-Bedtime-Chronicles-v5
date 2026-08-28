import { describe, expect, it } from 'vitest';
import {
  evaluateProvenance,
  CANONICAL_REPO,
  CANONICAL_REPO_OWNER,
  CANONICAL_REPO_NAME,
  CANONICAL_PRODUCTION_REF,
  // eslint-disable-next-line import/no-relative-packages -- authoritative rule module lives with deploy scripts
} from '../scripts/verify-release-provenance.mjs';

const FULL_SHA = 'abcdef0123456789abcdef0123456789abcdef01';

const canonicalProductionEnv = {
  VERCEL: '1',
  VERCEL_ENV: 'production',
  VERCEL_GIT_REPO_OWNER: CANONICAL_REPO_OWNER,
  VERCEL_GIT_REPO_SLUG: CANONICAL_REPO_NAME,
  VERCEL_GIT_COMMIT_REF: CANONICAL_PRODUCTION_REF,
  VERCEL_GIT_COMMIT_SHA: FULL_SHA,
};

describe('vercel-build phase', () => {
  it('allows local development where Vercel variables are legitimately absent', () => {
    const result = evaluateProvenance({}, 'vercel-build');
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('allows a canonical Git-backed main production build', () => {
    const result = evaluateProvenance(canonicalProductionEnv, 'vercel-build');
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('is case-insensitive on repository identity', () => {
    const result = evaluateProvenance({
      ...canonicalProductionEnv,
      VERCEL_GIT_REPO_OWNER: CANONICAL_REPO_OWNER.toUpperCase(),
      VERCEL_GIT_REPO_SLUG: CANONICAL_REPO_NAME.toLowerCase(),
    }, 'vercel-build');
    expect(result.ok).toBe(true);
  });

  it('fails a production build triggered from a mirror repository', () => {
    const result = evaluateProvenance({
      ...canonicalProductionEnv,
      VERCEL_GIT_REPO_OWNER: 'Krosebrook',
      VERCEL_GIT_REPO_SLUG: 'Infinite-Heros-Bedtime-Chronicles-v5-main',
    }, 'vercel-build');
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('is not the canonical');
  });

  it('fails a metadata-less production CLI upload', () => {
    const result = evaluateProvenance({ VERCEL: '1', VERCEL_ENV: 'production' }, 'vercel-build');
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('CLI uploads are forbidden');
  });

  it('allows a metadata-less non-production preview with a warning', () => {
    const result = evaluateProvenance({ VERCEL: '1', VERCEL_ENV: 'preview' }, 'vercel-build');
    expect(result.ok).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('fails a production build from an unmerged branch', () => {
    const result = evaluateProvenance({
      ...canonicalProductionEnv,
      VERCEL_GIT_COMMIT_REF: 'fix/activate-cloud-sync-triggers',
    }, 'vercel-build');
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('is not main');
  });

  it('fails production without a full provider-native commit SHA', () => {
    const result = evaluateProvenance({
      ...canonicalProductionEnv,
      VERCEL_GIT_COMMIT_SHA: FULL_SHA.slice(0, 7),
    }, 'vercel-build');
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('full VERCEL_GIT_COMMIT_SHA');
  });
});

describe('release-gate phase', () => {
  const passingGateEnv = {
    EXPECTED_RELEASE_SHA: FULL_SHA,
    DEPLOYED_RELEASE_SHA: FULL_SHA,
    DEPLOYED_RELEASE_REPO: CANONICAL_REPO,
    DEPLOYED_RELEASE_REF: CANONICAL_PRODUCTION_REF,
  };

  it('passes only when SHA, repository, and main ref all match', () => {
    const result = evaluateProvenance(passingGateEnv, 'release-gate');
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('fails on a mismatched SHA', () => {
    const result = evaluateProvenance({
      ...passingGateEnv,
      DEPLOYED_RELEASE_SHA: FULL_SHA.replace('a', 'b'),
    }, 'release-gate');
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('does not match expected');
  });

  it('fails when deployed SHA is absent or abbreviated', () => {
    expect(evaluateProvenance({
      ...passingGateEnv,
      DEPLOYED_RELEASE_SHA: '',
    }, 'release-gate').ok).toBe(false);
    expect(evaluateProvenance({
      ...passingGateEnv,
      DEPLOYED_RELEASE_SHA: FULL_SHA.slice(0, 7),
    }, 'release-gate').ok).toBe(false);
  });

  it('fails when expected SHA is missing or abbreviated', () => {
    expect(evaluateProvenance({
      ...passingGateEnv,
      EXPECTED_RELEASE_SHA: '',
    }, 'release-gate').ok).toBe(false);
    expect(evaluateProvenance({
      ...passingGateEnv,
      EXPECTED_RELEASE_SHA: FULL_SHA.slice(0, 7),
    }, 'release-gate').ok).toBe(false);
  });

  it('fails when repository identity is missing or noncanonical', () => {
    expect(evaluateProvenance({
      ...passingGateEnv,
      DEPLOYED_RELEASE_REPO: '',
    }, 'release-gate').ok).toBe(false);
    expect(evaluateProvenance({
      ...passingGateEnv,
      DEPLOYED_RELEASE_REPO: 'Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main',
    }, 'release-gate').ok).toBe(false);
  });

  it('fails when releaseRef is missing or not main', () => {
    expect(evaluateProvenance({
      ...passingGateEnv,
      DEPLOYED_RELEASE_REF: '',
    }, 'release-gate').ok).toBe(false);
    expect(evaluateProvenance({
      ...passingGateEnv,
      DEPLOYED_RELEASE_REF: 'fix/activate-cloud-sync-triggers',
    }, 'release-gate').ok).toBe(false);
  });
});

describe('unknown phase', () => {
  it('fails closed', () => {
    expect(evaluateProvenance({}, 'nonsense' as never).ok).toBe(false);
  });
});
