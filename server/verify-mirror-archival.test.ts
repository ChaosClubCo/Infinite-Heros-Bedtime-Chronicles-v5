import { describe, it, expect } from 'vitest';
import {
  CANONICAL_REPO,
  LEGACY_MIRROR_REPO,
  validateCanonicalRepositoryOrigin,
  validateArchivalRunbook,
  isRepositoryPermittedForRelease,
  runMirrorArchivalVerification,
} from '../scripts/verify-mirror-archival.mjs';

describe('Mirror Archival & Decommissioning Verification Suite', () => {
  it('validates that package.json points to canonical repository origin', () => {
    const result = validateCanonicalRepositoryOrigin();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('validates that docs/operations/MIRROR-ARCHIVAL-RUNBOOK.md is complete with all required phases', () => {
    const result = validateArchivalRunbook();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('strictly permits only canonical repo and blocks legacy mirror from release', () => {
    expect(isRepositoryPermittedForRelease(CANONICAL_REPO)).toBe(true);
    expect(isRepositoryPermittedForRelease('chaosclubco/infinite-heros-bedtime-chronicles-v5')).toBe(true);

    expect(isRepositoryPermittedForRelease(LEGACY_MIRROR_REPO)).toBe(false);
    expect(isRepositoryPermittedForRelease('krosebrook/infinite-heros-bedtime-chronicles-v5-main')).toBe(false);
    expect(isRepositoryPermittedForRelease('random-user/fork')).toBe(false);
    expect(isRepositoryPermittedForRelease('')).toBe(false);
  });

  it('executes full mirror archival verification suite successfully', () => {
    const { passed, results } = runMirrorArchivalVerification({ verbose: false });
    expect(passed).toBe(true);
    expect(results.canonicalOrigin.ok).toBe(true);
    expect(results.archivalRunbook.ok).toBe(true);
  });
});
