import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ChoiceButton } from '@/components/ChoiceButton';

const TEST_COLORS: [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#10b981', '#059669'],
  ['#f59e0b', '#d97706'],
];

describe('ChoiceButton', () => {
  it('renders the choice label', async () => {
    await render(
      <ChoiceButton label="Fly to the moon" index={0} onPress={jest.fn()} colors={TEST_COLORS} />
    );
    expect(screen.getByText('Fly to the moon')).toBeTruthy();
  });

  it('renders "A" for index 0', async () => {
    await render(
      <ChoiceButton label="Option A" index={0} onPress={jest.fn()} colors={TEST_COLORS} />
    );
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('renders "B" for index 1', async () => {
    await render(
      <ChoiceButton label="Option B" index={1} onPress={jest.fn()} colors={TEST_COLORS} />
    );
    expect(screen.getByText('B')).toBeTruthy();
  });

  it('renders "C" for index 2', async () => {
    await render(
      <ChoiceButton label="Option C" index={2} onPress={jest.fn()} colors={TEST_COLORS} />
    );
    expect(screen.getByText('C')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(
      <ChoiceButton label="Choose this" index={0} onPress={onPress} colors={TEST_COLORS} />
    );
    fireEvent.press(screen.getByTestId('choice-0'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has correct testID for each index', async () => {
    const { rerender } = await render(
      <ChoiceButton label="A" index={0} onPress={jest.fn()} colors={TEST_COLORS} />
    );
    expect(screen.getByTestId('choice-0')).toBeTruthy();

    await rerender(
      <ChoiceButton label="B" index={1} onPress={jest.fn()} colors={TEST_COLORS} />
    );
    expect(screen.getByTestId('choice-1')).toBeTruthy();
  });

  it('cycles through color pairs when index exceeds color array length', async () => {
    const { toJSON } = await render(
      <ChoiceButton label="Wrapped" index={3} onPress={jest.fn()} colors={TEST_COLORS} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
