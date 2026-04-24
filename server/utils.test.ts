import { describe, it, expect } from 'vitest';
import { toErrorMessage, classifyError, createErrorResponse } from './utils';

describe('toErrorMessage', () => {
  it('extracts message from Error objects', () => {
    expect(toErrorMessage(new Error('something broke'))).toBe('something broke');
  });

  it('converts non-Error values to string', () => {
    expect(toErrorMessage('raw string')).toBe('raw string');
    expect(toErrorMessage(42)).toBe('42');
    expect(toErrorMessage(null)).toBe('null');
    expect(toErrorMessage(undefined)).toBe('undefined');
  });

  it('handles objects without message property', () => {
    expect(toErrorMessage({ code: 'ENOENT' })).toBe('[object Object]');
  });
});

describe('classifyError', () => {
  it('classifies timeout errors as transient', () => {
    expect(classifyError(new Error('timed out after 60000ms'))).toBe('transient');
  });

  it('classifies rate limit errors as transient', () => {
    expect(classifyError(new Error('429 Too Many Requests'))).toBe('transient');
  });

  it('classifies network errors as transient', () => {
    expect(classifyError(new Error('ECONNREFUSED'))).toBe('transient');
    expect(classifyError(new Error('ETIMEDOUT'))).toBe('transient');
    expect(classifyError(new Error('fetch failed'))).toBe('transient');
  });

  it('classifies circuit open as transient', () => {
    expect(classifyError(new Error('Circuit is open'))).toBe('transient');
  });

  it('classifies 5xx errors as transient', () => {
    expect(classifyError(new Error('500 Internal Server Error'))).toBe('transient');
    expect(classifyError(new Error('503 Service Unavailable'))).toBe('transient');
  });

  it('classifies validation errors as permanent', () => {
    expect(classifyError(new Error('Hero name is required'))).toBe('permanent');
  });

  it('classifies unknown errors as permanent', () => {
    expect(classifyError(new Error('something weird'))).toBe('permanent');
  });
});

describe('createErrorResponse', () => {
  it('creates a transient error response', () => {
    const resp = createErrorResponse('Service busy', 'transient');
    expect(resp).toEqual({ error: 'Service busy', retryable: true });
  });

  it('creates a permanent error response', () => {
    const resp = createErrorResponse('Invalid input', 'permanent');
    expect(resp).toEqual({ error: 'Invalid input', retryable: false });
  });
});
