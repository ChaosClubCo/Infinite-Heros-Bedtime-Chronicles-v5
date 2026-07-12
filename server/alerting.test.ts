import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCaptureMessage = vi.fn();
vi.mock("@sentry/node", () => ({ captureMessage: mockCaptureMessage }));

const mockGetMetrics = vi.fn();
vi.mock("./metrics", () => ({ getMetrics: mockGetMetrics }));

function metricsWith(overrides: { total?: number; byStatus?: Record<number, number>; ttsCalls?: number; ttsFailures?: number }) {
  return {
    requests: { total: overrides.total ?? 0, errors: 0, byStatus: overrides.byStatus ?? {} },
    tts: { calls: overrides.ttsCalls ?? 0, failures: overrides.ttsFailures ?? 0, cacheHits: 0, cacheHitRate: "0%" },
  };
}

describe("checkAlertThresholds", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useRealTimers();
    const { resetAlertState } = await import("./alerting");
    resetAlertState();
  });

  it("does not fire below the sample-size floor even at a 100% failure rate", async () => {
    mockGetMetrics.mockReturnValue(metricsWith({ total: 5, byStatus: { 500: 5 } }));
    const { checkAlertThresholds } = await import("./alerting");
    checkAlertThresholds();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("does not fire below the warning threshold", async () => {
    mockGetMetrics.mockReturnValue(metricsWith({ total: 100, byStatus: { 200: 98, 500: 2 } }));
    const { checkAlertThresholds } = await import("./alerting");
    checkAlertThresholds();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("fires a warning-level alert at the 5xx warn threshold", async () => {
    mockGetMetrics.mockReturnValue(metricsWith({ total: 100, byStatus: { 200: 90, 500: 10 } }));
    const { checkAlertThresholds } = await import("./alerting");
    checkAlertThresholds();
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith(expect.stringContaining("5xx rate elevated"), expect.objectContaining({ level: "warning" }));
  });

  it("fires an error-level alert at the 5xx critical threshold", async () => {
    mockGetMetrics.mockReturnValue(metricsWith({ total: 100, byStatus: { 200: 70, 500: 30 } }));
    const { checkAlertThresholds } = await import("./alerting");
    checkAlertThresholds();
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith(expect.stringContaining("5xx rate critical"), expect.objectContaining({ level: "error" }));
  });

  it("fires a TTS failure alert independently of the 5xx alert", async () => {
    mockGetMetrics.mockReturnValue(metricsWith({ total: 100, byStatus: { 200: 100 }, ttsCalls: 20, ttsFailures: 15 }));
    const { checkAlertThresholds } = await import("./alerting");
    checkAlertThresholds();
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith(expect.stringContaining("TTS failure rate critical"), expect.objectContaining({ level: "error" }));
  });

  it("suppresses a repeat fire of the same alert within the cooldown window", async () => {
    vi.useFakeTimers();
    mockGetMetrics.mockReturnValue(metricsWith({ total: 100, byStatus: { 200: 90, 500: 10 } }));
    const { checkAlertThresholds } = await import("./alerting");

    checkAlertThresholds();
    checkAlertThresholds();
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    checkAlertThresholds();
    expect(mockCaptureMessage).toHaveBeenCalledTimes(2);
  });
});
