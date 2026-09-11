interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 5000 };

function jitteredDelay(baseMs: number, attempt: number, maxMs: number): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxMs);
  return capped * (0.5 + Math.random() * 0.5); // 50-100% of capped value
}

export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try { return await fn(); }
    catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < opts.maxRetries) {
        const delay = jitteredDelay(opts.baseDelayMs, attempt, opts.maxDelayMs);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError!;
}

// Export for testing
export { jitteredDelay as _jitteredDelay };
