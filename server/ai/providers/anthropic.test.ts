import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { createMock, streamMock, ctorArgs } = vi.hoisted(() => ({
  createMock: vi.fn(),
  streamMock: vi.fn(),
  ctorArgs: [] as unknown[],
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: createMock, stream: streamMock };
    constructor(opts: unknown) {
      ctorArgs.push(opts);
    }
  },
}));

import { anthropicProvider } from './anthropic';

function mockMessage(overrides: Record<string, unknown> = {}) {
  return {
    content: [{ type: 'text', text: 'a story' }],
    usage: { input_tokens: 10, output_tokens: 20 },
    ...overrides,
  };
}

const REQ = { systemPrompt: 'sys', userPrompt: 'user' };

describe('anthropicProvider', () => {
  beforeEach(() => {
    createMock.mockReset();
    streamMock.mockReset();
    ctorArgs.length = 0;
    vi.stubEnv('AI_INTEGRATIONS_ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('AI_INTEGRATIONS_ANTHROPIC_BASE_URL', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('metadata', () => {
    it('exposes the expected identity and model', () => {
      expect(anthropicProvider.name).toBe('anthropic');
      expect(anthropicProvider.displayName).toBe('Anthropic Claude');
      expect(anthropicProvider.textModel).toBe('claude-sonnet-4-6');
    });

    it('declares text + streaming capabilities but not image', () => {
      expect(anthropicProvider.capabilities).toEqual({ text: true, image: false, streaming: true });
      expect(anthropicProvider.generateImage).toBeUndefined();
    });
  });

  describe('isAvailable', () => {
    it('is true when the API key is set', () => {
      expect(anthropicProvider.isAvailable()).toBe(true);
    });

    it('is false without the API key', () => {
      vi.stubEnv('AI_INTEGRATIONS_ANTHROPIC_API_KEY', undefined);
      expect(anthropicProvider.isAvailable()).toBe(false);
    });
  });

  describe('generateText', () => {
    it('throws when not configured', async () => {
      vi.stubEnv('AI_INTEGRATIONS_ANTHROPIC_API_KEY', undefined);
      await expect(anthropicProvider.generateText(REQ)).rejects.toThrow('Anthropic not configured');
    });

    it('passes apiKey and undefined baseURL to the client by default', async () => {
      createMock.mockResolvedValue(mockMessage());
      await anthropicProvider.generateText(REQ);
      expect(ctorArgs[0]).toEqual({ apiKey: 'test-key', baseURL: undefined });
    });

    it('passes the base URL when configured', async () => {
      vi.stubEnv('AI_INTEGRATIONS_ANTHROPIC_BASE_URL', 'https://proxy.example');
      createMock.mockResolvedValue(mockMessage());
      await anthropicProvider.generateText(REQ);
      expect(ctorArgs[0]).toEqual({ apiKey: 'test-key', baseURL: 'https://proxy.example' });
    });

    it('sends model, default max_tokens, system prompt, and the user message', async () => {
      createMock.mockResolvedValue(mockMessage());
      await anthropicProvider.generateText(REQ);
      expect(createMock).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: 'sys',
        messages: [{ role: 'user', content: 'user' }],
      });
    });

    it('respects a maxTokens override', async () => {
      createMock.mockResolvedValue(mockMessage());
      await anthropicProvider.generateText({ ...REQ, maxTokens: 1024 });
      expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ max_tokens: 1024 }));
    });

    it('extracts the first text block and maps usage tokens', async () => {
      createMock.mockResolvedValue(mockMessage());
      const result = await anthropicProvider.generateText(REQ);
      expect(result).toEqual({
        text: 'a story',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        usage: { inputTokens: 10, outputTokens: 20 },
      });
    });

    it('returns empty text when there is no text block', async () => {
      createMock.mockResolvedValue(mockMessage({ content: [{ type: 'tool_use' }] }));
      const result = await anthropicProvider.generateText(REQ);
      expect(result.text).toBe('');
    });
  });

  describe('generateTextStream', () => {
    it('throws when not configured', async () => {
      vi.stubEnv('AI_INTEGRATIONS_ANTHROPIC_API_KEY', undefined);
      const stream = anthropicProvider.generateTextStream!(REQ);
      await expect(stream.next()).rejects.toThrow('Anthropic not configured');
    });

    it('yields only text_delta events followed by a done chunk', async () => {
      streamMock.mockReturnValue((async function* () {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Once' } };
        yield { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: '{' } };
        yield { type: 'message_stop' };
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' upon' } };
      })());

      const chunks = [];
      for await (const chunk of anthropicProvider.generateTextStream!(REQ)) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual([
        { text: 'Once', done: false },
        { text: ' upon', done: false },
        { text: '', done: true },
      ]);
    });
  });
});
