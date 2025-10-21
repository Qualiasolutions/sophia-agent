import type { ConversationMessage } from '@sophiaai/shared';
import { SOPHIA_SYSTEM_PROMPT } from './constants/sophia-system-prompt';

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

interface SophiaMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GoogleAIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  safetyRatings?: unknown;
}

export class GoogleAIService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiBaseUrl: string;

  constructor(config?: { apiKey?: string; model?: string; apiBaseUrl?: string }) {
    const envKey = process.env.GOOGLE_AI_API_KEY;
    const envModel = process.env.GOOGLE_AI_MODEL;

    this.apiKey = config?.apiKey ?? envKey ?? '';
    this.model = config?.model ?? envModel ?? DEFAULT_MODEL;
    this.apiBaseUrl =
      config?.apiBaseUrl ??
      process.env.GOOGLE_AI_API_BASE_URL ??
      'https://generativelanguage.googleapis.com/v1beta';

    if (!this.apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
    }
  }

  async generateSophiaResponse(options: {
    message: string;
    history?: SophiaMessage[] | ConversationMessage[];
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<GoogleAIResponse> {
    const {
      message,
      history = [],
      temperature = DEFAULT_TEMPERATURE,
      maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
    } = options;

    if (!message?.trim()) {
      throw new Error('Message is required to generate a response');
    }

    const contents = this.buildContents(history, message);
    const url = `${this.apiBaseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            role: 'system',
            parts: [{ text: SOPHIA_SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorPayload = await this.safeJson(response);
        console.error('[GoogleAIService] API error response', {
          status: response.status,
          statusText: response.statusText,
          error: errorPayload,
        });

        throw new Error(
          `Google Generative AI API error: ${response.status} ${response.statusText}`
        );
      }

      const payload = await response.json();
      const text = this.extractText(payload);

      return {
        text,
        usage: this.extractUsage(payload),
        finishReason: payload?.candidates?.[0]?.finishReason,
        safetyRatings: payload?.candidates?.[0]?.safetyRatings,
      };
    } catch (error) {
      console.error('[GoogleAIService] Failed to generate response', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  private buildContents(
    history: Array<SophiaMessage | ConversationMessage>,
    message: string
  ) {
    const mappedHistory = history
      .map((entry) => {
        if ('role' in entry && entry.role === 'system') {
          return null;
        }

        const role =
          'role' in entry && entry.role === 'assistant' ? 'model' : 'user';
        const content =
          'content' in entry ? entry.content : (entry as SophiaMessage).content;

        if (!content?.trim()) {
          return null;
        }

        return {
          role,
          parts: [{ text: content }],
        };
      })
      .filter(Boolean);

    return [
      ...(mappedHistory as Array<{ role: string; parts: Array<{ text: string }> }>),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];
  }

  private extractText(payload: any) {
    const candidates = payload?.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return "I'm not sure how to help with that yet.";
    }

    const parts = candidates[0]?.content?.parts;
    if (!Array.isArray(parts)) {
      return "I'm not sure how to help with that yet.";
    }

    return parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  private extractUsage(payload: any) {
    const metadata = payload?.usageMetadata;

    if (!metadata) {
      return undefined;
    }

    return {
      promptTokens: metadata.promptTokenCount ?? 0,
      responseTokens: metadata.candidatesTokenCount ?? 0,
      totalTokens: metadata.totalTokenCount ?? 0,
    };
  }

  private async safeJson(response: Response) {
    try {
      return await response.json();
    } catch (_error) {
      return null;
    }
  }
}
