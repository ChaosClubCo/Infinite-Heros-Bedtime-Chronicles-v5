import { beforeEach, describe, expect, it, vi } from "vitest";

const OpenAIMock = vi.fn(function MockOpenAI() {
  return {
    audio: {
      transcriptions: {
        create: vi.fn(),
      },
    },
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock("openai", () => ({
  default: OpenAIMock,
  toFile: vi.fn(),
}));

describe("audio client OpenAI configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  });

  it("throws a clear error before constructing the SDK when the OpenAI key is missing", async () => {
    const { textToSpeech } = await import("./client");

    await expect(textToSpeech("hello")).rejects.toThrow(
      "OpenAI is not configured. AI_INTEGRATIONS_OPENAI_API_KEY is required."
    );
    expect(OpenAIMock).not.toHaveBeenCalled();
  });
});
