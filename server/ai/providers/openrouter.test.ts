import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { xaiProvider, mistralProvider, cohereProvider, metaLlamaProvider } from './openrouter';

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
    vi.stubEnv('AI_INTEGRATIONS_OPENROUTER_API_KEY', 'router-key');
    vi.stubEnv('AI_INTEGRATIONS_OPENROUTER_BASE_URL', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe.each(PROVIDERS)('$name', ({ provider, name, displayName, model }) => {
    it('exposes the expected identity and OpenRouter model', () => {
      expect(provider.name).toBe(name);
      expect(provider.displayName).toBe(displayName);
      expect(provider.textModel).toBe(model);
      expect(provider.capabilities).toEqual({ text: true, image: false, streaming: true });
      expect(provider.generateImage).toBeUndefined();
    });

    it('availability is keyed to the shared OpenRouter key', () => {
      expect(provider.isAvailable()).toBe(true);
      vi.stubEnv('AI_INTEGRATIONS_OPENROUTER_API_KEY', undefined);
      expect(provider.isAvailable()).toBe(false);
    });

    it('throws a provider-specific error when OpenRouter is not configured', async () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENROUTER_API_KEY', undefined);
      await expect(provider.generateText(REQ)).rejects.toThrow(
        `${displayName} not configured (requires OpenRouter)`
      );
      const stream = provider.generateTextStream!(REQ);
      await expect(stream.next()).rejects.toThrow(`${displayName} not configured (requires OpenRouter)`);
    });

    it('sends the mapped model with defaults and supports jsonMode', async () => {
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
        usage: { inputTokens: 5, outputTokens: 15 },
      });
    });

    it('streams deltas and ends with a done chunk', async () => {
      chatCreateMock.mockResolvedValue((async function* () {
        yield { choices: [{ delta: { content: 'Once' } }] };
        yield { choices: [{ delta: {} }] };
        yield { choices: [{ delta: { content: ' upon' } }] };
      })());

      const chunks = [];
      for await (const chunk of provider.generateTextStream!(REQ)) {
        chunks.push(chunk);
      }
      expect(chatCreateMock).toHaveBeenCalledWith(expect.objectContaining({ model, stream: true }));
      expect(chunks).toEqual([
        { text: 'Once', done: false },
        { text: ' upon', done: false },
        { text: '', done: true },
      ]);
    });
  });

  it('passes the OpenRouter key and base URL to the client', async () => {
    vi.stubEnv('AI_INTEGRATIONS_OPENROUTER_BASE_URL', 'https://openrouter.example');
    chatCreateMock.mockResolvedValue(mockCompletion());
    await xaiProvider.generateText(REQ);
    expect(ctorArgs[0]).toEqual({ apiKey: 'router-key', baseURL: 'https://openrouter.example' });
  });

  it('omits the base URL when not configured', async () => {
    chatCreateMock.mockResolvedValue(mockCompletion());
    await xaiProvider.generateText(REQ);
    expect(ctorArgs[0]).toEqual({ apiKey: 'router-key', baseURL: undefined });
  });
});
