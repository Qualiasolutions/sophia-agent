import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { WhatsAppService } from '../whatsapp.service';

// Mock axios
vi.mock('axios');

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  // Mock environment variables
  const mockEnv = {
    TWILIO_ACCOUNT_SID: 'ACtest123',
    TWILIO_AUTH_TOKEN: 'test_token_123',
    TWILIO_WHATSAPP_NUMBER: '+14155238886',
  };

  beforeEach(() => {
    // Set up environment variables
    vi.stubEnv('TWILIO_ACCOUNT_SID', mockEnv.TWILIO_ACCOUNT_SID);
    vi.stubEnv('TWILIO_AUTH_TOKEN', mockEnv.TWILIO_AUTH_TOKEN);
    vi.stubEnv('TWILIO_WHATSAPP_NUMBER', mockEnv.TWILIO_WHATSAPP_NUMBER);

    // Create service instance
    service = new WhatsAppService();

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully with valid inputs', async () => {
      // Mock successful Twilio API response
      const mockResponse = {
        data: {
          sid: 'SM123abc456def',
          status: 'queued',
          from: 'whatsapp:+14155238886',
          to: 'whatsapp:+35799123456',
          body: 'Hello from Sophia!',
        },
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

      const result = await service.sendMessage({
        phoneNumber: '+35799123456',
        messageText: 'Hello from Sophia!',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM123abc456def');
      expect(result.messageId).toMatch(/^SM/);
      expect(result.error).toBeUndefined();
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should format phone numbers with whatsapp: prefix for Twilio', async () => {
      const mockResponse = {
        data: {
          sid: 'SM123abc456def',
          status: 'queued',
        },
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

      await service.sendMessage({
        phoneNumber: '+35799123456',
        messageText: 'Test message',
      });

      // Check that axios.post was called with form data containing whatsapp: prefix
      const callArgs = vi.mocked(axios.post).mock.calls[0];
      const formData = callArgs[1] as string;

      expect(formData).toContain('whatsapp%3A%2B35799123456'); // URL encoded whatsapp:+35799123456
      expect(formData).toContain('whatsapp%3A%2B14155238886'); // URL encoded whatsapp:+14155238886
    });

    it('should handle API errors gracefully', async () => {
      // Mock Twilio API error
      vi.mocked(axios.post).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            code: 21211,
            message: 'Invalid phone number',
          },
        },
        isAxiosError: true,
      });

      // Mock axios.isAxiosError to return true
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const result = await service.sendMessage({
        phoneNumber: '+1234567890',
        messageText: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number');
      expect(result.messageId).toBeUndefined();
    });

    it('should retry on API failure with exponential backoff (3 attempts)', async () => {
      // Mock first 2 failures, 3rd success
      vi.mocked(axios.post)
        .mockRejectedValueOnce({
          message: 'Network error',
          isAxiosError: true,
        })
        .mockRejectedValueOnce({
          message: 'Network error',
          isAxiosError: true,
        })
        .mockResolvedValueOnce({
          data: {
            sid: 'SM123abc456def',
            status: 'queued',
          },
        });

      // Mock axios.isAxiosError to return false for permanent errors
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      const result = await service.sendMessage({
        phoneNumber: '+35799123456',
        messageText: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM123abc456def');
      expect(axios.post).toHaveBeenCalledTimes(3);
    });

    it('should return error after max retries exhausted', async () => {
      // Mock all 3 attempts fail with Error object
      const networkError = new Error('Network error');
      vi.mocked(axios.post).mockRejectedValue(networkError);

      // Mock axios.isAxiosError to return false (transient error)
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      const result = await service.sendMessage({
        phoneNumber: '+35799123456',
        messageText: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(axios.post).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid phone number error without retry', async () => {
      // Mock invalid phone number error (permanent error)
      vi.mocked(axios.post).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            code: 21211,
            message: "The 'To' number is not a valid phone number.",
          },
        },
        isAxiosError: true,
      });

      // Mock axios.isAxiosError to return true
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const result = await service.sendMessage({
        phoneNumber: '+invalid',
        messageText: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number');
      // Should only try once (no retries for permanent errors)
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should handle authentication error without retry', async () => {
      // Mock authentication error (permanent error)
      vi.mocked(axios.post).mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            code: 20003,
            message: 'Authentication error',
          },
        },
        isAxiosError: true,
      });

      // Mock axios.isAxiosError to return true
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const result = await service.sendMessage({
        phoneNumber: '+35799123456',
        messageText: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication error');
      // Should only try once (no retries for permanent errors)
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should mask phone numbers in error logs', async () => {
      // Mock console.error to capture log output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock API error
      vi.mocked(axios.post).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            code: 21211,
            message: 'Invalid phone number',
          },
        },
        isAxiosError: true,
      });

      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await service.sendMessage({
        phoneNumber: '+35799123456789',
        messageText: 'Test message',
      });

      // Check that console.error was called with masked phone number
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorCall = consoleErrorSpy.mock.calls[0][0];

      // Phone number should be masked (first 7 chars visible, rest as X)
      // +35799123456789 -> +357991XXXXXXXX (8 X's for the remaining digits)
      expect(errorCall.phoneNumber).toBe('+357991XXXXXXXX');
      expect(errorCall.phoneNumber).not.toContain('123456789');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('constructor', () => {
    it('should throw error when environment variables are missing', () => {
      // Clear environment variables
      const originalAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const originalAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const originalWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
      const originalApiKeySid = process.env.TWILIO_API_KEY_SID;
      const originalApiKeySecret = process.env.TWILIO_API_KEY_SECRET;

      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_WHATSAPP_NUMBER;
      delete process.env.TWILIO_API_KEY_SID;
      delete process.env.TWILIO_API_KEY_SECRET;

      expect(() => new WhatsAppService()).toThrow();

      // Restore environment variables
      if (originalAccountSid) process.env.TWILIO_ACCOUNT_SID = originalAccountSid;
      if (originalAuthToken) process.env.TWILIO_AUTH_TOKEN = originalAuthToken;
      if (originalWhatsAppNumber) process.env.TWILIO_WHATSAPP_NUMBER = originalWhatsAppNumber;
      if (originalApiKeySid) process.env.TWILIO_API_KEY_SID = originalApiKeySid;
      if (originalApiKeySecret) process.env.TWILIO_API_KEY_SECRET = originalApiKeySecret;
    });

    it('should initialize successfully with valid environment variables', () => {
      expect(() => new WhatsAppService()).not.toThrow();
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limit and wait when limit is reached', async () => {
      // Create service with low rate limit for testing
      const testService = new WhatsAppService({ rateLimitPerSecond: 2 });

      // Mock successful responses
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          sid: 'SM123abc456def',
          status: 'queued',
        },
      });

      // Send 3 messages quickly (should hit rate limit on 3rd)
      const promises = [
        testService.sendMessage({ phoneNumber: '+1', messageText: 'Test 1' }),
        testService.sendMessage({ phoneNumber: '+2', messageText: 'Test 2' }),
        testService.sendMessage({ phoneNumber: '+3', messageText: 'Test 3' }),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
      expect(axios.post).toHaveBeenCalledTimes(3);
    });
  });
});
