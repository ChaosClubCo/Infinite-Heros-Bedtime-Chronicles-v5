import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AIProvider } from "../types";

const { generateContentMock, generateContentStreamMock, ctorArgs } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
  generateContentStreamMock: vi.fn(),
  ctorArgs: [] as unknown[],
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = { generateContent: generateContentMock, generateContentStream: generateContentStreamMock };
    constructor(opts: unknown) { ctorArgs.push(opts); }
  },
  Modality: { TEXT: "TEXT", IMAGE: "IMAGE" },
}));

const REQ = { systemPrompt: "sys", userPrompt: "user" };
async function loadProvider(): Promise<AIProvider> { return (await import("./gemini")).geminiProvider; }
async function loadPing(): Promise<typeof import("./gemini").pingGemini> { return (await import("./gemini")).pingGemini; }

describe("geminiProvider direct AI Studio configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    generateContentMock.mockReset();
    generateContentStreamMock.mockReset();
    ctorArgs.length = 0;
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("uses GEMINI_API_KEY and no custom base URL", async () => {
    generateContentMock.mockResolvedValue({ text: "story", usageMetadata: {} });
    const provider = await loadProvider();
    await provider.generateText(REQ);
    expect(ctorArgs[0]).toEqual({ apiKey: "test-key" });
    expect(provider.isAvailable()).toBe(true);
  });

  it("rejects generation when GEMINI_API_KEY is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const provider = await loadProvider();
    expect(provider.isAvailable()).toBe(false);
    await expect(provider.generateText(REQ)).rejects.toThrow("Gemini not configured");
  });

  it("maps text response and usage", async () => {
    generateContentMock.mockResolvedValue({ text: "a story", usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 15 } });
    const result = await (await loadProvider()).generateText(REQ);
    expect(result).toEqual({ text: "a story", provider: "gemini", model: "gemini-2.5-flash", usage: { inputTokens: 5, outputTokens: 15 } });
  });

  it("streams non-empty chunks and emits done", async () => {
    generateContentStreamMock.mockResolvedValue((async function* () { yield { text: "Once" }; yield { text: "" }; yield { text: " upon" }; })());
    const chunks = [];
    for await (const chunk of (await loadProvider()).generateTextStream!(REQ)) chunks.push(chunk);
    expect(chunks).toEqual([{ text: "Once", done: false }, { text: " upon", done: false }, { text: "", done: true }]);
  });

  it("generates image data URIs", async () => {
    generateContentMock.mockResolvedValue({ candidates: [{ content: { parts: [{ inlineData: { data: "abc123", mimeType: "image/jpeg" } }] } }] });
    const result = await (await loadProvider()).generateImage!({ prompt: "a hero" });
    expect(result.imageDataUri).toBe("data:image/jpeg;base64,abc123");
  });

  it("pings the canonical Gemini endpoint", async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      expect(await (await loadPing())()).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://generativelanguage.googleapis.com/v1beta/models",
        expect.objectContaining({ headers: { "x-goog-api-key": "test-key" } }),
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
