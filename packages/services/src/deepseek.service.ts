/**
 * DeepSeek AI Service for Natural Conversation
 * Uses OpenRouter API to access DeepSeek models for conversational AI
 */

export interface DeepSeekResponse {
  text: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  responseTime: number;
}

export class DeepSeekService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseURL = 'https://openrouter.ai/api/v1';

    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }
  }

  /**
   * Generate a natural conversational response
   * @param message - The user's message
   * @param context - Optional conversation context
   * @returns AI-generated response
   */
  async generateResponse(
    message: string,
    context?: {
      agentName?: string;
      messageHistory?: Array<{ role: string; content: string }>;
    }
  ): Promise<DeepSeekResponse> {
    const startTime = Date.now();

    try {
      // Natural conversation system prompt
      const systemPrompt = `You are Sophia, a friendly and professional AI assistant for zyprus.com real estate agents in Cyprus. You help agents with their daily tasks through natural conversation.

Your personality:
- Friendly, helpful, and conversational
- Knowledgeable about Cyprus real estate
- Professional yet approachable
- Focus on solving problems efficiently

Your capabilities:
- Answer questions about Cyprus real estate
- Help with property valuations and market information
- Assist with client communication strategies
- Provide guidance on real estate procedures
- Forward messages to WhatsApp when requested

Message forwarding:
- When agents ask to "forward" or "send" messages, acknowledge and ask for the recipient's phone number
- Use format: "Sure! What phone number should I forward this to?"
- After getting the number, confirm: "Got it! I'll forward: [message] to +[number]"

Keep responses conversational and natural (2-4 sentences typically). Avoid being overly formal or robotic.`;

      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history if provided
      if (context?.messageHistory && context.messageHistory.length > 0) {
        messages.push(...context.messageHistory.slice(-6)); // Keep last 6 messages for context
      }

      // Add current user message
      messages.push({ role: 'user', content: message });

      const response = await fetch(this.baseURL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sophia-agent.vercel.app',
          'X-Title': 'Sophia AI Assistant'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 500,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      const responseText = data.choices?.[0]?.message?.content || '';

      // Extract token usage (DeepSeek may not provide this, so we estimate)
      const tokensUsed = {
        prompt: Math.ceil(message.length / 4), // Rough estimate
        completion: Math.ceil(responseText.length / 4), // Rough estimate
        total: Math.ceil((message.length + responseText.length) / 4)
      };

      return {
        text: responseText,
        tokensUsed,
        responseTime
      };

    } catch (error) {
      console.error('[DeepSeek] Error:', error);
      return {
        text: "I'm having trouble responding right now. Please try again in a moment.",
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check if a message is asking to forward something
   * @param message - The user's message
   * @returns True if the message is about forwarding
   */
  isForwardingRequest(message: string): boolean {
    const forwardingKeywords = [
      'forward', 'send', 'share', 'pass along', 'transmit',
      'message to', 'send to', 'forward to', 'text to'
    ];

    const normalizedMessage = message.toLowerCase();
    return forwardingKeywords.some(keyword => normalizedMessage.includes(keyword));
  }

  /**
   * Extract phone number from a message
   * @param message - The user's message
   * @returns Extracted phone number or null
   */
  extractPhoneNumber(message: string): string | null {
    // Match international phone numbers
    const phoneRegex = /\+?[1-9]\d{1,14}/g;
    const matches = message.match(phoneRegex);

    if (matches && matches.length > 0) {
      // Ensure it starts with +
      const phone = matches[0];
      return phone.startsWith('+') ? phone : '+' + phone;
    }

    return null;
  }

  /**
   * Extract message content to forward
   * @param message - The user's message
   * @returns Content to forward
   */
  extractForwardContent(message: string): string {
    // Look for content after forwarding keywords
    const patterns = [
      /forward to .+?: (.+)/i,
      /send to .+?: (.+)/i,
      /message to .+?: (.+)/i,
      /forward (.+?): (.+)/i,
      /send (.+?): (.+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[2]) {
        return match[2].trim();
      }
    }

    // If no specific pattern found, return the full message
    return message;
  }
}

// Singleton instance
let _instance: DeepSeekService | null = null;

export function getDeepSeekService(): DeepSeekService {
  if (!_instance) {
    _instance = new DeepSeekService();
  }
  return _instance;
}