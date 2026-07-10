import * as Sentry from "@sentry/node";
import type { ProviderName } from "./types";

/** A single generation costing more than this is reported to Sentry as a cost-anomaly signal. */
const COST_ANOMALY_THRESHOLD_USD = 0.50;

/**
 * Approximate blended USD cost per 1M tokens (input + output averaged) per
 * provider. This is a coarse signal for cost-anomaly detection and per-request
 * cost logging — it is NOT billing-accurate. Verify against current provider
 * pricing pages before using for invoicing. Unknown providers fall back to $1/Mtok.
 */
const APPROX_USD_PER_MTOK: Record<ProviderName, number> = {
  anthropic: 6,
  gemini: 0.3,
  openai: 0.6,
  "meta-llama": 0.2,
  xai: 0.5,
  mistral: 0.3,
  cohere: 2.5,
};

/** Estimate the USD cost of a single text generation from its token usage. */
export function estimateCostUsd(
  provider: ProviderName,
  usage?: { inputTokens?: number; outputTokens?: number },
): number {
  const tokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
  if (tokens === 0) return 0;
  const rate = APPROX_USD_PER_MTOK[provider] ?? 1;
  return Number(((tokens / 1_000_000) * rate).toFixed(6));
}

/**
 * Reports a single generation's cost to Sentry as a warning breadcrumb when it
 * exceeds COST_ANOMALY_THRESHOLD_USD. No-ops when Sentry isn't initialized
 * (unset SENTRY_DSN) since captureMessage is then a safe no-op.
 */
export function reportCostAnomaly(estCostUsd: number, context: { provider: ProviderName; endpoint: string }): void {
  if (estCostUsd <= COST_ANOMALY_THRESHOLD_USD) return;
  Sentry.captureMessage(
    `High-cost AI generation: $${estCostUsd.toFixed(4)} (${context.endpoint} via ${context.provider})`,
    'warning',
  );
}
