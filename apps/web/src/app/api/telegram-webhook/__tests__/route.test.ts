/**
 * Telegram Webhook Endpoint Tests
 * Stories 6.1-6.4: Telegram Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

// Mock services
vi.mock('@sophiaai/services', () => ({
  telegramService: {
    sendMessage: vi.fn(),
  },
  TelegramService: {
    validateWebhookSignature: vi.fn(),
  },
  telegramAuthService: {
    isUserRegistered: vi.fn(),
    getTelegramUser: vi.fn(),
    getAgentByEmail: vi.fn(),
    registerTelegramUser: vi.fn(),
    updateLastActive: vi.fn(),
  },
  TelegramAuthService: {
    validateEmail: vi.fn(),
  },
  messageForwardService: {
    forwardToWhatsApp: vi.fn(),
  },
  MessageForwardService: {
    parseForwardCommand: vi.fn(),
  },
  getAssistantService: vi.fn(() => ({
    generateDocument: vi.fn(),
  })),
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

describe('Telegram Webhook Endpoint', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret-token';

    mockRequest = {
      headers: {
        get: vi.fn((header: string) => {
          if (header === 'X-Telegram-Bot-Api-Secret-Token') {
            return 'test-secret-token';
          }
          return null;
        }),
      },
      json: vi.fn(),
    } as any;
  });

  describe('GET', () => {
    it('should return status information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('Telegram webhook endpoint is active');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('POST - Authentication', () => {
    it('should reject requests with invalid signature', async () => {
      const { TelegramService } = await import('@sophiaai/services');
      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(false);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept requests with valid signature', async () => {
      const { TelegramService } = await import('@sophiaai/services');
      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);

      (mockRequest.json as any).mockResolvedValueOnce({
        update_id: 123,
        message: {
          message_id: 1,
          from: { id: 456, username: 'testuser' },
          chat: { id: 789, type: 'private' },
          date: Date.now(),
          text: 'test',
        },
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
    });
  });

  describe('POST - User Registration Flow', () => {
    it('should prompt unregistered user for email', async () => {
      const { TelegramService, telegramAuthService, telegramService } = await import('@sophiaai/services');

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (telegramAuthService.isUserRegistered as any).mockResolvedValueOnce(false);

      (mockRequest.json as any).mockResolvedValueOnce({
        update_id: 123,
        message: {
          message_id: 1,
          from: { id: 456, username: 'newuser' },
          chat: { id: 789, type: 'private' },
          date: Date.now(),
          text: 'Hello',
        },
      });

      await POST(mockRequest);

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        789,
        expect.stringContaining('Welcome to Sophia AI'),
        expect.any(Object)
      );
    });

    it('should validate email and register user', async () => {
      const {
        TelegramService,
        telegramAuthService,
        TelegramAuthService,
        telegramService
      } = await import('@sophiaai/services');

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (telegramAuthService.isUserRegistered as any).mockResolvedValueOnce(false);
      (TelegramAuthService.validateEmail as any).mockReturnValueOnce(true);
      (telegramAuthService.getAgentByEmail as any).mockResolvedValueOnce({
        id: 'agent-123',
        email: 'test@zyprus.com',
      });
      (telegramAuthService.registerTelegramUser as any).mockResolvedValueOnce({
        id: 'user-123',
        agent_id: 'agent-123',
      });

      (mockRequest.json as any).mockResolvedValueOnce({
        update_id: 124,
        message: {
          message_id: 2,
          from: { id: 456, username: 'newuser' },
          chat: { id: 789, type: 'private' },
          date: Date.now(),
          text: 'test@zyprus.com',
        },
      });

      await POST(mockRequest);

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(telegramAuthService.registerTelegramUser).toHaveBeenCalled();
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        789,
        expect.stringContaining('Registration successful'),
        expect.any(Object)
      );
    });
  });

  describe('POST - Message Forwarding', () => {
    it('should handle forward command', async () => {
      const {
        TelegramService,
        telegramAuthService,
        MessageForwardService,
        messageForwardService,
        telegramService
      } = await import('@sophiaai/services');

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (telegramAuthService.isUserRegistered as any).mockResolvedValueOnce(true);
      (telegramAuthService.getTelegramUser as any).mockResolvedValueOnce({
        id: 'user-123',
        agent_id: 'agent-456',
      });
      (MessageForwardService.parseForwardCommand as any).mockReturnValueOnce({
        isForwardCommand: true,
        recipient: '+35799123456',
        message: 'Test forward',
      });
      (messageForwardService.forwardToWhatsApp as any).mockResolvedValueOnce({
        success: true,
      });

      (mockRequest.json as any).mockResolvedValueOnce({
        update_id: 125,
        message: {
          message_id: 3,
          from: { id: 456, username: 'testuser' },
          chat: { id: 789, type: 'private' },
          date: Date.now(),
          text: 'forward to +35799123456: Test forward',
        },
      });

      await POST(mockRequest);

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messageForwardService.forwardToWhatsApp).toHaveBeenCalledWith({
        agentId: 'agent-456',
        telegramChatId: '789',
        recipientPhone: '+35799123456',
        message: 'Test forward',
        messageType: 'text',
      });
    });
  });

  describe('POST - AI Conversation', () => {
    it('should process AI conversation for registered user', async () => {
      const {
        TelegramService,
        telegramAuthService,
        MessageForwardService,
        getAssistantService,
        telegramService
      } = await import('@sophiaai/services');

      const mockAssistant = {
        generateDocument: vi.fn().mockResolvedValueOnce({
          text: 'AI response here',
        }),
      };

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (telegramAuthService.isUserRegistered as any).mockResolvedValueOnce(true);
      (telegramAuthService.getTelegramUser as any).mockResolvedValueOnce({
        id: 'user-123',
        agent_id: 'agent-456',
      });
      (MessageForwardService.parseForwardCommand as any).mockReturnValueOnce({
        isForwardCommand: false,
      });
      (getAssistantService as any).mockReturnValueOnce(mockAssistant);

      (mockRequest.json as any).mockResolvedValueOnce({
        update_id: 126,
        message: {
          message_id: 4,
          from: { id: 456, username: 'testuser' },
          chat: { id: 789, type: 'private' },
          date: Date.now(),
          text: 'What is my schedule today?',
        },
      });

      await POST(mockRequest);

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockAssistant.generateDocument).toHaveBeenCalledWith(
        'agent-456',
        'What is my schedule today?',
        []
      );

      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        789,
        'AI response here',
        { parse_mode: 'Markdown' }
      );
    });
  });

  describe('POST - Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const { TelegramService } = await import('@sophiaai/services');

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (mockRequest.json as any).mockRejectedValueOnce(new Error('Invalid JSON'));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should send error message to user on processing failure', async () => {
      const {
        TelegramService,
        telegramAuthService,
        MessageForwardService,
        getAssistantService,
        telegramService
      } = await import('@sophiaai/services');

      const mockAssistant = {
        generateDocument: vi.fn().mockRejectedValueOnce(new Error('AI service error')),
      };

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (telegramAuthService.isUserRegistered as any).mockResolvedValueOnce(true);
      (telegramAuthService.getTelegramUser as any).mockResolvedValueOnce({
        id: 'user-123',
        agent_id: 'agent-456',
      });
      (MessageForwardService.parseForwardCommand as any).mockReturnValueOnce({
        isForwardCommand: false,
      });
      (getAssistantService as any).mockReturnValueOnce(mockAssistant);

      (mockRequest.json as any).mockResolvedValueOnce({
        update_id: 127,
        message: {
          message_id: 5,
          from: { id: 456, username: 'testuser' },
          chat: { id: 789, type: 'private' },
          date: Date.now(),
          text: 'Test message',
        },
      });

      await POST(mockRequest);

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        789,
        expect.stringContaining('error occurred'),
        expect.any(Object)
      );
    });
  });
});
