import { describe, it, expect, vi, afterEach } from 'vitest';

// Mutable per-test overrides, hoisted so the vi.mock factory can reference them
const fsState = vi.hoisted(() => ({
  existsSyncOverride: null as null | ((p: string) => boolean | null),
  readFileSyncOverride: null as null | ((p: string) => string | null | 'THROW'),
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: (p: unknown) => {
      if (fsState.existsSyncOverride) {
        const r = fsState.existsSyncOverride(String(p).replace(/\\/g, '/'));
        if (r !== null) return r;
      }
      return actual.existsSync(p as import('node:fs').PathLike);
    },
    readFileSync: (p: unknown, options?: unknown) => {
      if (fsState.readFileSyncOverride) {
        const r = fsState.readFileSyncOverride(String(p).replace(/\\/g, '/'));
        if (r === 'THROW') {
          const err = Object.assign(new Error(`ENOENT: no such file: ${p}`), { code: 'ENOENT' });
          throw err;
        }
        if (r !== null) return r;
      }
      return actual.readFileSync(
        p as import('node:fs').PathOrFileDescriptor,
        options as Parameters<typeof actual.readFileSync>[1],
      );
    },
  };
});

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
  afterEach(() => {
    fsState.existsSyncOverride = null;
    fsState.readFileSyncOverride = null;
  });

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

  it('flags repository metadata issues when release identity validation fails', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('package.json')) {
        return JSON.stringify({ repository: { url: 'https://github.com/example/not-canonical-repo.git' } });
      }
      return null;
    };

    const result = validateReleaseIdentity('0123456789abcdef0123456789abcdef01234567');
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain(CANONICAL_REPO);
  });

  it('validates runtime engine configuration across vercel.json, .nvmrc, and package.json', () => {
    const result = validateRuntimeConfiguration();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('fails when vercel.json is missing', () => {
    fsState.existsSyncOverride = (p) => (p.endsWith('vercel.json') ? false : null);

    const result = validateRuntimeConfiguration();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('vercel.json');
  });

  it('fails when vercel.json runtime is invalid', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('vercel.json')) {
        return JSON.stringify({ functions: { 'api/server.mjs': { runtime: 'nodejs18.x' } } });
      }
      return null;
    };

    const result = validateRuntimeConfiguration();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('runtime');
  });

  it('fails when .nvmrc is missing', () => {
    fsState.existsSyncOverride = (p) => (p.endsWith('.nvmrc') ? false : null);

    const result = validateRuntimeConfiguration();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('.nvmrc');
  });

  it('fails when .nvmrc node version is invalid', () => {
    fsState.readFileSyncOverride = (p) => (p.endsWith('.nvmrc') ? '18' : null);

    const result = validateRuntimeConfiguration();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('.nvmrc');
  });

  it('fails when package.json engines.node is missing', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('package.json')) {
        return JSON.stringify({ engines: {} });
      }
      return null;
    };

    const result = validateRuntimeConfiguration();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('engines.node');
  });

  it('fails when package.json engines.node version is invalid', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('package.json')) {
        return JSON.stringify({ engines: { node: '18.x' } });
      }
      return null;
    };

    const result = validateRuntimeConfiguration();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('engines.node');
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

  it('fails privacy disclosure coverage when server/routes/health.ts is missing', () => {
    fsState.existsSyncOverride = (p) => (p.endsWith('server/routes/health.ts') ? false : null);

    const result = validatePrivacyDisclosureCoverage();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('server/routes/health.ts');
  });

  it('fails privacy disclosure coverage when a required privacy route is missing from health.ts', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('server/routes/health.ts')) {
        // Return health route content that is missing /api/privacy
        return `export const routes = ['/privacy', '/privacy/', '/privacy-policy', '/privacy-policy/'];`;
      }
      return null;
    };

    const result = validatePrivacyDisclosureCoverage();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('/api/privacy');
  });

  it('fails privacy disclosure coverage when lib/ConsentContext.tsx is missing', () => {
    fsState.existsSyncOverride = (p) => (p.endsWith('lib/ConsentContext.tsx') ? false : null);

    const result = validatePrivacyDisclosureCoverage();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('lib/ConsentContext.tsx');
  });

  it('fails privacy disclosure coverage when parental consent keywords are missing', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('lib/ConsentContext.tsx')) {
        return '// empty placeholder without consent logic';
      }
      return null;
    };

    const result = validatePrivacyDisclosureCoverage();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('ConsentContext');
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
