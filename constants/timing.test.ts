import { describe, it, expect } from 'vitest';
import {
  MS_PER_WORD,
  MIN_READING_TIME_MS,
  LOADING_MESSAGE_INTERVAL_MS,
  VIDEO_POLL_INTERVAL_MS,
  TTS_PREVIEW_TIMEOUT_MS,
} from './timing';

describe('Application Timing Constants', () => {
  it('exports positive reading pacing constants', () => {
    expect(MS_PER_WORD).toBe(300);
    expect(MIN_READING_TIME_MS).toBe(8000);
    expect(MS_PER_WORD).toBeGreaterThan(0);
    expect(MIN_READING_TIME_MS).toBeGreaterThan(0);
  });

  it('exports UI message and polling interval constants', () => {
    expect(LOADING_MESSAGE_INTERVAL_MS).toBe(2500);
    expect(VIDEO_POLL_INTERVAL_MS).toBe(5000);
    expect(TTS_PREVIEW_TIMEOUT_MS).toBe(8000);
  });
});
