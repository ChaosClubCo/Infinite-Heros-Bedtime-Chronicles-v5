import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  xaiProvider,
  mistralProvider,
  cohereProvider,
  metaLlamaProvider,
  pingOpenRouter,
  OPENROUTER_PRIVACY_ROUTING,
} from './openrouter';

const { chatCreateMock, ctorArgs } = vi.hoisted(() => ({
  chatCreateMock: vi.fn(),
  ctorArgs: [] as unknown[],
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: chatCreateMock } };
    constructor(opts: unknown) {
      ctorArgs.push(opts);
    }
  },
}));

const PROVIDERS = [
  { provider: xaiProvider, name: 'xai', displayName: 'xAI Grok', model: 'x-ai/grok-3-mini' },
  { provider: mistralProvider, name: 'mistral', displayName: 'Mistral', model: 'mistralai/mistral-small-3.1-24b-instruct' },
  { provider: cohereProvider, name: 'cohere', displayName: 'Cohere Command', model: 'cohere/command-a-03-2025' },
  { provider: metaLlamaProvider, name: 'meta-llama', displayName: 'Meta Llama', model: 'meta-llama/llama-4-scout-17b-16e-instruct' },
] as const;

function mockCompletion() {
  return {
    choices: [{ message: { content: 'a story' } }],
    usage: { prompt_tokens: 5, completion_tokens: 15 },
  };
}

const REQ = { systemPrompt: 'sys', userPrompt: 'user' };

describe('openrouter providers', () => {
  beforeEach(() => {
    chatCreateMock.mockReset();
    ctorArgs.length = 0;
    vi.stubEnv('OPENROUTER_API_KEY', 'router-key');
    vi.stubEnv('OPENROUTER_BASE_URL', undefined);
    vi.stubEnv('AI_INTEGRATIONS_OPENROUTER_API_KEY', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('locks every request to zero-retention, non-collecting endpoints', () => {
    expect(OPENROUTER_PRIVACY_ROUTING).toEqual({
      zdr: true,
      data_collection: 'deny',
    });
  });

  describe.each(PROVIDERS)('$name', ({ provider, name, displayName, model }) => {
    it('exposes the expected identity and OpenRouter model', () => {
      expect(provider.name).toBe(name);
      expect(provider.displayName).toBe(displayName);
      expect(provider.textModel).toBe(model);
      expect(provider.capabilities).toEqual({ text: true, image: false, streaming: true });
      expect(provider.generateImage).toBeUndefined();
    });

    it('availability is keyed to OPENROUTER_API_KEY', () => {
      expect(provider.isAvailable()).toBe(true);
      vi.stubEnv('OPENROUTER_API_KEY', undefined);
      expect(provider.isAvailable()).toBe(false);
    });

    it('throws a provider-specific error when OpenRouter is not configured', async () => {
      vi.stubEnv('OPENROUTER_API_KEY', undefined);
      await expect(provider.generateText(REQ)).rejects.toThrow(
        `${displayName} not configured (requires OpenRouter)`
      );
      const stream = provider.generateTextStream!(REQ);
      await expect(stream.next()).rejects.toThrow(`${displayName} not configured (requires OpenRouter)`);
    });

    it('sends the mapped model with defaults, privacy routing, and jsonMode', async () => {
      chatCreateMock.mockResolvedValue(mockCompletion());
      await provider.generateText({ ...REQ, jsonMode: true });
      expect(chatCreateMock).toHaveBeenCalledWith({
        model,
        messages: [
          { role: 'system', content: 'sys' },
          { role: 'user', content: 'user' },
        ],
        temperature: 0.9,
        max_tokens: 8192,
        provider: { zdr: true, data_collection: 'deny' },
        response_format: { type: 'json_object' },
      });
    });

    it('reports itself (not openrouter) as the response provider', async () => {
      chatCreateMock.mockResolvedValue(mockCompletion());
      const result = await provider.generateText(REQ);
      expect(result).toEqual({
        text: 'a story',
        provider: name,
        model,
        usage: {
          inputTokens: 5,
          outputTokens: 15,
        },
      });
    });

    it('streams deltas with privacy routing and ends with a done chunk', async () => {
      chatCreateMock.mockResolvedValue((async function* () {
        yield { choices: [{ delta: { content: 'Once' } }] };
        yield { choices: [{ delta: {} }] };
        yield { choices: [{ delta: { content: ' upon' } }] };
      })());

      const chunks = [];
      for await (const chunk of provider.generateTextStream!(REQ)) {
        chunks.push(chunk);
      }
      expect(chatCreateMock).toHaveBeenCalledWith(expect.objectContaining({
        model,
        stream: true,
        provider: { zdr: true, data_collection: 'deny' },
      }));
      expect(chunks).toEqual([
        { text: 'Once', done: false },
        { text: ' upon', done: false },
        { text: '', done: true },
      ]);
    });
  });

  it('uses the canonical OpenRouter base URL by default', async () => {
    chatCreateMock.mockResolvedValue(mockCompletion());
    await xaiProvider.generateText(REQ);
    expect(ctorArgs[0]).toEqual({
      apiKey: 'router-key',
      baseURL: 'https://openrouter.ai/api/v1',
    });
  });

  it('passes OPENROUTER_BASE_URL when configured', async () => {
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.example');
    chatCreateMock.mockResolvedValue(mockCompletion());
    await xaiProvider.generateText(REQ);
    expect(ctorArgs[0]).toEqual({ apiKey: 'router-key', baseURL: 'https://openrouter.example' });
  });

  describe('pingOpenRouter', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('returns false if API key is missing', async () => {
      vi.stubEnv('OPENROUTER_API_KEY', '');
      const result = await pingOpenRouter();
      expect(result).toBe(false);
    });

    it('makes a fetch request with Authorization header and returns true on success', async () => {
      vi.stubEnv('OPENROUTER_API_KEY', 'router-secret');
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await pingOpenRouter();

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer router-secret',
          },
        })
      );
    });

    it('returns false if fetch fails', async () => {
      vi.stubEnv('OPENROUTER_API_KEY', 'router-secret');
      global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

      const result = await pingOpenRouter();
      expect(result).toBe(false);
    });
  });
});
