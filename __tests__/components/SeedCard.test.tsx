import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SeedCard } from '@/components/SeedCard';
import type { StorySeed } from '@/constants/story-seeds';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

const MOCK_SEED: StorySeed = {
  id: "test-seed-id",
  title: "The Brave Little Rabbit",
  blurb: "A small rabbit goes on a big forest quest.",
  theme: "courage",
  ageRange: "4-6",
  mode: "classic",
  suggestedHeroId: "hero-5",
  setting: "enchanted-forest",
  tone: "adventurous",
  sidekick: "owl",
  problem: "help-friend",
  emoji: "🐰",
};

const MOCK_SLEEP_SEED: StorySeed = {
  id: "test-sleep-id",
  title: "The Silent Stars",
  blurb: "The stars drift to sleep.",
  theme: "comfort",
  ageRange: "2-4",
  mode: "sleep",
  emoji: "✨",
};

describe('SeedCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the seed title and blurb', async () => {
    await render(<SeedCard seed={MOCK_SEED} />);
    expect(screen.getByText('The Brave Little Rabbit')).toBeTruthy();
    expect(screen.getByText('A small rabbit goes on a big forest quest.')).toBeTruthy();
  });

  it('renders the theme and age badges', async () => {
    await render(<SeedCard seed={MOCK_SEED} />);
    expect(screen.getByText('COURAGE')).toBeTruthy();
    expect(screen.getByText('Age 4-6')).toBeTruthy();
  });

  it('calls router.push with prefilled parameters on tap', async () => {
    await render(<SeedCard seed={MOCK_SEED} />);
    fireEvent.press(screen.getByRole('button'));
    
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/story-details',
      params: {
        storyId: 'test-seed-id',
        setting: 'enchanted-forest',
        tone: 'adventurous',
        sidekick: 'owl',
        problem: 'help-friend',
      },
    });
  });

  it('handles tap event for sleep-mode seed with minimal fields', async () => {
    await render(<SeedCard seed={MOCK_SLEEP_SEED} />);
    fireEvent.press(screen.getByRole('button'));
    
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/story-details',
      params: {
        storyId: 'test-sleep-id',
      },
    });
  });
});
