/**
 * WCAG 2.1 contrast maths.
 *
 * This exists because `colors.test.ts` used to be named "provides WCAG AA
 * compliant… colors" while asserting nothing but string equality against hex
 * literals — a token could drift below the threshold and the suite would stay
 * green. These helpers let the assertion actually check what its name claims.
 *
 * Reference: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** WCAG AA minimum for body text. */
export const AA_NORMAL_TEXT = 4.5;
/** WCAG AA minimum for large text (>=18pt, or >=14pt bold) and UI components. */
export const AA_LARGE_TEXT = 3;

/** Parses `#rgb`, `#rrggbb`, `rgb(...)` or `rgba(...)`. Alpha is returned separately. */
export function parseColor(color: string): { rgb: Rgb; alpha: number } {
  const value = color.trim();

  const rgbaMatch = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i,
  );
  if (rgbaMatch) {
    return {
      rgb: {
        r: Number(rgbaMatch[1]),
        g: Number(rgbaMatch[2]),
        b: Number(rgbaMatch[3]),
      },
      alpha: rgbaMatch[4] === undefined ? 1 : Number(rgbaMatch[4]),
    };
  }

  const hex = value.replace(/^#/, '');
  if (hex.length === 3) {
    return {
      rgb: {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      },
      alpha: 1,
    };
  }
  if (hex.length === 6 || hex.length === 8) {
    return {
      rgb: {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      },
      alpha: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  }

  throw new Error(`Unsupported color format: ${color}`);
}

/**
 * Flattens a translucent foreground onto an opaque background.
 *
 * Most of this app's text is `rgba(255,255,255,α)` over a dark surface, so the
 * literal token tells you nothing about the contrast a viewer actually sees —
 * it has to be composited first.
 */
export function composite(foreground: string, background: string): Rgb {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  const a = fg.alpha;
  return {
    r: fg.rgb.r * a + bg.rgb.r * (1 - a),
    g: fg.rgb.g * a + bg.rgb.g * (1 - a),
    b: fg.rgb.b * a + bg.rgb.b * (1 - a),
  };
}

function channelLuminance(channel8Bit: number): number {
  const c = channel8Bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/**
 * Contrast ratio between a foreground and background colour, from 1 to 21.
 *
 * A translucent foreground is composited onto the background first, so passing
 * `rgba(255,255,255,0.4)` gives the ratio a viewer really sees rather than the
 * ratio pure white would have had.
 */
export function contrastRatio(foreground: string, background: string): number {
  const fgRgb = composite(foreground, background);
  const bgRgb = parseColor(background).rgb;
  const l1 = relativeLuminance(fgRgb);
  const l2 = relativeLuminance(bgRgb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when the pair clears the WCAG AA threshold for the given text size. */
export function meetsAA(
  foreground: string,
  background: string,
  { largeText = false }: { largeText?: boolean } = {},
): boolean {
  const threshold = largeText ? AA_LARGE_TEXT : AA_NORMAL_TEXT;
  return contrastRatio(foreground, background) >= threshold;
}
