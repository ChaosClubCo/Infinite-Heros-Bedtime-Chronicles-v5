import { describe, expect, it } from 'vitest';
import { StoryRequestSchema, SuggestSettingsRequestSchema } from './validation';

describe('provider data minimization', () => {
  it('discards explicit child name from story requests', () => {
    const result = StoryRequestSchema.parse({
      heroName: 'Moon Guardian',
      childName: 'Real Child Name',
      duration: 'short',
      mode: 'classic',
    });

    expect(result.childName).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('Real Child Name');
  });

  it('discards explicit child name and age from suggestion requests', () => {
    const result = SuggestSettingsRequestSchema.parse({
      heroName: 'Moon Guardian',
      childName: 'Real Child Name',
      childAge: 7,
      hour: 20,
    });

    expect(result.childName).toBeUndefined();
    expect(result.childAge).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('Real Child Name');
    expect(JSON.stringify(result)).not.toContain('7');
  });
});
