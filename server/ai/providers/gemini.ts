import { GoogleGenAI, Modality } from "@google/genai";
import type { AIProvider, TextGenerationRequest, TextGenerationResponse, ImageGenerationRequest, ImageGenerationResponse, StreamingTextChunk } from "../types";
import { CHECK_TIMEOUT_MS } from "../../health-checks";

const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

export async function pingGemini(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  try {
    const res = await fetch(GEMINI_MODELS_URL, {
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Gemini not configured");
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export const geminiProvider: AIProvider = {
  name: "gemini",
  displayName: "Google Gemini",
  textModel: "gemini-2.5-flash",
  capabilities: { text: true, image: true, streaming: true },

  isAvailable(): boolean {
    return !!getApiKey();
  },

  async generateText(req: TextGenerationRequest): Promise<TextGenerationResponse> {
    const config: Record<string, unknown> = {
      systemInstruction: req.systemPrompt,
      temperature: req.temperature ?? 0.9,
      maxOutputTokens: req.maxTokens ?? 8192,
    };
    if (req.jsonMode) config.responseMimeType = "application/json";
    if (req.responseSchema) {
      config.responseMimeType = "application/json";
      config.responseSchema = req.responseSchema;
    }
    if (req.thinkingBudget !== undefined) config.thinkingConfig = { thinkingBudget: req.thinkingBudget };

    const response = await getClient().models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: req.userPrompt }] }],
      config,
    });
    return {
      text: response.text || "",
      provider: "gemini",
      model: "gemini-2.5-flash",
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
      },
    };
  },

  async *generateTextStream(req: TextGenerationRequest): AsyncGenerator<StreamingTextChunk> {
    const config: Record<string, unknown> = {
      systemInstruction: req.systemPrompt,
      temperature: req.temperature ?? 0.9,
      maxOutputTokens: req.maxTokens ?? 8192,
    };
    if (req.thinkingBudget !== undefined) config.thinkingConfig = { thinkingBudget: req.thinkingBudget };

    const response = await getClient().models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: req.userPrompt }] }],
      config,
    });
    for await (const chunk of response) {
      const text = chunk.text || "";
      if (text) yield { text, done: false };
    }
    yield { text: "", done: true };
  },

  async generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const response = await getClient().models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });
    const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
    if (!imagePart?.inlineData?.data) throw new Error("Gemini returned no image data");
    return {
      imageDataUri: `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`,
      provider: "gemini",
      model: "gemini-2.5-flash-image",
    };
  },
};
