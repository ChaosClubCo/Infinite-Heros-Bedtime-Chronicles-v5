export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export type ErrorKind = 'transient' | 'permanent';

const TRANSIENT_PATTERNS = [
  /timed?\s*out/i,
  /\b429\b/,
  /too many requests/i,
  /ECONNREFUSED/,
  /ECONNRESET/,
  /ETIMEDOUT/,
  /ENOTFOUND/,
  /EHOSTUNREACH/,
  /ENETUNREACH/,
  /fetch failed/i,
  /circuit is open/i,
  /socket hang up/i,
  /\b5\d{2}\b/,
  /overloaded/i,
  /temporarily unavailable/i,
];

export function classifyError(err: unknown): ErrorKind {
  const message = toErrorMessage(err);
  for (const pattern of TRANSIENT_PATTERNS) {
    if (pattern.test(message)) return 'transient';
  }
  return 'permanent';
}

export function createErrorResponse(message: string, kind: ErrorKind): { error: string; retryable: boolean } {
  return { error: message, retryable: kind === 'transient' };
}
