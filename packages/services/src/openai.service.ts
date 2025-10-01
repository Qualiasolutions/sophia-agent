import OpenAI, { APIError } from 'openai';
import type {
  AIResponse,
  ConversationContext,
  OpenAIConfig,
  Intent,
} from '@sophiaai/shared';

// Sophia's system prompt - defines her identity, role, and conversational style
const SYSTEM_PROMPT = `You are Sophia, an AI assistant for zyprus.com, a real estate company in Cyprus. You help real estate agents with their daily tasks by providing quick, accurate assistance.

Your capabilities:
- Generate professional documents (contracts, marketing materials, legal forms)
- Manage property listings (create, update, upload to zyprus.com)
- Perform real estate calculations (mortgage, ROI, commission)
- Send and manage emails for client communications

Your communication style:
- Friendly and professional
- Concise and clear (2-3 sentences for simple queries)
- Helpful and proactive
- Focused on solving agent problems quickly

When an agent greets you (hello, hi, hey), respond with: "Hi! I'm Sophia, your zyprus.com AI assistant. I can help with documents, listings, calculations, and emails. What can I assist you with today?"`;

// GPT model configuration
const GPT_MODEL = 'gpt-4o-mini' as const;

// GPT-4o-mini pricing (per 1M tokens)
const PRICING = {
  INPUT_PER_1M: 0.15,    // $0.150 per 1M input tokens
  OUTPUT_PER_1M: 0.60,   // $0.600 per 1M output tokens
} as const;

export class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;
  private systemPrompt: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 3000, // 3 seconds timeout
    });

    this.config = {
      model: GPT_MODEL,
      temperature: 0.7,
      maxTokens: 500,
      timeout: 3000,
    };

    this.systemPrompt = SYSTEM_PROMPT;
  }

  /**
   * Generate an AI response for a given message
   * @param message - The user's message text
   * @param context - Optional conversation context (agent ID, history, intent)
   * @returns AI-generated response with token usage and cost estimate
   */
  async generateResponse(
    message: string,
    context?: ConversationContext
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Detect if this is a greeting
      const isGreeting = this.isGreeting(message);

      // Build messages array
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: this.systemPrompt },
      ];

      // Add conversation history if provided
      if (context?.messageHistory) {
        messages.push(
          ...context.messageHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        );
      }

      // Add current user message
      messages.push({ role: 'user', content: message });

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const responseTime = Date.now() - startTime;

      // Extract response text
      const responseText = response.choices[0]?.message?.content || '';

      // Extract token usage
      const tokensUsed = {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      };

      // Calculate cost estimate
      const costEstimate = this.calculateCost({
        prompt_tokens: tokensUsed.prompt,
        completion_tokens: tokensUsed.completion,
      });

      // Log token usage and cost for monitoring
      console.log('[OpenAI] Response generated', {
        agentId: context?.agentId,
        messageLength: message.length,
        tokensUsed,
        costEstimate: `$${costEstimate.toFixed(6)}`,
        responseTime: `${responseTime}ms`,
        isGreeting,
      });

      return {
        text: responseText,
        tokensUsed,
        costEstimate,
        responseTime,
      };
    } catch (error) {
      return this.handleError(error, Date.now() - startTime);
    }
  }

  /**
   * Classify the intent of a message
   * @param message - The user's message text
   * @returns The detected intent
   */
  async classifyIntent(message: string): Promise<Intent> {
    if (this.isGreeting(message)) {
      return 'greeting';
    }

    // Future: Implement more sophisticated intent classification
    // For now, return unknown for non-greetings
    return 'unknown';
  }

  /**
   * Calculate the cost of an OpenAI API call
   * @param usage - Token usage from OpenAI response
   * @returns Estimated cost in USD
   */
  private calculateCost(usage: {
    prompt_tokens: number;
    completion_tokens: number;
  }): number {
    const inputCost = (usage.prompt_tokens / 1_000_000) * PRICING.INPUT_PER_1M;
    const outputCost =
      (usage.completion_tokens / 1_000_000) * PRICING.OUTPUT_PER_1M;
    return inputCost + outputCost;
  }

  /**
   * Detect if a message is a greeting
   * @param message - The user's message text
   * @returns True if the message is a greeting
   */
  private isGreeting(message: string): boolean {
    const normalizedMessage = message.toLowerCase().trim();
    const greetingPatterns = [
      'hello',
      'hi',
      'hey',
      'hi sophia',
      'hello sophia',
      'hey sophia',
      'good morning',
      'good afternoon',
      'good evening',
      'greetings',
    ];

    return greetingPatterns.some((pattern) =>
      normalizedMessage.includes(pattern)
    );
  }

  /**
   * Handle OpenAI API errors gracefully
   * @param error - The error from OpenAI API
   * @param responseTime - Time elapsed before error
   * @returns Fallback AI response
   */
  private handleError(error: unknown, responseTime: number): AIResponse {
    let errorType = 'unknown';
    let errorMessage = 'Unknown error';

    if (error instanceof APIError) {
      errorType = error.type || 'api_error';
      errorMessage = error.message;

      // Log specific error types
      if (error.status === 401) {
        errorType = 'authentication_error';
        console.error('[OpenAI] Authentication error:', errorMessage);
      } else if (error.status === 429) {
        errorType = 'rate_limit_error';
        console.error('[OpenAI] Rate limit exceeded:', errorMessage);
      } else if (error.status === 400) {
        errorType = 'invalid_request_error';
        console.error('[OpenAI] Invalid request:', errorMessage);
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorType = 'timeout_error';
        console.error('[OpenAI] Request timeout:', errorMessage);
      } else {
        console.error('[OpenAI] API error:', errorMessage);
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[OpenAI] Error:', errorMessage);
    }

    // Log structured error
    console.error('[OpenAI] Error details', {
      timestamp: new Date().toISOString(),
      errorType,
      errorMessage,
      responseTime: `${responseTime}ms`,
    });

    // Return graceful fallback response
    return {
      text: "I'm having trouble processing your request right now. Please try again in a moment.",
      tokensUsed: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
      costEstimate: 0,
      responseTime,
    };
  }

  /**
   * Get the current OpenAI configuration
   * @returns The OpenAI configuration
   */
  getConfig(): OpenAIConfig {
    return { ...this.config };
  }
}

// Singleton instance - lazy initialization
let _instance: OpenAIService | null = null;

/**
 * Get the singleton OpenAIService instance
 * @returns The OpenAI service instance
 */
export function getOpenAIService(): OpenAIService {
  if (!_instance) {
    _instance = new OpenAIService();
  }
  return _instance;
}

// Export singleton getter as default export
export const openAIService = {
  get instance() {
    return getOpenAIService();
  },
};
