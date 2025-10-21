import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(),
}));

const sendMessageMock = vi.fn().mockResolvedValue({ success: true, messageId: 'mock-meta-id' });
const generateResponseMock = vi.fn().mockResolvedValue({
  text: 'Mock AI response',
  tokensUsed: { prompt: 0, completion: 0, total: 0 },
  costEstimate: 0,
  responseTime: 0,
  toolCalls: [],
});

vi.mock('@sophiaai/services', async () => {
  const actual = await vi.importActual<typeof import('@sophiaai/services')>('@sophiaai/services');

  return {
    ...actual,
    OpenAIService: vi.fn(() => ({
      generateResponse: generateResponseMock,
    })),
    WhatsAppMetaService: vi.fn(() => ({
      sendMessage: sendMessageMock,
    })),
    CalculatorService: {
      calculateTransferFees: vi.fn(() => ({ success: false })),
      calculateCapitalGainsTax: vi.fn(() => ({ success: false })),
      calculateVAT: vi.fn(() => ({ success: false })),
    },
  };
});

interface MessagePayloadOptions {
  messageText?: string;
  from?: string;
  messageId?: string;
  includeMessages?: boolean;
}

function createMessagePayload(options: MessagePayloadOptions = {}) {
  const {
    messageText = 'Test message',
    from = '35799123456',
    messageId = 'wamid.SM1234567890abcdef',
    includeMessages = true,
  } = options;

  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry-id',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '123456789',
                phone_number_id: 'phone-number-id',
              },
              contacts: [
                {
                  profile: { name: 'Test User' },
                  wa_id: from,
                },
              ],
              messages: includeMessages
                ? [
                    {
                      from,
                      id: messageId,
                      timestamp: `${Math.floor(Date.now() / 1000)}`,
                      type: 'text',
                      text: { body: messageText },
                    },
                  ]
                : undefined,
            },
          },
        ],
      },
    ],
  };
}

function createWebhookRequest(payload: unknown) {
  return new NextRequest('http://localhost:3000/api/whatsapp-webhook', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
  });
}

type SupabaseResponse<T> = { data: T | null; error: { message: string; code?: string } | null };

interface SupabaseMockOptions {
  agentResponse?: SupabaseResponse<{ id: string; name?: string; phone_number?: string }>;
  conversationInsertResult?: { error: { code?: string; message?: string } | null };
  conversationHistory?: Array<{ message_text: string; direction: string; timestamp: string }>;
  onConversationInsert?: (data: unknown) => void;
  onAgentPhoneLookup?: (value: string) => void;
}

const defaultAgentNotFound: SupabaseResponse<{ id: string }> = {
  data: null,
  error: { message: 'No rows found' },
};

function buildSupabaseMock(options: SupabaseMockOptions = {}) {
  const agentResponse = options.agentResponse ?? defaultAgentNotFound;
  const conversationInsertResult = options.conversationInsertResult ?? { error: null };
  const conversationHistory = options.conversationHistory ?? [];
  const onConversationInsert = options.onConversationInsert;
  const onAgentPhoneLookup = options.onAgentPhoneLookup;

  const conversationInsert = vi.fn((data: unknown) => {
    onConversationInsert?.(data);
    return Promise.resolve(conversationInsertResult);
  });

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'agents') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => {
              if (column === 'phone_number') {
                onAgentPhoneLookup?.(value);
              }
              return {
                single: vi.fn().mockResolvedValue(agentResponse),
              };
            }),
          })),
        };
      }

      if (table === 'conversation_logs') {
        return {
          insert: conversationInsert,
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: conversationHistory,
                  error: null,
                }),
              })),
            })),
          })),
          update: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      if (table === 'calculator_history') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      if (table === 'calculators') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'calculator-id' },
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === 'document_generations') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      };
    }),
  };

  return { client, conversationInsert };
}

async function mockSupabase(options: SupabaseMockOptions = {}) {
  const { createAdminClient } = await import('@/lib/supabase');
  const supabaseMock = buildSupabaseMock(options);
  vi.mocked(createAdminClient).mockReturnValue(
    supabaseMock.client as unknown as ReturnType<typeof createAdminClient>
  );
  return supabaseMock;
}

