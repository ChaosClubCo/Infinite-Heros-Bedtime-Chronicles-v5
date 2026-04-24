import { describe, it, expect } from 'vitest';
import { sanitizeString, validateMadlibWords, VALID_MODES, VALID_DURATIONS } from './validation';
import { getPartCount, getWordCount } from './prompts';
import { checkRateLimit, resetRateLimits } from './rate-limit';

describe('sanitizeString', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizeString(123, 100)).toBe('');
    expect(sanitizeString(null, 100)).toBe('');
    expect(sanitizeString(undefined, 100)).toBe('');
    expect(sanitizeString({}, 100)).toBe('');
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

  it('preserves valid strings under max length', () => {
    expect(sanitizeString('Captain Sparkle', 500)).toBe('Captain Sparkle');
  });

  it('handles max length of zero', () => {
    expect(sanitizeString('hello', 0)).toBe('');
  });

  it('handles strings exactly at max length', () => {
    const str = 'a'.repeat(100);
    expect(sanitizeString(str, 100)).toHaveLength(100);
  });

  it('handles boolean input', () => {
    expect(sanitizeString(true, 100)).toBe('');
    expect(sanitizeString(false, 100)).toBe('');
  });

  it('handles array input', () => {
    expect(sanitizeString(['a', 'b'], 100)).toBe('');
  });

  it('trims after truncation', () => {
    expect(sanitizeString('hello      world', 6)).toBe('hello');
  });
});

describe('validateMadlibWords', () => {
  it('returns undefined for null/undefined', () => {
    expect(validateMadlibWords(null)).toBeUndefined();
    expect(validateMadlibWords(undefined)).toBeUndefined();
  });

  it('returns undefined for non-objects', () => {
    expect(validateMadlibWords('string')).toBeUndefined();
    expect(validateMadlibWords(123)).toBeUndefined();
    expect(validateMadlibWords(true)).toBeUndefined();
  });

  it('returns undefined for arrays', () => {
    expect(validateMadlibWords(['a', 'b'])).toBeUndefined();
  });

  it('returns undefined when more than 20 keys', () => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < 21; i++) obj[`key${i}`] = `value${i}`;
    expect(validateMadlibWords(obj)).toBeUndefined();
  });

  it('accepts valid word objects', () => {
    const words = { noun: 'dragon', adjective: 'sparkly', verb: 'flying' };
    const result = validateMadlibWords(words);
    expect(result).toEqual(words);
  });

  it('truncates long values to 100 chars', () => {
    const words = { noun: 'a'.repeat(200) };
    const result = validateMadlibWords(words);
    expect(result?.noun).toHaveLength(100);
  });

  it('skips non-string values', () => {
    const words = { noun: 'dragon', number: 42, bool: true } as Record<string, unknown>;
    const result = validateMadlibWords(words);
    expect(result).toEqual({ noun: 'dragon' });
  });

  it('returns undefined when no valid string values exist', () => {
    const words = { number: 42, bool: true } as Record<string, unknown>;
    expect(validateMadlibWords(words)).toBeUndefined();
  });

  it('accepts exactly 20 keys', () => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < 20; i++) obj[`key${i}`] = `value${i}`;
    const result = validateMadlibWords(obj);
    expect(result).toBeDefined();
    expect(Object.keys(result!)).toHaveLength(20);
  });

  it('handles empty object', () => {
    expect(validateMadlibWords({})).toBeUndefined();
  });

  it('preserves keys under 100 chars', () => {
    const key = 'a'.repeat(99);
    const words = { [key]: 'value' };
    const result = validateMadlibWords(words);
    expect(result).toHaveProperty(key, 'value');
  });
});

