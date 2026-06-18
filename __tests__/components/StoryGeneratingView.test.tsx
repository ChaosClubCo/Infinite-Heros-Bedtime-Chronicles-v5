import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StoryGeneratingView } from '@/components/StoryGeneratingView';

const MOCK_HERO = {
  iconName: 'star' as const,
  color: '#FFD54F',
  name: 'Nova',
};

const MOCK_THEME = {
  accent: '#6366f1',
  orbColor: '#4f46e5',
};

const MESSAGES = ['Weaving your story…', 'Adding magic…', 'Almost ready…'];

describe('StoryGeneratingView — generating state', () => {
  it('renders the current loading message', async () => {
    await render(
      <StoryGeneratingView
        storyState="generating"
        hero={MOCK_HERO}
        theme={MOCK_THEME}
        loadingMsg={0}
        messages={MESSAGES}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByText('Weaving your story…')).toBeTruthy();
  });

  it('shows the hero name in the subtitle', async () => {
    await render(
      <StoryGeneratingView
        storyState="generating"
        hero={MOCK_HERO}
        theme={MOCK_THEME}
        loadingMsg={1}
        messages={MESSAGES}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByText(/Nova is preparing/i)).toBeTruthy();
  });

  it('cycles through messages via loadingMsg index', async () => {
    const { rerender } = await render(
      <StoryGeneratingView
        storyState="generating"
        hero={MOCK_HERO}
        theme={MOCK_THEME}
        loadingMsg={0}
        messages={MESSAGES}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByText('Weaving your story…')).toBeTruthy();

    await rerender(
      <StoryGeneratingView
        storyState="generating"
        hero={MOCK_HERO}
        theme={MOCK_THEME}
        loadingMsg={2}
        messages={MESSAGES}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByText('Almost ready…')).toBeTruthy();
  });

  it('does not show the retry button while generating', async () => {
    await render(
      <StoryGeneratingView
        storyState="generating"
        hero={MOCK_HERO}
        theme={MOCK_THEME}
        loadingMsg={0}
        messages={MESSAGES}
        onRetry={jest.fn()}
      />
    );
    expect(screen.queryByText('Try Again')).toBeNull();
  });
});

describe('StoryGeneratingView — error state', () => {
  it('renders the error message', async () => {
    await render(
      <StoryGeneratingView
        storyState="error"
        hero={MOCK_HERO}
        theme={MOCK_THEME}
        loadingMsg={0}
        messages={MESSAGES}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
  });

  it('renders the Try Again button', async () => {
    await render(
      <StoryGeneratingView
        storyState="error"
        hero={MOCK_HERO}
        theme={MOCK_THEME}
        loadingMsg={0}
        messages={MESSAGES}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('calls onRetry when Try Again is pressed', async () => {
    const onRetry = jest.fn();
    await render(
      <StoryGeneratingView
        storyState="error"
        hero={MOCK_HERO}
        theme={MOCK_THEME}
        loadingMsg={0}
        messages={MESSAGES}
        onRetry={onRetry}
      />
    );
    fireEvent.press(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show the loading message in error state', async () => {
    await render(
      <StoryGeneratingView
        storyState="error"
        hero={MOCK_HERO}
        theme={MOCK_THEME}
        loadingMsg={0}
        messages={MESSAGES}
        onRetry={jest.fn()}
      />
    );
    expect(screen.queryByText('Weaving your story…')).toBeNull();
  });
});
