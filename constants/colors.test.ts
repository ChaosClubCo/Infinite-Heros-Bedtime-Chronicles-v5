import { describe, it, expect } from 'vitest';
import Colors from './colors';

describe('Cosmic Design System Colors', () => {
  it('exports required primary and accent palette tokens', () => {
    expect(Colors.primary).toBe('#05051e');
    expect(Colors.primaryLight).toBe('#0a0a2e');
    expect(Colors.secondary).toBe('#1a1a3e');
    expect(Colors.accent).toBe('#6366f1');
    expect(Colors.starlight).toBe('#E8E4F0');
  });

  it('provides WCAG AA compliant muted and secondary text colors', () => {
    expect(Colors.textPrimary).toBe('#FFFFFF');
    expect(Colors.textSecondary).toBe('#94a3b8');
    expect(Colors.textMuted).toBe('#6f7fa0');
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
