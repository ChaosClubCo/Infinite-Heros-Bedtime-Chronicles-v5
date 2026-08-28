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
// request will fail identically every time. Used as a fallback when the error
// carries no numeric status code (see isRetryableError).
const NON_RETRYABLE_PATTERNS = [
  /unauthorized/i,
  /forbidden/i,
  /invalid[\s_-]?api[\s_-]?key/i,
  /authentication/i,
  /permission denied/i,
  /\binvalid request\b/i,
];

// 4xx status codes that ARE worth retrying despite being client errors:
// 408 Request Timeout, 409 Conflict, 425 Too Early, 429 Too Many Requests.
const RETRYABLE_4XX = new Set([408, 409, 425, 429]);

/** Extract a numeric HTTP status from an error object's status/statusCode field. */
function getStatusCode(err: unknown): number | undefined {
  if (err && typeof err === 'object') {
    const obj = err as { status?: unknown; statusCode?: unknown };
    if (typeof obj.status === 'number') return obj.status;
    if (typeof obj.statusCode === 'number') return obj.statusCode;
  }
  return undefined;
}

/**
 * Decide whether an error is worth retrying. Treats any 4xx (except the
 * retryable set above) as non-retryable, reading the status off the error
 * object when present and falling back to a status code embedded in the message
 * or known client-error keywords. Defaults to retryable so unknown / network /
 * 5xx / timeout errors still get a second chance. Used as the default
 * `shouldRetry` predicate in `retryWithJitter`.
 */
export function isRetryableError(err: unknown): boolean {
  const status = getStatusCode(err);
  if (status !== undefined && status >= 400 && status < 500) {
    return RETRYABLE_4XX.has(status);
  }
  const message = toErrorMessage(err);
  const codeMatch = message.match(/\b(4\d{2})\b/);
  if (codeMatch) {
    return RETRYABLE_4XX.has(parseInt(codeMatch[1], 10));
  }
  for (const pattern of NON_RETRYABLE_PATTERNS) {
    if (pattern.test(message)) return false;
  }
  return true;
}

/**
 * Parse a positive integer from an env var, falling back when unset or invalid
 * (non-numeric, NaN, zero, or negative). Prevents a config typo from forwarding
 * NaN into downstream APIs.
 */
export function parsePositiveIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function createErrorResponse(message: string, kind: ErrorKind): { error: string; retryable: boolean } {
  return { error: message, retryable: kind === 'transient' };
}
