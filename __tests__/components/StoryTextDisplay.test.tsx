import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StoryTextDisplay } from '@/components/StoryTextDisplay';

const ACCENT = '#6366f1';

describe('StoryTextDisplay', () => {
  it('renders a single paragraph of text', async () => {
    await render(
      <StoryTextDisplay
        text="Once upon a time there was a brave hero."
        isSleep={false}
        accent={ACCENT}
        partIndex={0}
      />
    );
    expect(screen.getByText(/brave hero/i)).toBeTruthy();
  });

  it('renders multiple paragraphs separated by double newlines', async () => {
    const text = 'First paragraph here.\n\nSecond paragraph here.';
    await render(
      <StoryTextDisplay text={text} isSleep={false} accent={ACCENT} partIndex={0} />
    );
    expect(screen.getByText(/First paragraph/)).toBeTruthy();
    expect(screen.getByText(/Second paragraph/)).toBeTruthy();
  });

  it('applies the drop cap to the first character of the first paragraph', async () => {
    const text = 'Amazing adventure begins now.';
    await render(
      <StoryTextDisplay text={text} isSleep={false} accent={ACCENT} partIndex={0} />
    );
    // Drop cap is the first character rendered as a separate nested Text
    expect(screen.getByText('A')).toBeTruthy();
    // The outer Text element's concatenated content includes both the drop cap and the rest
    expect(screen.getByText('Amazing adventure begins now.')).toBeTruthy();
  });

  it('filters out empty paragraphs', async () => {
    const text = 'First.\n\n\n\nSecond.';
    await render(
      <StoryTextDisplay text={text} isSleep={false} accent={ACCENT} partIndex={0} />
    );
    // Two paragraphs rendered (middle empty filtered).
    // First paragraph has drop cap "F"; getByText concatenates children so "F"+"irst." = "First."
    expect(screen.getByText('First.')).toBeTruthy();
    // Second paragraph has no drop cap
    expect(screen.getByText('Second.')).toBeTruthy();
  });

  it('renders without crashing in sleep mode', async () => {
    const { toJSON } = await render(
      <StoryTextDisplay
        text="A calm, peaceful story."
        isSleep={true}
        accent={ACCENT}
        partIndex={0}
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('uses partIndex in animation keys (renders different parts without key conflict)', async () => {
    const { rerender, toJSON } = await render(
      <StoryTextDisplay text="Part 0 text." isSleep={false} accent={ACCENT} partIndex={0} />
    );
    expect(toJSON()).toBeTruthy();
    await rerender(
      <StoryTextDisplay text="Part 1 text." isSleep={false} accent={ACCENT} partIndex={1} />
    );
    expect(screen.getByText(/Part 1 text/)).toBeTruthy();
  });
});
