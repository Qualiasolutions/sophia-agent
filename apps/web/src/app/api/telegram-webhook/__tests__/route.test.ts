/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Telegram Webhook Endpoint Tests
 * Stories 6.1-6.4: Telegram Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

// Create mock service instances
const mockTelegramService = {
  sendMessage: vi.fn(),
};

const mockTelegramAuthService = {
  isUserRegistered: vi.fn(),
  getTelegramUser: vi.fn(),
  getAgentByEmail: vi.fn(),
  registerTelegramUser: vi.fn(),
  updateLastActive: vi.fn(),
};

const mockMessageForwardService = {
  forwardToWhatsApp: vi.fn(),
};

const mockDeepSeekService = {
  generateResponse: vi.fn(),
};

// Mock services
vi.mock('@sophiaai/services', () => ({
  getTelegramService: vi.fn(() => mockTelegramService),
  TelegramService: {
    validateWebhookSignature: vi.fn(),
  },
  getTelegramAuthService: vi.fn(() => mockTelegramAuthService),
  TelegramAuthService: {
    validateEmail: vi.fn(),
  },
  getMessageForwardService: vi.fn(() => mockMessageForwardService),
  MessageForwardService: {
    parseForwardCommand: vi.fn(),
    validatePhoneNumber: vi.fn(() => true),
  },
  getDeepSeekService: vi.fn(() => mockDeepSeekService),
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trackPerformance: vi.fn(),
    trackEvent: vi.fn(),
  })),
  getMetricsService: vi.fn(() => ({
    trackRequest: vi.fn(),
    trackError: vi.fn(),
    trackRateLimit: vi.fn(),
    trackUserRegistration: vi.fn(),
    trackMessageForward: vi.fn(),
    trackPerformance: vi.fn(),
    trackActiveUser: vi.fn(),
    trackRegistration: vi.fn(),
    getMetricsSnapshot: vi.fn(() => ({
      timestamp: new Date().toISOString(),
      uptime: 1000,
    })),
  })),
  getTelegramRateLimiter: vi.fn(() => ({
    checkLimit: vi.fn(() => ({ allowed: true, resetAt: Date.now() + 60000 })),
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
    } as unknown as NextRequest;

    mockDeepSeekService.generateResponse.mockReset();
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
          from: { id: 111, username: 'testuser' },
          chat: { id: 222, type: 'private' },
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
      const { TelegramService,   } = await import('@sophiaai/services');

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (mockTelegramAuthService.isUserRegistered as any).mockResolvedValueOnce(false);

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

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        789,
        expect.stringContaining('Welcome to Sophia AI'),
        expect.any(Object)
      );
    });

    it('should validate email and register user', async () => {
      const {
        TelegramService,
        
        TelegramAuthService,
        
      } = await import('@sophiaai/services');

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (mockTelegramAuthService.isUserRegistered as any).mockResolvedValueOnce(false);
      (TelegramAuthService.validateEmail as any).mockReturnValueOnce(true);
      (mockTelegramAuthService.getAgentByEmail as any).mockResolvedValueOnce({
        id: 'agent-123',
        email: 'test@zyprus.com',
      });
      (mockTelegramAuthService.registerTelegramUser as any).mockResolvedValueOnce({
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

      expect(mockTelegramAuthService.registerTelegramUser).toHaveBeenCalled();
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
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
        
        MessageForwardService,
        
        
      } = await import('@sophiaai/services');

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (mockTelegramAuthService.isUserRegistered as any).mockResolvedValueOnce(true);
      (mockTelegramAuthService.getTelegramUser as any).mockResolvedValueOnce({
        id: 'user-123',
        agent_id: 'agent-456',
      });
      (MessageForwardService.parseForwardCommand as any).mockReturnValueOnce({
        isForwardCommand: true,
        recipient: '+35799123456',
        message: 'Test forward',
      });
      (mockMessageForwardService.forwardToWhatsApp as any).mockResolvedValueOnce({
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

      expect(mockMessageForwardService.forwardToWhatsApp).toHaveBeenCalledWith({
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
      const { TelegramService, MessageForwardService, getDeepSeekService } = await import('@sophiaai/services');

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (mockTelegramAuthService.isUserRegistered as any).mockResolvedValueOnce(true);
      (mockTelegramAuthService.getTelegramUser as any).mockResolvedValueOnce({
        id: 'user-123',
        agent_id: 'agent-456',
      });
      (MessageForwardService.parseForwardCommand as any).mockReturnValueOnce({
        isForwardCommand: false,
      });
      (getDeepSeekService as any).mockReturnValueOnce(mockDeepSeekService);

      mockDeepSeekService.generateResponse.mockResolvedValueOnce({
        text: 'AI response here',
        tokensUsed: { prompt: 5, completion: 5, total: 10 },
        responseTime: 10,
      });

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

      expect(mockDeepSeekService.generateResponse).toHaveBeenCalledWith(
        'What is my schedule today?',
        expect.objectContaining({
          messageHistory: [],
        })
      );

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
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
      const { TelegramService, MessageForwardService, getDeepSeekService } = await import('@sophiaai/services');

      (getDeepSeekService as any).mockReturnValueOnce(mockDeepSeekService);
      mockDeepSeekService.generateResponse.mockRejectedValueOnce(new Error('AI service error'));

      (TelegramService.validateWebhookSignature as any).mockReturnValueOnce(true);
      (mockTelegramAuthService.isUserRegistered as any).mockResolvedValueOnce(true);
      (mockTelegramAuthService.getTelegramUser as any).mockResolvedValueOnce({
        id: 'user-123',
        agent_id: 'agent-456',
      });
      (MessageForwardService.parseForwardCommand as any).mockReturnValueOnce({
        isForwardCommand: false,
      });
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

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        789,
        '❌ An error occurred processing your message. Please try again later.',
        { parse_mode: 'Markdown' }
      );
    });
  });
});
