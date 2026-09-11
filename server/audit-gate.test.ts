import { describe, it, expect } from 'vitest';
import {
  parseAdvisories,
  evaluateAuditReport,
  ALLOWLIST,
} from '../scripts/audit-gate.mjs';

describe('Security Audit Gate Engine', () => {
  it('parses high and critical advisories while ignoring low and moderate findings', () => {
    const mockReport = {
      vulnerabilities: {
        'esbuild': {
          name: 'esbuild',
          severity: 'moderate',
          via: [{ name: 'esbuild', title: 'Moderate dev server advisory', severity: 'moderate' }],
        },
        'image-size': {
          name: 'image-size',
          severity: 'high',
          via: [
            {
              name: 'image-size',
              title: 'ICNS parser DoS',
              url: 'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
              severity: 'high',
            },
          ],
        },
      },
    };

    const advisories = parseAdvisories(mockReport);
    expect(advisories.has('GHSA-w3rx-r6r6-pgpr')).toBe(true);
    expect(advisories.size).toBe(1);
    expect(advisories.get('GHSA-w3rx-r6r6-pgpr')?.name).toBe('image-size');
  });

  it('allows active allowlisted advisories before expiration date', () => {
    const mockReport = {
      vulnerabilities: {
        'image-size': {
          name: 'image-size',
          severity: 'high',
          via: [
            {
              name: 'image-size',
              title: 'ICNS parser DoS',
              url: 'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
              severity: 'high',
            },
          ],
        },
      },
    };

    const result = evaluateAuditReport(mockReport, ALLOWLIST, '2026-08-14');
    expect(result.ok).toBe(true);
    expect(result.blocked).toHaveLength(0);
    expect(result.allowed).toHaveLength(1);
    expect(result.allowed[0]).toContain('GHSA-w3rx-r6r6-pgpr');
  });

  it('blocks expired allowlist entries forcing mandatory re-review', () => {
    const mockReport = {
      vulnerabilities: {
        'image-size': {
          name: 'image-size',
          severity: 'high',
          via: [
            {
              name: 'image-size',
              title: 'ICNS parser DoS',
              url: 'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
              severity: 'high',
            },
          ],
        },
      },
    };

    // Evaluate on a date after 2026-10-01 expiration
    const result = evaluateAuditReport(mockReport, ALLOWLIST, '2026-11-01');
    expect(result.ok).toBe(false);
    expect(result.blocked).toHaveLength(1);
    expect(result.blocked[0]).toContain('allowlist entry EXPIRED');
  });

  it('blocks unknown high or critical vulnerabilities', () => {
    const mockReport = {
      vulnerabilities: {
        'unknown-lib': {
          name: 'unknown-lib',
          severity: 'critical',
          via: [
            {
              name: 'unknown-lib',
              title: 'Remote Code Execution',
              url: 'https://github.com/advisories/GHSA-9999-9999-9999',
              severity: 'critical',
            },
          ],
        },
      },
    };

    const result = evaluateAuditReport(mockReport, ALLOWLIST, '2026-08-14');
    expect(result.ok).toBe(false);
    expect(result.blocked).toHaveLength(1);
    expect(result.blocked[0]).toContain('GHSA-9999-9999-9999');
    expect(result.blocked[0]).toContain('critical');
  });

  it('passes cleanly when report has zero vulnerabilities', () => {
    const emptyReport = { vulnerabilities: {} };
    const result = evaluateAuditReport(emptyReport, ALLOWLIST, '2026-08-14');
    expect(result.ok).toBe(true);
    expect(result.blocked).toHaveLength(0);
    expect(result.allowed).toHaveLength(0);
    expect(result.advisoryCount).toBe(0);
  });
});
