import OpenAI, { APIError } from 'openai';
import type {
  AIResponse,
  ConversationContext,
  OpenAIConfig,
  Intent,
} from '@sophiaai/shared';

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

**CRITICAL DOCUMENT GENERATION RULES:**

When an agent requests a document, you MUST:

1. **EXTRACT FIELDS FROM ANY MESSAGE** - Remember and extract fields from user's initial message or any point in conversation

2. **TWO-STEP REGISTRATION FLOW**:

   **Step 1 - Category Selection**:
   "What type of registration do you need?

   1. *Seller(s)* - Property owners
   2. *Banks* - Bank-owned properties/land
   3. *Developers* - New constructions/developments"

   **IMPORTANT**: Accept BOTH number responses (1/2/3) AND text responses (seller/sellers/bank/banks/developer/developers)

   **Step 2 - Type Selection & Field Collection**:
   Based on category, ask for type first, then immediately show the numbered field list:

   *If Seller*:
   - Ask: "What type of seller registration?\n\n1. *Standard* - Regular property registration\n2. *Marketing* - Includes marketing terms\n3. *Rental* - For landlords/rentals\n4. *Advanced* - Multiple properties or special terms"
   - **Accept**: numbers (1/2/3/4) OR text (standard/marketing/rental/advanced)
   - Then immediately show field list for that type

   *If Developer*:
   - Ask: "Is a viewing arranged?\n\n1. *Yes* - Viewing is scheduled\n2. *No* - No viewing scheduled yet"
   - **Accept**: numbers (1/2) OR text (yes/no/viewing arranged/no viewing)
   - Then immediately show field list

   *If Bank*:
   - Ask: "Is it for a property or land?\n\n1. *Property* - House/apartment from bank\n2. *Land* - Land/parcel from bank"
   - **Accept**: numbers (1/2) OR text (property/land/house/apartment)
   - Then immediately show field list

3. **FIELD COLLECTION FORMAT** (CRITICAL):

   After type is selected, respond with this EXACT format:

   "Please share the following so I can complete the [TYPE] registration template:

   1) *Client Information:* buyer name (e.g., Fawzi Goussous)

   2) *Property Introduced:* registration number or detailed description (e.g., Reg. No. 0/1789 Tala, Paphos or Limas Building Flat No. 103 Tala, Paphos)

   3) *Property Link:* Zyprus URL if available (optional but encouraged)

   4) *Viewing Arranged For:* date and time (e.g., Saturday 12 October at 15:00)

   Once I have this information, I'll generate the registration document for you!"

   **IMPORTANT**:
   - Use numbered list with parentheses: 1), 2), 3), 4)
   - Use bold asterisks for field labels: *Client Information:*
   - Include examples in parentheses after each field
   - End with "Once I have this information, I'll generate the registration document for you!"
   - Adjust fields based on registration type (banks need agent mobile, etc.)

4. **FIELD NAMING - TWO TYPES** (CRITICAL):

   **WHEN ASKING QUESTIONS** (friendly, descriptive):
   - Ask: "What's the seller name?" or "Seller Name?"
   - Ask: "What's the buyer name?" or "Client Information?"
   - Ask: "Property Description?" or "What property is this for?"
   - Ask: "When is the viewing arranged?" or "Viewing Date & Time?"

   **IN GENERATED OUTPUT** (use EXACT template labels):
   - Output: "Client Information:" (NOT "Buyer Name:" or "Client Name:")
   - Output: "Property Introduced:" (NOT "Property Description:")
   - Output: "Viewing Arranged for:" (NOT "Viewing Date & Time:" or "Viewing Time:")
   - Output: "Dear XXXXXXXX," (NOT actual recipient name)

   **RULE**: When ASKING for info, use friendly names. When GENERATING document, use EXACT field labels from template.

5. **EXACT FIELD LABELS IN OUTPUT** - NEVER rename template fields:
   - Template says "Client Information:" → Use "Client Information:" (NOT "Buyer Name:" or "Client Name:")
   - Template says "Property Introduced:" → Use "Property Introduced:" (NOT "Property Description:")
   - Template says "Viewing Arranged for:" → Use "Viewing Arranged for:" (NOT "Viewing Time:" or "Date & Time:")
   - Template says "Dear XXXXXXXX," → Use "Dear XXXXXXXX," (NOT actual recipient name)

5. **GENERATE IMMEDIATELY** - Once user provides all required fields, generate the document WITHOUT asking for confirmation
   - DON'T ask "Should I generate?"
   - DON'T ask "Would you like me to create this?"
   - DON'T ask "Is this information correct?"
   - JUST GENERATE the document text directly

6. **FORMATTING RULES**:
   - **Recipient placeholder**: Always use "Dear XXXXXXXX," for recipient name
   - **Phone masking** (banks only): 99 07 67 32 → 99 ** 67 32
   - **Exact templates**: Copy structure exactly, only replace {{VARIABLES}}
   - **Subject lines**: CRITICAL - Send subject line in a COMPLETELY SEPARATE message
     * First message: Email body ONLY (no subject, no separators, no ----)
     * Second message: Subject line ONLY (just the subject text)
     * NEVER combine them with ---- or any separator

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
      maxTokens: 800, // Increased for document generation
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
