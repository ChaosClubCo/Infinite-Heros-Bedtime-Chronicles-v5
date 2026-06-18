import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { HeroCard } from '@/components/HeroCard';
import type { Hero } from '@/constants/heroes';

const MOCK_HERO: Hero = {
  id: 'test-hero',
  name: 'Nova',
  title: 'Guardian of Light',
  power: 'Starlight Shield',
  description: 'Protects children with magical light.',
  iconName: 'shield-half-sharp',
  color: '#FFD54F',
  gradient: ['#1a237e', '#283593'],
  constellation: 'The Shield',
};

describe('HeroCard', () => {
  it('renders the hero name', async () => {
    await render(<HeroCard hero={MOCK_HERO} onPress={jest.fn()} />);
    expect(screen.getByText('Nova')).toBeTruthy();
  });

  it('renders the hero title', async () => {
    await render(<HeroCard hero={MOCK_HERO} onPress={jest.fn()} />);
    expect(screen.getByText('Guardian of Light')).toBeTruthy();
  });

  it('renders the hero power', async () => {
    await render(<HeroCard hero={MOCK_HERO} onPress={jest.fn()} />);
    expect(screen.getByText('Starlight Shield')).toBeTruthy();
  });

  it('calls onPress when the card is tapped', async () => {
    const onPress = jest.fn();
    await render(<HeroCard hero={MOCK_HERO} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('triggers haptic feedback on press', async () => {
    await render(<HeroCard hero={MOCK_HERO} onPress={jest.fn()} />);
    fireEvent.press(screen.getByRole('button'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('has correct accessibility label', async () => {
    await render(<HeroCard hero={MOCK_HERO} onPress={jest.fn()} />);
    expect(screen.getByLabelText('Hero: Nova, Guardian of Light')).toBeTruthy();
  });

  it('renders without crashing with minimal hero data', async () => {
    const { toJSON } = await render(<HeroCard hero={MOCK_HERO} onPress={jest.fn()} />);
    expect(toJSON()).toBeTruthy();
  });
});
