import { describe, it, expect } from 'vitest';
import { chatSafetyModerationProvider } from './safety-provider';
import { isSafetyInspection } from '../../shared/media/schemas';

describe('chatSafetyModerationProvider', () => {
  it('approves a calm, on-policy reply and returns the original text', async () => {
    const result = await chatSafetyModerationProvider.moderate({
      text: 'Let us imagine a gentle garden full of friendly fireflies.',
      subjectType: 'realtime-utterance',
    });

    expect(isSafetyInspection(result.inspection)).toBe(true);
    expect(result.inspection.outcome).toBe('approved');
    expect(result.inspection.subjectType).toBe('realtime-utterance');
    expect(result.text).toContain('gentle garden');
  });

  it('falls back to a known-safe reply when the text contains a HARD-banned term', async () => {
    const result = await chatSafetyModerationProvider.moderate({
      text: 'The dragon pulled out a gun and killed the villager.',
      subjectType: 'chat-reply',
    });

    expect(result.inspection.outcome).toBe('fallback');
    expect(result.inspection.categories.length).toBeGreaterThan(0);
    expect(result.text).not.toContain('gun');
  });

  it('falls back on empty input', async () => {
    const result = await chatSafetyModerationProvider.moderate({
      text: '',
      subjectType: 'chat-reply',
    });

    expect(result.inspection.outcome).toBe('fallback');
  });

  it('produces a fresh inspection id per call', async () => {
    const a = await chatSafetyModerationProvider.moderate({ text: 'hello there', subjectType: 'chat-reply' });
    const b = await chatSafetyModerationProvider.moderate({ text: 'hello there', subjectType: 'chat-reply' });
    expect(a.inspection.id).not.toBe(b.inspection.id);
  });
});
