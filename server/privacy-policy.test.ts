import { describe, it, expect } from 'vitest';
import { PRIVACY_POLICY_HTML } from './privacy-policy';

describe('Server Privacy Policy HTML Renderer', () => {
  it('exports valid HTML document structure with required meta tags', () => {
    expect(typeof PRIVACY_POLICY_HTML).toBe('string');
    expect(PRIVACY_POLICY_HTML).toContain('<!DOCTYPE html>');
    expect(PRIVACY_POLICY_HTML).toContain('<html lang="en">');
    expect(PRIVACY_POLICY_HTML).toContain('<meta charset="utf-8">');
    expect(PRIVACY_POLICY_HTML).toContain('<meta name="viewport"');
    expect(PRIVACY_POLICY_HTML).toContain('<title>Privacy Policy — Infinity Heroes: Bedtime Chronicles</title>');
  });

  it('contains mandatory COPPA and children privacy disclosures', () => {
    expect(PRIVACY_POLICY_HTML).toContain('Summary for parents:');
    expect(PRIVACY_POLICY_HTML).toContain('Child profile name and age stay on the device');
    expect(PRIVACY_POLICY_HTML).toContain('parental-consent record');
    expect(PRIVACY_POLICY_HTML).toContain('Delete All Data');
  });

  it('explicitly documents zero microphone permissions and voice containment', () => {
    expect(PRIVACY_POLICY_HTML).toContain('Voice Chat is unavailable in this release');
    expect(PRIVACY_POLICY_HTML).toContain('does not request microphone permission');
    expect(PRIVACY_POLICY_HTML).toContain('No Voice Chat audio is collected or sent');
  });

  it('includes data retention, parental rights, and contact information', () => {
    expect(PRIVACY_POLICY_HTML).toContain('Data retention');
    expect(PRIVACY_POLICY_HTML).toContain('Parental rights');
    expect(PRIVACY_POLICY_HTML).toContain('privacy@bedtime-chronicles.com');
  });
});
