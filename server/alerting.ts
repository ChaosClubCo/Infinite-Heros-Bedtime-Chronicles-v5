import * as Sentry from "@sentry/node";
import { getMetrics } from "./metrics";
import { logger } from "./logger";

const THRESHOLDS = {
  storyErrorRateWarnPct: parseFloat(process.env.ALERT_5XX_RATE_WARN_PCT || "5"),
  storyErrorRateCritPct: parseFloat(process.env.ALERT_5XX_RATE_CRIT_PCT || "20"),
  ttsFailureRateWarnPct: parseFloat(process.env.ALERT_TTS_FAILURE_WARN_PCT || "10"),
  ttsFailureRateCritPct: parseFloat(process.env.ALERT_TTS_FAILURE_CRIT_PCT || "50"),
};

// Minimum sample sizes before evaluating a rate — avoids alerting on e.g. "1 of 1 requests failed".
const MIN_REQUEST_SAMPLE = 20;
const MIN_TTS_SAMPLE = 10;

// Don't re-fire the same alert within this window.
const ALERT_COOLDOWN_MS = parseInt(process.env.ALERT_COOLDOWN_MS || String(15 * 60 * 1000), 10);
const lastFired = new Map<string, number>();

function maybeFire(key: string, level: "warning" | "error", message: string, extra: Record<string, unknown>): void {
  const now = Date.now();
  const last = lastFired.get(key) ?? 0;
  if (now - last < ALERT_COOLDOWN_MS) return;
  lastFired.set(key, now);
  const logFn = level === "error" ? logger.error : logger.warn;
  logFn.call(logger, { alertKey: key, level, ...extra }, message);
  Sentry.captureMessage(message, { level, extra });
}

function pct5xx(byStatus: Record<number, number>, total: number): number {
  if (total === 0) return 0;
  const count5xx = Object.entries(byStatus)
    .filter(([code]) => Number(code) >= 500)
    .reduce((sum, [, n]) => sum + n, 0);
  return (count5xx / total) * 100;
}

/**
 * Reads server/metrics.ts counters and fires a Sentry alert when the 5xx
 * request rate or TTS failure rate crosses a warn/crit threshold. Cheap and
 * synchronous — safe to call inline from a request hook (see
 * server/index.ts, gated to roughly every 20th request) rather than needing
 * a dedicated timer/process on either Replit or Vercel.
 *
 * Known limitation: server/metrics.ts counters are lifetime-cumulative for
 * the process (reset only in tests, or implicitly on a Vercel cold start),
 * so this is a "since process start" rate, not a true rolling window.
 */
export function checkAlertThresholds(): void {
  const metrics = getMetrics();

  const total = metrics.requests.total;
  if (total >= MIN_REQUEST_SAMPLE) {
    const errPct = pct5xx(metrics.requests.byStatus, total);
    if (errPct >= THRESHOLDS.storyErrorRateCritPct) {
      maybeFire("5xx-critical", "error", `5xx rate critical: ${errPct.toFixed(1)}% (${total} requests)`, { errPct, total });
    } else if (errPct >= THRESHOLDS.storyErrorRateWarnPct) {
      maybeFire("5xx-warning", "warning", `5xx rate elevated: ${errPct.toFixed(1)}% (${total} requests)`, { errPct, total });
    }
  }

  const ttsTotal = metrics.tts.calls;
  if (ttsTotal >= MIN_TTS_SAMPLE) {
    const ttsFailPct = (metrics.tts.failures / ttsTotal) * 100;
    if (ttsFailPct >= THRESHOLDS.ttsFailureRateCritPct) {
      maybeFire("tts-critical", "error", `TTS failure rate critical: ${ttsFailPct.toFixed(1)}% (${ttsTotal} calls)`, { ttsFailPct, ttsTotal });
    } else if (ttsFailPct >= THRESHOLDS.ttsFailureRateWarnPct) {
      maybeFire("tts-warning", "warning", `TTS failure rate elevated: ${ttsFailPct.toFixed(1)}% (${ttsTotal} calls)`, { ttsFailPct, ttsTotal });
    }
  }
}

/** For testing only. */
export function resetAlertState(): void {
  lastFired.clear();
}
