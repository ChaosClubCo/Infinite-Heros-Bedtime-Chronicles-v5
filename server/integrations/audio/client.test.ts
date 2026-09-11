import { beforeEach, describe, expect, it, vi } from "vitest";
const OpenAIMock = vi.fn(function MockOpenAI() { return { audio: { transcriptions: { create: vi.fn() } }, chat: { completions: { create: vi.fn() } } }; });
vi.mock("openai", () => ({ default: OpenAIMock, toFile: vi.fn() }));

describe("audio client OpenAI configuration", () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); delete process.env.OPENAI_API_KEY; });
  it("throws before constructing the SDK when OPENAI_API_KEY is missing", async () => {
    const { textToSpeech } = await import("./client");
    await expect(textToSpeech("hello")).rejects.toThrow("OpenAI is not configured. OPENAI_API_KEY is required.");
    expect(OpenAIMock).not.toHaveBeenCalled();
  });
});
