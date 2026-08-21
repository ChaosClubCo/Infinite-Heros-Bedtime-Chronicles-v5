import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useMotionPreference } from '@/lib/useMotionPreference';

// The in-app half of the preference. The OS half comes from reanimated's
// useReducedMotion, which jest.setup.ts mocks globally.
const mockSettings = { reducedMotion: false };
jest.mock('@/lib/SettingsContext', () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

const mockOSReducedMotion = useReducedMotion as unknown as jest.Mock;

function Probe() {
  const { reducedMotion } = useMotionPreference();
  return <Text testID="probe">{reducedMotion ? 'reduced' : 'full'}</Text>;
}

describe('useMotionPreference', () => {
  beforeEach(() => {
    mockOSReducedMotion.mockReturnValue(false);
    mockSettings.reducedMotion = false;
  });

  it('reports full motion when neither the OS nor the app asks to reduce it', async () => {
    const { getByTestId } = await render(<Probe />);
    expect(getByTestId('probe')).toHaveTextContent('full');
  });

  it('reduces motion when the in-app setting is on', async () => {
    mockSettings.reducedMotion = true;
    const { getByTestId } = await render(<Probe />);
    expect(getByTestId('probe')).toHaveTextContent('reduced');
  });

  it('reduces motion when the OS asks for it, even with the in-app toggle off', async () => {
    // The case the app previously ignored entirely: a device configured for
    // reduced motion still received the full animation set, because nothing in
    // the tree ever read AccessibilityInfo or useReducedMotion.
    mockOSReducedMotion.mockReturnValue(true);
    mockSettings.reducedMotion = false;
    const { getByTestId } = await render(<Probe />);
    expect(getByTestId('probe')).toHaveTextContent('reduced');
  });

  it('reduces motion when both signals are on', async () => {
    mockOSReducedMotion.mockReturnValue(true);
    mockSettings.reducedMotion = true;
    const { getByTestId } = await render(<Probe />);
    expect(getByTestId('probe')).toHaveTextContent('reduced');
  });
});
