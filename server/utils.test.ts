import { describe, it, expect } from 'vitest';
import { toErrorMessage, classifyError, createErrorResponse, isRetryableError, parsePositiveIntEnv } from './utils';

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

describe('isRetryableError', () => {
  it('does not retry clear 4xx client errors', () => {
    expect(isRetryableError(new Error('400 Bad Request'))).toBe(false);
    expect(isRetryableError(new Error('401 Unauthorized'))).toBe(false);
    expect(isRetryableError(new Error('403 Forbidden'))).toBe(false);
    expect(isRetryableError(new Error('404 Not Found'))).toBe(false);
    expect(isRetryableError(new Error('422 Unprocessable Entity'))).toBe(false);
    expect(isRetryableError(new Error('invalid api key'))).toBe(false);
  });

  it('retries 429 rate-limit errors despite being 4xx', () => {
    expect(isRetryableError(new Error('429 Too Many Requests'))).toBe(true);
    expect(isRetryableError(new Error('Too Many Requests'))).toBe(true);
  });

  it('retries 5xx, network, timeout, and unknown errors', () => {
    expect(isRetryableError(new Error('500 Internal Server Error'))).toBe(true);
    expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
    expect(isRetryableError(new Error('timed out after 60000ms'))).toBe(true);
    expect(isRetryableError(new Error('something weird'))).toBe(true);
  });

  it('does not retry other 4xx codes embedded in the message (413/415)', () => {
    expect(isRetryableError(new Error('413 Payload Too Large'))).toBe(false);
    expect(isRetryableError(new Error('415 Unsupported Media Type'))).toBe(false);
  });

  it('reads numeric status/statusCode off the error object', () => {
    expect(isRetryableError({ status: 413, message: 'too big' })).toBe(false);
    expect(isRetryableError({ statusCode: 403, message: 'nope' })).toBe(false);
    expect(isRetryableError({ status: 429 })).toBe(true);
    expect(isRetryableError({ status: 408 })).toBe(true); // request timeout
    expect(isRetryableError({ status: 500 })).toBe(true);
  });
});

describe('parsePositiveIntEnv', () => {
  it('returns the fallback when the value is unset', () => {
    expect(parsePositiveIntEnv(undefined, 8192)).toBe(8192);
  });

  it('parses a valid positive integer', () => {
    expect(parsePositiveIntEnv('4096', 8192)).toBe(4096);
  });

  it('falls back on non-numeric, NaN, zero, or negative values', () => {
    expect(parsePositiveIntEnv('abc', 2048)).toBe(2048);
    expect(parsePositiveIntEnv('0', 2048)).toBe(2048);
    expect(parsePositiveIntEnv('-5', 2048)).toBe(2048);
    expect(parsePositiveIntEnv('12.5', 2048)).toBe(2048);
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
