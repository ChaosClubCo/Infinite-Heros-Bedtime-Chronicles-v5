import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, TextGenerationRequest, TextGenerationResponse, StreamingTextChunk } from "../types";
import { CHECK_TIMEOUT_MS } from "../../health-checks";

const ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models";

function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY?.trim() || undefined;
}

function getBaseUrl(): string | undefined {
  return process.env.ANTHROPIC_BASE_URL?.trim() || undefined;
}

function getClient(): Anthropic | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new Anthropic({ apiKey, baseURL: getBaseUrl() });
}

/** Cheap reachability probe for health checks without generating content. */
export async function pingAnthropic(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  const baseURL = getBaseUrl();
  const modelsUrl = baseURL ? `${baseURL.replace(/\/$/, "")}/v1/models` : ANTHROPIC_MODELS_URL;
  try {
    const res = await fetch(modelsUrl, {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",
  displayName: "Anthropic Claude",
  textModel: "claude-sonnet-4-6",
  capabilities: { text: true, image: false, streaming: true },

  isAvailable(): boolean {
    return !!getApiKey();
  },

  async generateText(req: TextGenerationRequest): Promise<TextGenerationResponse> {
    const client = getClient();
    if (!client) throw new Error("Anthropic not configured");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: req.maxTokens ?? 8192,
      system: req.systemPrompt,
      messages: [{ role: "user", content: req.userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";

    return {
      text,
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      usage: {
        inputTokens: message.usage?.input_tokens,
        outputTokens: message.usage?.output_tokens,
      },
    };
  },

  async *generateTextStream(req: TextGenerationRequest): AsyncGenerator<StreamingTextChunk> {
    const client = getClient();
    if (!client) throw new Error("Anthropic not configured");

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: req.maxTokens ?? 8192,
      system: req.systemPrompt,
      messages: [{ role: "user", content: req.userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { text: event.delta.text, done: false };
      }
    }
    yield { text: "", done: true };
  },
};
