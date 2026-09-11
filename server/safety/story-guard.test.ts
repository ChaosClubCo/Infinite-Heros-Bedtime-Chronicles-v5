import { describe, it, expect, beforeEach, vi } from 'vitest';
import { guardStory } from './story-guard';
import { getMetrics, resetMetrics } from '../metrics';

function cleanStory(overrides: Record<string, unknown> = {}) {
  return {
    title: 'The Cozy Cloud',
    parts: [
      { text: 'A gentle bunny hopped through a warm meadow and shared sweet berries with friends.', choices: ['Hop left', 'Hop right'], partIndex: 0 },
      { text: 'Everyone giggled happily and settled in for a peaceful, cozy rest.', partIndex: 1 },
    ],
    vocabWord: { word: 'meadow', definition: 'a grassy field full of flowers' },
    joke: 'Why did the bunny smile? Because sharing is sweet!',
    lesson: 'Sharing makes friendships grow.',
    tomorrowHook: 'Tomorrow they might find a rainbow.',
    rewardBadge: { emoji: '🐰', title: 'Kind Bunny', description: 'You shared with friends.' },
    ...overrides,
  };
}

function unsafeStory() {
  return cleanStory({ parts: [{ text: 'The villain pulled out a gun.', choices: [], partIndex: 0 }] });
}

/** A story with exactly one soft term: passes regex, but is "borderline". */
function borderlineStory() {
  return cleanStory({ parts: [{ text: 'The bunny felt a little scared, then smiled brightly.', choices: [], partIndex: 0 }] });
}

beforeEach(() => resetMetrics());

describe('guardStory', () => {
  it('returns the story untouched when it is clean', async () => {
    const regenerate = vi.fn();
    const result = await guardStory({ story: cleanStory(), mode: 'classic', regenerate });
    expect(result.outcome).toBe('clean');
    expect(result.story.title).toBe('The Cozy Cloud');
    expect(regenerate).not.toHaveBeenCalled();
    expect(getMetrics().safety.blocks).toBe(0);
  });

  it('regenerates once and returns the safe result', async () => {
    const regenerate = vi.fn().mockResolvedValue(cleanStory({ title: 'Regenerated Safe Story' }));
    const result = await guardStory({ story: unsafeStory(), mode: 'classic', regenerate });
    expect(result.outcome).toBe('regenerated');
    expect(result.story.title).toBe('Regenerated Safe Story');
    expect(regenerate).toHaveBeenCalledTimes(1);
    const m = getMetrics().safety;
    expect(m.blocks).toBe(1);
    expect(m.regenerations).toBe(1);
    expect(m.regenerationSuccesses).toBe(1);
    expect(m.byCategory.weapons).toBe(1);
  });

  it('falls back to a known-safe story when regeneration is still unsafe', async () => {
    const regenerate = vi.fn().mockResolvedValue(unsafeStory());
    const result = await guardStory({ story: unsafeStory(), mode: 'sleep', regenerate });
    expect(result.outcome).toBe('fallback');
    // Fallback is itself safe and complete.
    expect(Array.isArray(result.story.parts)).toBe(true);
    expect(regenerate).toHaveBeenCalledTimes(1);
    const m = getMetrics().safety;
    expect(m.fallbacks).toBe(1);
    expect(m.regenerationSuccesses).toBe(0);
  });

  it('falls back when regeneration throws (e.g. provider outage)', async () => {
    const regenerate = vi.fn().mockRejectedValue(new Error('all providers down'));
    const result = await guardStory({ story: unsafeStory(), mode: 'classic', regenerate });
    expect(result.outcome).toBe('fallback');
    expect(getMetrics().safety.fallbacks).toBe(1);
  });

  it('never generates more than twice total (one regeneration cap)', async () => {
    const regenerate = vi.fn().mockResolvedValue(unsafeStory());
    await guardStory({ story: unsafeStory(), mode: 'classic', regenerate });
    expect(regenerate).toHaveBeenCalledTimes(1); // + the initial generation = 2 total
  });

  describe('optional LLM layer', () => {
    it('runs only on a borderline story and blocks when the LLM says unsafe', async () => {
      const llmClassify = vi.fn().mockResolvedValue(false); // unsafe
      const regenerate = vi.fn().mockResolvedValue(cleanStory({ title: 'LLM Regenerated' }));
      const result = await guardStory({ story: borderlineStory(), mode: 'classic', regenerate, llmClassify });
      expect(llmClassify).toHaveBeenCalledTimes(1);
      expect(result.outcome).toBe('regenerated');
      expect(getMetrics().safety.llmChecks).toBe(1);
    });

    it('keeps the regex verdict (safe) when the LLM check fails', async () => {
      const llmClassify = vi.fn().mockRejectedValue(new Error('moderation provider down'));
      const regenerate = vi.fn();
      const result = await guardStory({ story: borderlineStory(), mode: 'classic', regenerate, llmClassify });
      expect(result.outcome).toBe('clean');
      expect(regenerate).not.toHaveBeenCalled();
      expect(getMetrics().safety.llmFailures).toBe(1);
    });

    it('does not run the LLM on a fully clean story (no soft signal)', async () => {
      const llmClassify = vi.fn().mockResolvedValue(true);
      await guardStory({ story: cleanStory(), mode: 'classic', regenerate: vi.fn(), llmClassify });
      expect(llmClassify).not.toHaveBeenCalled();
    });
  });
});