describe('rate limiter', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows first request from an IP', () => {
    expect(checkRateLimit('192.168.1.1')).toBe(true);
  });

  it('allows requests up to the limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('192.168.1.2')).toBe(true);
    }
  });

  it('blocks requests exceeding the limit', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('192.168.1.3');
    }
    expect(checkRateLimit('192.168.1.3')).toBe(false);
  });

  it('tracks different IPs independently', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('192.168.1.4');
    }
    expect(checkRateLimit('192.168.1.5')).toBe(true);
  });
});

describe('input validation constants', () => {
  it('recognizes all valid modes', () => {
    expect(VALID_MODES).toContain('classic');
    expect(VALID_MODES).toContain('madlibs');
    expect(VALID_MODES).toContain('sleep');
    expect(VALID_MODES).toHaveLength(3);
  });

  it('recognizes all valid durations', () => {
    expect(VALID_DURATIONS).toContain('short');
    expect(VALID_DURATIONS).toContain('medium-short');
    expect(VALID_DURATIONS).toContain('medium');
    expect(VALID_DURATIONS).toContain('long');
    expect(VALID_DURATIONS).toContain('epic');
    expect(VALID_DURATIONS).toHaveLength(5);
  });

  it('rejects invalid modes', () => {
    expect(VALID_MODES).not.toContain('turbo');
    expect(VALID_MODES).not.toContain('');
    expect(VALID_MODES).not.toContain('CLASSIC');
  });

  it('rejects invalid durations', () => {
    expect(VALID_DURATIONS).not.toContain('extra-long');
    expect(VALID_DURATIONS).not.toContain('');
    expect(VALID_DURATIONS).not.toContain('SHORT');
  });
});

describe('getPartCount', () => {
  it('returns correct part count for each duration', () => {
    expect(getPartCount('short')).toBe(3);
    expect(getPartCount('medium-short')).toBe(4);
    expect(getPartCount('medium')).toBe(5);
    expect(getPartCount('long')).toBe(6);
    expect(getPartCount('epic')).toBe(7);
  });

  it('defaults to 5 for unknown duration', () => {
    expect(getPartCount('unknown')).toBe(5);
    expect(getPartCount('')).toBe(5);
  });
});

describe('getWordCount', () => {
  it('returns correct word count range for each duration', () => {
    expect(getWordCount('short')).toBe('200-300');
    expect(getWordCount('medium-short')).toBe('350-450');
    expect(getWordCount('medium')).toBe('500-650');
    expect(getWordCount('long')).toBe('750-950');
    expect(getWordCount('epic')).toBe('1000-1300');
  });

  it('defaults to medium range for unknown duration', () => {
    expect(getWordCount('unknown')).toBe('500-650');
  });
});

describe('TTS filename validation', () => {
  const TTS_FILENAME_REGEX = /^[a-f0-9]+\.mp3$/;

  it('accepts valid hex filenames with .mp3 extension', () => {
    expect(TTS_FILENAME_REGEX.test('abc123def456.mp3')).toBe(true);
  });

  it('rejects filenames with uppercase hex', () => {
    expect(TTS_FILENAME_REGEX.test('ABC123.mp3')).toBe(false);
  });

  it('rejects filenames without .mp3 extension', () => {
    expect(TTS_FILENAME_REGEX.test('abc123')).toBe(false);
  });

  it('rejects path traversal attempts', () => {
    expect(TTS_FILENAME_REGEX.test('../abc123.mp3')).toBe(false);
    expect(TTS_FILENAME_REGEX.test('abc/123.mp3')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(TTS_FILENAME_REGEX.test('')).toBe(false);
  });
});

describe('video ID validation', () => {
  const VIDEO_ID_REGEX = /^[a-f0-9]+$/;

  it('accepts valid hex IDs', () => {
    expect(VIDEO_ID_REGEX.test('abc123')).toBe(true);
  });

  it('rejects uppercase hex', () => {
    expect(VIDEO_ID_REGEX.test('ABC123')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(VIDEO_ID_REGEX.test('')).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(VIDEO_ID_REGEX.test('xyz')).toBe(false);
  });
});
