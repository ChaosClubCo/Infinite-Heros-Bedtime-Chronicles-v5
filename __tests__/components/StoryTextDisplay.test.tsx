import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StoryTextDisplay } from '@/components/StoryTextDisplay';

// Story text size is read from settings; keep it mutable so a test can change
// the scale without re-importing the module under test.
const mockSettings: { textSize: 'small' | 'medium' | 'large' } = { textSize: 'medium' };
jest.mock('@/lib/SettingsContext', () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

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

  describe('client safety fail-safe', () => {
    it('substitutes a gentle placeholder when the text is unsafe', async () => {
      const onUnsafe = jest.fn();
      await render(
        <StoryTextDisplay
          text="The villain grabbed a gun."
          isSleep={false}
          accent={ACCENT}
          partIndex={0}
          onUnsafe={onUnsafe}
        />
      );
      // The unsafe text is never rendered.
      expect(screen.queryByText(/gun/i)).toBeNull();
      // The placeholder is shown instead, and onUnsafe fired.
      expect(screen.getByText(/taking a little rest/i)).toBeTruthy();
      expect(onUnsafe).toHaveBeenCalledTimes(1);
    });

    it('renders safe text unchanged and does not fire onUnsafe', async () => {
      const onUnsafe = jest.fn();
      await render(
        <StoryTextDisplay
          text="The brave hero shared a warm cookie with a friend."
          isSleep={false}
          accent={ACCENT}
          partIndex={0}
          onUnsafe={onUnsafe}
        />
      );
      expect(screen.getByText(/shared a warm cookie/i)).toBeTruthy();
      expect(onUnsafe).not.toHaveBeenCalled();
    });
  });
});

describe('StoryTextDisplay — story text size setting', () => {
  // Base paragraph size is 18; the setting multiplies it by 0.875 / 1 / 1.25.
  const BASE_FONT_SIZE = 18;

  const flatten = (style: unknown): Record<string, number> =>
    Object.assign({}, ...[].concat(style as never[]).filter(Boolean));

  const renderParagraphFontSize = async (textSize: 'small' | 'medium' | 'large') => {
    mockSettings.textSize = textSize;
    const { getAllByTestId } = await render(
      <StoryTextDisplay text="Once upon a time." isSleep={false} accent="#6366f1" partIndex={0} />,
    );
    return flatten(getAllByTestId('story-paragraph')[0].props.style).fontSize;
  };

  afterEach(() => {
    mockSettings.textSize = 'medium';
  });

  it('renders story text at the base size on "medium"', async () => {
    expect(await renderParagraphFontSize('medium')).toBe(BASE_FONT_SIZE);
  });

  it('renders larger story text on "large"', async () => {
    expect(await renderParagraphFontSize('large')).toBeGreaterThan(BASE_FONT_SIZE);
  });

  it('renders smaller story text on "small"', async () => {
    expect(await renderParagraphFontSize('small')).toBeLessThan(BASE_FONT_SIZE);
  });

  it('never disables allowFontScaling, so the device text-size setting still applies', async () => {
    // The in-app scale must compose with the OS scale, never replace it —
    // disabling font scaling here would break WCAG 1.4.4 (Resize Text).
    mockSettings.textSize = 'large';
    const { toJSON } = await render(
      <StoryTextDisplay text="Once upon a time." isSleep={false} accent="#6366f1" partIndex={0} />,
    );
    expect(JSON.stringify(toJSON())).not.toContain('"allowFontScaling":false');
  });
});
