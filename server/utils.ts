export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export type ErrorKind = 'transient' | 'permanent';

const TRANSIENT_PATTERNS = [
  /timed?\s*out/i,
  /429/,
  /too many requests/i,
  /ECONNREFUSED/,
  /ECONNRESET/,
  /ETIMEDOUT/,
  /ENOTFOUND/,
  /fetch failed/i,
  /circuit is open/i,
  /socket hang up/i,
  /5\d{2}\s/,
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
