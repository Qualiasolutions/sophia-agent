/**
 * MessageForwardService Tests
 * Story 6.3: Telegram Message Forwarding
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert.mockReturnValue(Promise.resolve({ error: null })),
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
    })),
  })),
}));

// Mock WhatsAppService
const mockSendMessage = vi.fn();
vi.mock('../whatsapp.service', () => ({
  WhatsAppService: vi.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
  })),
}));

// Import after mocking
import { MessageForwardService } from '../message-forward.service';

describe('MessageForwardService', () => {
  let service: MessageForwardService;

  beforeEach(() => {
    // Set up environment
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    // Clear all mocks
    vi.clearAllMocks();

    // Create fresh service instance
    service = new MessageForwardService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('forwardToWhatsApp', () => {
    it('should forward message successfully', async () => {
      mockSendMessage.mockResolvedValueOnce(undefined);

      const result = await service.forwardToWhatsApp({
        agentId: 'agent-123',
        telegramChatId: '456',
        recipientPhone: '+35799123456',
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(mockSendMessage).toHaveBeenCalledWith({
        phoneNumber: '+35799123456',
        messageText: 'Test message',
      });
    });

    it('should add + prefix to phone number if missing', async () => {
      mockSendMessage.mockResolvedValueOnce(undefined);

      await service.forwardToWhatsApp({
        agentId: 'agent-123',
        telegramChatId: '456',
        recipientPhone: '35799123456',
        message: 'Test message',
      });

      expect(mockSendMessage).toHaveBeenCalledWith({
        phoneNumber: '+35799123456',
        messageText: 'Test message',
      });
    });

    it('should log successful forward to database', async () => {
      mockSendMessage.mockResolvedValueOnce(undefined);

      await service.forwardToWhatsApp({
        agentId: 'agent-123',
        telegramChatId: '456',
        recipientPhone: '+35799123456',
        message: 'Test message',
        messageType: 'text',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_id: 'agent-123',
          source_platform: 'telegram',
          source_chat_id: '456',
          destination_platform: 'whatsapp',
          destination_identifier: '+35799123456',
          message_content: 'Test message',
          message_type: 'text',
          forward_status: 'sent',
        })
      );
    });

    it('should handle WhatsApp send failure', async () => {
      const error = new Error('WhatsApp API error');
      mockSendMessage.mockRejectedValueOnce(error);

      const result = await service.forwardToWhatsApp({
        agentId: 'agent-123',
        telegramChatId: '456',
        recipientPhone: '+35799123456',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('WhatsApp API error');
    });

    it('should log failed forward to database', async () => {
      const error = new Error('Network error');
      mockSendMessage.mockRejectedValueOnce(error);

      await service.forwardToWhatsApp({
        agentId: 'agent-123',
        telegramChatId: '456',
        recipientPhone: '+35799123456',
        message: 'Test message',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          forward_status: 'failed',
          error_message: 'Network error',
        })
      );
    });
  });

  describe('getForwardHistory', () => {
    it('should retrieve forward history for agent', async () => {
      const mockHistory = [
        {
          id: 'forward-1',
          agent_id: 'agent-123',
          source_platform: 'telegram',
          destination_platform: 'whatsapp',
          forward_status: 'sent',
        },
        {
          id: 'forward-2',
          agent_id: 'agent-123',
          source_platform: 'telegram',
          destination_platform: 'whatsapp',
          forward_status: 'failed',
        },
      ];

      mockLimit.mockResolvedValueOnce({ data: mockHistory, error: null });

      const result = await service.getForwardHistory('agent-123');

      expect(result).toEqual(mockHistory);
    });

    it('should respect limit parameter', async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      await service.getForwardHistory('agent-123', 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should throw error on database failure', async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(
        service.getForwardHistory('agent-123')
      ).rejects.toThrow();
    });
  });

  describe('parseForwardCommand', () => {
    describe('Pattern 1: "forward to +phone: message"', () => {
      it('should parse valid command', () => {
        const result = MessageForwardService.parseForwardCommand(
          'forward to +35799123456: Hello from Telegram!'
        );

        expect(result.isForwardCommand).toBe(true);
        expect(result.recipient).toBe('+35799123456');
        expect(result.message).toBe('Hello from Telegram!');
      });

      it('should parse command without + prefix', () => {
        const result = MessageForwardService.parseForwardCommand(
          'forward to 35799123456: Test message'
        );

        expect(result.isForwardCommand).toBe(true);
        expect(result.recipient).toBe('35799123456');
        expect(result.message).toBe('Test message');
      });

      it('should handle case insensitivity', () => {
        const result = MessageForwardService.parseForwardCommand(
          'FORWARD TO +35799123456: Test'
        );

        expect(result.isForwardCommand).toBe(true);
      });

      it('should trim whitespace from message', () => {
        const result = MessageForwardService.parseForwardCommand(
          'forward to +35799123456:    Test with spaces   '
        );

        expect(result.message).toBe('Test with spaces');
      });
    });

    describe('Pattern 2: "/forward +phone message"', () => {
      it('should parse valid command', () => {
        const result = MessageForwardService.parseForwardCommand(
          '/forward +35799123456 Hello from Telegram!'
        );

        expect(result.isForwardCommand).toBe(true);
        expect(result.recipient).toBe('+35799123456');
        expect(result.message).toBe('Hello from Telegram!');
      });

      it('should parse command without + prefix', () => {
        const result = MessageForwardService.parseForwardCommand(
          '/forward 35799123456 Test message'
        );

        expect(result.isForwardCommand).toBe(true);
        expect(result.recipient).toBe('35799123456');
        expect(result.message).toBe('Test message');
      });

      it('should handle case insensitivity', () => {
        const result = MessageForwardService.parseForwardCommand(
          '/FORWARD +35799123456 Test'
        );

        expect(result.isForwardCommand).toBe(true);
      });

      it('should trim whitespace from message', () => {
        const result = MessageForwardService.parseForwardCommand(
          '/forward +35799123456    Test with spaces   '
        );

        expect(result.message).toBe('Test with spaces');
      });
    });

    describe('Invalid commands', () => {
      it('should reject non-forward messages', () => {
        const result = MessageForwardService.parseForwardCommand(
          'Just a normal message'
        );

        expect(result.isForwardCommand).toBe(false);
        expect(result.recipient).toBeUndefined();
        expect(result.message).toBeUndefined();
      });

      it('should reject incomplete forward command', () => {
        const result = MessageForwardService.parseForwardCommand(
          'forward to +35799123456'
        );

        expect(result.isForwardCommand).toBe(false);
      });

      it('should reject command without phone number', () => {
        const result = MessageForwardService.parseForwardCommand(
          'forward to : message'
        );

        expect(result.isForwardCommand).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate Cyprus phone numbers', () => {
      expect(MessageForwardService.validatePhoneNumber('+35799123456')).toBe(true);
      expect(MessageForwardService.validatePhoneNumber('35799123456')).toBe(true);
    });

    it('should validate international phone numbers', () => {
      expect(MessageForwardService.validatePhoneNumber('+1234567890')).toBe(true);
      expect(MessageForwardService.validatePhoneNumber('+44123456789012')).toBe(true);
    });

    it('should handle phone numbers with spaces and dashes', () => {
      expect(MessageForwardService.validatePhoneNumber('+357 99 123456')).toBe(true);
      expect(MessageForwardService.validatePhoneNumber('+357-99-123456')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(MessageForwardService.validatePhoneNumber('123')).toBe(false); // Too short
      expect(MessageForwardService.validatePhoneNumber('abcdefghijk')).toBe(false); // Non-numeric
      expect(MessageForwardService.validatePhoneNumber('')).toBe(false); // Empty
      expect(MessageForwardService.validatePhoneNumber('+1234567890123456')).toBe(false); // Too long
    });
  });
});
