import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Operational Runbooks & Architecture Specs Integrity Suite', () => {
  const specsToCheck = [
    {
      path: 'docs/ROADMAP.md',
      requiredMarkers: ['#', 'Roadmap'],
    },
    {
      path: 'docs/CHANGELOG.md',
      requiredMarkers: ['#', 'Changelog'],
    },
    {
      path: 'docs/operations/EXPO-57-UPGRADE-SPEC.md',
      requiredMarkers: ['#', 'Expo 57', 'Upgrade'],
    },
    {
      path: 'docs/operations/DEPENDENCY-AUDIT-REMEDIATION.md',
      requiredMarkers: ['#', 'Dependency', 'Remediation'],
    },
    {
      path: 'docs/operations/RELEASE-PROOF-LEDGER-376.md',
      requiredMarkers: ['#', 'Release', 'Proof', 'Ledger'],
    },
    {
      path: 'docs/operations/PLAY-STORE-SUBMISSION-CHECKLIST.md',
      requiredMarkers: ['#', 'Play Store', 'Checklist'],
    },
    {
      path: 'docs/operations/CLOUD-SYNC-ISOLATION-EVIDENCE.md',
      requiredMarkers: ['#', 'Cloud Sync', 'Isolation', 'Evidence'],
    },
    {
      path: 'docs/operations/MIRROR-ARCHIVAL-RUNBOOK.md',
      requiredMarkers: ['#', 'Mirror', 'Archival', 'Runbook'],
    },
    {
      path: 'docs/operations/WEBHOOK-SURFACE-AUDIT.md',
      requiredMarkers: ['#', 'Webhook', 'Audit'],
    },
  ];

  specsToCheck.forEach(({ path: specPath, requiredMarkers }) => {
    it(`validates specification document exists and is well-formed: "${specPath}"`, () => {
      const fullPath = resolve(__dirname, '..', specPath);
      expect(existsSync(fullPath)).toBe(true);
      const content = readFileSync(fullPath, 'utf8');
      expect(content.length).toBeGreaterThan(100);
      requiredMarkers.forEach((marker) => {
        expect(content).toContain(marker);
      });
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
