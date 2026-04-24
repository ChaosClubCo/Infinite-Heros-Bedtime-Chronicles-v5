import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLoadSheddingMiddleware, getActiveRequests, resetActiveRequests } from './load-shedding';

// Minimal mock req/res/next
function mockReq(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { method: 'POST', path: '/api/generate-story', user: undefined, ...overrides };
}

function mockRes() {
  const listeners: Record<string, Function[]> = {};
  return {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json: vi.fn().mockReturnThis(),
    on(event: string, fn: Function) { (listeners[event] ??= []).push(fn); return this; },
    _emit(event: string) { listeners[event]?.forEach((fn) => fn()); },
  };
}

describe('createLoadSheddingMiddleware', () => {
  beforeEach(() => {
    resetActiveRequests();
  });

  it('passes GET requests through without counting', () => {
    const middleware = createLoadSheddingMiddleware({ maxConcurrent: 2, highPriorityReserve: 1 });
    const next = vi.fn();
    middleware(mockReq({ method: 'GET' }) as any, mockRes() as any, next);
    expect(next).toHaveBeenCalled();
    expect(getActiveRequests()).toBe(0);
  });

  it('passes non-api POST requests through', () => {
    const middleware = createLoadSheddingMiddleware({ maxConcurrent: 2, highPriorityReserve: 1 });
    const next = vi.fn();
    middleware(mockReq({ path: '/privacy' }) as any, mockRes() as any, next);
    expect(next).toHaveBeenCalled();
    expect(getActiveRequests()).toBe(0);
  });

  it('increments active requests on POST /api/*', () => {
    const middleware = createLoadSheddingMiddleware({ maxConcurrent: 10, highPriorityReserve: 2 });
    const next = vi.fn();
    const res = mockRes();
    middleware(mockReq() as any, res as any, next);
    expect(next).toHaveBeenCalled();
    expect(getActiveRequests()).toBe(1);

    // Simulate response finish
    res._emit('finish');
    expect(getActiveRequests()).toBe(0);
  });

  it('sheds low-priority requests when at limit minus reserve', () => {
    const middleware = createLoadSheddingMiddleware({ maxConcurrent: 3, highPriorityReserve: 1 });
    const next = vi.fn();

    // Fill up to low-priority limit (3 - 1 = 2)
    for (let i = 0; i < 2; i++) {
      middleware(mockReq() as any, mockRes() as any, vi.fn());
    }

    // Third low-priority request should be shed
    const res = mockRes();
    middleware(mockReq() as any, res as any, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ retryable: true }));
    expect(next).not.toHaveBeenCalled();
  });

  it('allows high-priority requests up to full limit', () => {
    const middleware = createLoadSheddingMiddleware({ maxConcurrent: 3, highPriorityReserve: 1 });

    // Fill 2 slots
    for (let i = 0; i < 2; i++) {
      middleware(mockReq() as any, mockRes() as any, vi.fn());
    }

    // High-priority request uses reserved slot
    const next = vi.fn();
    const highPriorityReq = mockReq({ user: { uid: 'user-123', isAnonymous: false } });
    middleware(highPriorityReq as any, mockRes() as any, next);
    expect(next).toHaveBeenCalled();
    expect(getActiveRequests()).toBe(3);
  });

  it('sheds high-priority requests when at full limit', () => {
    const middleware = createLoadSheddingMiddleware({ maxConcurrent: 2, highPriorityReserve: 1 });

    // Fill all slots
    for (let i = 0; i < 2; i++) {
      const req = mockReq({ user: { uid: `u${i}`, isAnonymous: false } });
      middleware(req as any, mockRes() as any, vi.fn());
    }

    // Even high-priority is shed at full capacity
    const next = vi.fn();
    const res = mockRes();
    const req = mockReq({ user: { uid: 'u3', isAnonymous: false } });
    middleware(req as any, res as any, next);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
