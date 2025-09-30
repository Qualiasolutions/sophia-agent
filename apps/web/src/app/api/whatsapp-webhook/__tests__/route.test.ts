import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(),
}));

describe('WhatsApp Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/whatsapp-webhook', () => {
    it('should return 200 OK for valid message payload', async () => {
      const formData = new FormData();
      formData.append('Body', 'Hello Sophia');
      formData.append('From', 'whatsapp:+35799123456');
      formData.append('MessageSid', 'SM1234567890abcdef');

      const mockAgent = { id: 'agent-uuid-1' };
      const mockSupabaseClient = {
        from: vi.fn((table: string) => {
          if (table === 'agents') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockAgent,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'conversation_logs') {
            return {
              insert: vi.fn().mockResolvedValue({
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      const { createAdminClient } = await import('@/lib/supabase');
      vi.mocked(createAdminClient).mockReturnValue(
        mockSupabaseClient as ReturnType<typeof createAdminClient>
      );

      const request = new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
    });

    it('should return 200 OK for missing Body field', async () => {
      const formData = new FormData();
      formData.append('From', 'whatsapp:+35799123456');
      formData.append('MessageSid', 'SM1234567890abcdef');
      // Body is missing

      const request = new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('error');
      expect(data.message).toBe('Invalid payload');
    });

    it('should return 200 OK for missing From field', async () => {
      const formData = new FormData();
      formData.append('Body', 'Hello Sophia');
      formData.append('MessageSid', 'SM1234567890abcdef');
      // From is missing

      const request = new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('error');
      expect(data.message).toBe('Invalid payload');
    });

    it('should return 200 OK for missing MessageSid field', async () => {
      const formData = new FormData();
      formData.append('Body', 'Hello Sophia');
      formData.append('From', 'whatsapp:+35799123456');
      // MessageSid is missing

      const request = new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('error');
      expect(data.message).toBe('Invalid payload');
    });

    it('should strip whatsapp: prefix from phone number', async () => {
      const formData = new FormData();
      formData.append('Body', 'Test message');
      formData.append('From', 'whatsapp:+35799123456');
      formData.append('MessageSid', 'SM1234567890abcdef');

      const mockAgent = { id: 'agent-uuid-1' };
      let capturedPhoneNumber = '';

      const mockSupabaseClient = {
        from: vi.fn((table: string) => {
          if (table === 'agents') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn((column: string, value: string) => {
                  if (column === 'phone_number') {
                    capturedPhoneNumber = value;
                  }
                  return {
                    single: vi.fn().mockResolvedValue({
                      data: mockAgent,
                      error: null,
                    }),
                  };
                }),
              }),
            };
          }
          if (table === 'conversation_logs') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      };

      const { createAdminClient } = await import('@/lib/supabase');
      vi.mocked(createAdminClient).mockReturnValue(
        mockSupabaseClient as ReturnType<typeof createAdminClient>
      );

      const request = new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
        method: 'POST',
        body: formData,
      });

      await POST(request);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(capturedPhoneNumber).toBe('+35799123456');
    });

    it('should handle unregistered agent gracefully', async () => {
      const formData = new FormData();
      formData.append('Body', 'Hello from unknown');
      formData.append('From', 'whatsapp:+999999999');
      formData.append('MessageSid', 'SM1234567890abcdef');

      const mockSupabaseClient = {
        from: vi.fn((table: string) => {
          if (table === 'agents') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'No rows found' },
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };

      const { createAdminClient } = await import('@/lib/supabase');
      vi.mocked(createAdminClient).mockReturnValue(
        mockSupabaseClient as ReturnType<typeof createAdminClient>
      );

      const request = new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle duplicate message ID (Twilio retry)', async () => {
      const formData = new FormData();
      formData.append('Body', 'Duplicate message');
      formData.append('From', 'whatsapp:+35799123456');
      formData.append('MessageSid', 'SM1234567890abcdef');

      const mockAgent = { id: 'agent-uuid-1' };
      const mockSupabaseClient = {
        from: vi.fn((table: string) => {
          if (table === 'agents') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockAgent,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'conversation_logs') {
            return {
              insert: vi.fn().mockResolvedValue({
                error: { code: '23505', message: 'Duplicate key violation' },
              }),
            };
          }
          return {};
        }),
      };

      const { createAdminClient } = await import('@/lib/supabase');
      vi.mocked(createAdminClient).mockReturnValue(
        mockSupabaseClient as ReturnType<typeof createAdminClient>
      );

      const request = new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(console.log).toHaveBeenCalledWith(
        'Duplicate message ID, skipping insert',
        expect.any(Object)
      );
    });

    it('should handle database insert errors gracefully', async () => {
      const formData = new FormData();
      formData.append('Body', 'Test message');
      formData.append('From', 'whatsapp:+35799123456');
      formData.append('MessageSid', 'SM1234567890abcdef');

      const mockAgent = { id: 'agent-uuid-1' };
      const mockSupabaseClient = {
        from: vi.fn((table: string) => {
          if (table === 'agents') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockAgent,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'conversation_logs') {
            return {
              insert: vi.fn().mockResolvedValue({
                error: { code: 'XXXX', message: 'Database error' },
              }),
            };
          }
          return {};
        }),
      };

      const { createAdminClient } = await import('@/lib/supabase');
      vi.mocked(createAdminClient).mockReturnValue(
        mockSupabaseClient as ReturnType<typeof createAdminClient>
      );

      const request = new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(console.error).toHaveBeenCalled();
    });

    it('should log message with correct data structure', async () => {
      const formData = new FormData();
      formData.append('Body', 'Test message content');
      formData.append('From', 'whatsapp:+35799123456');
      formData.append('MessageSid', 'SM1234567890abcdef');

      const mockAgent = { id: 'agent-uuid-123' };
      let insertedData: unknown = null;

      const mockSupabaseClient = {
        from: vi.fn((table: string) => {
          if (table === 'agents') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockAgent,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'conversation_logs') {
            return {
              insert: vi.fn((data: unknown) => {
                insertedData = data;
                return Promise.resolve({ error: null });
              }),
            };
          }
          return {};
        }),
      };

      const { createAdminClient } = await import('@/lib/supabase');
      vi.mocked(createAdminClient).mockReturnValue(
        mockSupabaseClient as ReturnType<typeof createAdminClient>
      );

      const request = new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
        method: 'POST',
        body: formData,
      });

      await POST(request);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(insertedData).toMatchObject({
        agent_id: 'agent-uuid-123',
        message_text: 'Test message content',
        direction: 'inbound',
        message_id: 'SM1234567890abcdef',
      });
      expect(insertedData).toHaveProperty('timestamp');
    });
  });
});
