import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ErrorFallbackProps } from '@/components/ErrorFallback';

// Stub out ErrorFallback so we don't pull in Modal or safe-area context
jest.mock('@/components/ErrorFallback', () => ({
  ErrorFallback: ({ error }: ErrorFallbackProps) =>
    require('react').createElement(
      require('react-native').Text,
      null,
      `Oops! ${error.message}`
    ),
}));

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('test render error');
  return <Text>Rendered OK</Text>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', async () => {
    await render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Rendered OK')).toBeTruthy();
  });

  it('shows the default fallback UI when a child throws', async () => {
    await render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Oops/i)).toBeTruthy();
  });

  it('calls onError with the error and component stack', async () => {
    const onError = jest.fn();
    await render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'test render error' }),
      expect.any(String)
    );
  });

  it('renders a custom FallbackComponent when provided', async () => {
    const CustomFallback = ({ error }: ErrorFallbackProps) => (
      <Text>Custom: {error.message}</Text>
    );
    await render(
      <ErrorBoundary FallbackComponent={CustomFallback}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom: test render error')).toBeTruthy();
  });

  it('does not invoke onError when no error occurs', async () => {
    const onError = jest.fn();
    await render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(onError).not.toHaveBeenCalled();
  });
});
