import { describe, it, expect } from 'vitest';
import { LOADING_MESSAGES } from '@/constants/story-theme';

describe('Loading Messages Hook Logic', () => {
  it('returns valid message list for classic story mode', () => {
    const messages = LOADING_MESSAGES.classic;
    expect(messages).toBeDefined();
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toBe('Charting the stars...');
  });

  it('returns valid message list for madlibs story mode', () => {
    const messages = LOADING_MESSAGES.madlibs;
    expect(messages).toBeDefined();
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toBe('Mixing your silly words...');
  });

  it('returns valid message list for sleep story mode', () => {
    const messages = LOADING_MESSAGES.sleep;
    expect(messages).toBeDefined();
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toBe('Dimming the stars...');
  });
});
