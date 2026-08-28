import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openaiProvider, pingOpenAI } from "./openai";

const { chatCreateMock, imagesGenerateMock, ctorArgs } = vi.hoisted(() => ({
  chatCreateMock: vi.fn(), imagesGenerateMock: vi.fn(), ctorArgs: [] as unknown[],
}));
vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: chatCreateMock } };
    images = { generate: imagesGenerateMock };
    constructor(opts: unknown) { ctorArgs.push(opts); }
  },
}));
const REQ = { systemPrompt: "sys", userPrompt: "user" };

describe("openaiProvider direct configuration", () => {
  beforeEach(() => {
    chatCreateMock.mockReset();
    imagesGenerateMock.mockReset();
    ctorArgs.length = 0;
    vi.stubEnv("OPENAI_API_KEY", "direct-key");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("uses OPENAI_API_KEY with the canonical SDK endpoint", async () => {
    chatCreateMock.mockResolvedValue({ choices: [{ message: { content: "story" } }], usage: {} });
    await openaiProvider.generateText(REQ);
    expect(ctorArgs[0]).toEqual({ apiKey: "direct-key" });
    expect(openaiProvider.isAvailable()).toBe(true);
  });

  it("rejects generation when OPENAI_API_KEY is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(openaiProvider.isAvailable()).toBe(false);
    await expect(openaiProvider.generateText(REQ)).rejects.toThrow("OpenAI not configured");
  });

  it("sends expected text defaults", async () => {
    chatCreateMock.mockResolvedValue({ choices: [{ message: { content: "a story" } }], usage: { prompt_tokens: 5, completion_tokens: 15 } });
    const result = await openaiProvider.generateText(REQ);
    expect(chatCreateMock).toHaveBeenCalledWith({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "sys" }, { role: "user", content: "user" }],
      temperature: 0.9,
      max_tokens: 8192,
    });
    expect(result.usage).toEqual({ inputTokens: 5, outputTokens: 15 });
  });

  it("generates image URLs", async () => {
    imagesGenerateMock.mockResolvedValue({ data: [{ url: "https://img.example/x.png" }] });
    const result = await openaiProvider.generateImage!({ prompt: "a hero" });
    expect(result.imageDataUri).toBe("https://img.example/x.png");
  });

  it("pings api.openai.com using the direct key", async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      expect(await pingOpenAI()).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.openai.com/v1/models",
        expect.objectContaining({ headers: { Authorization: "Bearer direct-key" } }),
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
