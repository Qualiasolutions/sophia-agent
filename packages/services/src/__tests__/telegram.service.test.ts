/**
 * TelegramService Tests
 * Story 6.1: Telegram Bot Setup & Webhook Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelegramService, getTelegramService } from '../telegram.service';

// Mock environment variables
const mockBotToken = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
const mockWebhookUrl = 'https://example.com/api/telegram-webhook';
const mockSecretToken = 'test-secret-token';

describe('TelegramService', () => {
  let service: TelegramService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;

    // Set up test environment
    process.env = {
      ...originalEnv,
      TELEGRAM_BOT_TOKEN: mockBotToken,
    };

    // Reset fetch mock
    global.fetch = vi.fn();

    // Get fresh service instance
    service = getTelegramService();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should throw error if TELEGRAM_BOT_TOKEN is missing', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      expect(() => new TelegramService()).toThrow(
        'TELEGRAM_BOT_TOKEN environment variable is required'
      );
    });

    it('should initialize with valid bot token', () => {
      expect(() => new TelegramService()).not.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        ok: true,
        result: {
          message_id: 123,
          chat: { id: 456, type: 'private' },
          date: Date.now(),
          text: 'Hello, World!',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await service.sendMessage(456, 'Hello, World!');

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${mockBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: 456,
            text: 'Hello, World!',
          }),
        }
      );

      expect(result.message_id).toBe(123);
      expect(result.text).toBe('Hello, World!');
    });

    it('should send message with options', async () => {
      const mockResponse = {
        ok: true,
        result: {
          message_id: 124,
          chat: { id: 456, type: 'private' },
          date: Date.now(),
          text: '*Bold text*',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      await service.sendMessage(456, '*Bold text*', {
        parse_mode: 'Markdown',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            chat_id: 456,
            text: '*Bold text*',
            parse_mode: 'Markdown',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        description: 'Bad Request: chat not found',
      };

      (global.fetch as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      await expect(
        service.sendMessage(999, 'Test')
      ).rejects.toThrow('Telegram API error: Bad Request: chat not found');
    });

    it('should retry on failure', async () => {
      const mockErrorResponse = {
        ok: false,
        description: 'Internal Server Error',
      };

      const mockSuccessResponse = {
        ok: true,
        result: {
          message_id: 125,
          chat: { id: 456, type: 'private' },
          date: Date.now(),
          text: 'Test',
        },
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ json: async () => mockErrorResponse })
        .mockResolvedValueOnce({ json: async () => mockSuccessResponse });

      const result = await service.sendMessage(456, 'Test');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.message_id).toBe(125);
    });
  });

  describe('setWebhook', () => {
    it('should set webhook successfully', async () => {
      const mockResponse = {
        ok: true,
        result: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await service.setWebhook(mockWebhookUrl);

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${mockBotToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: mockWebhookUrl,
            allowed_updates: JSON.stringify(['message', 'callback_query']),
          }),
        }
      );

      expect(result).toBe(true);
    });

    it('should set webhook with secret token', async () => {
      const mockResponse = {
        ok: true,
        result: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      await service.setWebhook(mockWebhookUrl, mockSecretToken);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            url: mockWebhookUrl,
            allowed_updates: JSON.stringify(['message', 'callback_query']),
            secret_token: mockSecretToken,
          }),
        })
      );
    });
  });

  describe('getWebhookInfo', () => {
    it('should get webhook info successfully', async () => {
      const mockResponse = {
        ok: true,
        result: {
          url: mockWebhookUrl,
          has_custom_certificate: false,
          pending_update_count: 0,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await service.getWebhookInfo();

      expect(result.url).toBe(mockWebhookUrl);
      expect(result.pending_update_count).toBe(0);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook successfully', async () => {
      const mockResponse = {
        ok: true,
        result: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await service.deleteWebhook();

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${mockBotToken}/deleteWebhook`,
        expect.any(Object)
      );

      expect(result).toBe(true);
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate matching signatures', () => {
      const result = TelegramService.validateWebhookSignature(
        'secret-token',
        'secret-token'
      );
      expect(result).toBe(true);
    });

    it('should reject non-matching signatures', () => {
      const result = TelegramService.validateWebhookSignature(
        'secret-token',
        'wrong-token'
      );
      expect(result).toBe(false);
    });

    it('should reject missing received token', () => {
      const result = TelegramService.validateWebhookSignature(
        'secret-token',
        undefined
      );
      expect(result).toBe(false);
    });
  });
});
