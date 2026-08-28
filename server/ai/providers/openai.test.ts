import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { chatCreateMock, imagesGenerateMock, ctorArgs } = vi.hoisted(() => ({
  chatCreateMock: vi.fn(),
  imagesGenerateMock: vi.fn(),
  ctorArgs: [] as unknown[],
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: chatCreateMock } };
    images = { generate: imagesGenerateMock };
    constructor(opts: unknown) {
      ctorArgs.push(opts);
    }
  },
}));

import { openaiProvider, pingOpenAI } from './openai';

function mockCompletion(overrides: Record<string, unknown> = {}) {
  return {
    choices: [{ message: { content: 'a story' } }],
    usage: { prompt_tokens: 5, completion_tokens: 15 },
    ...overrides,
  };
}

const REQ = { systemPrompt: 'sys', userPrompt: 'user' };

describe('openaiProvider', () => {
  beforeEach(() => {
    chatCreateMock.mockReset();
    imagesGenerateMock.mockReset();
    ctorArgs.length = 0;
    vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', 'integrations-key');
    vi.stubEnv('AI_INTEGRATIONS_OPENAI_BASE_URL', undefined);
    vi.stubEnv('OPENAI_API_KEY', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('metadata', () => {
    it('exposes the expected identity, model, and capabilities', () => {
      expect(openaiProvider.name).toBe('openai');
      expect(openaiProvider.displayName).toBe('OpenAI');
      expect(openaiProvider.textModel).toBe('gpt-4o-mini');
      expect(openaiProvider.capabilities).toEqual({ text: true, image: true, streaming: true });
    });
  });

  describe('isAvailable', () => {
    it('is true with only the integrations key', () => {
      expect(openaiProvider.isAvailable()).toBe(true);
    });

    it('is true with only the direct key', () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', undefined);
      vi.stubEnv('OPENAI_API_KEY', 'direct-key');
      expect(openaiProvider.isAvailable()).toBe(true);
    });

    it('is false with neither key', () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', undefined);
      expect(openaiProvider.isAvailable()).toBe(false);
    });
  });

  describe('generateText', () => {
    it('throws when not configured', async () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', undefined);
      await expect(openaiProvider.generateText(REQ)).rejects.toThrow('OpenAI not configured');
    });

    it('prefers the integrations key (with base URL) over the direct key', async () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_BASE_URL', 'https://proxy.example');
      vi.stubEnv('OPENAI_API_KEY', 'direct-key');
      chatCreateMock.mockResolvedValue(mockCompletion());
      await openaiProvider.generateText(REQ);
      expect(ctorArgs[0]).toEqual({ apiKey: 'integrations-key', baseURL: 'https://proxy.example' });
    });

    it('falls back to the direct key when integrations key is absent', async () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', undefined);
      vi.stubEnv('OPENAI_API_KEY', 'direct-key');
      chatCreateMock.mockResolvedValue(mockCompletion());
      await openaiProvider.generateText(REQ);
      expect(ctorArgs[0]).toEqual({ apiKey: 'direct-key' });
    });

    it('sends model, messages, and defaults', async () => {
      chatCreateMock.mockResolvedValue(mockCompletion());
      await openaiProvider.generateText(REQ);
      expect(chatCreateMock).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'sys' },
          { role: 'user', content: 'user' },
        ],
        temperature: 0.9,
        max_tokens: 8192,
      });
    });

    it('adds response_format only in jsonMode', async () => {
      chatCreateMock.mockResolvedValue(mockCompletion());
      await openaiProvider.generateText({ ...REQ, jsonMode: true });
      expect(chatCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({ response_format: { type: 'json_object' } })
      );

      chatCreateMock.mockClear();
      chatCreateMock.mockResolvedValue(mockCompletion());
      await openaiProvider.generateText(REQ);
      expect(chatCreateMock.mock.calls[0][0]).not.toHaveProperty('response_format');
    });

    it('maps the completion text and usage tokens', async () => {
      chatCreateMock.mockResolvedValue(mockCompletion());
      const result = await openaiProvider.generateText(REQ);
      expect(result).toEqual({
        text: 'a story',
        provider: 'openai',
        model: 'gpt-4o-mini',
        usage: { inputTokens: 5, outputTokens: 15 },
      });
    });

    it('falls back to empty text when there is no content', async () => {
      chatCreateMock.mockResolvedValue(mockCompletion({ choices: [] }));
      const result = await openaiProvider.generateText(REQ);
      expect(result.text).toBe('');
    });
  });

  describe('generateTextStream', () => {
    it('requests a stream and skips empty deltas', async () => {
      chatCreateMock.mockResolvedValue((async function* () {
        yield { choices: [{ delta: { content: 'Once' } }] };
        yield { choices: [{ delta: {} }] };
        yield { choices: [{ delta: { content: ' upon' } }] };
      })());

      const chunks = [];
      for await (const chunk of openaiProvider.generateTextStream!(REQ)) {
        chunks.push(chunk);
      }
      expect(chatCreateMock).toHaveBeenCalledWith(expect.objectContaining({ stream: true }));
      expect(chunks).toEqual([
        { text: 'Once', done: false },
        { text: ' upon', done: false },
        { text: '', done: true },
      ]);
    });
  });

  describe('generateImage', () => {
    it('throws when not configured', async () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', undefined);
      await expect(openaiProvider.generateImage!({ prompt: 'a hero' })).rejects.toThrow(
        'OpenAI not configured for image generation'
      );
    });

    it('prefers the direct key over the integrations key for images', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'direct-key');
      imagesGenerateMock.mockResolvedValue({ data: [{ url: 'https://img.example/x.png' }] });
      await openaiProvider.generateImage!({ prompt: 'a hero' });
      expect(ctorArgs[0]).toEqual({ apiKey: 'direct-key' });
    });

    it('sends gpt-image-1 with default size and quality', async () => {
      imagesGenerateMock.mockResolvedValue({ data: [{ url: 'https://img.example/x.png' }] });
      await openaiProvider.generateImage!({ prompt: 'a hero' });
      expect(imagesGenerateMock).toHaveBeenCalledWith({
        model: 'gpt-image-1',
        prompt: 'a hero',
        size: '1536x1024',
        quality: 'low',
        n: 1,
      });
    });

    it('returns a data URI for b64_json payloads', async () => {
      imagesGenerateMock.mockResolvedValue({ data: [{ b64_json: 'abc123' }] });
      const result = await openaiProvider.generateImage!({ prompt: 'a hero' });
      expect(result).toEqual({
        imageDataUri: 'data:image/png;base64,abc123',
        provider: 'openai',
        model: 'gpt-image-1',
      });
    });

    it('passes a URL payload through', async () => {
      imagesGenerateMock.mockResolvedValue({ data: [{ url: 'https://img.example/x.png' }] });
      const result = await openaiProvider.generateImage!({ prompt: 'a hero' });
      expect(result.imageDataUri).toBe('https://img.example/x.png');
    });

    it('throws when there is no image entry', async () => {
      imagesGenerateMock.mockResolvedValue({ data: [] });
      await expect(openaiProvider.generateImage!({ prompt: 'a hero' })).rejects.toThrow(
        'OpenAI returned no image data'
      );
    });

    it('throws when the entry has neither b64_json nor url', async () => {
      imagesGenerateMock.mockResolvedValue({ data: [{}] });
      await expect(openaiProvider.generateImage!({ prompt: 'a hero' })).rejects.toThrow(
        'OpenAI returned no usable image'
      );
    });
  });

  describe('pingOpenAI', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('returns false if both API keys are missing', async () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', '');
      vi.stubEnv('OPENAI_API_KEY', '');
      const result = await pingOpenAI();
      expect(result).toBe(false);
    });

    it('makes a fetch request with Authorization header using integrations key and returns true on success', async () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', 'integrations-secret');
      vi.stubEnv('OPENAI_API_KEY', '');
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await pingOpenAI();

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer integrations-secret',
          },
        })
      );
    });

    it('makes a fetch request with Authorization header using direct key when integrations key is missing', async () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', '');
      vi.stubEnv('OPENAI_API_KEY', 'direct-secret');
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await pingOpenAI();

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer direct-secret',
          },
        })
      );
    });

    it('returns false if fetch fails or throws', async () => {
      vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', 'integrations-secret');
      global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

      const result = await pingOpenAI();
      expect(result).toBe(false);
    });
  });
});
