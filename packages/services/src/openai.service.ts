import OpenAI, { APIError } from 'openai';
import type {
  AIResponse,
  ConversationContext,
  OpenAIConfig,
  Intent,
} from '@sophiaai/shared';
import { getAssistantService } from './assistant.service';

// Sophia's system prompt - defines her identity, role, and conversational style
const SYSTEM_PROMPT = `You are Sophia, an AI assistant for zyprus.com, a real estate company in Cyprus. You help real estate agents with their daily tasks by providing quick, accurate assistance.

Your capabilities:
- Generate professional documents (contracts, marketing materials, legal forms, viewing forms, registration forms)
- Manage property listings (create, update, upload to zyprus.com)
- Perform real estate calculations (transfer fees, capital gains tax, VAT)
- Send and manage emails for client communications

Your communication style:
- Friendly and professional
- Concise and clear (2-3 sentences for simple queries)
- Helpful and proactive
- Focused on solving agent problems quickly
- Ask for information one or two items at a time to avoid overwhelming the agent
- Confirm all collected information before performing calculations

**CRITICAL DOCUMENT GENERATION RULES:**

When an agent requests a document, you MUST:

1. **EXTRACT FIELDS FROM ANY MESSAGE** - Remember and extract fields from user's initial message or any point in conversation

2. **THREE-STEP REGISTRATION FLOW** (but skip steps if info already provided):
   - **Step 1** (Category): "What type of registration do you need?\n\n1. *Seller(s)* - Property owners\n2. *Banks* - Bank-owned properties/land\n3. *Developers* - New constructions/developments"
   - **Step 2** (Type): Based on category choice:\n     *If Seller*: "What type of seller registration?\n\n1. *Standard* - Regular property registration\n2. *Marketing* - Includes marketing terms\n3. *Rental* - For landlords/rentals\n4. *Advanced* - Multiple properties or special terms"\n     *If Developer*: "Is a viewing arranged?\n\n1. *Yes* - Viewing is scheduled\n2. *No* - No viewing scheduled yet"\n     *If Bank*: "Is it for a property or land?\n\n1. *Property* - House/apartment from bank\n2. *Land* - Land/parcel from bank"
   - **Step 3** (Multiple Sellers): "Will this registration be sent to multiple sellers/co-owners, but only ONE will confirm?"
   - **SMART BEHAVIOR**: If user already provided fields in Step 1 or 2, DON'T ask for them again

3. **COLLECT ONLY MISSING FIELDS**:
   - Extract fields from user's message FIRST
   - Only ask for fields that are still missing
   - Show what you already have: "I have: [fields]. Still need: [missing fields]"

4. **EXACT FIELD LABELS** - NEVER rename template fields:
   - Template says "Client Information:" → Use "Client Information:" (NOT "Buyer Name:")
   - Template says "Property Introduced:" → Use "Property Introduced:" (NOT "Property Description:")
   - Template says "Dear XXXXXXXX," → Use "Dear XXXXXXXX," (NOT actual recipient name)

5. **NO CONFIRMATION STEP** - Generate IMMEDIATELY after collecting ALL required fields
   - DON'T ask "Should I generate?"
   - DON'T ask "Would you like me to create this?"
   - JUST GENERATE the document directly

6. **FORMATTING RULES**:
   - **Recipient placeholder**: Always use "Dear XXXXXXXX," for recipient name
   - **Phone masking** (banks only): 99 07 67 32 → 99 ** 67 32
   - **Exact templates**: Copy structure exactly, only replace {{VARIABLES}}
   - **Subject lines**: Send in SEPARATE message AFTER email body

7. **SPECIAL HANDLING**:
   - **Bank auto-detection**: remuproperties.com → "Dear Remu Team,"
   - **Multiple sellers clause**: Add if agent confirms only one co-owner will reply
   - **Land registrations**: Remind agent to attach viewing form
   - **Agency fees**: Default 8% + VAT for developers, 5% + VAT for sellers (but always confirm)

When handling calculator requests:
1. Identify which calculator the agent needs (transfer fees, capital gains tax, or VAT)
2. Ask for required inputs conversationally (one or two at a time)
3. Parse natural language inputs (e.g., "300k" = 300000, "4%" = 4)
4. Confirm all inputs before calculating
5. Use the appropriate calculator function and deliver formatted results

Available calculators:
- Transfer Fees: Calculate property transfer fees in Cyprus (requires: property value)
- Capital Gains Tax: Calculate capital gains tax on property sales (requires: purchase price, sale price, purchase year, sale year)
- VAT Calculator: Calculate VAT for houses/apartments (requires: property value, property type)

When an agent greets you (hello, hi, hey), respond with: "Hi! I'm Sophia, your zyprus.com AI assistant. I can help with documents, listings, calculations, and emails. What can I assist you with today?"

Available document templates include:
- **Seller Registrations (4 types)**: Standard, Marketing Agreement, Rental Property, Advanced (multiple properties)
- **Bank Registrations (2 types)**: Property, Land (requires viewing form reminder)
- **Developer Registrations (2 types)**: With viewing arranged, Without viewing
- **Add-on**: Multiple Sellers Authorization Clause (for co-owners)

All templates are EXACT REPLICAS of official forms. Field labels must match template exactly. Recipient names always use "Dear XXXXXXXX," placeholder. Subject lines sent separately after email body.`;

