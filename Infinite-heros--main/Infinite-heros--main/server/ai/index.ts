import { AIRouter } from "./router";
import { geminiProvider } from "./providers/gemini";
import { openaiProvider } from "./providers/openai";
import { anthropicProvider } from "./providers/anthropic";
import { xaiProvider, mistralProvider, cohereProvider, metaLlamaProvider } from "./providers/openrouter";
import type { ProviderStatus } from "./types";
import type { BreakerStatus } from "./router";
import { logger } from "../logger";

export { AIRouter } from "./router";
export type { BreakerStatus } from "./router";
export type { AITaskType, ProviderName, TextGenerationRequest, TextGenerationResponse, ImageGenerationRequest, ImageGenerationResponse, StreamingTextChunk, ProviderStatus } from "./types";

const allProviders = [
  geminiProvider,
  openaiProvider,
  anthropicProvider,
  xaiProvider,
  mistralProvider,
  cohereProvider,
  metaLlamaProvider,
];

let routerInstance: AIRouter | null = null;

export function getAIRouter(): AIRouter {
  if (!routerInstance) {
    routerInstance = new AIRouter();
    for (const provider of allProviders) {
      routerInstance.registerProvider(provider);
    }
  }
  return routerInstance;
}

export function getProviderStatuses(): ProviderStatus[] {
  const router = getAIRouter();
  return allProviders.map((p) => ({
    name: p.name,
    displayName: p.displayName,
    available: p.isAvailable(),
    capabilities: { ...p.capabilities },
  }));
}

export function getBreakerStatuses(): BreakerStatus[] {
  return getAIRouter().getBreakerStatuses();
}

export function logProviderStatus(): void {
  const statuses = getProviderStatuses();
  const available = statuses.filter((s) => s.available);
  const unavailable = statuses.filter((s) => !s.available);

  logger.info({
    available: available.map((s) => ({
      name: s.displayName,
      capabilities: Object.entries(s.capabilities).filter(([, v]) => v).map(([k]) => k),
    })),
    unavailable: unavailable.map((s) => s.displayName),
    total: statuses.length,
  }, `${available.length}/${statuses.length} AI providers available`);
}
