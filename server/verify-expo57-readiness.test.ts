import { describe, it, expect } from 'vitest';
import {
  verifyEngineReadiness,
  verifyConfigReadiness,
  verifyModuleReadiness,
  verifySpecReadiness,
  runExpo57ReadinessVerification,
  REQUIRED_SPEC_SECTIONS,
  REQUIRED_MODERN_MODULES,
} from '../scripts/verify-expo57-readiness.mjs';

describe('Expo SDK 55 → 57 Upgrade Readiness Engine', () => {
  it('validates Node engine and serverless runtime alignment', () => {
    const result = verifyEngineReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('validates app.json and eas.json configuration prerequisites', () => {
    const result = verifyConfigReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('validates required modern native modules and dependabot rules', () => {
    const result = verifyModuleReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(REQUIRED_MODERN_MODULES).toContain('expo-audio');
    expect(REQUIRED_MODERN_MODULES).toContain('react-native-reanimated');
    expect(REQUIRED_MODERN_MODULES).toContain('expo-router');
  });

  it('validates presence and required sections of EXPO-57-UPGRADE-SPEC.md', () => {
    const result = verifySpecReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(REQUIRED_SPEC_SECTIONS).toContain('Platform & Dependency Compatibility Matrix');
    expect(REQUIRED_SPEC_SECTIONS).toContain('Phased 5-Step Execution Runbook');
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