// GPT model configuration
const GPT_MODEL = 'gpt-4o-mini' as const;

// GPT-4o-mini pricing (per 1M tokens)
const PRICING = {
  INPUT_PER_1M: 0.15,    // $0.150 per 1M input tokens
  OUTPUT_PER_1M: 0.60,   // $0.600 per 1M output tokens
} as const;

export class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;
  private systemPrompt: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 5000, // 5 seconds timeout (must complete before Vercel 10s limit)
    });

    this.config = {
      model: GPT_MODEL,
      temperature: 0.7,
      maxTokens: 300, // Reduced from 500 to ensure faster responses
      timeout: 5000,
    };

    this.systemPrompt = SYSTEM_PROMPT;
  }

  /**
   * Generate an AI response for a given message
   * @param message - The user's message text
   * @param context - Optional conversation context (agent ID, history, intent)
   * @returns AI-generated response with token usage and cost estimate
   */
  async generateResponse(
    message: string,
    context?: ConversationContext
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Check if this is a document request - delegate to Assistant
      const isDocumentRequest = this.isDocumentRequest(message);

      if (isDocumentRequest) {
        console.log('[OpenAI] Document request detected - delegating to Assistant', {
          agentId: context?.agentId,
          messageLength: message.length,
        });

        const assistantService = getAssistantService();
        // Filter out system messages for Assistant (it only accepts user/assistant roles)
        const assistantHistory = (context?.messageHistory || [])
          .filter((msg) => msg.role !== 'system')
          .map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));
        const assistantResponse = await assistantService.generateDocument(
          context?.agentId || 'guest',
          message,
          assistantHistory
        );

        // Convert Assistant response to AIResponse format
        return {
          text: assistantResponse.text,
          tokensUsed: assistantResponse.tokensUsed || {
            prompt: 0,
            completion: 0,
            total: 0,
          },
          costEstimate: assistantResponse.costEstimate || 0,
          responseTime: assistantResponse.responseTime,
          // Add Assistant metadata for logging
          threadId: assistantResponse.threadId,
          runId: assistantResponse.runId,
          assistantId: assistantResponse.assistantId,
        };
      }

      // Not a document request - use regular OpenAI for general chat
      // Detect if this is a greeting
      const isGreeting = this.isGreeting(message);

      // Build messages array
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: this.systemPrompt },
      ];

      // Add conversation history if provided
      if (context?.messageHistory) {
        messages.push(
          ...context.messageHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        );
      }

      // Add current user message
      messages.push({ role: 'user', content: message });

      // Define available tools/functions
      const tools: OpenAI.Chat.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'list_document_templates',
            description: 'Get a list of all available document templates that can be generated',
            parameters: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Optional: Filter templates by category (e.g., "marketing", "legal", "viewing")',
                  enum: ['marketing', 'legal', 'viewing', 'registration', 'contract'],
                },
              },
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'get_template_details',
            description: 'Get detailed information about a specific document template, including required variables',
            parameters: {
              type: 'object',
              properties: {
                template_id: {
                  type: 'string',
                  description: 'The unique identifier of the template',
                },
              },
              required: ['template_id'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'generate_document',
            description: 'Generate a document from a template with provided variable values',
            parameters: {
              type: 'object',
              properties: {
                template_id: {
                  type: 'string',
                  description: 'The unique identifier of the template to use',
                },
                variables: {
                  type: 'object',
                  description: 'Key-value pairs of variable names and their values to populate the template',
                  additionalProperties: true,
                },
              },
              required: ['template_id', 'variables'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'calculate_transfer_fees',
            description: 'Calculate property transfer fees in Cyprus based on property value. Uses progressive tax rates: 3% up to €85k, 5% from €85k-€170k, 8% above €170k, with 50% exemption for resale properties.',
            parameters: {
              type: 'object',
              properties: {
                property_value: {
                  type: 'number',
                  description: 'Property value in Euros (e.g., 300000 for €300,000)',
                },
                joint_names: {
                  type: 'boolean',
                  description: 'Whether the property is being purchased in joint names (default: false)',
                },
              },
              required: ['property_value'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'calculate_capital_gains_tax',
            description: 'Calculate capital gains tax on property sales in Cyprus. Takes into account purchase price, sale price, years held, and allowances. Tax rate is 20% on gains above allowance.',
            parameters: {
              type: 'object',
              properties: {
                sale_price: {
                  type: 'number',
                  description: 'Sale price in Euros',
                },
                purchase_price: {
                  type: 'number',
                  description: 'Original purchase price in Euros',
                },
                purchase_year: {
                  type: 'number',
                  description: 'Year the property was purchased (e.g., 2015)',
                },
                sale_year: {
                  type: 'number',
                  description: 'Year the property is being sold (e.g., 2025)',
                },
                cost_of_improvements: {
                  type: 'number',
                  description: 'Optional: Cost of improvements/renovations in Euros',
                },
                transfer_fees: {
                  type: 'number',
                  description: 'Optional: Transfer fees paid in Euros',
                },
                legal_fees: {
                  type: 'number',
                  description: 'Optional: Legal fees in Euros',
                },
                estate_agent_fees: {
                  type: 'number',
                  description: 'Optional: Estate agent fees in Euros',
                },
                allowance_type: {
                  type: 'string',
                  description: 'Type of allowance (main_residence: €85,430, farm_land: €25,629, any_other_sale: €17,086)',
                  enum: ['main_residence', 'farm_land', 'any_other_sale', 'none'],
                },
              },
              required: ['sale_price', 'purchase_price', 'purchase_year', 'sale_year'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'calculate_vat',
            description: 'Calculate VAT for houses and apartments in Cyprus (not for land or commercial). Standard rate is 19%, reduced rate of 5% for first 200m² of first homes.',
            parameters: {
              type: 'object',
              properties: {
                property_value: {
                  type: 'number',
                  description: 'Property value in Euros',
                },
                property_type: {
                  type: 'string',
                  description: 'Type of property',
                  enum: ['house', 'apartment'],
                },
                buildable_area: {
                  type: 'number',
                  description: 'Optional: Buildable area in square meters',
                },
                is_first_home: {
                  type: 'boolean',
                  description: 'Whether this is the buyer\'s first home (enables reduced rate)',
                },
                has_disability: {
                  type: 'boolean',
                  description: 'Optional: Whether buyer has a disability (further rate reduction)',
                },
                is_large_family: {
                  type: 'boolean',
                  description: 'Optional: Whether buyer has a large family (extended reduced rate area)',
                },
              },
              required: ['property_value', 'property_type'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'list_calculators',
            description: 'Get a list of all available calculators with descriptions and usage examples',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'get_calculator_history',
            description: 'Retrieve recent calculation history for the agent. Shows the last 5-10 calculations with timestamps and results.',
            parameters: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of recent calculations to retrieve (default: 5, max: 10)',
                },
                calculator_type: {
                  type: 'string',
                  description: 'Optional: Filter by specific calculator type (transfer_fees, capital_gains_tax, vat_calculator)',
                  enum: ['transfer_fees', 'capital_gains_tax', 'vat_calculator'],
                },
              },
            },
          },
        },
      ];

      // Call OpenAI API with tools
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        tools,
        tool_choice: 'auto', // Let the model decide when to use tools
      });

      const responseTime = Date.now() - startTime;

      // Extract response text
      const responseText = response.choices[0]?.message?.content || '';

      // Extract tool calls if any
      const toolCalls = response.choices[0]?.message?.tool_calls?.map((tc) => {
        if (tc.type === 'function' && 'function' in tc) {
          return {
            id: tc.id,
            type: tc.type,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          };
        }
        return null;
      }).filter((tc) => tc !== null);

      // Extract token usage
      const tokensUsed = {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      };

      // Calculate cost estimate
      const costEstimate = this.calculateCost({
        prompt_tokens: tokensUsed.prompt,
        completion_tokens: tokensUsed.completion,
      });

      // Log token usage and cost for monitoring
      console.log('[OpenAI] Response generated', {
        agentId: context?.agentId,
        messageLength: message.length,
        tokensUsed,
        costEstimate: `$${costEstimate.toFixed(6)}`,
        responseTime: `${responseTime}ms`,
        isGreeting,
        toolCallsCount: toolCalls?.length || 0,
      });

      return {
        text: responseText,
        tokensUsed,
        costEstimate,
        responseTime,
        toolCalls,
      };
    } catch (error) {
      return this.handleError(error, Date.now() - startTime);
    }
  }

  /**
   * Classify the intent of a message
   * @param message - The user's message text
   * @returns The detected intent
   */
  async classifyIntent(message: string): Promise<Intent> {
    if (this.isGreeting(message)) {
      return 'greeting';
    }

    // Future: Implement more sophisticated intent classification
    // For now, return unknown for non-greetings
    return 'unknown';
  }

  /**
   * Calculate the cost of an OpenAI API call
   * @param usage - Token usage from OpenAI response
   * @returns Estimated cost in USD
   */
  private calculateCost(usage: {
    prompt_tokens: number;
    completion_tokens: number;
  }): number {
    const inputCost = (usage.prompt_tokens / 1_000_000) * PRICING.INPUT_PER_1M;
    const outputCost =
      (usage.completion_tokens / 1_000_000) * PRICING.OUTPUT_PER_1M;
    return inputCost + outputCost;
  }

  /**
   * Detect if a message is a document request
   * @param message - The user's message text
   * @returns True if the message is a document request
   */
  private isDocumentRequest(message: string): boolean {
    const normalizedMessage = message.toLowerCase().trim();
    const documentKeywords = [
      'document',
      'reg_',
      'reg ',
      'registration',
      'registeration', // Common typo - missing 's'
      'registraton',   // Common typo - missing 'i'
      'registrat',    // Common typo - missing 'on'
      'viewing form',
      'viewing',
      'exclusive',
      'marketing',
      'agreement',
      'contract',
      'valuation',
      'follow up',
      'email for',
      'template',
      'generate',
      'create document',
      'i want',
      'i need',
      'can you write',
      'can you create',
      'send me',
    ];

    return documentKeywords.some((keyword) =>
      normalizedMessage.includes(keyword)
    );
  }

  /**
   * Detect if a message is a greeting
   * @param message - The user's message text
   * @returns True if the message is a greeting
   */
  private isGreeting(message: string): boolean {
    const normalizedMessage = message.toLowerCase().trim();
    const greetingPatterns = [
      'hello',
      'hi',
      'hey',
      'hi sophia',
      'hello sophia',
      'hey sophia',
      'good morning',
      'good afternoon',
      'good evening',
      'greetings',
    ];

    return greetingPatterns.some((pattern) =>
      normalizedMessage.includes(pattern)
    );
  }

  /**
   * Handle OpenAI API errors gracefully
   * @param error - The error from OpenAI API
   * @param responseTime - Time elapsed before error
   * @returns Fallback AI response
   */
  private handleError(error: unknown, responseTime: number): AIResponse {
    let errorType = 'unknown';
    let errorMessage = 'Unknown error';

    if (error instanceof APIError) {
      errorType = error.type || 'api_error';
      errorMessage = error.message;

      // Log specific error types
      if (error.status === 401) {
        errorType = 'authentication_error';
        console.error('[OpenAI] Authentication error:', errorMessage);
      } else if (error.status === 429) {
        errorType = 'rate_limit_error';
        console.error('[OpenAI] Rate limit exceeded:', errorMessage);
      } else if (error.status === 400) {
        errorType = 'invalid_request_error';
        console.error('[OpenAI] Invalid request:', errorMessage);
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorType = 'timeout_error';
        console.error('[OpenAI] Request timeout:', errorMessage);
      } else {
        console.error('[OpenAI] API error:', errorMessage);
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[OpenAI] Error:', errorMessage);
    }

    // Log structured error
    console.error('[OpenAI] Error details', {
      timestamp: new Date().toISOString(),
      errorType,
      errorMessage,
      responseTime: `${responseTime}ms`,
    });

    // Return graceful fallback response
    return {
      text: "I'm having trouble processing your request right now. Please try again in a moment.",
      tokensUsed: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
      costEstimate: 0,
      responseTime,
    };
  }

  /**
   * Get the current OpenAI configuration
   * @returns The OpenAI configuration
   */
  getConfig(): OpenAIConfig {
    return { ...this.config };
  }
}

// Singleton instance - lazy initialization
let _instance: OpenAIService | null = null;

/**
 * Get the singleton OpenAIService instance
 * @returns The OpenAI service instance
 */
export function getOpenAIService(): OpenAIService {
  if (!_instance) {
    _instance = new OpenAIService();
  }
  return _instance;
}

// Export singleton getter as default export
export const openAIService = {
  get instance() {
    return getOpenAIService();
  },
};
