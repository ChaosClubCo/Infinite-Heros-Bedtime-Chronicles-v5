import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StoryPlayerControls } from '@/components/StoryPlayerControls';

const theme = {
  accent: '#6366f1',
  choiceColors: [['#6366f1', '#818cf8']] as [string, string][],
};

const modeVoices = [
  { id: 'captain', label: 'Captain', accent: 'British' },
  { id: 'aurora', label: 'Aurora', accent: 'American' },
];

const baseProps = {
  isSpeaking: false,
  audioLoading: false,
  audioDuration: 0,
  audioPosition: 0,
  playbackSpeed: 'medium',
  currentVoice: 'captain',
  modeVoices,
  currentPartIndex: 1,
  isLastPart: false,
  storyMode: 'classic',
  theme,
  musicMuted: false,
  musicLoading: false,
  musicPlaying: true,
  bottomInset: 0,
  onSpeedCycle: jest.fn(),
  onVoiceCycle: jest.fn(),
  onPrevPart: jest.fn(),
  onNextPart: jest.fn(),
  onSpeakToggle: jest.fn(),
  onToggleMusic: jest.fn(),
  onComplete: jest.fn(),
};

const renderControls = (overrides = {}) =>
  render(<StoryPlayerControls {...baseProps} {...overrides} />);

describe('StoryPlayerControls accessibility', () => {
  it('labels every interactive control', async () => {
    await renderControls();

    // Every control the player exposes, by the testID it ships with.
    const controlTestIds = [
      'speed-cycle-btn',
      'voice-cycle-btn',
      'prev-part-btn',
      'play-pause-btn',
      'next-part-btn',
      'narration-toggle-btn',
      'music-toggle-btn',
    ];

    for (const testID of controlTestIds) {
      const node = screen.getByTestId(testID);
      expect(node.props.accessibilityRole).toBeTruthy();
      expect(node.props.accessibilityLabel).toBeTruthy();
    }
  });

  it('carries playback state in the play/pause label, not just the icon', async () => {
    await renderControls({ isSpeaking: false });
    expect(screen.getByTestId('play-pause-btn').props.accessibilityLabel).toBe('Play narration');

    await renderControls({ isSpeaking: true });
    expect(screen.getByTestId('play-pause-btn').props.accessibilityLabel).toBe('Pause narration');
  });

  it('announces the loading state of narration', async () => {
    await renderControls({ audioLoading: true });
    const btn = screen.getByTestId('play-pause-btn');
    expect(btn.props.accessibilityLabel).toBe('Loading narration');
    expect(btn.props.accessibilityState).toMatchObject({ busy: true });
  });

  it('marks the previous-part control disabled on the first part', async () => {
    await renderControls({ currentPartIndex: 0 });
    expect(screen.getByTestId('prev-part-btn').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('marks the next-part control disabled on the last part', async () => {
    await renderControls({ isLastPart: true });
    expect(screen.getByTestId('next-part-btn').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('describes the music toggle by what pressing it will do', async () => {
    await renderControls({ musicMuted: false });
    expect(screen.getByTestId('music-toggle-btn').props.accessibilityLabel).toBe(
      'Mute background music',
    );

    await renderControls({ musicMuted: true });
    expect(screen.getByTestId('music-toggle-btn').props.accessibilityLabel).toBe(
      'Unmute background music',
    );
  });

  it('names the current voice rather than only its accent code', async () => {
    await renderControls({ currentVoice: 'aurora' });
    expect(screen.getByTestId('voice-cycle-btn').props.accessibilityLabel).toContain('Aurora');
  });

  it('exposes narration progress as a progressbar with a value', async () => {
    await renderControls({
      isSpeaking: true,
      audioDuration: 60000,
      audioPosition: 30000,
    });
    const bar = screen.getByLabelText('Narration progress');
    expect(bar.props.accessibilityValue).toMatchObject({ min: 0, max: 60, now: 30 });
  });
});
