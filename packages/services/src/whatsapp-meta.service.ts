import axios, { AxiosError } from 'axios';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  SendMessageParams,
  SendMessageResult,
} from '@sophiaai/shared';

// Meta Cloud API configuration
const META_API_VERSION = 'v21.0';
const META_API_BASE_URL = 'https://graph.facebook.com';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Rate limiting configuration
const RATE_LIMIT_MESSAGES_PER_SECOND = 80; // Meta Cloud API limit
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window

export interface WhatsAppMetaServiceOptions {
  supabaseClient?: SupabaseClient;
  rateLimitPerSecond?: number;
}

/**
 * Simple in-memory rate limiter using sliding window algorithm
 */
class RateLimiter {
  private timestamps: number[] = [];
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Checks if request can proceed, updates timestamps if allowed
   * @returns true if allowed, false if rate limit exceeded
   */
  checkLimit(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(ts => ts > windowStart);

    // Check if we've hit the limit
    if (this.timestamps.length >= this.limit) {
      return false;
    }

    // Add current timestamp
    this.timestamps.push(now);
    return true;
  }

  /**
   * Gets time in ms until next request can be made
   */
  getWaitTime(): number {
    if (this.timestamps.length < this.limit) {
      return 0;
    }

    const now = Date.now();
    const oldestTimestamp = this.timestamps[0];
    if (!oldestTimestamp) {
      return 0;
    }
    const waitTime = this.windowMs - (now - oldestTimestamp);

    return Math.max(0, waitTime);
  }
}

export class WhatsAppMetaService {
  private accessToken: string;
  private phoneNumberId: string;
  private businessAccountId: string;
  private supabaseClient?: SupabaseClient;
  private rateLimiter: RateLimiter;

