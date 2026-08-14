import { describe, it, expect } from 'vitest';
import {
  MODE_THEME,
  MODE_VOICES,
  LOADING_MESSAGES,
  SPEED_RATES,
  type StoryMode,
} from './story-theme';

describe('Story Theme and Mode Configurations', () => {
  const modes: StoryMode[] = ['classic', 'madlibs', 'sleep'];

  it('defines themes for all three story modes', () => {
    modes.forEach((mode) => {
      const theme = MODE_THEME[mode];
      expect(theme).toBeDefined();
      expect(theme.accent).toBeTruthy();
      expect(theme.accentLight).toBeTruthy();
      expect(theme.gradient).toHaveLength(3);
      expect(theme.orbColor).toBeTruthy();
      expect(theme.choiceColors).toHaveLength(3);
    });
  });

  it('defines voice profiles for all three story modes', () => {
    modes.forEach((mode) => {
      const voices = MODE_VOICES[mode];
      expect(voices).toBeDefined();
      expect(voices.length).toBeGreaterThanOrEqual(3);
      voices.forEach((v) => {
        expect(v.id).toBeTruthy();
        expect(v.label).toBeTruthy();
        expect(v.accent).toBeTruthy();
      });
    });
  });

  it('provides kid-friendly loading messages for all story modes', () => {
    modes.forEach((mode) => {
      const msgs = LOADING_MESSAGES[mode];
      expect(msgs).toBeDefined();
      expect(msgs.length).toBeGreaterThanOrEqual(5);
    });
  });

  it('defines narration playback speed rates', () => {
    expect(SPEED_RATES.gentle).toBe(0.8);
    expect(SPEED_RATES.medium).toBe(0.9);
    expect(SPEED_RATES.normal).toBe(1.0);
  });
});
