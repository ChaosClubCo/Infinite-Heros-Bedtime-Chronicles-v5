import { describe, it, expect } from 'vitest';
import {
  getTargetAgeRange,
  isAgeInRange,
  getAgeDistance,
  resolveSavedThemes,
  getRecommendedStories,
} from '../../src/utils/storyRecommendations';
import { FEATURED_STORIES } from '../../src/data/featuredStories';

describe('Story Recommendations Utility', () => {
  describe('Age Calculations', () => {
    it('maps numerical child age to target AgeRange correctly', () => {
      expect(getTargetAgeRange(2)).toBe('2-4');
      expect(getTargetAgeRange(3)).toBe('2-4');
      expect(getTargetAgeRange(4)).toBe('2-4');
      expect(getTargetAgeRange(5)).toBe('4-6');
      expect(getTargetAgeRange(6)).toBe('4-6');
      expect(getTargetAgeRange(7)).toBe('6-8');
      expect(getTargetAgeRange(8)).toBe('6-8');
      expect(getTargetAgeRange(9)).toBe('8-10');
      expect(getTargetAgeRange(10)).toBe('8-10');
    });

    it('identifies if child age falls within story age range', () => {
      expect(isAgeInRange('2-4', 3)).toBe(true);
      expect(isAgeInRange('2-4', 4)).toBe(true);
      expect(isAgeInRange('2-4', 5)).toBe(false);

      expect(isAgeInRange('4-6', 4)).toBe(true);
      expect(isAgeInRange('4-6', 5)).toBe(true);
      expect(isAgeInRange('4-6', 6)).toBe(true);
      expect(isAgeInRange('4-6', 7)).toBe(false);

      expect(isAgeInRange('6-8', 6)).toBe(true);
      expect(isAgeInRange('6-8', 7)).toBe(true);
      expect(isAgeInRange('6-8', 8)).toBe(true);

      expect(isAgeInRange('8-10', 8)).toBe(true);
      expect(isAgeInRange('8-10', 9)).toBe(true);
      expect(isAgeInRange('8-10', 10)).toBe(true);
    });

    it('computes distance from age range', () => {
      expect(getAgeDistance('4-6', 5)).toBe(0);
      expect(getAgeDistance('4-6', 3)).toBe(1);
      expect(getAgeDistance('4-6', 7)).toBe(1);
      expect(getAgeDistance('4-6', 8)).toBe(2);
    });
  });

  describe('Saved Themes Resolution', () => {
    it('resolves valid saved theme IDs into rich metadata', () => {
      const themes = resolveSavedThemes(['theme-cosmic-voyage', 'theme-ancient-forest']);
      expect(themes.length).toBe(2);
      expect(themes[0].title).toBe('Cosmic Voyage');
      expect(themes[0].category).toBe('cosmic');
      expect(themes[0].storyCategories).toContain('Cosmic Adventures');
      expect(themes[1].title).toBe('Ancient Forest');
      expect(themes[1].storyCategories).toContain('Forest & Nature');
    });

    it('provides fallback defaults when savedThemeIds is empty', () => {
      const themes = resolveSavedThemes([]);
      expect(themes.length).toBeGreaterThan(0);
      expect(themes.some((t) => t.id === 'theme-cosmic-voyage')).toBe(true);
    });
  });

  describe('Recommendations Filtering & Scoring', () => {
    it('returns top 4 stories matching child age and saved themes for age 5 with cosmic theme', () => {
      const results = getRecommendedStories({
        stories: FEATURED_STORIES,
        childAge: 5,
        savedThemeIds: ['theme-cosmic-voyage'],
        limit: 4,
      });

      expect(results.length).toBe(4);
      // For age 5, top recommendations should have age 4-6
      const topStory = results[0];
      expect(topStory.matchedAge).toBe(true);
      expect(topStory.score).toBeGreaterThan(0);
      expect(topStory.matchReasons.length).toBeGreaterThan(0);
    });

    it('recommends ocean stories when ocean/abyssal theme is saved', () => {
      const results = getRecommendedStories({
        stories: FEATURED_STORIES,
        childAge: 5,
        savedThemeIds: ['theme-abyssal-calm'],
        limit: 4,
      });

      expect(results.length).toBe(4);
      const hasOceanStory = results.some(
        (r) => r.story.category === 'Ocean Wonders' || r.story.title.includes('Whale')
      );
      expect(hasOceanStory).toBe(true);
    });

    it('recommends nature/forest stories when ancient forest theme is saved', () => {
      const results = getRecommendedStories({
        stories: FEATURED_STORIES,
        childAge: 5,
        savedThemeIds: ['theme-ancient-forest'],
        limit: 4,
      });

      expect(results.length).toBe(4);
      const hasForestStory = results.some(
        (r) => r.story.category === 'Forest & Nature' || r.story.title.includes('Hollow Tree')
      );
      expect(hasForestStory).toBe(true);
    });

    it('filters strictly to the selected saved theme when selectedThemeFilter is provided', () => {
      const results = getRecommendedStories({
        stories: FEATURED_STORIES,
        childAge: 5,
        savedThemeIds: ['theme-cosmic-voyage', 'theme-ancient-forest'],
        selectedThemeFilter: 'theme-ancient-forest',
        limit: 4,
      });

      expect(results.length).toBeGreaterThan(0);
      for (const item of results) {
        expect(item.matchedThemeId).toBe('theme-ancient-forest');
      }
    });

    it('adapts when child age changes (e.g. toddler age 3)', () => {
      const results = getRecommendedStories({
        stories: FEATURED_STORIES,
        childAge: 3,
        savedThemeIds: ['theme-abyssal-calm'],
        limit: 4,
      });

      expect(results.length).toBe(4);
      // Story with 2-4 ageRange should be prioritized
      const coralLagoon = results.find((r) => r.story.id === 'story-coral-lagoon');
      expect(coralLagoon).toBeDefined();
      expect(coralLagoon?.matchedAge).toBe(true);
    });
  });
});
