import { describe, it, expect } from 'vitest';
import { getFallbackStory, type FallbackMode } from './fallback-stories';

describe('Fallback Stories Engine', () => {
  const modes: FallbackMode[] = ['classic', 'madlibs', 'sleep'];

  modes.forEach((mode) => {
    it(`returns a valid, complete fallback story for mode: "${mode}"`, () => {
      const story = getFallbackStory(mode);
      expect(story).toBeDefined();
      expect(story.title).toBeTruthy();
      expect(story.parts).toHaveLength(3);
      expect(story.parts[0].partIndex).toBe(0);
      expect(story.parts[1].partIndex).toBe(1);
      expect(story.parts[2].partIndex).toBe(2);
      expect(story.vocabWord.word).toBeTruthy();
      expect(story.vocabWord.definition).toBeTruthy();
      expect(story.joke).toBeTruthy();
      expect(story.lesson).toBeTruthy();
      expect(story.tomorrowHook).toBeTruthy();
      expect(story.rewardBadge.emoji).toBeTruthy();
      expect(story.rewardBadge.title).toBeTruthy();
    });
  });

  it('defaults unknown modes to classic story template', () => {
    const unknownStory = getFallbackStory('invalid-mode-name');
    const classicStory = getFallbackStory('classic');
    expect(unknownStory.title).toBe(classicStory.title);
    expect(unknownStory.rewardBadge.title).toBe(classicStory.rewardBadge.title);
  });

  it('returns deep cloned copies to prevent template mutation', () => {
    const story1 = getFallbackStory('classic');
    const story2 = getFallbackStory('classic');
    const originalTitle = story2.title;
    story1.title = 'Mutated Title';
    expect(story2.title).toBe(originalTitle);
  });
});
