import OpenAI from "openai";
import type { AIProvider, ProviderName, TextGenerationRequest, TextGenerationResponse, StreamingTextChunk } from "../types";
import { CHECK_TIMEOUT_MS } from "../../health-checks";

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const OPENROUTER_PRIVACY_ROUTING = Object.freeze({
  zdr: true,
  data_collection: "deny" as const,
});

function getApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY?.trim() || undefined;
}

function getBaseUrl(): string {
  return process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL;
}

export async function pingOpenRouter(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  try {
    const res = await fetch(`${getBaseUrl().replace(/\/$/, "")}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function getClient(): OpenAI | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: getBaseUrl() });
}

const PROVIDER_MODELS: Record<string, { model: string; providerName: ProviderName; displayName: string }> = {
  "xai": {
    model: "x-ai/grok-3-mini",
    providerName: "xai",
    displayName: "xAI Grok",
  },
  "mistral": {
    model: "mistralai/mistral-small-3.1-24b-instruct",
    providerName: "mistral",
    displayName: "Mistral",
  },
  "cohere": {
    model: "cohere/command-a-03-2025",
    providerName: "cohere",
    displayName: "Cohere Command",
  },
  "meta-llama": {
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    providerName: "meta-llama",
    displayName: "Meta Llama",
  },
};

/**
 * Build the raw OpenRouter request body. The OpenAI-compatible SDK does not
 * currently type OpenRouter's provider preferences, but it forwards unknown
 * JSON fields. Every request is therefore forced onto endpoints that both
 * support zero data retention and deny non-transient data collection.
 */
export function buildOpenRouterRequestBody(
  model: string,
  req: TextGenerationRequest,
  stream: boolean,
): Record<string, unknown> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: req.systemPrompt },
    { role: "user", content: req.userPrompt },
  ];

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: req.temperature ?? 0.9,
    max_tokens: req.maxTokens ?? 8192,
    provider: OPENROUTER_PRIVACY_ROUTING,
  };

  if (stream) body.stream = true;
  if (req.jsonMode) body.response_format = { type: "json_object" };
  return body;
}

function createOpenRouterProvider(providerKey: string): AIProvider {
  const info = PROVIDER_MODELS[providerKey];
  if (!info) throw new Error(`Unknown OpenRouter provider: ${providerKey}`);

  return {
    name: info.providerName,
    displayName: info.displayName,
    textModel: info.model,
    capabilities: { text: true, image: false, streaming: true },

    isAvailable(): boolean {
      return !!getApiKey();
    },

    async generateText(req: TextGenerationRequest): Promise<TextGenerationResponse> {
      const client = getClient();
      if (!client) throw new Error(`${info.displayName} not configured (requires OpenRouter)`);

      const params = (
        buildOpenRouterRequestBody(info.model, req, false)
      ) as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
      const response = await client.chat.completions.create(params);
      const text = response.choices[0]?.message?.content || "";

      return {
        text,
        provider: info.providerName,
        model: info.model,
        usage: {
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
        },
      };
    },

    async *generateTextStream(req: TextGenerationRequest): AsyncGenerator<StreamingTextChunk> {
      const client = getClient();
      if (!client) throw new Error(`${info.displayName} not configured (requires OpenRouter)`);

      const params = (
        buildOpenRouterRequestBody(info.model, req, true)
      ) as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming;
      const stream = await client.chat.completions.create(params);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield { text: content, done: false };
        }
      }
      yield { text: "", done: true };
    },
  };
}

export const xaiProvider = createOpenRouterProvider("xai");
export const mistralProvider = createOpenRouterProvider("mistral");
export const cohereProvider = createOpenRouterProvider("cohere");
export const metaLlamaProvider = createOpenRouterProvider("meta-llama");