  constructor(options?: WhatsAppMetaServiceOptions) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !phoneNumberId || !businessAccountId) {
      throw new Error(
        'Missing required environment variables: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, or WHATSAPP_BUSINESS_ACCOUNT_ID'
      );
    }

    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.businessAccountId = businessAccountId;

    // Initialize Supabase client if not provided
    if (options?.supabaseClient) {
      this.supabaseClient = options.supabaseClient;
    } else if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    }

    // Initialize rate limiter
    const rateLimit = options?.rateLimitPerSecond || RATE_LIMIT_MESSAGES_PER_SECOND;
    this.rateLimiter = new RateLimiter(rateLimit, RATE_LIMIT_WINDOW_MS);
  }

  /**
   * Sends a WhatsApp message to a recipient and logs it to database
   * Handles rate limiting automatically with delay if needed
   * @param params - Phone number and message text
   * @param agentId - Optional agent ID for database logging
   * @returns Result with success status, message ID, and any errors
   */
  async sendMessage(params: SendMessageParams, agentId?: string): Promise<SendMessageResult> {
    const { phoneNumber, messageText } = params;

    console.log('[WhatsApp Meta] Sending message', {
      to: this.maskPhoneNumber(phoneNumber),
      textLength: messageText.length,
      agentId,
    });

    try {
      // Check rate limit
      if (!this.rateLimiter.checkLimit()) {
        const waitTime = this.rateLimiter.getWaitTime();
        console.log('[WhatsApp Meta] Rate limit reached, waiting', {
          waitTimeMs: waitTime,
          phoneNumber: this.maskPhoneNumber(phoneNumber),
        });

        // Wait for rate limit window to pass
        await this.sleep(waitTime);

        // Try again after waiting
        if (!this.rateLimiter.checkLimit()) {
          throw new Error('Rate limit exceeded after waiting');
        }
      }

      // Retry with exponential backoff
      const result = await this.retry(
        async () => {
          const response = await this.sendMessageToMeta(phoneNumber, messageText);
          return response;
        },
        MAX_RETRIES
      );

      console.log('[WhatsApp Meta] Message sent successfully', {
        messageId: result.messageId,
        to: this.maskPhoneNumber(phoneNumber),
        agentId,
      });

      const sendResult: SendMessageResult = {
        success: true,
        messageId: result.messageId,
        timestamp: new Date(),
      };

      // Log to database if Supabase client is available and agentId is provided
      if (this.supabaseClient && agentId) {
        await this.logOutboundMessage(agentId, messageText, result.messageId);
      }

      return sendResult;
    } catch (error) {
      const errorMessage = this.handleError(error, phoneNumber);

      console.error('[WhatsApp Meta] Failed to send message', {
        to: this.maskPhoneNumber(phoneNumber),
        error: errorMessage,
        agentId,
      });

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Logs an outbound message to the conversation_logs table
   * Errors are logged but don't block message sending
   * @private
   */
  private async logOutboundMessage(
    agentId: string,
    messageText: string,
    messageId: string
  ): Promise<void> {
    try {
      if (!this.supabaseClient) {
        console.warn('[WhatsApp Meta] Supabase client not available, skipping database logging');
        return;
      }

      const { error: insertError } = await this.supabaseClient
        .from('conversation_logs')
        .insert({
          agent_id: agentId,
          message_text: messageText,
          direction: 'outbound',
          timestamp: new Date().toISOString(),
          message_id: messageId,
          delivery_status: 'sent', // Meta Cloud API initial status
        });

      if (insertError) {
        // Check if it's a duplicate message ID
        if (insertError.code === '23505') {
          console.log('[WhatsApp Meta] Duplicate message ID, skipping insert', { messageId });
        } else {
          console.error('[WhatsApp Meta] Database insert error for outbound message', {
            agentId,
            messageId,
            error: insertError.message,
          });
        }
      } else {
        console.log('[WhatsApp Meta] Outbound message logged successfully', {
          agentId,
          messageId,
        });
      }
    } catch (error) {
      // Log but don't throw - database errors shouldn't block message sending
      console.error('[WhatsApp Meta] Error logging outbound message to database', {
        agentId,
        messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Sends message to Meta Cloud API
   * @private
   */
  private async sendMessageToMeta(
    phoneNumber: string,
    messageText: string
  ): Promise<{ messageId: string }> {
    const url = `${META_API_BASE_URL}/${META_API_VERSION}/${this.phoneNumberId}/messages`;

    // Remove + prefix and any whitespace from phone number
    const cleanNumber = phoneNumber.replace(/^\+/, '').replace(/\s/g, '');

    // Build request payload for Meta Cloud API
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText,
      },
    };

    console.log('[WhatsApp Meta] Sending API request', {
      url,
      to: this.maskPhoneNumber(cleanNumber),
      bodyLength: messageText.length,
    });

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      console.log('[WhatsApp Meta] API response received', {
        messageId: response.data.messages?.[0]?.id,
        status: response.status,
      });

      return {
        messageId: response.data.messages[0].id,
      };
    } catch (error) {
      console.error('[WhatsApp Meta] API request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        isAxiosError: axios.isAxiosError(error),
        response: axios.isAxiosError(error) ? error.response?.data : undefined,
      });
      // Re-throw to be handled by retry logic
      throw error;
    }
  }

  /**
   * Retries a function with exponential backoff
   * @private
   */
  private async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log('[WhatsApp Meta] Attempt', { attempt, maxAttempts });
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on permanent failures (validation errors, auth errors)
        if (this.isPermanentError(error)) {
          console.error('[WhatsApp Meta] Permanent error, not retrying', {
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }

        if (attempt < maxAttempts) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1); // 1s, 2s, 4s
          console.log('[WhatsApp Meta] Retrying after delay', { attempt, delayMs: delay });
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Checks if error is permanent (don't retry)
   * @private
   */
  private isPermanentError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { code?: number; message?: string } }>;
      const errorCode = axiosError.response?.data?.error?.code;
      const status = axiosError.response?.status;

      // Meta Cloud API error codes that shouldn't be retried
      // 400 = Bad Request (invalid parameters)
      // 401 = Unauthorized (invalid access token)
      // 403 = Forbidden (insufficient permissions)
      if (status === 400 || status === 401 || status === 403) {
        return true;
      }

      // Specific Meta error codes
      const permanentErrorCodes = [
        100,  // Invalid parameter
        190,  // Access token expired
        200,  // Permission denied
      ];

      return permanentErrorCodes.includes(errorCode ?? 0);
    }

    return false;
  }

  /**
   * Handles errors and returns user-friendly error message
   * @private
   */
  private handleError(error: unknown, phoneNumber: string): string {
    const maskedPhone = this.maskPhoneNumber(phoneNumber);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { code?: number; message?: string } }>;
      const errorCode = axiosError.response?.data?.error?.code;
      const errorMessage = axiosError.response?.data?.error?.message || axiosError.message;
      const status = axiosError.response?.status;

      // Log structured error
      console.error('[WhatsApp Meta] Axios error details', {
        timestamp: new Date().toISOString(),
        service: 'WhatsAppMetaService',
        errorCode,
        status,
        message: errorMessage,
        phoneNumber: maskedPhone,
      });

      // Handle specific Meta Cloud API errors
      if (status === 400) {
        return `Invalid request parameters for ${maskedPhone}: ${errorMessage}`;
      } else if (status === 401) {
        return 'Authentication error - invalid WhatsApp access token';
      } else if (status === 403) {
        return 'Permission denied - check WhatsApp Business API permissions';
      } else if (status === 429) {
        return 'Rate limit exceeded - message queued for retry';
      } else if (errorCode === 100) {
        return `Invalid phone number: ${maskedPhone}`;
      } else if (errorCode === 190) {
        return 'Access token expired - please refresh credentials';
      }

      return `Failed to send message: ${errorMessage}`;
    }

    // Generic error
    console.error('[WhatsApp Meta] Generic error', {
      timestamp: new Date().toISOString(),
      service: 'WhatsAppMetaService',
      error: error instanceof Error ? error.message : String(error),
      phoneNumber: maskedPhone,
    });

    return `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  /**
   * Masks phone number for logging (e.g., +357991XXXXX)
   * @private
   */
  private maskPhoneNumber(phoneNumber: string): string {
    // Remove + prefix if present
    const cleanNumber = phoneNumber.replace(/^\+/, '');

    if (cleanNumber.length < 8) {
      return 'XXXXX';
    }

    // Show first 7 characters, mask the rest
    return '+' + cleanNumber.substring(0, 7) + 'X'.repeat(cleanNumber.length - 7);
  }

  /**
   * Sleep utility for delays
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
