import { describe, it, expect } from 'vitest';
import Colors from './colors';
import { contrastRatio, AA_NORMAL_TEXT, AA_LARGE_TEXT } from './contrast';

describe('Cosmic Design System Colors', () => {
  it('exports required primary and accent palette tokens', () => {
    expect(Colors.primary).toBe('#05051e');
    expect(Colors.primaryLight).toBe('#0a0a2e');
    expect(Colors.secondary).toBe('#1a1a3e');
    expect(Colors.accent).toBe('#6366f1');
    expect(Colors.starlight).toBe('#E8E4F0');
  });

  // These assertions compute real WCAG ratios rather than comparing hex
  // strings. The previous version of this block was named for AA compliance
  // but only checked string equality, so a token could regress below the
  // threshold without failing anything.
  describe('WCAG AA text contrast', () => {
    const surfaces: [string, string][] = [
      ['primary', Colors.primary],
      ['primaryLight', Colors.primaryLight],
      ['secondary', Colors.secondary],
      ['background', Colors.background],
    ];

    it.each(surfaces)('textPrimary clears AA on %s', (_name, surface) => {
      expect(contrastRatio(Colors.textPrimary, surface)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });

    it.each(surfaces)('textSecondary clears AA on %s', (_name, surface) => {
      expect(contrastRatio(Colors.textSecondary, surface)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });

    it.each(surfaces)('textMuted clears AA on %s', (_name, surface) => {
      expect(contrastRatio(Colors.textMuted, surface)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });

    it('accent clears the AA large-text / UI-component threshold on the primary surface', () => {
      // The accent is used for chips, icons and emphasis rather than body copy,
      // so 3:1 is the applicable bar.
      expect(contrastRatio(Colors.accent, Colors.primary)).toBeGreaterThanOrEqual(AA_LARGE_TEXT);
    });

    it('still exports the exact token values the palette is built on', () => {
      expect(Colors.textPrimary).toBe('#FFFFFF');
      expect(Colors.textSecondary).toBe('#94a3b8');
      expect(Colors.textMuted).toBe('#7686a7');
    });
  });

  it('provides glassmorphism background and border tokens', () => {
    expect(Colors.cardBg).toBe('rgba(255, 255, 255, 0.05)');
    expect(Colors.cardBorder).toBe('rgba(255, 255, 255, 0.1)');
    expect(Colors.glassBg).toBe('rgba(255, 255, 255, 0.03)');
    expect(Colors.glassBorder).toBe('rgba(255, 255, 255, 0.1)');
  });

  it('includes light theme fallback mapping', () => {
    expect(Colors.light).toBeDefined();
    expect(Colors.light.background).toBe('#05051e');
    expect(Colors.light.tint).toBe('#6366f1');
  });
});
