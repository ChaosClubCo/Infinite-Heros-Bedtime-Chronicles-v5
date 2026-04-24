import { describe, it, expect } from 'vitest';
import { createLogger, createRequestId } from './logger';

describe('createRequestId', () => {
  it('returns a 16-char hex string', () => {
    const id = createRequestId();
    expect(id).toMatch(/^[a-f0-9]{16}$/);
  });

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createRequestId()));
    expect(ids.size).toBe(100);
  });
});

describe('createLogger', () => {
  it('returns a pino logger instance', () => {
    const log = createLogger();
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.child).toBe('function');
  });

  it('creates a child logger with requestId', () => {
    const log = createLogger();
    const child = log.child({ requestId: 'abc123' });
    expect(typeof child.info).toBe('function');
  });
});
