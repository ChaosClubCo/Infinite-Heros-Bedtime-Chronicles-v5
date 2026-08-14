import { describe, it, expect } from 'vitest';
import {
  validateReleaseIdentity,
  validateRuntimeConfiguration,
  validatePrivacyDisclosureCoverage,
  validateEasConfiguration,
  verifyReleaseProof,
  REQUIRED_PRIVACY_ROUTES,
  CANONICAL_REPO,
  CANONICAL_REF,
} from '../scripts/verify-release-proof.mjs';

describe('Exact-SHA Release Proof Engine', () => {
  it('validates canonical repository and branch reference', () => {
    expect(CANONICAL_REPO).toBe('ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5');
    expect(CANONICAL_REF).toBe('main');

    const result = validateReleaseIdentity('0123456789abcdef0123456789abcdef01234567');
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('rejects invalid or truncated commit SHAs', () => {
    const result = validateReleaseIdentity('short-sha-123');
    expect(result.ok).toBe(false);
    expect(result.failures[0]).toContain('not a valid 40-character hexadecimal string');
  });

  it('validates runtime engine configuration across vercel.json, .nvmrc, and package.json', () => {
    const result = validateRuntimeConfiguration();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('validates privacy route handlers and parental consent coverage', () => {
    const result = validatePrivacyDisclosureCoverage();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(REQUIRED_PRIVACY_ROUTES).toEqual([
      '/privacy',
      '/privacy/',
      '/privacy-policy',
      '/privacy-policy/',
      '/api/privacy',
    ]);
  });

  it('validates EAS production build and store submission profiles', () => {
    const result = validateEasConfiguration();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('executes full verifyReleaseProof aggregate suite', () => {
    const result = verifyReleaseProof('0123456789abcdef0123456789abcdef01234567');
    expect(result.ok).toBe(true);
    expect(result.summary.passed).toBe(4);
    expect(result.summary.failed).toBe(0);
  });
});
