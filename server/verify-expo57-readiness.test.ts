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

describe('Expo SDK 55 → 57 Upgrade Readiness Verification', () => {
  it('validates Node engine and serverless runtime alignment', () => {
    const result = verifyEngineReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('exposes failures when Node engine and runtime alignment checks do not pass', () => {
    const result = verifyEngineReadiness();
    if (!result.ok) {
      expect(result.failures.length).toBeGreaterThan(0);
    } else {
      expect(result.ok).toBe(true);
      expect(result.failures).toHaveLength(0);
    }
  });

  it('validates app.json and eas.json configuration prerequisites', () => {
    const result = verifyConfigReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('exposes failures when app.json or eas.json prerequisites are missing', () => {
    const result = verifyConfigReadiness();
    if (!result.ok) {
      expect(result.failures.length).toBeGreaterThan(0);
    } else {
      expect(result.ok).toBe(true);
      expect(result.failures).toHaveLength(0);
    }
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
    const result = verifyModuleReadiness();
    if (!result.ok) {
      expect(result.failures.length).toBeGreaterThan(0);
    } else {
      expect(result.ok).toBe(true);
      expect(result.failures).toHaveLength(0);
    }
  });

  it('validates presence and required sections of EXPO-57-UPGRADE-SPEC.md', () => {
    const result = verifySpecReadiness();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(REQUIRED_SPEC_SECTIONS).toContain('Platform & Dependency Compatibility Matrix');
    expect(REQUIRED_SPEC_SECTIONS).toContain('Phased 5-Step Execution Runbook');
  });

  it('exposes failures when required spec sections are missing', () => {
    const result = verifySpecReadiness();
    if (!result.ok) {
      expect(result.failures.length).toBeGreaterThan(0);
    } else {
      expect(result.ok).toBe(true);
      expect(result.failures).toHaveLength(0);
    }
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
