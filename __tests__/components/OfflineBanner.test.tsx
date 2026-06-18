import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OfflineBanner } from '@/components/OfflineBanner';

describe('OfflineBanner', () => {
  it('renders the offline message', async () => {
    await render(<OfflineBanner />);
    expect(screen.getByText(/offline/i)).toBeTruthy();
  });

  it('mentions that saved stories are available', async () => {
    await render(<OfflineBanner />);
    expect(screen.getByText(/saved stories are still available/i)).toBeTruthy();
  });

  it('renders without crashing', async () => {
    const { toJSON } = await render(<OfflineBanner />);
    expect(toJSON()).toBeTruthy();
  });
});
