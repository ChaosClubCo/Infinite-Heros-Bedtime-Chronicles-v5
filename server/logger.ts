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
  });
}

export function createRequestId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export const logger = createLogger();
