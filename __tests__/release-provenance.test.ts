import { describe, expect, it } from 'vitest';
import {
  evaluateProvenance,
  CANONICAL_REPO,
  CANONICAL_PRODUCTION_REF,
} from '../scripts/verify-release-provenance.mjs';

const FULL_SHA = 'abcdef0123456789abcdef0123456789abcdef01';

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

  it('is case-insensitive on repository identity', () => {
    const result = evaluateProvenance({
      ...passingGateEnv,
      DEPLOYED_RELEASE_REPO: CANONICAL_REPO.toUpperCase(),
    }, 'release-gate');
    expect(result.ok).toBe(true);
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

describe('unsupported phases', () => {
  it('fails closed for retired provider-specific phases', () => {
    expect(evaluateProvenance({}, 'vercel-build' as never).ok).toBe(false);
  });

  it('fails closed for unknown phases', () => {
    expect(evaluateProvenance({}, 'nonsense' as never).ok).toBe(false);
  });
});
