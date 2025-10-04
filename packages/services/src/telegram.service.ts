/**
 * Telegram Bot Service
 * Story 6.1: Telegram Bot Setup & Webhook Integration
 */

import {
  TelegramMessage,
  SendMessageOptions,
  WebhookInfo,
} from '@sophiaai/shared/types/telegram';

export class TelegramService {
  private botToken: string;
  private baseUrl: string;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second initial delay

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN!;

    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
    }

    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Send a text message to a Telegram chat
   */
  async sendMessage(
    chatId: number,
    text: string,
    options?: SendMessageOptions
  ): Promise<TelegramMessage> {
    const payload = {
      chat_id: chatId,
      text,
      ...options,
    };

    return this.makeRequest<TelegramMessage>('sendMessage', payload);
  }

  /**
   * Set webhook URL for receiving updates
   */
  async setWebhook(url: string, secretToken?: string): Promise<boolean> {
    const payload: Record<string, string> = {
      url,
      allowed_updates: JSON.stringify(['message', 'callback_query']),
    };

    if (secretToken) {
      payload.secret_token = secretToken;
    }

    const response = await this.makeRequest<boolean>('setWebhook', payload);
    return response;
  }

  /**
   * Get current webhook information
   */
  async getWebhookInfo(): Promise<WebhookInfo> {
    return this.makeRequest<WebhookInfo>('getWebhookInfo');
  }

  /**
   * Delete webhook (for testing/cleanup)
   */
  async deleteWebhook(): Promise<boolean> {
    return this.makeRequest<boolean>('deleteWebhook');
  }

  /**
   * Make an API request to Telegram Bot API with retry logic
   */
  private async makeRequest<T>(
    method: string,
    payload?: Record<string, unknown>,
    attempt = 1
  ): Promise<T> {
    const url = `${this.baseUrl}/${method}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(
          `Telegram API error: ${data.description || 'Unknown error'}`
        );
      }

      return data.result as T;
    } catch (error) {
      // Retry logic with exponential backoff
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.warn(
          `Telegram API request failed (attempt ${attempt}/${this.maxRetries}). Retrying in ${delay}ms...`,
          error
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.makeRequest<T>(method, payload, attempt + 1);
      }

      console.error('Telegram API request failed after max retries:', error);
      throw error;
    }
  }

  /**
   * Validate webhook signature (for security)
   */
  static validateWebhookSignature(
    secretToken: string,
    receivedToken?: string
  ): boolean {
    if (!receivedToken) {
      return false;
    }
    return secretToken === receivedToken;
  }
}

// Export singleton instance
export const telegramService = new TelegramService();
