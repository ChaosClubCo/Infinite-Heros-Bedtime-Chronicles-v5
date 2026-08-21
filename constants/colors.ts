const Colors = {
  primary: '#05051e',
  primaryLight: '#0a0a2e',
  secondary: '#1a1a3e',
  accent: '#6366f1',
  accentSoft: '#6366f133',
  deepIndigo: '#0f0fbd',
  purple: '#6366f1',
  purpleLight: '#818cf8',
  starlight: '#E8E4F0',
  textPrimary: '#FFFFFF',
  textSecondary: '#94a3b8',
  // WCAG AA on every surface it can land on, not just the darkest one.
  // The previous #6f7fa0 was tuned against `primary` (4.99:1) but measured
  // 4.14:1 on `secondary` — below the 4.5:1 threshold. This value keeps the
  // same hue and clears AA on primary, primaryLight, secondary and background
  // (worst case 4.55:1). Verified by constants/colors.test.ts.
  textMuted: '#7686a7',
  cardBg: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  glassBg: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  success: '#4CAF50',
  error: '#FF5252',
  overlay: 'rgba(5, 5, 30, 0.85)',
  background: '#02021a',
  light: {
    text: '#FFFFFF',
    background: '#05051e',
    tint: '#6366f1',
    tabIconDefault: '#64748b',
    tabIconSelected: '#6366f1',
  },
};

export default Colors;
