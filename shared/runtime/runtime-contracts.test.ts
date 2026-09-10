import { describe, expect, it } from "vitest";
import { normalizeHeaders } from "./http";
import type { RuntimeRequest, RuntimeResponse } from "./http";
import type { AIOrchestrator } from "./ai";
import type { MediaObject, MediaStore } from "./media-store";
import type { PersistenceHealth } from "./persistence";

describe("runtime-neutral contracts", () => {
  it("normalizes Headers into a lowercase plain record", () => {
    const headers = new Headers({
      Authorization: "Bearer test-token",
      "X-Request-ID": "req-123",
    });

    expect(normalizeHeaders(headers)).toEqual({
      authorization: "Bearer test-token",
      "x-request-id": "req-123",
    });
  });

  it("keeps HTTP request and response contracts independent of framework types", () => {
    const request = {
      method: "GET",
      url: "https://example.test/api/health",
      headers: { accept: "application/json" },
      requestId: "req-123",
    } satisfies RuntimeRequest;

    const response = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { ok: true },
    } satisfies RuntimeResponse<{ ok: boolean }>;

    expect(request.method).toBe("GET");
    expect(response.body.ok).toBe(true);
  });

  it("defines a portable media store contract", async () => {
    const stored: MediaObject = {
      key: "stories/story-123/scene-1.webp",
      contentType: "image/webp",
      etag: "etag-1",
      size: 4,
      body: new Uint8Array([1, 2, 3, 4]),
    };

    const store: MediaStore = {
      async put(key, body, options) {
        expect(key).toBe(stored.key);
        expect(options?.contentType).toBe("image/webp");
        expect(body).toBeInstanceOf(Uint8Array);
        return { ...stored, body };
      },
      async get(key) {
        return key === stored.key ? stored : null;
      },
      async delete() {
        return;
      },
    };

    const result = await store.put(
      stored.key,
      new Uint8Array([1, 2, 3, 4]),
      { contentType: "image/webp" },
    );

    expect(result.etag).toBe("etag-1");
    expect((await store.get(stored.key))?.size).toBe(4);
  });

  it("defines bounded persistence health and AI delegation surfaces", async () => {
    const persistence = {
      ok: true,
      provider: "postgres",
      latencyMs: 18,
    } satisfies PersistenceHealth;

    const ai: AIOrchestrator = {
      async generateText(_taskType, request) {
        return {
          text: `echo:${request.userPrompt}`,
          provider: "gemini",
          model: "test-model",
        };
      },
      getProviderStatuses() {
        return [];
      },
    };

    const result = await ai.generateText("story", {
      systemPrompt: "system",
      userPrompt: "hello",
    });

    expect(persistence.provider).toBe("postgres");
    expect(result.text).toBe("echo:hello");
  });
});
