import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * WCAG 1.4.4 (Resize Text) guard.
 *
 * React Native's `allowFontScaling` defaults to true, so the app honours the
 * device's own text-size setting for free. Setting it to `false` — a common
 * reflex when large text breaks a layout — silently opts the app out of that,
 * and the in-app "Story Text Size" setting is explicitly a multiplier on top of
 * the OS scale rather than a replacement for it.
 *
 * If a layout genuinely cannot absorb large text, fix the layout (wrap, scroll,
 * or use `maxFontSizeMultiplier`) instead of disabling scaling outright.
 */

const ROOTS = ['app', 'components', 'lib'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, acc);
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry)) && !entry.includes('.test.')) {
      acc.push(full);
    }
  }
  return acc;
}

describe('allowFontScaling guard', () => {
  it('is never disabled anywhere in the client source', () => {
    const offenders: string[] = [];

    for (const root of ROOTS) {
      for (const file of collectSourceFiles(root)) {
        const source = readFileSync(file, 'utf8');
        // Matches allowFontScaling={false} and allowFontScaling: false,
        // tolerating whitespace between the tokens.
        if (/allowFontScaling\s*[=:]\s*\{?\s*false/.test(source)) {
          offenders.push(file);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
