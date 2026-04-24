import { logger } from './logger';

interface Metrics {
  requests: { total: number; errors: number; byStatus: Record<number, number> };
  ai: {
    calls: number;
    failures: number;
    totalTokens: { input: number; output: number };
    latencyMs: number[];
    byProvider: Record<string, { calls: number; failures: number; totalLatencyMs: number }>;
  };
  tts: { calls: number; failures: number; cacheHits: number };
}

const metrics: Metrics = {
  requests: { total: 0, errors: 0, byStatus: {} },
  ai: { calls: 0, failures: 0, totalTokens: { input: 0, output: 0 }, latencyMs: [], byProvider: {} },
  tts: { calls: 0, failures: 0, cacheHits: 0 },
};

export function recordRequest(statusCode: number): void {
  metrics.requests.total++;
  metrics.requests.byStatus[statusCode] = (metrics.requests.byStatus[statusCode] || 0) + 1;
  if (statusCode >= 400) metrics.requests.errors++;
}

export function recordAICall(provider: string, latencyMs: number, success: boolean, tokens?: { input?: number; output?: number }): void {
  metrics.ai.calls++;
  if (!success) metrics.ai.failures++;
  metrics.ai.latencyMs.push(latencyMs);
  // Keep only last 1000 latency samples
  if (metrics.ai.latencyMs.length > 1000) metrics.ai.latencyMs.shift();
  if (tokens?.input) metrics.ai.totalTokens.input += tokens.input;
  if (tokens?.output) metrics.ai.totalTokens.output += tokens.output;
  if (!metrics.ai.byProvider[provider]) metrics.ai.byProvider[provider] = { calls: 0, failures: 0, totalLatencyMs: 0 };
  metrics.ai.byProvider[provider].calls++;
  if (!success) metrics.ai.byProvider[provider].failures++;
  metrics.ai.byProvider[provider].totalLatencyMs += latencyMs;
}

export function recordTTS(cacheHit: boolean, success: boolean): void {
  metrics.tts.calls++;
  if (cacheHit) metrics.tts.cacheHits++;
  if (!success) metrics.tts.failures++;
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function getMetrics() {
  return {
    requests: { ...metrics.requests },
    ai: {
      calls: metrics.ai.calls,
      failures: metrics.ai.failures,
      errorRate: metrics.ai.calls > 0 ? (metrics.ai.failures / metrics.ai.calls * 100).toFixed(1) + '%' : '0%',
      totalTokens: { ...metrics.ai.totalTokens },
      latency: {
        p50: percentile(metrics.ai.latencyMs, 50),
        p95: percentile(metrics.ai.latencyMs, 95),
        p99: percentile(metrics.ai.latencyMs, 99),
      },
      byProvider: { ...metrics.ai.byProvider },
    },
    tts: {
      ...metrics.tts,
      cacheHitRate: metrics.tts.calls > 0 ? (metrics.tts.cacheHits / metrics.tts.calls * 100).toFixed(1) + '%' : '0%',
    },
  };
}

export function resetMetrics(): void {
  metrics.requests = { total: 0, errors: 0, byStatus: {} };
  metrics.ai = { calls: 0, failures: 0, totalTokens: { input: 0, output: 0 }, latencyMs: [], byProvider: {} };
  metrics.tts = { calls: 0, failures: 0, cacheHits: 0 };
}

// Suppress unused import warning — logger is available for future metric flush/export use
void logger;
