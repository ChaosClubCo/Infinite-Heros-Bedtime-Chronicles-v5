import OpenAI from "openai";
import type { AIProvider, TextGenerationRequest, TextGenerationResponse, ImageGenerationRequest, ImageGenerationResponse, StreamingTextChunk } from "../types";
import { CHECK_TIMEOUT_MS } from "../../health-checks";

const OPENAI_BASE_URL = "https://api.openai.com/v1";
function getApiKey(): string | undefined { return process.env.OPENAI_API_KEY?.trim() || undefined; }

export async function pingOpenAI(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  try {
    const res = await fetch(`${OPENAI_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function getClient(): OpenAI {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("OpenAI not configured");
  return new OpenAI({ apiKey });
}

export const openaiProvider: AIProvider = {
  name: "openai",
  displayName: "OpenAI",
  textModel: "gpt-4o-mini",
  capabilities: { text: true, image: true, streaming: true },

  isAvailable(): boolean { return !!getApiKey(); },

  async generateText(req: TextGenerationRequest): Promise<TextGenerationResponse> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: req.systemPrompt },
      { role: "user", content: req.userPrompt },
    ];
    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: "gpt-4o-mini",
      messages,
      temperature: req.temperature ?? 0.9,
      max_tokens: req.maxTokens ?? 8192,
    };
    if (req.jsonMode) params.response_format = { type: "json_object" };
    const response = await getClient().chat.completions.create(params);
    return {
      text: response.choices[0]?.message?.content || "",
      provider: "openai",
      model: "gpt-4o-mini",
      usage: { inputTokens: response.usage?.prompt_tokens, outputTokens: response.usage?.completion_tokens },
    };
  },

  async *generateTextStream(req: TextGenerationRequest): AsyncGenerator<StreamingTextChunk> {
    const stream = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: req.systemPrompt }, { role: "user", content: req.userPrompt }],
      temperature: req.temperature ?? 0.9,
      max_tokens: req.maxTokens ?? 8192,
      stream: true,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) yield { text: content, done: false };
    }
    yield { text: "", done: true };
  },

  async generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const response = await getClient().images.generate({
      model: "gpt-image-1",
      prompt: req.prompt,
      size: (req.size as "1536x1024") || "1536x1024",
      quality: (req.quality as "low") || "low",
      n: 1,
    });
    const imageData = response.data?.[0];
    if (!imageData) throw new Error("OpenAI returned no image data");
    const imageRecord = imageData as Record<string, unknown>;
    if (imageRecord.b64_json) return { imageDataUri: `data:image/png;base64,${imageRecord.b64_json}`, provider: "openai", model: "gpt-image-1" };
    if (imageData.url) return { imageDataUri: imageData.url, provider: "openai", model: "gpt-image-1" };
    throw new Error("OpenAI returned no usable image");
  },
};