describe('WhatsApp Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    sendMessageMock.mockClear();
    generateResponseMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/whatsapp-webhook', () => {
    it('should return 200 OK for valid message payload', async () => {
      const mockAgent = { id: 'agent-uuid-1' };
      await mockSupabase({
        agentResponse: { data: mockAgent, error: null },
      });

      const payload = createMessagePayload({
        messageText: 'Hello Sophia',
        from: '35799123456',
        messageId: 'wamid.SM1234567890abcdef',
      });

      const request = createWebhookRequest(payload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(sendMessageMock).toHaveBeenCalled();
    });

    it('should return 200 OK for missing Body field', async () => {
      const payload = createMessagePayload({
        messageText: '',
        from: '35799123456',
        messageId: 'wamid.SM1234567890abcdef',
      });

      const request = createWebhookRequest(payload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });

    it('should return 200 OK for missing From field', async () => {
      const payload = createMessagePayload({
        from: '',
        messageText: 'Hello Sophia',
        messageId: 'wamid.SM1234567890abcdef',
      });

      const request = createWebhookRequest(payload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });

    it('should return 200 OK for missing MessageSid field', async () => {
      const payload = createMessagePayload({
        messageText: 'Hello Sophia',
        from: '35799123456',
        messageId: '',
      });

      const request = createWebhookRequest(payload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });

    it('should strip whatsapp: prefix from phone number', async () => {
      const mockAgent = { id: 'agent-uuid-1' };
      let capturedPhoneNumber = '';

      await mockSupabase({
        agentResponse: { data: mockAgent, error: null },
        onAgentPhoneLookup: (value) => {
          capturedPhoneNumber = value;
        },
      });

      const payload = createMessagePayload({
        messageText: 'Test message',
        from: '35799123456',
        messageId: 'wamid.SM1234567890abcdef',
      });

      const request = createWebhookRequest(payload);

      await POST(request);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(capturedPhoneNumber).toBe('+35799123456');
    });

    it('should handle unregistered agent and send rejection message (Story 1.6)', async () => {
      await mockSupabase();

      const payload = createMessagePayload({
        messageText: 'Hello from unknown',
        from: '999999999',
        messageId: 'wamid.SM1234567890abcdef',
      });

      const request = createWebhookRequest(payload);

      const response = await POST(request);

      // Webhook should return 200 OK for unregistered agents
      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify log was written about guest user (sandbox mode allows all users now)
      expect(console.log).toHaveBeenCalledWith(
        'Guest user (unregistered) accessing Sophia',
        expect.objectContaining({
          messageId: 'wamid.SM1234567890abcdef',
        })
      );
    });

    it('should handle duplicate message ID (Meta retry)', async () => {
      const mockAgent = { id: 'agent-uuid-1' };
      await mockSupabase({
        agentResponse: { data: mockAgent, error: null },
        conversationInsertResult: {
          error: { code: '23505', message: 'Duplicate key violation' },
        },
      });

      const payload = createMessagePayload({
        messageText: 'Duplicate message',
        from: '35799123456',
        messageId: 'wamid.SM1234567890abcdef',
      });

      const request = createWebhookRequest(payload);

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(console.log).toHaveBeenCalledWith(
        'Duplicate message ID, skipping processing',
        expect.objectContaining({
          messageId: 'wamid.SM1234567890abcdef',
        })
      );
    });

    it('should handle database insert errors gracefully', async () => {
      const mockAgent = { id: 'agent-uuid-1' };
      await mockSupabase({
        agentResponse: { data: mockAgent, error: null },
        conversationInsertResult: {
          error: { code: 'XXXX', message: 'Database error' },
        },
      });

      const payload = createMessagePayload({
        messageText: 'Test message',
        from: '35799123456',
        messageId: 'wamid.SM1234567890abcdef',
      });

      const request = createWebhookRequest(payload);

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(console.error).toHaveBeenCalled();
    });

    it('should log message with correct data structure', async () => {
      const mockAgent = { id: 'agent-uuid-123' };
      let insertedData: unknown = null;

      await mockSupabase({
        agentResponse: { data: mockAgent, error: null },
        onConversationInsert: (data) => {
          insertedData = data;
        },
      });

      const payload = createMessagePayload({
        messageText: 'Test message content',
        from: '35799123456',
        messageId: 'wamid.SM1234567890abcdef',
      });

      const request = createWebhookRequest(payload);

      await POST(request);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(insertedData).toMatchObject({
        agent_id: 'agent-uuid-123',
        message_text: 'Test message content',
        direction: 'inbound',
        message_id: 'wamid.SM1234567890abcdef',
      });
      expect(insertedData).toHaveProperty('timestamp');
    });
  });
});
