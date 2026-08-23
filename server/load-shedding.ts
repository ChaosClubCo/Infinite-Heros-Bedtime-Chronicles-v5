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
    res.on('finish', () => { activeRequests--; });
    next();
  };
}
