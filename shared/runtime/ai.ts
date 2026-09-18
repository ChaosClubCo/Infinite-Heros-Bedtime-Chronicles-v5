/**
 * Portable AI orchestration surface independent of Express or a specific provider SDK.
 */

export type RuntimeAITaskType = string;

export type RuntimeTextGenerationRequest = {
  systemPrompt: string;
  userPrompt: string;
};

export type RuntimeTextGenerationResponse = {
  text: string;
  provider: string;
  model: string;
};

export type RuntimeProviderStatus = {
  name: string;
  available: boolean;
};

export interface AIOrchestrator {
  generateText(
    taskType: RuntimeAITaskType,
    request: RuntimeTextGenerationRequest,
  ): Promise<RuntimeTextGenerationResponse>;
  getProviderStatuses(): RuntimeProviderStatus[];
}
