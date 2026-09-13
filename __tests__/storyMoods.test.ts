import { describe, it, expect } from 'vitest';
import {
  STORY_MOOD_CONFIGS,
  MOOD_FILTER_ITEMS,
  getStoryMood,
  getMoodBadgeInfo,
} from '../src/utils/storyMoods';
import { FEATURED_STORIES } from '../src/data/featuredStories';
import { Story } from '../src/types';

describe('storyMoods utility', () => {
  it('should define all 4 story moods with full UI configurations', () => {
    const moods = ['Peaceful', 'Curious', 'Energizing', 'Dreamy'] as const;
    moods.forEach((m) => {
      const config = STORY_MOOD_CONFIGS[m];
      expect(config).toBeDefined();
      expect(config.label).toBe(m);
      expect(config.emoji).toBeTruthy();
      expect(config.tagline).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.colorClass.bg).toBeTruthy();
      expect(config.colorClass.badgeBg).toBeTruthy();
    });
  });

  it('should include "All Moods" and all 4 moods in MOOD_FILTER_ITEMS', () => {
    expect(MOOD_FILTER_ITEMS).toHaveLength(5);
    expect(MOOD_FILTER_ITEMS[0].id).toBe('all');
    expect(MOOD_FILTER_ITEMS.map((item) => item.id)).toEqual([
      'all',
      'Peaceful',
      'Curious',
      'Energizing',
      'Dreamy',
    ]);
  });

  it('should accurately categorize known stories by bedtime mood', () => {
    const starryWhales = FEATURED_STORIES.find((s) => s.id === 'story-starry-whales');
    expect(starryWhales).toBeDefined();
    if (starryWhales) {
      expect(getStoryMood(starryWhales)).toBe('Peaceful');
    }

    const journeyCore = FEATURED_STORIES.find((s) => s.id === 'story-journey-core');
    expect(journeyCore).toBeDefined();
    if (journeyCore) {
      expect(getStoryMood(journeyCore)).toBe('Energizing');
    }

    const midnightExplorers = FEATURED_STORIES.find((s) => s.id === 'story-midnight-explorers');
    expect(midnightExplorers).toBeDefined();
    if (midnightExplorers) {
      expect(getStoryMood(midnightExplorers)).toBe('Curious');
    }

    const candyCloud = FEATURED_STORIES.find((s) => s.id === 'story-candy-cloud');
    expect(candyCloud).toBeDefined();
    if (candyCloud) {
      expect(getStoryMood(candyCloud)).toBe('Dreamy');
    }
  });

  it('should honor explicit mood field on story objects', () => {
    const customStory: Story = {
      id: 'test-story',
      title: 'Energizing Blast',
      category: 'Cosmic',
      theme: 'wonder',
      mode: 'adventure',
      ageRange: '4-6',
      heroId: 'hero-1',
      heroName: 'Nova',
      summary: 'A fast-paced rocket adventure',
      mood: 'Energizing',
      scenes: [],
    };
    expect(getStoryMood(customStory)).toBe('Energizing');
  });

  it('should return correct badge info with getMoodBadgeInfo', () => {
    const info = getMoodBadgeInfo('Peaceful');
    expect(info.emoji).toBe('🌙');
    expect(info.label).toBe('Peaceful');
    expect(info.tagline).toBe('Calm & Soothing');
  });
});
