export interface TextGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface TextGenerationResponse {
  text: string;
  provider: string;
  model: string;
}

export interface ProviderStatus {
  provider: string;
  available: boolean;
  reason?: string;
}

export interface AIOrchestrator {
  generateText(taskType: string, request: TextGenerationRequest): Promise<TextGenerationResponse>;
  getProviderStatuses(): ProviderStatus[];
}
