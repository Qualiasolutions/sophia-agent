import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GoogleAIService } from '../google-ai.service';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

describe('GoogleAIService', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('throws when GOOGLE_AI_API_KEY is missing', async () => {
    process.env.GOOGLE_AI_API_KEY = '';

    await expect(async () => {
      const service = new GoogleAIService();
      await service.generateSophiaResponse({ message: 'Hello' });
    }).rejects.toThrow('GOOGLE_AI_API_KEY');
  });

  it('invokes Google Generative API and returns parsed response', async () => {
    process.env.GOOGLE_AI_API_KEY = 'test-key';

    const jsonResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'Hello from Sophia.' }],
          },
          finishReason: 'STOP',
          safetyRatings: [{ category: 'HARASSMENT', probability: 'LOW' }],
        },
      ],
      usageMetadata: {
        promptTokenCount: 12,
        candidatesTokenCount: 8,
        totalTokenCount: 20,
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(jsonResponse),
    });

    globalThis.fetch = mockFetch;

    const service = new GoogleAIService();
    const result = await service.generateSophiaResponse({
      message: 'Test',
      history: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello, how can I help?' },
      ],
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toContain('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent');
    expect(options?.method).toBe('POST');

    const body = JSON.parse(options?.body as string);
    expect(body.contents).toHaveLength(3);
    expect(body.contents[0]).toEqual({
      role: 'user',
      parts: [{ text: 'Hi' }],
    });
    expect(body.contents[1]).toEqual({
      role: 'model',
      parts: [{ text: 'Hello, how can I help?' }],
    });
    expect(body.contents[2]).toEqual({
      role: 'user',
      parts: [{ text: 'Test' }],
    });

    expect(result.text).toBe('Hello from Sophia.');
    expect(result.finishReason).toBe('STOP');
    expect(result.usage).toEqual({
      promptTokens: 12,
      responseTokens: 8,
      totalTokens: 20,
    });
    expect(result.safetyRatings).toEqual(jsonResponse.candidates[0].safetyRatings);
  });

  it('throws descriptive error on non-OK response', async () => {
    process.env.GOOGLE_AI_API_KEY = 'test-key';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: vi.fn().mockResolvedValue({
        error: { message: 'Permission denied.' },
      }),
    });

    globalThis.fetch = mockFetch;

    const service = new GoogleAIService();

    await expect(
      service.generateSophiaResponse({ message: 'Test' })
    ).rejects.toThrow(/Google Generative AI API error: 403 Forbidden/);
  });
});
