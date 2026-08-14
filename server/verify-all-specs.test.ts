import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Operational Runbooks & Architecture Specs Integrity Suite', () => {
  const specsToCheck = [
    'docs/ROADMAP.md',
    'docs/CHANGELOG.md',
    'docs/operations/EXPO-57-UPGRADE-SPEC.md',
    'docs/operations/DEPENDENCY-AUDIT-REMEDIATION.md',
    'docs/operations/RELEASE-PROOF-LEDGER-376.md',
    'docs/operations/PLAY-STORE-SUBMISSION-CHECKLIST.md',
    'docs/operations/CLOUD-SYNC-ISOLATION-EVIDENCE.md',
    'docs/operations/MIRROR-ARCHIVAL-RUNBOOK.md',
    'docs/operations/WEBHOOK-SURFACE-AUDIT.md',
  ];

  specsToCheck.forEach((specPath) => {
    it(`validates specification document exists and is non-empty: "${specPath}"`, () => {
      const fullPath = resolve(__dirname, '..', specPath);
      expect(existsSync(fullPath)).toBe(true);
      const content = readFileSync(fullPath, 'utf8');
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain('#');
    });
  });

  it('validates scripts directory contains all verification engines', () => {
    const requiredScripts = [
      'scripts/audit-gate.mjs',
      'scripts/verify-expo57-readiness.mjs',
      'scripts/verify-milestones.mjs',
      'scripts/verify-release-proof.mjs',
      'scripts/verify-mirror-archival.mjs',
      'scripts/build-preflight-eas.mjs',
    ];

    requiredScripts.forEach((script) => {
      const fullPath = resolve(__dirname, '..', script);
      expect(existsSync(fullPath)).toBe(true);
    });
  });
});
