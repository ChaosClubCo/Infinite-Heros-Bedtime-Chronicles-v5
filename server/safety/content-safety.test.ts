import { describe, it, expect } from 'vitest';
import { moderateStory, SOFT_BLOCK_THRESHOLD } from './content-safety';
import { getFallbackStory } from './fallback-stories';

/** A wholesome, structurally-complete story that should always pass. */
function cleanStory(overrides: Record<string, unknown> = {}) {
  return {
    title: 'The Cozy Cloud',
    parts: [
      { text: 'A gentle bunny hopped through a warm meadow toward a reward of sweet berries.', choices: ['Hop left', 'Hop right'], partIndex: 0 },
      { text: 'The bunny shared the berries with friendly birds and everyone giggled happily.', partIndex: 1 },
    ],
    vocabWord: { word: 'meadow', definition: 'a grassy field full of flowers' },
    joke: 'Why did the bunny smile? Because sharing is sweet!',
    lesson: 'Sharing makes friendships grow.',
    tomorrowHook: 'Tomorrow they might find a rainbow.',
    rewardBadge: { emoji: '🐰', title: 'Kind Bunny', description: 'You shared with friends.' },
    ...overrides,
  };
}

describe('moderateStory — clean content', () => {
  it('passes a wholesome, complete story', () => {
    const v = moderateStory(cleanStory());
    expect(v.safe).toBe(true);
    expect(v.matches).toEqual([]);
  });

  it('does not flag benign words that merely contain a banned substring', () => {
    // "reward"/"toward"/"warm" contain "war"; "already" contains "read"/"dead".
    const v = moderateStory(cleanStory({
      title: 'A Warm Reward',
      lesson: 'Moving toward kindness is already its own reward.',
    }));
    expect(v.safe).toBe(true);
  });
});

describe('moderateStory — HARD tier', () => {
  it('rejects a weapon reference', () => {
    const v = moderateStory(cleanStory({
      parts: [{ text: 'The villain pulled out a gun.', choices: [], partIndex: 0 }],
    }));
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('weapons');
  });

  it('rejects death themes', () => {
    const v = moderateStory(cleanStory({
      parts: [{ text: 'Sadly, the old dog would die that night.', choices: [], partIndex: 0 }],
    }));
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('death');
  });

  it('rejects real-world brands as whole phrases', () => {
    const v = moderateStory(cleanStory({ joke: 'It was just like star wars!' }));
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('brands');
  });

  it('does not treat an allowlisted compound as a soft hit', () => {
    const v = moderateStory(cleanStory({
      parts: [{ text: 'A friendly swordfish waved a fin hello.', choices: [], partIndex: 0 }],
    }));
    expect(v.safe).toBe(true);
    expect(v.matches.find((m) => m.term === 'sword')).toBeUndefined();
  });
});

describe('moderateStory — SOFT tier & thresholds', () => {
  it('allows a single soft term in non-strict mode', () => {
    const v = moderateStory(cleanStory({
      parts: [{ text: 'The bunny felt a little scared, then smiled.', choices: [], partIndex: 0 }],
    }));
    expect(v.safe).toBe(true);
  });

  it('rejects a single soft term under strict mode', () => {
    const v = moderateStory(
      cleanStory({ parts: [{ text: 'The bunny felt a little scared, then smiled.', choices: [], partIndex: 0 }] }),
      { strict: true },
    );
    expect(v.safe).toBe(false);
  });

  it(`rejects when ${SOFT_BLOCK_THRESHOLD} distinct soft terms co-occur`, () => {
    const v = moderateStory(cleanStory({
      parts: [{ text: 'Alone in the dark, the little one felt scared and worried.', choices: [], partIndex: 0 }],
    }));
    expect(v.safe).toBe(false);
  });
});

describe('moderateStory — structural layer', () => {
  it('rejects a missing parts array', () => {
    const { parts, ...noParts } = cleanStory();
    void parts;
    const v = moderateStory(noParts);
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('structural');
  });

  it('rejects an empty part text', () => {
    const v = moderateStory(cleanStory({ parts: [{ text: '   ', choices: [], partIndex: 0 }] }));
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('structural');
  });

  it('rejects a missing required field', () => {
    const v = moderateStory(cleanStory({ joke: '' }));
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('structural');
  });

  it('rejects a non-object input', () => {
    expect(moderateStory(null).safe).toBe(false);
    expect(moderateStory('a string').safe).toBe(false);
    expect(moderateStory([]).safe).toBe(false);
  });

  it('rejects a part longer than the moderation scan window (no unscanned tail can reach the child)', () => {
    // ~5280 chars: over the 4000-char scan window but under the previous 8000
    // oversize threshold — the exact gap where an unmoderated tail used to pass.
    const longText = 'The gentle bunny hopped happily. '.repeat(160);
    const v = moderateStory(cleanStory({ parts: [{ text: longText, choices: [], partIndex: 0 }] }));
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('structural');
  });

  it('catches a HARD term hidden past the scan window via the oversize gate', () => {
    const filler = 'The bunny smiled warmly. '.repeat(180); // > 4000 chars
    const v = moderateStory(cleanStory({ parts: [{ text: `${filler} gun`, choices: [], partIndex: 0 }] }));
    expect(v.safe).toBe(false);
  });

  it('term-scans rewardBadge.emoji (rendered raw to the child)', () => {
    const v = moderateStory(cleanStory({
      rewardBadge: { emoji: 'gun', title: 'Star', description: 'You earned a star.' },
    }));
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('weapons');
  });

  it('rejects an oversize rewardBadge.emoji (a phrase masquerading as an emoji)', () => {
    const v = moderateStory(cleanStory({
      rewardBadge: { emoji: 'you are a winner today', title: 'Star', description: 'You earned a star.' },
    }));
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('structural');
  });

  it('accepts a normal emoji, including a ZWJ sequence', () => {
    const v = moderateStory(cleanStory({
      rewardBadge: { emoji: '👩‍🚀', title: 'Star', description: 'You earned a star.' },
    }));
    expect(v.safe).toBe(true);
  });
});

describe('fallback stories are themselves safe', () => {
  it.each(['classic', 'madlibs', 'sleep'])('the %s fallback passes moderation (even strict)', (mode) => {
    const story = getFallbackStory(mode);
    expect(moderateStory(story).safe).toBe(true);
    expect(moderateStory(story, { strict: true }).safe).toBe(true);
  });
});

describe('moderateStory — leakage & PII', () => {
  it('rejects model/prompt leakage', () => {
    const v = moderateStory(cleanStory({ lesson: 'As an AI language model, I cannot do that.' }));
    expect(v.safe).toBe(false);
    expect(v.categories).toContain('leakage');
  });

  it('rejects URLs and emails in output', () => {
    const url = moderateStory(cleanStory({ tomorrowHook: 'Visit https://example.com for more.' }));
    expect(url.safe).toBe(false);
    expect(url.categories).toContain('pii');

    const email = moderateStory(cleanStory({ tomorrowHook: 'Email us at hi@example.com.' }));
    expect(email.safe).toBe(false);
    expect(email.categories).toContain('pii');
  });
});
