import { describe, it, expect } from 'vitest';
import { STORY_SEEDS, type ContentTheme, type StorySeed } from './story-seeds';

describe('Story Seeds Library Constants', () => {
  it('contains exactly 50 curated story seeds', () => {
    expect(STORY_SEEDS).toHaveLength(50);
  });

  it('ensures all story seeds have unique IDs', () => {
    const idSet = new Set(STORY_SEEDS.map((s) => s.id));
    expect(idSet.size).toBe(STORY_SEEDS.length);
  });

  it('validates required fields across all story seeds', () => {
    const validThemes: ContentTheme[] = ['courage', 'kindness', 'friendship', 'wonder', 'imagination', 'comfort'];
    const validAgeRanges = ['2-4', '4-6', '6-8', '8-10'];
    const validModes = ['classic', 'madlibs', 'sleep'];

    STORY_SEEDS.forEach((seed: StorySeed) => {
      expect(seed.id).toBeTruthy();
      expect(seed.title).toBeTruthy();
      expect(seed.blurb).toBeTruthy();
      expect(validThemes).toContain(seed.theme);
      expect(validAgeRanges).toContain(seed.ageRange);
      expect(validModes).toContain(seed.mode);
      expect(seed.emoji).toBeTruthy();
    });
  });
});
