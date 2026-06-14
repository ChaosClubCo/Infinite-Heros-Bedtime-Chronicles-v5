import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AIProvider } from '../types';

const { generateContentMock, generateContentStreamMock, ctorArgs } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
  generateContentStreamMock: vi.fn(),
  ctorArgs: [] as unknown[],
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = { generateContent: generateContentMock, generateContentStream: generateContentStreamMock };
    constructor(opts: unknown) {
      ctorArgs.push(opts);
    }
  },
  Modality: { TEXT: 'TEXT', IMAGE: 'IMAGE' },
}));

const REQ = { systemPrompt: 'sys', userPrompt: 'user' };

// gemini.ts caches its client in a module-level variable, so each test gets a
// fresh module instance via resetModules + dynamic import.
async function loadProvider(): Promise<AIProvider> {
  const mod = await import('./gemini');
  return mod.geminiProvider;
}

function mockTextResponse(overrides: Record<string, unknown> = {}) {
  return {
    text: 'a story',
    usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 15 },
    ...overrides,
  };
}

describe('geminiProvider', () => {
  beforeEach(() => {
    vi.resetModules();
    generateContentMock.mockReset();
    generateContentStreamMock.mockReset();
    ctorArgs.length = 0;
    vi.stubEnv('AI_INTEGRATIONS_GEMINI_API_KEY', 'test-key');
    vi.stubEnv('AI_INTEGRATIONS_GEMINI_BASE_URL', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('metadata', () => {
    it('exposes the expected identity, model, and capabilities', async () => {
      const provider = await loadProvider();
      expect(provider.name).toBe('gemini');
      expect(provider.displayName).toBe('Google Gemini');
      expect(provider.textModel).toBe('gemini-2.5-flash');
      expect(provider.capabilities).toEqual({ text: true, image: true, streaming: true });
    });
  });

  describe('isAvailable', () => {
    it('is keyed to AI_INTEGRATIONS_GEMINI_API_KEY', async () => {
      const provider = await loadProvider();
      expect(provider.isAvailable()).toBe(true);
      vi.stubEnv('AI_INTEGRATIONS_GEMINI_API_KEY', undefined);
      expect(provider.isAvailable()).toBe(false);
    });
  });

  describe('client construction', () => {
    it('passes apiKey with no httpOptions by default', async () => {
      generateContentMock.mockResolvedValue(mockTextResponse());
      const provider = await loadProvider();
      await provider.generateText(REQ);
      expect(ctorArgs[0]).toEqual({ apiKey: 'test-key', httpOptions: undefined });
    });

    it('passes the base URL via httpOptions when configured', async () => {
      vi.stubEnv('AI_INTEGRATIONS_GEMINI_BASE_URL', 'https://proxy.example');
      generateContentMock.mockResolvedValue(mockTextResponse());
      const provider = await loadProvider();
      await provider.generateText(REQ);
      expect(ctorArgs[0]).toEqual({ apiKey: 'test-key', httpOptions: { baseUrl: 'https://proxy.example' } });
    });

    it('does not validate the key at request time (known quirk: getClient never checks it)', async () => {
      vi.stubEnv('AI_INTEGRATIONS_GEMINI_API_KEY', undefined);
      generateContentMock.mockResolvedValue(mockTextResponse());
      const provider = await loadProvider();
      // Unlike the other providers there is no "not configured" throw; the
      // request goes through with an undefined key.
      await expect(provider.generateText(REQ)).resolves.toMatchObject({ provider: 'gemini' });
      expect(ctorArgs[0]).toEqual({ apiKey: undefined, httpOptions: undefined });
    });
  });

  describe('generateText', () => {
    it('sends model, contents, and default config', async () => {
      generateContentMock.mockResolvedValue(mockTextResponse());
      const provider = await loadProvider();
      await provider.generateText(REQ);
      expect(generateContentMock).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'user' }] }],
        config: { systemInstruction: 'sys', temperature: 0.9, maxOutputTokens: 8192 },
      });
    });

    it('maps jsonMode to responseMimeType', async () => {
      generateContentMock.mockResolvedValue(mockTextResponse());
      const provider = await loadProvider();
      await provider.generateText({ ...REQ, jsonMode: true });
      const config = generateContentMock.mock.calls[0][0].config;
      expect(config.responseMimeType).toBe('application/json');
      expect(config.responseSchema).toBeUndefined();
    });

    it('maps responseSchema to responseMimeType + responseSchema', async () => {
      generateContentMock.mockResolvedValue(mockTextResponse());
      const provider = await loadProvider();
      const schema = { type: 'object' };
      await provider.generateText({ ...REQ, responseSchema: schema });
      const config = generateContentMock.mock.calls[0][0].config;
      expect(config.responseMimeType).toBe('application/json');
      expect(config.responseSchema).toBe(schema);
    });

    it('maps thinkingBudget to thinkingConfig (including 0)', async () => {
      generateContentMock.mockResolvedValue(mockTextResponse());
      const provider = await loadProvider();
      await provider.generateText({ ...REQ, thinkingBudget: 0 });
      const config = generateContentMock.mock.calls[0][0].config;
      expect(config.thinkingConfig).toEqual({ thinkingBudget: 0 });
    });

    it('maps usage metadata and falls back to empty text', async () => {
      generateContentMock.mockResolvedValue(mockTextResponse({ text: undefined }));
      const provider = await loadProvider();
      const result = await provider.generateText(REQ);
      expect(result).toEqual({
        text: '',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        usage: { inputTokens: 5, outputTokens: 15 },
      });
    });
  });

  describe('generateTextStream', () => {
    it('skips empty chunks and ends with a done chunk', async () => {
      generateContentStreamMock.mockResolvedValue((async function* () {
        yield { text: 'Once' };
        yield { text: '' };
        yield { text: undefined };
        yield { text: ' upon' };
      })());

      const provider = await loadProvider();
      const chunks = [];
      for await (const chunk of provider.generateTextStream!(REQ)) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual([
        { text: 'Once', done: false },
        { text: ' upon', done: false },
        { text: '', done: true },
      ]);
    });
  });

  describe('generateImage', () => {
    it('requests the image model with TEXT+IMAGE modalities', async () => {
      generateContentMock.mockResolvedValue({
        candidates: [{ content: { parts: [{ inlineData: { data: 'abc123', mimeType: 'image/jpeg' } }] } }],
      });
      const provider = await loadProvider();
      await provider.generateImage!({ prompt: 'a hero' });
      expect(generateContentMock).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-image',
        contents: [{ role: 'user', parts: [{ text: 'a hero' }] }],
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      });
    });

    it('assembles a data URI from inlineData', async () => {
      generateContentMock.mockResolvedValue({
        candidates: [{ content: { parts: [{ inlineData: { data: 'abc123', mimeType: 'image/jpeg' } }] } }],
      });
      const provider = await loadProvider();
      const result = await provider.generateImage!({ prompt: 'a hero' });
      expect(result).toEqual({
        imageDataUri: 'data:image/jpeg;base64,abc123',
        provider: 'gemini',
        model: 'gemini-2.5-flash-image',
      });
    });

    it('defaults the mime type to image/png', async () => {
      generateContentMock.mockResolvedValue({
        candidates: [{ content: { parts: [{ inlineData: { data: 'abc123' } }] } }],
      });
      const provider = await loadProvider();
      const result = await provider.generateImage!({ prompt: 'a hero' });
      expect(result.imageDataUri).toBe('data:image/png;base64,abc123');
    });

    it('throws when no inline image data is returned', async () => {
      generateContentMock.mockResolvedValue({
        candidates: [{ content: { parts: [{ text: 'no image here' }] } }],
      });
      const provider = await loadProvider();
      await expect(provider.generateImage!({ prompt: 'a hero' })).rejects.toThrow('Gemini returned no image data');
    });
  });
});
