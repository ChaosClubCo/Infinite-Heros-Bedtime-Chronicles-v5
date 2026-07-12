import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLiveStatus, resetHealthCheckCache } from "./health-checks";

describe("getLiveStatus", () => {
  beforeEach(() => {
    resetHealthCheckCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns {reachable: null} on the first call before any probe resolves", () => {
    const probe = vi.fn().mockResolvedValue(true);
    const result = getLiveStatus("key-a", probe);
    expect(result).toEqual({ reachable: null, checkedAt: null });
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("caches a successful probe result and does not re-probe while fresh", async () => {
    const probe = vi.fn().mockResolvedValue(true);
    getLiveStatus("key-b", probe);
    await vi.waitFor(() => expect(getLiveStatus("key-b", probe).reachable).toBe(true));

    getLiveStatus("key-b", probe);
    getLiveStatus("key-b", probe);
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("does not start a second probe while one is already in flight for the same key", () => {
    let resolveProbe: (v: boolean) => void = () => {};
    const probe = vi.fn(() => new Promise<boolean>((resolve) => { resolveProbe = resolve; }));

    getLiveStatus("key-c", probe);
    getLiveStatus("key-c", probe);
    getLiveStatus("key-c", probe);
    expect(probe).toHaveBeenCalledTimes(1);

    resolveProbe(true);
  });

  it("resolves to reachable:false when the probe rejects", async () => {
    const probe = vi.fn().mockRejectedValue(new Error("network error"));
    getLiveStatus("key-d", probe);
    await vi.waitFor(() => expect(getLiveStatus("key-d", probe).reachable).toBe(false));
  });

  it("resolves to reachable:false when the probe exceeds the timeout", async () => {
    const probe = vi.fn(() => new Promise<boolean>(() => {})); // never resolves
    getLiveStatus("key-e", probe);
    await vi.waitFor(
      () => expect(getLiveStatus("key-e", probe).reachable).toBe(false),
      { timeout: 3000 },
    );
  });

  it("resetHealthCheckCache clears cached and in-flight state", async () => {
    const probe = vi.fn().mockResolvedValue(true);
    getLiveStatus("key-f", probe);
    await vi.waitFor(() => expect(getLiveStatus("key-f", probe).reachable).toBe(true));

    resetHealthCheckCache();
    const result = getLiveStatus("key-f", probe);
    expect(result).toEqual({ reachable: null, checkedAt: null });
  });
});
