import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validateMadlibWords,
  VALID_MODES,
  VALID_DURATIONS,
  StoryRequestSchema,
  AvatarRequestSchema,
  SceneRequestSchema,
  TtsRequestSchema,
  parseStoryRequest,
} from './validation';

describe('sanitizeString', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizeString(123, 100)).toBe('');
    expect(sanitizeString(null, 100)).toBe('');
    expect(sanitizeString(undefined, 100)).toBe('');
  });

  it('truncates strings exceeding max length', () => {
    expect(sanitizeString('a'.repeat(600), 500)).toHaveLength(500);
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ', 100)).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeString('', 100)).toBe('');
  });
});

describe('validateMadlibWords', () => {
  it('returns undefined for null input', () => {
    expect(validateMadlibWords(null)).toBeUndefined();
  });

  it('returns undefined for non-object input', () => {
    expect(validateMadlibWords('string')).toBeUndefined();
    expect(validateMadlibWords([1, 2])).toBeUndefined();
  });

  it('returns sanitized key-value pairs', () => {
    expect(validateMadlibWords({ noun: 'cat', verb: 'jump' })).toEqual({ noun: 'cat', verb: 'jump' });
  });

  it('limits to 20 keys', () => {
    const input: Record<string, string> = {};
    for (let i = 0; i < 25; i++) input[`key${i}`] = 'val';
    expect(validateMadlibWords(input)).toBeUndefined();
  });

  it('skips keys longer than 100 chars', () => {
    const result = validateMadlibWords({ ['k'.repeat(200)]: 'v'.repeat(200) });
    // Keys over 100 chars are skipped entirely, so result is empty → undefined
    expect(result).toBeUndefined();
  });

  it('truncates values to 100 chars', () => {
    const result = validateMadlibWords({ noun: 'v'.repeat(200) });
    expect(Object.values(result!)[0]).toHaveLength(100);
  });
});

describe('StoryRequestSchema', () => {
  it('validates a minimal story request', () => {
    const result = StoryRequestSchema.safeParse({ heroName: 'Luna' });
    expect(result.success).toBe(true);
  });

  it('rejects missing heroName', () => {
    const result = StoryRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('applies defaults for optional fields', () => {
    const result = StoryRequestSchema.parse({ heroName: 'Luna' });
    expect(VALID_MODES).toContain(result.mode);
    expect(VALID_DURATIONS).toContain(result.duration);
  });

  it('truncates long strings', () => {
    const result = StoryRequestSchema.parse({ heroName: 'a'.repeat(600) });
    expect(result.heroName.length).toBeLessThanOrEqual(500);
  });
});

describe('AvatarRequestSchema', () => {
  it('validates with heroName', () => {
    const result = AvatarRequestSchema.safeParse({ heroName: 'Luna' });
    expect(result.success).toBe(true);
  });

  it('rejects missing heroName', () => {
    const result = AvatarRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('SceneRequestSchema', () => {
  it('validates with sceneText', () => {
    const result = SceneRequestSchema.safeParse({ sceneText: 'A magical forest' });
    expect(result.success).toBe(true);
  });

  it('rejects missing sceneText', () => {
    const result = SceneRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('TtsRequestSchema', () => {
  it('validates with text', () => {
    const result = TtsRequestSchema.safeParse({ text: 'Hello world' });
    expect(result.success).toBe(true);
  });

  it('rejects empty text', () => {
    const result = TtsRequestSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
  });

  it('lowercases voice', () => {
    const result = TtsRequestSchema.parse({ text: 'hello', voice: 'MOONBEAM' });
    expect(result.voice).toBe('moonbeam');
  });
});

describe('parseStoryRequest', () => {
  it('returns parsed result for valid body', () => {
    const result = parseStoryRequest({ heroName: 'Luna', mode: 'sleep' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.heroName).toBe('Luna');
      expect(result.data.mode).toBe('sleep');
    }
  });

  it('returns error for missing heroName', () => {
    const result = parseStoryRequest({});
    expect(result.success).toBe(false);
  });
});
