import pino from 'pino';
import crypto from 'node:crypto';

export function createLogger() {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Never emit credentials or child PII to logs.
    redact: {
      paths: [
        'req.headers.authorization',
        'authorization',
        '*.authorization',
        'token',
        '*.token',
        'apiKey',
        '*.apiKey',
        'password',
        '*.password',
        'childName',
        '*.childName',
      ],
      censor: '[REDACTED]',
    },
    // Log only safe error fields — never stacks or provider response bodies,
    // which can embed endpoint URLs or key fragments.
    serializers: {
      err: (e: unknown) => {
        if (e && typeof e === 'object') {
          const anyErr = e as { name?: unknown; message?: unknown; code?: unknown };
          return { name: anyErr.name, message: anyErr.message, code: anyErr.code };
        }
        return { message: String(e) };
      },
    },
  });
}

export function createRequestId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export const logger = createLogger();
