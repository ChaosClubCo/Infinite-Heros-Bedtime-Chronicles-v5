import { describe, it, expect } from 'vitest';
import {
  HARD_TERMS,
  HARD_BANNED_TERMS,
  containsUnsafeContent,
  buildTermRegex,
  SAFE_PLACEHOLDER_TEXT,
} from './safety-terms';

describe('shared/safety-terms', () => {
  describe('containsUnsafeContent', () => {
    it('flags text containing a HARD term', () => {
      expect(containsUnsafeContent('the hero found a gun in the cave')).toBe(true);
      expect(containsUnsafeContent('nobody would die tonight')).toBe(true);
      expect(containsUnsafeContent('a story about spider-man')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(containsUnsafeContent('A GUN was there')).toBe(true);
    });

    it('does not flag benign text', () => {
      expect(containsUnsafeContent('the brave hero shared a warm cookie')).toBe(false);
      expect(containsUnsafeContent('')).toBe(false);
    });

    it('respects word boundaries — no substring false positives', () => {
      // "die" must not match "dye"/"diet"; "gun" must not match "begun";
      // "dead" must not match "already"; "hell" must not match "hello".
      expect(containsUnsafeContent('she dyed the diet-friendly cloth')).toBe(false);
      expect(containsUnsafeContent('the story had begun already')).toBe(false);
      expect(containsUnsafeContent('hello there, little one')).toBe(false);
    });

    it('matches multi-word brands as whole phrases only', () => {
      expect(containsUnsafeContent('they watched star wars')).toBe(true);
      // "star" and "wars" apart should not trip the phrase matcher.
      expect(containsUnsafeContent('a bright star shone in the sky')).toBe(false);
    });
  });

  describe('HARD_BANNED_TERMS', () => {
    it('is the de-duplicated union of every HARD_TERMS category', () => {
      const union = Object.values(HARD_TERMS).flat();
      expect(new Set(HARD_BANNED_TERMS)).toEqual(new Set(union));
      expect(HARD_BANNED_TERMS.length).toBe(new Set(HARD_BANNED_TERMS).size);
    });

    it('is non-empty', () => {
      expect(HARD_BANNED_TERMS.length).toBeGreaterThan(0);
    });
  });

  describe('buildTermRegex', () => {
    it('escapes regex metacharacters in terms', () => {
      const re = buildTermRegex(['coca-cola']);
      expect(re.test('a can of coca-cola')).toBe(true);
      // The '.' is not treated as a wildcard.
      expect(buildTermRegex(['a.b']).test('axb')).toBe(false);
    });
  });

  describe('SAFE_PLACEHOLDER_TEXT', () => {
    it('is itself safe', () => {
      expect(containsUnsafeContent(SAFE_PLACEHOLDER_TEXT)).toBe(false);
    });
  });
});
