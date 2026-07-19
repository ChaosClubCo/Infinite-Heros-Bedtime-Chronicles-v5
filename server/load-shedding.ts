import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface LoadSheddingOptions {
  maxConcurrent: number;
  highPriorityReserve: number;
}

const DEFAULT_OPTIONS: LoadSheddingOptions = {
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '50', 10),
  highPriorityReserve: parseInt(process.env.HIGH_PRIORITY_RESERVE || '10', 10),
};

let activeRequests = 0;

export function getActiveRequests(): number {
  return activeRequests;
}

export function resetActiveRequests(): void {
  activeRequests = 0;
}

export function createLoadSheddingMiddleware(options?: Partial<LoadSheddingOptions>) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'POST' || !req.path.startsWith('/api/')) return next();

    const isHighPriority = !!req.user?.uid && !req.user?.isAnonymous;
    const limit = isHighPriority ? opts.maxConcurrent : opts.maxConcurrent - opts.highPriorityReserve;

    if (activeRequests >= limit) {
      logger.warn({ activeRequests, limit, isHighPriority, path: req.path }, 'request shed');
      return res.status(503).json({ error: 'Server is busy, please try again shortly', retryable: true });
    }

    activeRequests++;
    // Decrement on 'close' (fires for both normal completion AND client aborts)
    // rather than 'finish' (never fires when the client disconnects mid-response,
    // which would leak the slot and ratchet toward permanent 503 load-shedding).
    // A guard keeps it exactly-once in case both events ever fire.
    let released = false;
    const release = () => { if (!released) { released = true; activeRequests--; } };
    res.once('close', release);
    next();
  };
}
