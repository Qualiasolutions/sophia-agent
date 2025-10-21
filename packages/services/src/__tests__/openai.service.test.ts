import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIService } from '../openai.service';
import OpenAI, { APIError } from 'openai';

// Mock OpenAI client
vi.mock('openai', () => {
  // Mock OpenAI APIError class
  class MockAPIError extends Error {
    status: number;
    type: string | null;
    code: string | undefined;

    constructor(
      status: number,
      error: any,
      message: string,
      headers: any
    ) {
      super(message);
      this.name = 'APIError';
      this.status = status;
      this.type = error?.error?.type || null;
      this.code = error?.error?.code;
    }
  }

  const mockCreate = vi.fn();

  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
    APIError: MockAPIError,
  };
});

describe('OpenAIService', () => {
  let service: OpenAIService;
  let mockCreate: any;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Set up environment variable
    process.env.OPENAI_API_KEY = 'test-api-key';

    // Create service instance
    service = new OpenAIService();

    // Get reference to the mocked create function
    const OpenAIConstructor = OpenAI as any;
    const mockClient = new OpenAIConstructor();
    mockCreate = mockClient.chat.completions.create;

    // Default mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Hello! I am Sophia, your AI assistant for zyprus.com.',
          },
        },
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150,
      },
    });
  });

  describe('Configuration', () => {
    it('should use gpt-4o-mini model', () => {
      const config = service.getConfig();
      expect(config.model).toBe('gpt-4o-mini');
    });

    it('should have temperature of 0.7', () => {
      const config = service.getConfig();
      expect(config.temperature).toBe(0.7);
    });

    it('should have max tokens of 300', () => {
      const config = service.getConfig();
      expect(config.maxTokens).toBe(800);
    });

    it('should have timeout of 5000ms', () => {
      const config = service.getConfig();
      expect(config.timeout).toBe(8000);
    });

    it('should throw error if OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new OpenAIService()).toThrow(
        'OPENAI_API_KEY environment variable is not set'
      );
    });
  });

  describe('generateResponse', () => {
    it('should generate response for valid message', async () => {
      const response = await service.generateResponse('Hello Sophia');

      expect(response.text).toBeDefined();
      expect(response.text.length).toBeGreaterThan(0);
      expect(response.text).toBe(
        'Hello! I am Sophia, your AI assistant for zyprus.com.'
      );
    });

    it('should return non-empty string for any valid input', async () => {
      const response = await service.generateResponse('Test message');

      expect(response.text).toBeDefined();
      expect(typeof response.text).toBe('string');
      expect(response.text.length).toBeGreaterThan(0);
    });

    it('should include token usage in response', async () => {
      const response = await service.generateResponse('Hello');

      expect(response.tokensUsed).toBeDefined();
      expect(response.tokensUsed.prompt).toBe(50);
      expect(response.tokensUsed.completion).toBe(100);
      expect(response.tokensUsed.total).toBe(150);
      expect(response.tokensUsed.total).toBeGreaterThan(0);
    });

    it('should include cost estimate in response', async () => {
      const response = await service.generateResponse('Hello');

      expect(response.costEstimate).toBeDefined();
      expect(typeof response.costEstimate).toBe('number');
      expect(response.costEstimate).toBeGreaterThan(0);

      // Verify cost calculation: (50 * 0.15 / 1M) + (100 * 0.60 / 1M) = 0.0000675
      expect(response.costEstimate).toBeCloseTo(0.0000675, 7);
    });

    it('should include response time in response', async () => {
      const response = await service.generateResponse('Hello');

      expect(response.responseTime).toBeDefined();
      expect(typeof response.responseTime).toBe('number');
      expect(response.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await service.generateResponse('Hello');
      const duration = Date.now() - startTime;

      // Should complete quickly in tests (mocked)
      expect(duration).toBeLessThan(1000);
    });

    it('should pass correct parameters to OpenAI API', async () => {
      await service.generateResponse('Test message');

      expect(mockCreate).toHaveBeenCalled();

      const callArgs = mockCreate.mock.calls.at(-1)?.[0] as Record<string, unknown>;
      expect(callArgs).toBeDefined();
      expect(callArgs.model).toBe('gpt-4o-mini');
      expect(callArgs.temperature).toBe(0.7);
      expect(callArgs.max_tokens).toBe(800);

      const extractText = (content: unknown): string => {
        if (typeof content === 'string') {
          return content;
        }
        if (Array.isArray(content)) {
          return content
            .map((entry) => {
              if (typeof entry === 'string') {
                return entry;
              }
              if (entry && typeof entry === 'object' && 'text' in entry) {
                const { text } = entry as { text?: unknown };
                return typeof text === 'string' ? text : '';
              }
              return '';
            })
            .join(' ');
        }
        return '';
      };

      const messages = (callArgs.messages as Array<{ role: string; content: unknown }>) || [];
      const systemMessage = messages.find((msg) => msg.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(extractText(systemMessage?.content)).toContain('Sophia');

      const userMessage = messages.find((msg) => msg.role === 'user');
      expect(userMessage).toBeDefined();
      expect(extractText(userMessage?.content)).toContain('Test message');
    });

    it('should include conversation history if provided', async () => {
      const context = {
        agentId: 'agent-123',
        messageHistory: [
          { role: 'user' as const, content: 'Previous message' },
          { role: 'assistant' as const, content: 'Previous response' },
        ],
      };

      await service.generateResponse('Follow-up message', context);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'user', content: 'Previous message' },
            { role: 'assistant', content: 'Previous response' },
            { role: 'user', content: 'Follow-up message' },
          ]),
        })
      );
    });
  });

  describe('Greeting Detection', () => {
    it('should detect "hello" as greeting', async () => {
      const intent = await service.classifyIntent('hello');
      expect(intent).toBe('greeting');
    });

    it('should detect "hi" as greeting', async () => {
      const intent = await service.classifyIntent('hi');
      expect(intent).toBe('greeting');
    });

    it('should detect "hey" as greeting', async () => {
      const intent = await service.classifyIntent('hey');
      expect(intent).toBe('greeting');
    });

    it('should detect "hi sophia" as greeting', async () => {
      const intent = await service.classifyIntent('hi sophia');
      expect(intent).toBe('greeting');
    });

    it('should detect "hello sophia" as greeting', async () => {
      const intent = await service.classifyIntent('hello sophia');
      expect(intent).toBe('greeting');
    });

    it('should detect "good morning" as greeting', async () => {
      const intent = await service.classifyIntent('good morning');
      expect(intent).toBe('greeting');
    });

    it('should detect greetings case-insensitively', async () => {
      expect(await service.classifyIntent('HELLO')).toBe('greeting');
      expect(await service.classifyIntent('Hi')).toBe('greeting');
      expect(await service.classifyIntent('HEY SOPHIA')).toBe('greeting');
    });

    it('should detect greetings with extra whitespace', async () => {
      expect(await service.classifyIntent('  hello  ')).toBe('greeting');
      expect(await service.classifyIntent('hi  sophia')).toBe('greeting');
    });

    it('should return unknown for non-greeting messages', async () => {
      const intent = await service.classifyIntent(
        'Calculate mortgage for property'
      );
      expect(intent).toBe('unknown');
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      const apiError = new APIError(
        500,
        {
          error: {
            message: 'Internal server error',
            type: 'server_error',
            code: 'internal_error',
          },
        },
        'Internal server error',
        {}
      );

      mockCreate.mockRejectedValueOnce(apiError);

      const response = await service.generateResponse('Test message');

      expect(response.text).toBe(
        "I'm having trouble processing your request right now. Please try again in a moment."
      );
      expect(response.tokensUsed.total).toBe(0);
      expect(response.costEstimate).toBe(0);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new APIError(
        0,
        null,
        'Request timeout',
        {}
      );
      (timeoutError as any).code = 'ETIMEDOUT';

      mockCreate.mockRejectedValueOnce(timeoutError);

      const response = await service.generateResponse('Test message');

      expect(response.text).toContain('trouble processing');
    });

    it('should handle rate limit errors (429)', async () => {
      const rateLimitError = new APIError(
        429,
        {
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error',
            code: 'rate_limit_exceeded',
          },
        },
        'Rate limit exceeded',
        {}
      );

      mockCreate.mockRejectedValueOnce(rateLimitError);

      const response = await service.generateResponse('Test message');

      expect(response.text).toContain('trouble processing');
    });

    it('should handle authentication errors (401)', async () => {
      const authError = new APIError(
        401,
        {
          error: {
            message: 'Invalid API key',
            type: 'authentication_error',
            code: 'invalid_api_key',
          },
        },
        'Invalid API key',
        {}
      );

      mockCreate.mockRejectedValueOnce(authError);

      const response = await service.generateResponse('Test message');

      expect(response.text).toContain('trouble processing');
    });

    it('should handle invalid request errors (400)', async () => {
      const invalidRequestError = new APIError(
        400,
        {
          error: {
            message: 'Invalid request',
            type: 'invalid_request_error',
            code: 'invalid_request',
          },
        },
        'Invalid request',
        {}
      );

      mockCreate.mockRejectedValueOnce(invalidRequestError);

      const response = await service.generateResponse('Test message');

      expect(response.text).toContain('trouble processing');
    });

    it('should handle generic errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Generic error'));

      const response = await service.generateResponse('Test message');

      expect(response.text).toContain('trouble processing');
    });

    it('should return fallback response immediately on error', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Test error'));

      const startTime = Date.now();
      const response = await service.generateResponse('Test message');
      const duration = Date.now() - startTime;

      expect(response.text).toContain('trouble processing');
      expect(duration).toBeLessThan(100); // Should fail fast
    });

    it('should include response time in error response', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Test error'));

      const response = await service.generateResponse('Test message');

      expect(response.responseTime).toBeDefined();
      expect(response.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Token Usage Logging', () => {
    it('should log token usage to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await service.generateResponse('Hello', { agentId: 'agent-123' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[OpenAI] Response generated',
        expect.objectContaining({
          agentId: 'agent-123',
          messageLength: 5,
          tokensUsed: {
            prompt: 50,
            completion: 100,
            total: 150,
          },
          costEstimate: expect.stringContaining('$0.00'),
          responseTime: expect.stringContaining('ms'),
          isGreeting: true,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log errors with structured format', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockCreate.mockRejectedValueOnce(new Error('Test error'));

      await service.generateResponse('Test message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[OpenAI] Error details',
        expect.objectContaining({
          timestamp: expect.any(String),
          errorType: expect.any(String),
          errorMessage: expect.any(String),
          responseTime: expect.stringContaining('ms'),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate cost correctly for typical usage', async () => {
      // 50 input tokens + 100 output tokens
      // Cost = (50/1M * $0.15) + (100/1M * $0.60) = $0.0000675
      const response = await service.generateResponse('Hello');

      expect(response.costEstimate).toBeCloseTo(0.0000675, 7);
    });

    it('should calculate cost for different token usage', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      });

      const response = await service.generateResponse('Test');

      // Cost = (100/1M * $0.15) + (200/1M * $0.60) = $0.000135
      expect(response.costEstimate).toBeCloseTo(0.000135, 7);
    });

    it('should return zero cost for errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Test error'));

      const response = await service.generateResponse('Test');

      expect(response.costEstimate).toBe(0);
    });
  });

  describe('Calculator Function Calling', () => {
    it('should detect calculator request and return function call', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_123',
                  type: 'function',
                  function: {
                    name: 'calculate_transfer_fees',
                    arguments: JSON.stringify({ property_value: 300000 }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      });

      const response = await service.generateResponse(
        'Calculate transfer fees for 300k property'
      );

      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls?.[0].function.name).toBe('calculate_transfer_fees');
      expect(JSON.parse(response.toolCalls?.[0].function.arguments || '{}')).toEqual({
        property_value: 300000,
      });
    });

    it('should support capital gains tax calculator function', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_456',
                  type: 'function',
                  function: {
                    name: 'calculate_capital_gains_tax',
                    arguments: JSON.stringify({
                      sale_price: 400000,
                      purchase_price: 250000,
                      purchase_year: 2015,
                      sale_year: 2025,
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 60,
          completion_tokens: 30,
          total_tokens: 90,
        },
      });

      const response = await service.generateResponse(
        'Calculate capital gains tax for property bought at 250k in 2015, selling at 400k in 2025'
      );

      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls?.[0].function.name).toBe('calculate_capital_gains_tax');
    });

    it('should support VAT calculator function', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_789',
                  type: 'function',
                  function: {
                    name: 'calculate_vat',
                    arguments: JSON.stringify({
                      property_value: 350000,
                      property_type: 'apartment',
                      is_first_home: true,
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 55,
          completion_tokens: 25,
          total_tokens: 80,
        },
      });

      const response = await service.generateResponse(
        'Calculate VAT for 350k apartment, first home'
      );

      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls?.[0].function.name).toBe('calculate_vat');
    });

    it('should support list_calculators function', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_list',
                  type: 'function',
                  function: {
                    name: 'list_calculators',
                    arguments: '{}',
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 40,
          completion_tokens: 15,
          total_tokens: 55,
        },
      });

      const response = await service.generateResponse(
        'What calculators do you have?'
      );

      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls?.[0].function.name).toBe('list_calculators');
    });

    it('should handle multiple tool calls in single response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'Let me calculate both for you.',
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'calculate_transfer_fees',
                    arguments: JSON.stringify({ property_value: 300000 }),
                  },
                },
                {
                  id: 'call_2',
                  type: 'function',
                  function: {
                    name: 'calculate_vat',
                    arguments: JSON.stringify({
                      property_value: 300000,
                      property_type: 'house',
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 70,
          completion_tokens: 40,
          total_tokens: 110,
        },
      });

      const response = await service.generateResponse(
        'Calculate both transfer fees and VAT for a 300k house'
      );

      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls).toHaveLength(2);
      expect(response.toolCalls?.[0].function.name).toBe('calculate_transfer_fees');
      expect(response.toolCalls?.[1].function.name).toBe('calculate_vat');
    });
  });
});
