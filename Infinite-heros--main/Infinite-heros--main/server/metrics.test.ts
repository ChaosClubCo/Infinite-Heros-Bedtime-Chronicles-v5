import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordRequest,
  recordAICall,
  recordTTS,
  getMetrics,
  resetMetrics,
} from './metrics';

beforeEach(() => {
  resetMetrics();
});

describe('recordRequest', () => {
  it('increments total counter on each call', () => {
    recordRequest(200);
    recordRequest(200);
    recordRequest(404);
    expect(getMetrics().requests.total).toBe(3);
  });

  it('tracks counts per status code', () => {
    recordRequest(200);
    recordRequest(200);
    recordRequest(500);
    const { byStatus } = getMetrics().requests;
    expect(byStatus[200]).toBe(2);
    expect(byStatus[500]).toBe(1);
  });

  it('increments errors for 4xx status codes', () => {
    recordRequest(400);
    recordRequest(401);
    recordRequest(403);
    expect(getMetrics().requests.errors).toBe(3);
  });

  it('increments errors for 5xx status codes', () => {
    recordRequest(500);
    recordRequest(503);
    expect(getMetrics().requests.errors).toBe(2);
  });

  it('does not count 2xx or 3xx as errors', () => {
    recordRequest(200);
    recordRequest(201);
    recordRequest(301);
    expect(getMetrics().requests.errors).toBe(0);
  });
});

describe('recordAICall', () => {
  it('increments ai.calls counter', () => {
    recordAICall('gemini', 100, true);
    recordAICall('openai', 200, true);
    expect(getMetrics().ai.calls).toBe(2);
  });

  it('increments ai.failures only on failure', () => {
    recordAICall('gemini', 100, true);
    recordAICall('gemini', 150, false);
    expect(getMetrics().ai.failures).toBe(1);
  });

  it('tracks per-provider calls and failures', () => {
    recordAICall('gemini', 100, true);
    recordAICall('gemini', 200, false);
    recordAICall('openai', 300, true);
    const { byProvider } = getMetrics().ai;
    expect(byProvider['gemini'].calls).toBe(2);
    expect(byProvider['gemini'].failures).toBe(1);
    expect(byProvider['openai'].calls).toBe(1);
    expect(byProvider['openai'].failures).toBe(0);
  });

  it('accumulates totalLatencyMs per provider', () => {
    recordAICall('gemini', 100, true);
    recordAICall('gemini', 200, true);
    expect(getMetrics().ai.byProvider['gemini'].totalLatencyMs).toBe(300);
  });

  it('accumulates token counts', () => {
    recordAICall('gemini', 100, true, { input: 500, output: 250 });
    recordAICall('gemini', 100, true, { input: 100, output: 50 });
    const { totalTokens } = getMetrics().ai;
    expect(totalTokens.input).toBe(600);
    expect(totalTokens.output).toBe(300);
  });

  it('handles missing token fields gracefully', () => {
    recordAICall('gemini', 100, true);
    recordAICall('gemini', 100, true, {});
    recordAICall('gemini', 100, true, { input: 10 });
    const { totalTokens } = getMetrics().ai;
    expect(totalTokens.input).toBe(10);
    expect(totalTokens.output).toBe(0);
  });
});

describe('recordTTS', () => {
  it('increments calls counter', () => {
    recordTTS(false, true);
    recordTTS(false, true);
    expect(getMetrics().tts.calls).toBe(2);
  });

  it('increments cacheHits only when cacheHit is true', () => {
    recordTTS(true, true);
    recordTTS(false, true);
    recordTTS(true, true);
    expect(getMetrics().tts.cacheHits).toBe(2);
  });

  it('increments failures only on failure', () => {
    recordTTS(false, true);
    recordTTS(false, false);
    expect(getMetrics().tts.failures).toBe(1);
  });

  it('computes cacheHitRate correctly', () => {
    recordTTS(true, true);
    recordTTS(true, true);
    recordTTS(false, true);
    recordTTS(false, true);
    expect(getMetrics().tts.cacheHitRate).toBe('50.0%');
  });

  it('returns 0% cacheHitRate when no calls made', () => {
    expect(getMetrics().tts.cacheHitRate).toBe('0%');
  });
});

describe('getMetrics — latency percentiles', () => {
  it('returns 0 for all percentiles when no AI calls recorded', () => {
    const { latency } = getMetrics().ai;
    expect(latency.p50).toBe(0);
    expect(latency.p95).toBe(0);
    expect(latency.p99).toBe(0);
  });

  it('computes percentiles from recorded latencies', () => {
    // Push 100 values: 1–100
    for (let i = 1; i <= 100; i++) {
      recordAICall('gemini', i, true);
    }
    const { latency } = getMetrics().ai;
    expect(latency.p50).toBe(50);
    expect(latency.p95).toBe(95);
    expect(latency.p99).toBe(99);
  });

  it('computes correct errorRate percentage string', () => {
    recordAICall('gemini', 100, true);
    recordAICall('gemini', 100, false);
    expect(getMetrics().ai.errorRate).toBe('50.0%');
  });

  it('returns 0% errorRate when no calls', () => {
    expect(getMetrics().ai.errorRate).toBe('0%');
  });
});

describe('latency array cap', () => {
  it('caps the latency array at 1000 entries', () => {
    for (let i = 0; i < 1100; i++) {
      recordAICall('gemini', i, true);
    }
    // We can't read latencyMs directly, but we can verify calls > 1000 and percentiles still work
    const m = getMetrics();
    expect(m.ai.calls).toBe(1100);
    // p99 should reflect only the last 1000 samples (100..1099), p99 = index 989 = value 1089
    expect(m.ai.latency.p99).toBe(1089);
  });
});

describe('resetMetrics', () => {
  it('clears all counters to zero', () => {
    recordRequest(200);
    recordAICall('gemini', 100, true, { input: 500, output: 250 });
    recordTTS(true, true);

    resetMetrics();

    const m = getMetrics();
    expect(m.requests.total).toBe(0);
    expect(m.requests.errors).toBe(0);
    expect(m.ai.calls).toBe(0);
    expect(m.ai.failures).toBe(0);
    expect(m.ai.totalTokens.input).toBe(0);
    expect(m.ai.totalTokens.output).toBe(0);
    expect(m.ai.latency.p50).toBe(0);
    expect(m.tts.calls).toBe(0);
    expect(m.tts.cacheHits).toBe(0);
    expect(m.tts.failures).toBe(0);
  });

  it('clears byStatus and byProvider maps', () => {
    recordRequest(200);
    recordAICall('gemini', 100, true);
    resetMetrics();

    const m = getMetrics();
    expect(Object.keys(m.requests.byStatus)).toHaveLength(0);
    expect(Object.keys(m.ai.byProvider)).toHaveLength(0);
  });
});
