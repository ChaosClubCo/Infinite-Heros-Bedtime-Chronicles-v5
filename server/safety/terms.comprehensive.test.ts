import { describe, it, expect } from 'vitest';
import { SOFT_TERMS, ALLOWLIST_PHRASES, HARD_TERMS } from './terms';

describe('Server Safety Terms Comprehensive Suite', () => {
  it('exports HARD_TERMS mapping from shared package', () => {
    expect(HARD_TERMS).toBeDefined();
    expect(Array.isArray(HARD_TERMS.violence)).toBe(true);
    expect(Array.isArray(HARD_TERMS.sexual)).toBe(true);
  });

  it('exports SOFT_TERMS with expected safety categories', () => {
    expect(SOFT_TERMS).toBeDefined();
    expect(SOFT_TERMS.violence).toContain('fight');
    expect(SOFT_TERMS.scary).toContain('monster');
    expect(SOFT_TERMS.anxiety).toContain('lost');
    expect(SOFT_TERMS.illness).toContain('sick');
  });

  it('exports benign allowlist compound phrases to prevent false positive soft hits', () => {
    expect(ALLOWLIST_PHRASES).toContain('swordfish');
    expect(ALLOWLIST_PHRASES).toContain('bloodhound');
    expect(ALLOWLIST_PHRASES).toContain('blood orange');
    expect(ALLOWLIST_PHRASES).toContain('war paint');
  });
});
