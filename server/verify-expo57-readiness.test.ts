import { describe, it, expect, vi, afterEach } from 'vitest';

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
  verifyEngineReadiness,
  verifyConfigReadiness,
  verifyModuleReadiness,
  verifySpecReadiness,
  runExpo57ReadinessVerification,
  REQUIRED_SPEC_SECTIONS,
  REQUIRED_MODERN_MODULES,
} from '../scripts/verify-expo57-readiness.mjs';

describe('Expo SDK 55 → 57 Upgrade Readiness Verification', () => {
  afterEach(() => {
    fsState.existsSyncOverride = null;
    fsState.readFileSyncOverride = null;
  });

  it('validates Node engine and serverless runtime alignment', () => {
    const result = verifyEngineReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('exposes failures when Node engine and runtime alignment checks do not pass', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('package.json')) {
        return JSON.stringify({ engines: { node: '18.x' } });
      }
      return null;
    };

    const result = verifyEngineReadiness();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('engines.node');
  });

  it('validates app.json and eas.json configuration prerequisites', () => {
    const result = verifyConfigReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('exposes failures when app.json or eas.json prerequisites are missing', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('app.json')) {
        return JSON.stringify({ expo: { name: 'Infinity Heroes', android: { package: 'com.infinityheroes.bedtime' } } });
      }
      return null;
    };

    const result = verifyConfigReadiness();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('missing required expo name/slug');
  });

  it('validates required modern native modules and dependabot rules', () => {
    const result = verifyModuleReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(REQUIRED_MODERN_MODULES).toContain('expo-audio');
    expect(REQUIRED_MODERN_MODULES).toContain('react-native-reanimated');
    expect(REQUIRED_MODERN_MODULES).toContain('expo-router');
  });

  it('exposes failures when required modules or dependabot rules are missing', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('.github/dependabot.yml')) {
        return 'version: 2\nupdates: []';
      }
      return null;
    };

    const result = verifyModuleReadiness();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('must ignore semver-major updates');
  });

  it('validates presence and required sections of EXPO-57-UPGRADE-SPEC.md', () => {
    const result = verifySpecReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(REQUIRED_SPEC_SECTIONS).toContain('Platform & Dependency Compatibility Matrix');
    expect(REQUIRED_SPEC_SECTIONS).toContain('Phased 5-Step Execution Runbook');
  });

  it('exposes failures when required spec sections are missing', () => {
    fsState.readFileSyncOverride = (p) => {
      if (p.endsWith('docs/operations/EXPO-57-UPGRADE-SPEC.md')) {
        return '# Upgrade Spec\n\n## Platform & Dependency Compatibility Matrix';
      }
      return null;
    };

    const result = verifySpecReadiness();
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('Upgrade specification missing required section');
  });

  it('executes full runExpo57ReadinessVerification suite with 4/4 passing gates', () => {
    const suiteResult = runExpo57ReadinessVerification();
    expect(suiteResult.ok).toBe(true);
    expect(suiteResult.summary.passed).toBe(4);
    expect(suiteResult.summary.failed).toBe(0);
    expect(suiteResult.engine.ok).toBe(true);
    expect(suiteResult.config.ok).toBe(true);
    expect(suiteResult.modules.ok).toBe(true);
    expect(suiteResult.spec.ok).toBe(true);
  });
});
