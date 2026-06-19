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

// Errors that signal a client-side problem (bad key, malformed request, missing
// resource). Retrying these wastes paid API quota and only adds latency — the
// request will fail identically every time. 429 is deliberately excluded: it is
// a 4xx but IS retryable after backoff (handled in isRetryableError below).
const NON_RETRYABLE_PATTERNS = [
  /\b400\b/,
  /\b401\b/,
  /\b403\b/,
  /\b404\b/,
  /\b405\b/,
  /\b422\b/,
  /unauthorized/i,
  /forbidden/i,
  /invalid[\s_-]?api[\s_-]?key/i,
  /authentication/i,
  /permission denied/i,
  /\binvalid request\b/i,
];

/**
 * Decide whether an error is worth retrying. Defaults to retryable (so unknown
 * and network errors still get a second chance) and only returns false for clear
 * non-429 4xx client errors. Used as the default `shouldRetry` predicate in
 * `retryWithJitter`.
 */
export function isRetryableError(err: unknown): boolean {
  const message = toErrorMessage(err);
  // Rate limiting is a 4xx but is always retryable after backoff.
  if (/\b429\b/.test(message) || /too many requests/i.test(message)) return true;
  for (const pattern of NON_RETRYABLE_PATTERNS) {
    if (pattern.test(message)) return false;
  }
  return true;
}

export function createErrorResponse(message: string, kind: ErrorKind): { error: string; retryable: boolean } {
  return { error: message, retryable: kind === 'transient' };
}
