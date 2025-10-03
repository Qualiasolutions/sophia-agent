import axios, { AxiosError } from 'axios';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  SendMessageParams,
  SendMessageResult,
  WhatsAppConfig,
} from '@sophiaai/shared';

// Twilio API configuration
const TWILIO_API_VERSION = '2010-04-01';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Rate limiting configuration
const RATE_LIMIT_MESSAGES_PER_SECOND = 80; // Twilio/Meta limit
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window

export interface WhatsAppServiceOptions {
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

export class WhatsAppService {
  private config: WhatsAppConfig;
  private supabaseClient?: SupabaseClient;
  private rateLimiter: RateLimiter;

  constructor(options?: WhatsAppServiceOptions) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    // Support both API Key (recommended) and Auth Token (legacy) authentication
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !fromNumber) {
      throw new Error(
        'Missing required environment variables: TWILIO_ACCOUNT_SID or TWILIO_WHATSAPP_NUMBER'
      );
    }

    // Prefer API Key over Auth Token (more secure)
    if (!apiKeySid && !authToken) {
      throw new Error(
        'Missing authentication: Set either TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET or TWILIO_AUTH_TOKEN'
      );
    }

    this.config = {
      accountSid,
      authToken: apiKeySecret || authToken!, // Use API Key Secret if available, otherwise Auth Token
      fromNumber,
      baseUrl: `https://api.twilio.com/${TWILIO_API_VERSION}`,
    };

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

    try {
      // Check rate limit
      if (!this.rateLimiter.checkLimit()) {
        const waitTime = this.rateLimiter.getWaitTime();
        console.log('Rate limit reached, waiting before sending', {
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
          const response = await this.sendMessageToTwilio(phoneNumber, messageText);
          return response;
        },
        MAX_RETRIES
      );

      const sendResult: SendMessageResult = {
        success: true,
        messageId: result.sid,
        timestamp: new Date(),
      };

      // Log to database if Supabase client is available and agentId is provided
      if (this.supabaseClient && agentId) {
        await this.logOutboundMessage(agentId, messageText, result.sid);
      }

      return sendResult;
    } catch (error) {
      const errorMessage = this.handleError(error, phoneNumber);

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
        console.warn('Supabase client not available, skipping database logging');
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
          delivery_status: 'queued', // Initial status from Twilio
        });

      if (insertError) {
        // Check if it's a duplicate message ID
        if (insertError.code === '23505') {
          console.log('Duplicate message ID, skipping insert', { messageId });
        } else {
          console.error('Database insert error for outbound message', {
            agentId,
            messageId,
            error: insertError.message,
          });
        }
      } else {
        console.log('Outbound message logged successfully', {
          agentId,
          messageId,
        });
      }
    } catch (error) {
      // Log but don't throw - database errors shouldn't block message sending
      console.error('Error logging outbound message to database', {
        agentId,
        messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Sends message to Twilio API
   * @private
   */
  private async sendMessageToTwilio(
    phoneNumber: string,
    messageText: string
  ): Promise<{ sid: string; status: string }> {
    const url = `${this.config.baseUrl}/Accounts/${this.config.accountSid}/Messages.json`;

    // Format phone numbers with whatsapp: prefix for Twilio
    const formattedTo = this.formatPhoneNumber(phoneNumber);
    const formattedFrom = this.formatPhoneNumber(this.config.fromNumber);

    // Build form-urlencoded body
    const params = new URLSearchParams({
      From: formattedFrom,
      To: formattedTo,
      Body: messageText,
    });

    try {
      // Determine auth username (API Key SID if available, otherwise Account SID)
      const authUsername = process.env.TWILIO_API_KEY_SID || this.config.accountSid;

      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: authUsername,
          password: this.config.authToken,
        },
      });

      return {
        sid: response.data.sid,
        status: response.data.status,
      };
    } catch (error) {
      // Re-throw to be handled by retry logic
      throw error;
    }
  }

  /**
   * Formats phone number with whatsapp: prefix for Twilio
   * @private
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove whatsapp: prefix if already present and trim whitespace
    const cleanNumber = phoneNumber.replace(/^whatsapp:/, '').trim();

    // Add whatsapp: prefix for Twilio
    return `whatsapp:${cleanNumber}`;
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
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on permanent failures (validation errors, auth errors)
        if (this.isPermanentError(error)) {
          throw error;
        }

        if (attempt < maxAttempts) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1); // 1s, 2s, 4s
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
      const axiosError = error as AxiosError<{ code?: number }>;
      const errorCode = axiosError.response?.data?.code;

      // Twilio error codes that shouldn't be retried
      const permanentErrorCodes = [
        21211, // Invalid phone number
        20003, // Authentication error
        21408, // Permission denied
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
      const axiosError = error as AxiosError<{ code?: number; message?: string }>;
      const errorCode = axiosError.response?.data?.code;
      const errorMessage = axiosError.response?.data?.message || axiosError.message;

      // Log structured error (in production, use proper logging service)
      console.error({
        timestamp: new Date().toISOString(),
        service: 'WhatsAppService',
        errorCode,
        message: errorMessage,
        phoneNumber: maskedPhone,
      });

      // Handle specific Twilio error codes
      switch (errorCode) {
        case 21211:
          return `Invalid phone number: ${maskedPhone}`;
        case 20003:
          return 'Authentication error - invalid Twilio credentials';
        case 20429:
          return 'Rate limit exceeded - message queued for retry';
        case 21408:
          return `Permission denied - unverified number: ${maskedPhone}`;
        default:
          return `Failed to send message: ${errorMessage}`;
      }
    }

    // Generic error
    console.error({
      timestamp: new Date().toISOString(),
      service: 'WhatsAppService',
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
    // Remove whatsapp: prefix if present
    const cleanNumber = phoneNumber.replace(/^whatsapp:/, '');

    if (cleanNumber.length < 8) {
      return 'XXXXX';
    }

    // Show first 7 characters, mask the rest
    return cleanNumber.substring(0, 7) + 'X'.repeat(cleanNumber.length - 7);
  }

  /**
   * Sleep utility for delays
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
