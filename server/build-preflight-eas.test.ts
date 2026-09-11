import { describe, it, expect } from 'vitest';
import {
  validateAppJson,
  validateEasJson,
  validateClientSecretsSeparation,
  runEasPreflight,
  FORBIDDEN_CLIENT_PERMISSIONS,
  ALLOWED_EXPO_PUBLIC_VARS,
} from '../scripts/build-preflight-eas.mjs';

describe('EAS Mobile Build & Play Store Preflight Engine', () => {
  it('validates app.json package, bundle IDs, and child safety permissions', () => {
    const result = validateAppJson();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(FORBIDDEN_CLIENT_PERMISSIONS).toContain('android.permission.RECORD_AUDIO');
    expect(FORBIDDEN_CLIENT_PERMISSIONS).toContain('android.permission.CAMERA');
  });

  it('validates eas.json build profiles and production app-bundle format', () => {
    const result = validateEasJson();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('validates client environment variable separation and allowed public variables', () => {
    const result = validateClientSecretsSeparation();
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(ALLOWED_EXPO_PUBLIC_VARS).toContain('EXPO_PUBLIC_API_URL');
    expect(ALLOWED_EXPO_PUBLIC_VARS).toContain('EXPO_PUBLIC_SUPABASE_URL');
  });

  it('executes full runEasPreflight aggregate suite', () => {
    const result = runEasPreflight();
    expect(result.ok).toBe(true);
    expect(result.summary.passed).toBe(3);
    expect(result.summary.failed).toBe(0);
  });
});
