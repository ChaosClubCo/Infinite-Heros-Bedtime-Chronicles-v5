import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";

export interface BatchOptions { concurrency?: number; retries?: number; minTimeout?: number; maxTimeout?: number; onProgress?: (completed: number, total: number, item: unknown) => void; }
export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || message.includes("RATELIMIT_EXCEEDED") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("rate limit");
}
export async function batchProcess<T, R>(items: T[], processor: (item: T, index: number) => Promise<R>, options: BatchOptions = {}): Promise<R[]> {
  const { concurrency = 2, retries = 7, minTimeout = 2000, maxTimeout = 128000, onProgress } = options;
  const limit = pLimit(concurrency);
  let completed = 0;
  return Promise.all(items.map((item, index) => limit(() => pRetry(async () => {
    try { const result = await processor(item, index); completed++; onProgress?.(completed, items.length, item); return result; }
    catch (error) { if (isRateLimitError(error)) throw error; throw new AbortError(error instanceof Error ? error : new Error(String(error))); }
  }, { retries, minTimeout, maxTimeout, factor: 2 }))));
}
export async function batchProcessWithSSE<T, R>(items: T[], processor: (item: T, index: number) => Promise<R>, sendEvent: (event: { type: string; [key: string]: unknown }) => void, options: Omit<BatchOptions, "concurrency" | "onProgress"> = {}): Promise<R[]> {
  const { retries = 5, minTimeout = 1000, maxTimeout = 15000 } = options;
  sendEvent({ type: "started", total: items.length });
  const results: R[] = [];
  let errors = 0;
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    sendEvent({ type: "processing", index, item });
    try {
      const result = await pRetry(() => processor(item, index), { retries, minTimeout, maxTimeout, factor: 2, onFailedAttempt: (error) => { if (!isRateLimitError(error)) throw new AbortError(error instanceof Error ? error : new Error(String(error))); } });
      results.push(result);
      sendEvent({ type: "progress", index, result });
    } catch (error) {
      errors++;
      results.push(undefined as R);
      sendEvent({ type: "progress", index, error: error instanceof Error ? error.message : "Processing failed" });
    }
  }
  sendEvent({ type: "complete", processed: items.length, errors });
  return results;
}
